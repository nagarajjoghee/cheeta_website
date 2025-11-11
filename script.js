// Storage Keys
const STORAGE_KEY = 'hopkintonCheetahs';
const AUTH_KEY = 'cheetahsAuth';
const SESSION_KEY = 'cheetahsSession';

// Default passwords (can be changed)
const DEFAULT_PASSWORDS = {
    captain: 'cheeta26',
    player: 'player123'
};

// Current user session
let currentUser = null;
let currentYear = new Date().getFullYear();

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const session = getSession();
    if (session) {
        currentUser = session.role;
        currentYear = session.year || new Date().getFullYear();
        showApp();
    } else {
        showLogin();
    }

    // Setup event listeners
    setupEventListeners();
    
    // Initialize year selector
    initializeYearSelector();
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.getAttribute('data-view');
            switchView(view);
        });
    });
    
    // Year selector
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        updateSession();
        loadAllViews();
    });
    
    // Player form
    document.getElementById('playerForm').addEventListener('submit', handlePlayerSubmit);
    document.getElementById('playerCancelBtn').addEventListener('click', cancelPlayerEdit);
    
    // Game form
    document.getElementById('gameForm').addEventListener('submit', handleGameSubmit);
    document.getElementById('gameCancelBtn').addEventListener('click', cancelGameEdit);
    
    // Refreshment form
    document.getElementById('refreshmentForm').addEventListener('submit', handleRefreshmentSubmit);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('cancelPlayersPlayed').addEventListener('click', closeModal);
    document.getElementById('savePlayersPlayed').addEventListener('click', savePlayersPlayed);
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('password').value;
    
    const auth = getAuth();
    const storedPassword = auth[role] || DEFAULT_PASSWORDS[role];
    
    if (password === storedPassword) {
        currentUser = role;
        saveSession({ role, year: currentYear });
        showApp();
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid password!', 'error');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        clearSession();
        currentUser = null;
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    
    // Hide/show features based on role
    if (currentUser === 'captain') {
        document.getElementById('navPlayers').style.display = 'block';
        document.getElementById('navGames').style.display = 'block';
    } else {
        document.getElementById('navPlayers').style.display = 'none';
        document.getElementById('navGames').style.display = 'none';
    }
    
    loadAllViews();
}

// Session Management
function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

function updateSession() {
    const session = getSession();
    if (session) {
        session.year = currentYear;
        saveSession(session);
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Auth Management
function getAuth() {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth) : { ...DEFAULT_PASSWORDS };
}

function saveAuth(auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

// Data Management
function getData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
        players: [],
        games: [],
        availability: [],
        refreshments: []
    };
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Year Management
function initializeYearSelector() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYearNum = new Date().getFullYear();
    
    // Generate years from 2026 to current year + 1
    for (let year = 2026; year <= currentYearNum + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

// View Switching
function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(viewName + 'View').classList.add('active');
    
    // Activate nav button
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    // Load view data
    loadView(viewName);
}

function loadAllViews() {
    loadView('dashboard');
    loadView('players');
    loadView('games');
    loadView('availability');
    loadView('refreshments');
    loadView('payments');
}

function loadView(viewName) {
    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'players':
            if (currentUser === 'captain') loadPlayers();
            break;
        case 'games':
            if (currentUser === 'captain') loadGames();
            break;
        case 'availability':
            loadAvailability();
            break;
        case 'refreshments':
            loadRefreshments();
            break;
        case 'payments':
            loadPayments();
            break;
    }
}

// Dashboard
function loadDashboard() {
    const data = getData();
    const yearData = getYearData(currentYear);
    
    document.getElementById('statPlayers').textContent = data.players.length;
    document.getElementById('statGames').textContent = yearData.games.length;
    
    const totalRefreshments = yearData.refreshments.reduce((sum, r) => sum + r.amount, 0);
    document.getElementById('statRefreshments').textContent = `$${totalRefreshments.toFixed(2)}`;
    
    const payments = calculatePayments(currentYear);
    const totalOutstanding = payments.reduce((sum, p) => sum + p.finalAmount, 0);
    document.getElementById('statPayments').textContent = `$${totalOutstanding.toFixed(2)}`;
    
    // Summary
    const summary = document.getElementById('dashboardSummary');
    summary.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <h3>Recent Games</h3>
                <p>${yearData.games.slice(-5).reverse().map(g => formatDate(g.date)).join(', ') || 'No games yet'}</p>
            </div>
            <div class="summary-item">
                <h3>Top Players (Games Played)</h3>
                <p>${getTopPlayers(currentYear).map(p => `${p.name}: ${p.games}`).join(', ') || 'No data'}</p>
            </div>
        </div>
    `;
    
    renderMatchesPlayedTable(payments);
}

function renderMatchesPlayedTable(payments) {
    const tbody = document.querySelector('#matchesPlayedTable tbody');
    if (!tbody) {
        return;
    }
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">No players added yet</td></tr>';
        return;
    }
    
    const sorted = [...payments].sort((a, b) => {
        if (b.gamesPlayed !== a.gamesPlayed) {
            return b.gamesPlayed - a.gamesPlayed;
        }
        return a.playerName.localeCompare(b.playerName);
    });
    
    tbody.innerHTML = '';
    sorted.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.playerName}</td>
            <td>${player.gamesPlayed}</td>
        `;
        tbody.appendChild(row);
    });
}

