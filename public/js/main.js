// Global state
let currentUser = null;
let userCurrency = 0;

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Check authentication status from server
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            userCurrency = userData.currency;
            return { isLoggedIn: true, user: userData };
        } else {
            currentUser = null;
            userCurrency = 0;
            return { isLoggedIn: false };
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        currentUser = null;
        userCurrency = 0;
        return { isLoggedIn: false, error };
    }
}

// Update UI based on authentication state
function updateUserInterface() {
    const currencyDisplay = document.getElementById('currency-amount');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (isLoggedIn()) {
        // User is logged in
        currencyDisplay.textContent = userCurrency;
        
        if (loginBtn) loginBtn.classList.add('hidden');
        if (registerBtn) registerBtn.classList.add('hidden');
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
            logoutBtn.addEventListener('click', handleLogout);
        }
    } else {
        // User is not logged in
        currencyDisplay.textContent = '0';
        
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = null;
            userCurrency = 0;
            updateUserInterface();
            
            // Redirect to home page
            window.location.href = '/';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Create card element from player data
// Replace the existing createCardElement function in main.js
// In public/js/main.js - update the createCardElement function
function createCardElement(player, showActions = false, quantity = null) {
    // Create card container
    const card = document.createElement('div');
    card.className = `card ${player.rarity}`;
    
    // Add quantity badge if specified
    if (quantity !== null && quantity > 1) {
        const quantityBadge = document.createElement('div');
        quantityBadge.className = 'quantity-badge';
        quantityBadge.textContent = quantity;
        card.appendChild(quantityBadge);
    }
    
    // Add listed badge if card is listed on market
    if (player.isListed) {
        const listedBadge = document.createElement('div');
        listedBadge.className = 'listed-badge';
        listedBadge.textContent = 'Listed';
        card.appendChild(listedBadge);
    }
    
    // Create card content
    card.innerHTML += `
        <div class="card-header">
            <h3 class="card-name">${player.riotId || player.name}</h3>
            <div class="card-rank">Challenger</div>
            <div class="card-lp">${player.leaguePoints} LP</div>
        </div>
        <div class="card-image">
            <img src="images/cards/default.png" alt="Player card" />
        </div>
        <div class="card-footer">
            <div class="card-rarity rarity-${player.rarity}">${player.rarity}</div>
            <div class="card-value">${player.value || Math.floor(player.leaguePoints / 10)} <span>💰</span></div>
        </div>
    `;
    
    // Add actions if requested
    if (showActions && !player.isListed) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';
        
        // Create sell button only if user is logged in
        if (isLoggedIn()) {
            const sellBtn = document.createElement('button');
            sellBtn.className = 'btn';
            sellBtn.textContent = 'Sell on Market';
            sellBtn.addEventListener('click', () => {
                showSellModal(player);
            });
            actionsDiv.appendChild(sellBtn);
        }
        
        // Create view details button
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn btn-primary';
        detailsBtn.textContent = 'View Details';
        detailsBtn.addEventListener('click', () => {
            showCardDetails(player);
        });
        actionsDiv.appendChild(detailsBtn);
        
        card.appendChild(actionsDiv);
    }
    
    return card;
}

// Show modal for selling a card
function showSellModal(player) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Sell Card on Market</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-card-info">
                    <p>You are selling: <strong>${player.riotId || player.name}</strong></p>
                    <p>Rarity: <span class="rarity-${player.rarity}">${player.rarity}</span></p>
                    <p>Base Value: ${player.value} 💰</p>
                </div>
                <div class="form-group">
                    <label for="listing-price">Listing Price:</label>
                    <input type="number" id="listing-price" min="1" value="${player.value}">
                </div>
                <div class="error-message" id="sell-error" style="display: none;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn" id="cancel-sell">Cancel</button>
                <button class="btn btn-primary" id="confirm-sell">List Card</button>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    const cancelBtn = modalContainer.querySelector('#cancel-sell');
    const confirmBtn = modalContainer.querySelector('#confirm-sell');
    
    // Close modal function
    const closeModal = () => {
        modalContainer.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(modalContainer);
        }, 300);
    };
    
    // Add event listeners
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Handle confirm button
    confirmBtn.addEventListener('click', async () => {
        const priceInput = modalContainer.querySelector('#listing-price');
        const price = parseInt(priceInput.value);
        const errorElement = modalContainer.querySelector('#sell-error');
        
        // Validate price
        if (!price || price <= 0) {
            errorElement.textContent = 'Please enter a valid price';
            errorElement.style.display = 'block';
            return;
        }
        
        // Submit listing
        try {
            const response = await fetch('/api/market/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    playerId: player._id,
                    price
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                closeModal();
                // Reload current page to reflect changes
                window.location.reload();
            } else {
                errorElement.textContent = result.message || 'Failed to list card';
                errorElement.style.display = 'block';
            }
        } catch (error) {
            console.error('Error listing card:', error);
            errorElement.textContent = 'An error occurred while listing the card';
            errorElement.style.display = 'block';
        }
    });
    
    // Add fade-in animation
    setTimeout(() => {
        modalContainer.classList.add('fade-in');
    }, 10);
}

// Show detailed card view
function showCardDetails(player) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    // Create modal content
    modalContainer.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Player Details</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="player-details">
                    <h3>${player.riotId || player.name}</h3>
                    <p><strong>Rank:</strong> Challenger</p>
                    <p><strong>League Points:</strong> ${player.leaguePoints} LP</p>
                    <p><strong>Rarity:</strong> <span class="rarity-${player.rarity}">${player.rarity}</span></p>
                    <p><strong>Value:</strong> ${player.value || Math.floor(player.leaguePoints / 10)} 💰</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" id="close-details">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    const closeBtn = modalContainer.querySelector('.close-btn');
    const closeDetailsBtn = modalContainer.querySelector('#close-details');
    
    // Close modal function
    const closeModal = () => {
        modalContainer.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(modalContainer);
        }, 300);
    };
    
    // Add event listeners
    closeBtn.addEventListener('click', closeModal);
    closeDetailsBtn.addEventListener('click', closeModal);
    
    // Add fade-in animation
    setTimeout(() => {
        modalContainer.classList.add('fade-in');
    }, 10);
}
// Display error message
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-container';
    errorContainer.innerHTML = `
        <div class="error-content">
            <p>${message}</p>
            <button class="btn close-error">Close</button>
        </div>
    `;
    
    document.body.appendChild(errorContainer);
    
    const closeBtn = errorContainer.querySelector('.close-error');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(errorContainer);
    });
}

// Initialize common elements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication on every page
    checkAuthStatus().then(result => {
        if (result.isLoggedIn) {
            updateUserInterface();
        }
    });
});