// Player Management
function loadPlayers() {
    const data = getData();
    const tbody = document.getElementById('playersTableBody');
    tbody.innerHTML = '';
    
    if (data.players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">No players added yet</td></tr>';
        return;
    }
    
    data.players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="editPlayer('${player.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deletePlayer('${player.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function handlePlayerSubmit(e) {
    e.preventDefault();
    const data = getData();
    const playerId = document.getElementById('playerId').value;
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        showNotification('Please enter a player name', 'error');
        return;
    }
    
    if (playerId) {
        // Edit
        const player = data.players.find(p => p.id === playerId);
        if (player) {
            player.name = playerName;
            saveData(data);
            showNotification('Player updated!', 'success');
            cancelPlayerEdit();
            loadPlayers();
        }
    } else {
        // Add
        const newPlayer = {
            id: generateId(),
            name: playerName
        };
        data.players.push(newPlayer);
        saveData(data);
        showNotification('Player added!', 'success');
        document.getElementById('playerForm').reset();
        loadPlayers();
    }
}

function editPlayer(id) {
    const data = getData();
    const player = data.players.find(p => p.id === id);
    if (player) {
        document.getElementById('playerId').value = player.id;
        document.getElementById('playerName').value = player.name;
        document.getElementById('playerSubmitBtn').textContent = 'Update Player';
        document.getElementById('playerCancelBtn').style.display = 'inline-block';
    }
}

function deletePlayer(id) {
    if (confirm('Are you sure you want to delete this player?')) {
        const data = getData();
        data.players = data.players.filter(p => p.id !== id);
        // Also remove from games, availability, refreshments
        data.games.forEach(game => {
            game.playersPlayed = game.playersPlayed.filter(pId => pId !== id);
        });
        data.availability = data.availability.filter(a => a.playerId !== id);
        data.refreshments = data.refreshments.filter(r => r.playerId !== id);
        saveData(data);
        showNotification('Player deleted!', 'success');
        loadAllViews();
    }
}

function cancelPlayerEdit() {
    document.getElementById('playerId').value = '';
    document.getElementById('playerForm').reset();
    document.getElementById('playerSubmitBtn').textContent = 'Add Player';
    document.getElementById('playerCancelBtn').style.display = 'none';
}

// Game Management
function loadGames() {
    const yearData = getYearData(currentYear);
    const data = getData();
    const tbody = document.getElementById('gamesTableBody');
    tbody.innerHTML = '';
    
    if (yearData.games.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No games added yet</td></tr>';
        return;
    }
    
    // Sort games by date (newest first)
    const sortedGames = [...yearData.games].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedGames.forEach(game => {
        const row = document.createElement('tr');
        const playersPlayed = game.playersPlayed || [];
        const playerNames = playersPlayed.map(pId => {
            const player = data.players.find(p => p.id === pId);
            return player ? player.name : 'Unknown';
        }).join(', ') || 'None';
        
        row.innerHTML = `
            <td>${formatDate(game.date)}</td>
            <td>${playerNames}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="markPlayersPlayed('${game.id}')">Mark Players</button>
                <button class="btn btn-small btn-secondary" onclick="editGame('${game.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteGame('${game.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function handleGameSubmit(e) {
    e.preventDefault();
    const data = getData();
    const gameId = document.getElementById('gameId').value;
    const gameDate = document.getElementById('gameDate').value;
    
    if (!gameDate) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    if (gameId) {
        // Edit
        const game = data.games.find(g => g.id === gameId);
        if (game) {
            game.date = gameDate;
            saveData(data);
            showNotification('Game updated!', 'success');
            cancelGameEdit();
            loadGames();
        }
    } else {
        // Add
        const newGame = {
            id: generateId(),
            date: gameDate,
            year: currentYear,
            playersPlayed: []
        };
        data.games.push(newGame);
        saveData(data);
        showNotification('Game added!', 'success');
        document.getElementById('gameForm').reset();
        loadGames();
        loadAvailability();
    }
}

function editGame(id) {
    const data = getData();
    const game = data.games.find(g => g.id === id);
    if (game) {
        document.getElementById('gameId').value = game.id;
        document.getElementById('gameDate').value = game.date;
        document.getElementById('gameSubmitBtn').textContent = 'Update Game';
        document.getElementById('gameCancelBtn').style.display = 'inline-block';
    }
}

function deleteGame(id) {
    if (confirm('Are you sure you want to delete this game?')) {
        const data = getData();
        data.games = data.games.filter(g => g.id !== id);
        saveData(data);
        showNotification('Game deleted!', 'success');
        loadGames();
        loadAvailability();
    }
}

function cancelGameEdit() {
    document.getElementById('gameId').value = '';
    document.getElementById('gameForm').reset();
    document.getElementById('gameSubmitBtn').textContent = 'Add Game';
    document.getElementById('gameCancelBtn').style.display = 'none';
}

let currentGameForPlayers = null;

function markPlayersPlayed(gameId) {
    currentGameForPlayers = gameId;
    const data = getData();
    const game = data.games.find(g => g.id === gameId);
    const playersPlayed = game ? (game.playersPlayed || []) : [];
    
    const list = document.getElementById('playersPlayedList');
    list.innerHTML = '';
    
    data.players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-checkbox-item';
        const checked = playersPlayed.includes(player.id);
        item.innerHTML = `
            <input type="checkbox" id="player_${player.id}" ${checked ? 'checked' : ''}>
            <label for="player_${player.id}">${player.name}</label>
        `;
        list.appendChild(item);
    });
    
    document.getElementById('playersPlayedModal').style.display = 'block';
}

function savePlayersPlayed() {
    if (!currentGameForPlayers) return;
    
    const data = getData();
    const game = data.games.find(g => g.id === currentGameForPlayers);
    if (!game) return;
    
    const playersPlayed = [];
    data.players.forEach(player => {
        const checkbox = document.getElementById(`player_${player.id}`);
        if (checkbox && checkbox.checked) {
            playersPlayed.push(player.id);
        }
    });
    
    game.playersPlayed = playersPlayed;
    saveData(data);
    showNotification('Players marked!', 'success');
    closeModal();
    loadGames();
    loadPayments();
}

function closeModal() {
    document.getElementById('playersPlayedModal').style.display = 'none';
    currentGameForPlayers = null;
}

// Availability
function loadAvailability() {
    const data = getData();
    const tbody = document.getElementById('availabilityTableBody');
    const headerRow = document.getElementById('availabilityHeaderRow');
    tbody.innerHTML = '';
    
    if (!headerRow) {
        return;
    }
    
    if (data.players.length === 0) {
        headerRow.innerHTML = '<th>Player</th>';
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px;">No players added yet</td></tr>';
        return;
    }
    
    // Clean up legacy availability entries that were game-based
    const filteredAvailability = data.availability.filter(a => a.date);
    if (filteredAvailability.length !== data.availability.length) {
        data.availability = filteredAvailability;
        saveData(data);
    }
    
    const weekDates = getUpcomingWeekDates();
    
    headerRow.innerHTML = '<th>Player</th>' + weekDates.map(date => `<th>${formatWeekDate(date)}</th>`).join('');
    
    data.players.forEach(player => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;
        row.appendChild(nameCell);
        
        weekDates.forEach(date => {
            const cell = document.createElement('td');
            const availability = getAvailability(player.id, date);
            let statusClass = 'not-set';
            let statusText = '-';
            
            if (availability) {
                if (availability.available) {
                    statusClass = 'available';
                    statusText = 'Yes';
                } else {
                    statusClass = 'unavailable';
                    statusText = 'No';
                }
            }
            
            cell.innerHTML = `
                <div class="availability-cell ${statusClass}" onclick="toggleAvailability('${player.id}', '${date}')">
                    ${statusText}
                </div>
            `;
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}

function toggleAvailability(playerId, date) {
    const data = getData();
    let availability = data.availability.find(a => a.playerId === playerId && a.date === date);
    
    if (!availability) {
        availability = {
            id: generateId(),
            playerId,
            date,
            available: true
        };
        data.availability.push(availability);
    } else if (availability.available) {
        availability.available = false;
    } else {
        data.availability = data.availability.filter(a => !(a.playerId === playerId && a.date === date));
    }
    
    saveData(data);
    loadAvailability();
}

function getAvailability(playerId, date) {
    const data = getData();
    return data.availability.find(a => a.playerId === playerId && a.date === date);
}

// Refreshments
function loadRefreshments() {
    const data = getData();
    const yearData = getYearData(currentYear);
    
    // Update player dropdown
    const playerSelect = document.getElementById('refreshmentPlayer');
    playerSelect.innerHTML = '<option value="">Select player</option>';
    data.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = player.name;
        playerSelect.appendChild(option);
    });
    
    // Load refreshments table
    const tbody = document.getElementById('refreshmentsTableBody');
    tbody.innerHTML = '';
    
    if (data.players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">No players added yet</td></tr>';
        return;
    }
    
    data.players.forEach(player => {
        const playerRefreshments = yearData.refreshments.filter(r => r.playerId === player.id);
        const total = playerRefreshments.reduce((sum, r) => sum + r.amount, 0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>$${total.toFixed(2)}</td>
            <td>
                ${playerRefreshments.map((r, idx) => `
                    <span style="font-size: 0.85em; margin-right: 5px;">
                        $${r.amount.toFixed(2)}
                        <button class="btn btn-small btn-danger" onclick="deleteRefreshment('${r.id}')" style="margin-left: 5px;">×</button>
                    </span>
                `).join('')}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function handleRefreshmentSubmit(e) {
    e.preventDefault();
    const data = getData();
    const playerId = document.getElementById('refreshmentPlayer').value;
    const amount = parseFloat(document.getElementById('refreshmentAmount').value);
    
    if (!playerId) {
        showNotification('Please select a player', 'error');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    const newRefreshment = {
        id: generateId(),
        playerId,
        amount,
        year: currentYear
    };
    
    data.refreshments.push(newRefreshment);
    saveData(data);
    showNotification('Refreshment added!', 'success');
    document.getElementById('refreshmentForm').reset();
    loadRefreshments();
    loadPayments();
}

function deleteRefreshment(id) {
    if (confirm('Are you sure you want to delete this refreshment entry?')) {
        const data = getData();
        data.refreshments = data.refreshments.filter(r => r.id !== id);
        saveData(data);
        showNotification('Refreshment deleted!', 'success');
        loadRefreshments();
        loadPayments();
    }
}

// Payments
function loadPayments() {
    const payments = calculatePayments(currentYear);
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '';
    
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No players added yet</td></tr>';
        return;
    }
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        const finalColor = payment.finalAmount >= 0 ? '#28a745' : '#dc3545';
        row.innerHTML = `
            <td>${payment.playerName}</td>
            <td>${payment.gamesPlayed}</td>
            <td>$${payment.basePayment.toFixed(2)}</td>
            <td>$${payment.playerRefreshments.toFixed(2)}</td>
            <td style="color: ${finalColor}; font-weight: bold;">$${payment.finalAmount.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function calculatePayments(year) {
    const data = getData();
    const yearData = getYearData(year);
    
    const playerGamesMap = {};
    
    yearData.games.forEach(game => {
        const playersPlayed = game.playersPlayed || [];
        playersPlayed.forEach(playerId => {
            playerGamesMap[playerId] = (playerGamesMap[playerId] || 0) + 1;
        });
    });
    
    // Calculate payments for each player
    const payments = data.players.map(player => {
        const gamesPlayed = playerGamesMap[player.id] || 0;
        const basePayment = gamesPlayed * 15;
        const playerRefreshments = yearData.refreshments
            .filter(r => r.playerId === player.id)
            .reduce((sum, r) => sum + r.amount, 0);
        
        const finalAmount = basePayment - playerRefreshments;
        
        return {
            playerName: player.name,
            gamesPlayed,
            basePayment,
            playerRefreshments,
            finalAmount
        };
    });
    
    return payments;
}

// Helper Functions
function getYearData(year) {
    const data = getData();
    return {
        games: data.games.filter(g => g.year === year),
        refreshments: data.refreshments.filter(r => r.year === year)
    };
}

function getTopPlayers(year) {
    const payments = calculatePayments(year);
    return payments
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
        .slice(0, 5)
        .map(p => ({ name: p.playerName, games: p.gamesPlayed }));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getUpcomingWeekDates() {
    const dates = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

function formatWeekDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }
    .summary-item {
        background: rgba(255, 255, 255, 0.05);
        padding: 15px;
        border-radius: 8px;
        border: 1px solid rgba(255, 107, 53, 0.2);
    }
    .summary-item h3 {
        color: #FF8C42;
        margin-bottom: 10px;
        font-size: 1.1em;
    }
    .summary-item p {
        color: #e0e0e0;
        line-height: 1.6;
    }
`;
document.head.appendChild(style);
