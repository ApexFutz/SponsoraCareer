// Dashboard JavaScript Functionality

// Global state management
let currentUser = null;
let currentSection = 'overview';
let profileData = {};
let offers = [];
let contracts = [];
let milestones = [];

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadUserData();
    updateFinancialCalculations();
});

// Initialize dashboard
async function initializeDashboard() {
    // Check if user is authenticated
    if (!window.apiClient.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Get user data from API
        const response = await window.apiClient.getProfile();
        currentUser = response.user || { userType: 'dreamer' }; // fallback
        profileData = response.profile || {};
        
        updateUserInterface();
        
        // Load data from API
        await loadUserDataFromAPI();
        
        // Initialize sections
        showSection('overview');
        
        console.log('🎉 Dashboard initialized for:', currentUser.userType);
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        // Redirect to login on error
        window.location.href = 'index.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
        
        // Real-time financial calculations
        const financialInputs = ['expectedDurationMin', 'expectedDurationMax', 'weeklyNeed'];
        financialInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', updateFinancialSummary);
            }
        });
    }
    
    // Calculator inputs
    const calcInputs = ['calcWeeklyNeed', 'calcDurationMin', 'calcDurationMax'];
    calcInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updateCalculatorResults);
        }
    });
    
    // Modal close events
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Notification bell
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotificationPanel);
    }
}

// Update user interface based on user type
function updateUserInterface() {
    const userTypeBadge = document.getElementById('userTypeBadge');
    if (userTypeBadge && currentUser) {
        userTypeBadge.textContent = currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1);
        userTypeBadge.className = `user-type-badge ${currentUser.userType}`;
    }
    
    // Update welcome message
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage && currentUser) {
        const timeOfDay = getTimeOfDay();
        welcomeMessage.textContent = `Good ${timeOfDay}! Here's your current status.`;
    }
}

// Get time of day for greeting
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

// Show specific dashboard section
function showSection(sectionName) {
    // Update navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-section') === sectionName) {
            btn.classList.add('active');
        }
    });
    
    // Update sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Load section-specific data
        loadSectionData(sectionName);
    }
}

// Load section-specific data
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'overview':
            updateOverviewStats();
            break;
        case 'profile':
            populateProfileForm();
            break;
        case 'offers':
            loadOffers();
            break;
        case 'contracts':
            loadContracts();
            break;
        case 'progress':
            updateProgressDisplay();
            break;
    }
}

// Update overview statistics
function updateOverviewStats() {
    const stats = calculateUserStats();
    
    // Update stat cards
    updateStatCard('Total Funding', formatCurrency(stats.totalFunding), `${stats.fundingChange >= 0 ? '+' : ''}${stats.fundingChange}% this month`);
    updateStatCard('Active Offers', stats.activeOffers, stats.activeOffers === 0 ? 'No pending offers' : `${stats.pendingOffers} pending`);
    updateStatCard('Active Contracts', stats.activeContracts, stats.activeContracts === 0 ? 'No active contracts' : `${stats.completedContracts} completed`);
    updateStatCard('Goal Progress', `${stats.goalProgress}%`, stats.goalProgress === 0 ? 'Get started!' : 'Keep going!');
}

// Update individual stat card
function updateStatCard(title, value, change) {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        const cardTitle = card.querySelector('h3');
        if (cardTitle && cardTitle.textContent === title) {
            const valueElement = card.querySelector('.stat-value');
            const changeElement = card.querySelector('.stat-change');
            if (valueElement) valueElement.textContent = value;
            if (changeElement) changeElement.textContent = change;
        }
    });
}

// Calculate user statistics
function calculateUserStats() {
    return {
        totalFunding: profileData.totalFunding || 0,
        fundingChange: 0,
        activeOffers: offers.filter(o => o.status === 'pending').length,
        pendingOffers: offers.filter(o => o.status === 'pending').length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        completedContracts: contracts.filter(c => c.status === 'completed').length,
        goalProgress: calculateGoalProgress()
    };
}

// Calculate goal progress
function calculateGoalProgress() {
    if (!profileData.goal || milestones.length === 0) return 0;
    
    const completedMilestones = milestones.filter(m => m.completed).length;
    return Math.round((completedMilestones / milestones.length) * 100);
}

// Handle profile form submission
function handleProfileSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newProfileData = {};
    
    // Extract form data
    for (let [key, value] of formData.entries()) {
        if (key === 'fundingTypes') {
            if (!newProfileData.fundingTypes) newProfileData.fundingTypes = [];
            newProfileData.fundingTypes.push(value);
        } else {
            newProfileData[key] = value;
        }
    }
    
    // Validate required fields
    const requiredFields = ['fullName', 'bio', 'goal', 'expectedDurationMin', 'expectedDurationMax', 'weeklyNeed'];
    const missingFields = requiredFields.filter(field => !newProfileData[field]);
    
    if (missingFields.length > 0) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate duration range
    const minDuration = parseInt(newProfileData.expectedDurationMin);
    const maxDuration = parseInt(newProfileData.expectedDurationMax);
    
    if (minDuration >= maxDuration) {
        showNotification('Maximum duration must be greater than minimum duration', 'error');
        return;
    }
    
    // Calculate financial totals
    const weeklyNeed = parseFloat(newProfileData.weeklyNeed);
    newProfileData.minTotalFunding = weeklyNeed * minDuration * 4.33; // Average weeks per month
    newProfileData.maxTotalFunding = weeklyNeed * maxDuration * 4.33;
    
    // Save profile data
    profileData = { ...profileData, ...newProfileData };
    saveProfileData();
    
    // Show success message
    showNotification('Profile saved successfully!', 'success');
    
    // Update overview stats
    updateOverviewStats();
    
    console.log('Profile saved:', profileData);
}

// Populate profile form with saved data
function populateProfileForm() {
    if (!profileData || Object.keys(profileData).length === 0) return;
    
    // Populate text inputs
    const textFields = ['fullName', 'location', 'bio', 'goal', 'skills', 'education', 'expectedDurationMin', 'expectedDurationMax', 'weeklyNeed'];
    textFields.forEach(field => {
        const input = document.getElementById(field);
        if (input && profileData[field]) {
            input.value = profileData[field];
        }
    });
    
    // Populate checkboxes
    if (profileData.fundingTypes) {
        const checkboxes = document.querySelectorAll('input[name="fundingTypes"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = profileData.fundingTypes.includes(checkbox.value);
        });
    }
    
    // Update financial summary
    updateFinancialSummary();
}

// Update financial summary in profile form
function updateFinancialSummary() {
    const minDuration = parseInt(document.getElementById('expectedDurationMin')?.value) || 0;
    const maxDuration = parseInt(document.getElementById('expectedDurationMax')?.value) || 0;
    const weeklyNeed = parseFloat(document.getElementById('weeklyNeed')?.value) || 0;
    
    if (minDuration && maxDuration && weeklyNeed) {
        const minTotal = weeklyNeed * minDuration * 4.33; // Average weeks per month
        const maxTotal = weeklyNeed * maxDuration * 4.33;
        
        const totalFundingRange = document.getElementById('totalFundingRange');
        if (totalFundingRange) {
            totalFundingRange.textContent = `${formatCurrency(minTotal)} - ${formatCurrency(maxTotal)}`;
        }
    }
}

// Load user data from API
async function loadUserDataFromAPI() {
    try {
        // Load offers from API
        const offersResponse = await window.apiClient.getOffers();
        offers = offersResponse.offers || [];
        
        // Load notifications from API
        const notificationsResponse = await window.apiClient.getNotifications();
        notifications = notificationsResponse.notifications || [];
        updateNotificationCount();
        
        // Load milestones from API
        const milestonesResponse = await window.apiClient.getMilestones();
        milestones = milestonesResponse.milestones || [];
        
        console.log('✅ Data loaded from API successfully');
    } catch (error) {
        console.error('Failed to load data from API:', error);
        // Fallback to demo data
        loadDemoData();
    }
}

// Load user data (fallback to demo data)
function loadUserData() {
    // This is now used as fallback when API is not available
    loadDemoData();
}

// Load demo data for testing
function loadDemoData() {
    // Demo offers
    offers = [
        {
            id: 1,
            sponsorName: 'Tech Innovators Inc.',
            amount: 15000,
            duration: 6,
            type: 'loan',
            interestRate: 3,
            status: 'pending',
            message: 'We love your web development goals and would like to support your journey.',
            createdAt: new Date('2024-01-15')
        },
        {
            id: 2,
            sponsorName: 'Career Boost Foundation',
            amount: 8000,
            duration: 4,
            type: 'donation',
            status: 'pending',
            message: 'Your dedication to learning is inspiring. This is a no-strings-attached donation.',
            createdAt: new Date('2024-01-10')
        }
    ];
    
    // Demo milestones
    milestones = [
        {
            id: 1,
            title: 'Complete JavaScript Fundamentals',
            description: 'Master basic JavaScript concepts and syntax',
            targetDate: new Date('2024-02-15'),
            completed: false,
            progress: 60
        },
        {
            id: 2,
            title: 'Build First Portfolio Project',
            description: 'Create a responsive web application',
            targetDate: new Date('2024-03-01'),
            completed: false,
            progress: 20
        }
    ];
}

// Financial calculator functions
function openCalculator() {
    const modal = document.getElementById('calculatorModal');
    if (modal) {
        modal.classList.add('active');
        updateCalculatorResults();
    }
}

function closeCalculator() {
    const modal = document.getElementById('calculatorModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateCalculatorResults() {
    const weeklyNeed = parseFloat(document.getElementById('calcWeeklyNeed')?.value) || 0;
    const minDuration = parseInt(document.getElementById('calcDurationMin')?.value) || 0;
    const maxDuration = parseInt(document.getElementById('calcDurationMax')?.value) || 0;
    
    if (weeklyNeed && minDuration && maxDuration) {
        const minTotal = weeklyNeed * minDuration * 4.33;
        const maxTotal = weeklyNeed * maxDuration * 4.33;
        
        document.getElementById('calcMinTotal').textContent = formatCurrency(minTotal);
        document.getElementById('calcMaxTotal').textContent = formatCurrency(maxTotal);
        document.getElementById('calcWeeklyPayment').textContent = formatCurrency(weeklyNeed);
    }
}

function useCalculatorValues() {
    const weeklyNeed = document.getElementById('calcWeeklyNeed')?.value;
    const minDuration = document.getElementById('calcDurationMin')?.value;
    const maxDuration = document.getElementById('calcDurationMax')?.value;
    
    // Transfer values to profile form
    if (weeklyNeed) document.getElementById('weeklyNeed').value = weeklyNeed;
    if (minDuration) document.getElementById('expectedDurationMin').value = minDuration;
    if (maxDuration) document.getElementById('expectedDurationMax').value = maxDuration;
    
    // Update financial summary
    updateFinancialSummary();
    
    // Close calculator and switch to profile section
    closeCalculator();
    showSection('profile');
    
    showNotification('Calculator values applied to your profile', 'success');
}

// Offers management
function loadOffers() {
    const offersList = document.getElementById('offersList');
    if (!offersList) return;
    
    if (offers.length === 0) {
        offersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No offers yet</h3>
                <p>Complete your profile to start receiving offers from sponsors</p>
                <button class="action-btn primary" onclick="showSection('profile')">
                    Complete Profile
                </button>
            </div>
        `;
        return;
    }
    
    const offersHTML = offers.map(offer => `
        <div class="offer-card" data-offer-id="${offer.id}">
            <div class="offer-header">
                <h4>${offer.sponsorName}</h4>
                <span class="offer-status ${offer.status}">${offer.status}</span>
            </div>
            <div class="offer-details">
                <div class="offer-amount">${formatCurrency(offer.amount)}</div>
                <div class="offer-terms">
                    <span>${offer.duration} months</span>
                    <span>${offer.type}</span>
                    ${offer.interestRate ? `<span>${offer.interestRate}% interest</span>` : ''}
                </div>
                <p class="offer-message">${offer.message}</p>
            </div>
            <div class="offer-actions">
                <button class="action-btn secondary" onclick="declineOffer(${offer.id})">Decline</button>
                <button class="action-btn primary" onclick="acceptOffer(${offer.id})">Accept</button>
            </div>
        </div>
    `).join('');
    
    offersList.innerHTML = offersHTML;
}

function acceptOffer(offerId) {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    if (confirm(`Accept offer from ${offer.sponsorName} for ${formatCurrency(offer.amount)}?`)) {
        offer.status = 'accepted';
        
        // Create contract
        const contract = {
            id: contracts.length + 1,
            offerId: offerId,
            sponsorName: offer.sponsorName,
            amount: offer.amount,
            duration: offer.duration,
            type: offer.type,
            interestRate: offer.interestRate,
            status: 'active',
            startDate: new Date(),
            weeklyPayment: offer.amount / (offer.duration * 4.33),
            paymentsReceived: 0,
            totalPayments: Math.ceil(offer.duration * 4.33)
        };
        
        contracts.push(contract);
        
        showNotification('Offer accepted! Contract created successfully!', 'success');
        
        // Refresh displays
        loadOffers();
        updateOverviewStats();
        
        console.log('Contract created:', contract);
    }
}

function declineOffer(offerId) {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    if (confirm(`Decline offer from ${offer.sponsorName}?`)) {
        offer.status = 'declined';
        showNotification('Offer declined', 'info');
        loadOffers();
        updateOverviewStats();
    }
}

// Contracts management
function loadContracts() {
    const contractsList = document.getElementById('contractsList');
    if (!contractsList) return;
    
    if (contracts.length === 0) {
        contractsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>No active contracts</h3>
                <p>Accept sponsor offers to create contracts</p>
            </div>
        `;
        return;
    }
    
    const contractsHTML = contracts.map(contract => `
        <div class="contract-card" data-contract-id="${contract.id}">
            <div class="contract-header">
                <h4>${contract.sponsorName}</h4>
                <span class="contract-status ${contract.status}">${contract.status}</span>
            </div>
            <div class="contract-details">
                <div class="contract-amount">${formatCurrency(contract.amount)}</div>
                <div class="contract-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(contract.paymentsReceived / contract.totalPayments) * 100}%"></div>
                    </div>
                    <span>${contract.paymentsReceived}/${contract.totalPayments} payments</span>
                </div>
                <div class="contract-terms">
                    <span>${contract.duration} months</span>
                    <span>${formatCurrency(contract.weeklyPayment)}/week</span>
                    <span>${contract.type}</span>
                </div>
            </div>
            <div class="contract-actions">
                <button class="action-btn secondary" onclick="viewContract(${contract.id})">View Details</button>
                <button class="action-btn primary" onclick="updateProgress(${contract.id})">Update Progress</button>
            </div>
        </div>
    `).join('');
    
    contractsList.innerHTML = contractsHTML;
}

function viewContract(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    alert(`Contract Details:\n\nSponsor: ${contract.sponsorName}\nAmount: ${formatCurrency(contract.amount)}\nDuration: ${contract.duration} months\nWeekly Payment: ${formatCurrency(contract.weeklyPayment)}\nType: ${contract.type}\nStart Date: ${contract.startDate.toLocaleDateString()}\nStatus: ${contract.status}`);
}

function updateProgress(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    // Simulate progress update
    if (contract.paymentsReceived < contract.totalPayments) {
        contract.paymentsReceived++;
        
        if (contract.paymentsReceived >= contract.totalPayments) {
            contract.status = 'completed';
            showNotification('Contract completed! 🎉', 'success');
        } else {
            showNotification('Progress updated successfully', 'success');
        }
        
        loadContracts();
        updateOverviewStats();
    }
}

// Progress and milestones
function updateProgressDisplay() {
    updateProgressCircle();
    loadMilestones();
}

function updateProgressCircle() {
    const progress = calculateGoalProgress();
    const progressCircle = document.querySelector('.progress-ring-progress');
    const progressText = document.querySelector('.progress-percentage');
    
    if (progressCircle && progressText) {
        const circumference = 2 * Math.PI * 52; // radius = 52
        const offset = circumference - (progress / 100) * circumference;
        
        progressCircle.style.strokeDashoffset = offset;
        progressText.textContent = `${progress}%`;
    }
}

function loadMilestones() {
    const milestonesList = document.getElementById('milestonesList');
    if (!milestonesList) return;
    
    if (milestones.length === 0) {
        milestonesList.innerHTML = `
            <div class="empty-state">
                <p>Set up milestones to track your progress</p>
                <button class="action-btn secondary" onclick="addMilestone()">
                    Add First Milestone
                </button>
            </div>
        `;
        return;
    }
    
    const milestonesHTML = milestones.map(milestone => `
        <div class="milestone-card ${milestone.completed ? 'completed' : ''}" data-milestone-id="${milestone.id}">
            <div class="milestone-header">
                <h5>${milestone.title}</h5>
                <span class="milestone-progress">${milestone.progress}%</span>
            </div>
            <p class="milestone-description">${milestone.description}</p>
            <div class="milestone-footer">
                <span class="milestone-date">Due: ${milestone.targetDate.toLocaleDateString()}</span>
                <button class="action-btn ${milestone.completed ? 'secondary' : 'primary'}" 
                        onclick="toggleMilestone(${milestone.id})">
                    ${milestone.completed ? 'Completed ✓' : 'Mark Complete'}
                </button>
            </div>
        </div>
    `).join('');
    
    milestonesList.innerHTML = milestonesHTML;
}

function addMilestone() {
    const title = prompt('Milestone title:');
    if (!title) return;
    
    const description = prompt('Milestone description:');
    if (!description) return;
    
    const targetDate = prompt('Target date (YYYY-MM-DD):');
    if (!targetDate) return;
    
    const milestone = {
        id: milestones.length + 1,
        title: title,
        description: description,
        targetDate: new Date(targetDate),
        completed: false,
        progress: 0
    };
    
    milestones.push(milestone);
    loadMilestones();
    updateProgressDisplay();
    showNotification('Milestone added successfully!', 'success');
}

function toggleMilestone(milestoneId) {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    milestone.completed = !milestone.completed;
    milestone.progress = milestone.completed ? 100 : 0;
    
    loadMilestones();
    updateProgressDisplay();
    updateOverviewStats();
    
    showNotification(`Milestone ${milestone.completed ? 'completed' : 'reopened'}!`, 'success');
}

// Profile preview
function previewProfile() {
    if (!profileData || Object.keys(profileData).length === 0) {
        showNotification('Please fill out your profile first', 'error');
        return;
    }
    
    const preview = `
Profile Preview:

Name: ${profileData.fullName || 'Not specified'}
Location: ${profileData.location || 'Not specified'}
Goal: ${profileData.goal || 'Not specified'}
Duration: ${profileData.expectedDurationMin || 0}-${profileData.expectedDurationMax || 0} months
Weekly Need: ${formatCurrency(parseFloat(profileData.weeklyNeed) || 0)}
Total Funding: ${formatCurrency(profileData.minTotalFunding || 0)} - ${formatCurrency(profileData.maxTotalFunding || 0)}
Skills: ${profileData.skills || 'Not specified'}
Education: ${profileData.education || 'Not specified'}
Funding Types: ${profileData.fundingTypes ? profileData.fundingTypes.join(', ') : 'Not specified'}

Bio: ${profileData.bio || 'Not specified'}
    `;
    
    alert(preview);
}

// Data persistence
function saveProfileData() {
    const key = `sponsoracareer_profile_${currentUser?.email}`;
    localStorage.setItem(key, JSON.stringify(profileData));
}

function loadProfileData() {
    const key = `sponsoracareer_profile_${currentUser?.email}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        profileData = JSON.parse(saved);
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    console.log(`${type.toUpperCase()}: ${message}`);
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function updateFinancialCalculations() {
    // Update any financial calculations on page load
    updateFinancialSummary();
    updateCalculatorResults();
}

function handleKeyboardShortcuts(event) {
    // ESC to close modals
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal);
        }
    }
    
    // Number keys for navigation (1-5)
    if (event.key >= '1' && event.key <= '5' && !event.target.matches('input, textarea')) {
        const sections = ['overview', 'profile', 'offers', 'contracts', 'progress'];
        const sectionIndex = parseInt(event.key) - 1;
        if (sections[sectionIndex]) {
            showSection(sections[sectionIndex]);
        }
    }
}

// Notification system
let notifications = [];

// Initialize notifications with demo data
function initializeNotifications() {
    notifications = [
        {
            id: 1,
            title: 'New Sponsor Offer',
            message: 'Tech Innovators Inc. has made you an offer of $15,000',
            type: 'offer',
            timestamp: new Date('2024-01-15T10:30:00'),
            read: false,
            actionUrl: 'offers'
        },
        {
            id: 2,
            title: 'Profile Incomplete',
            message: 'Complete your profile to attract more sponsors',
            type: 'reminder',
            timestamp: new Date('2024-01-14T14:20:00'),
            read: false,
            actionUrl: 'profile'
        },
        {
            id: 3,
            title: 'Welcome to SponsoraCareer!',
            message: 'Get started by setting up your profile and goals',
            type: 'welcome',
            timestamp: new Date('2024-01-10T09:00:00'),
            read: true,
            actionUrl: 'overview'
        }
    ];
    
    updateNotificationCount();
}

// Toggle notification panel
function toggleNotificationPanel() {
    let panel = document.getElementById('notificationPanel');
    
    if (!panel) {
        createNotificationPanel();
        panel = document.getElementById('notificationPanel');
    }
    
    const isVisible = panel.classList.contains('active');
    
    if (isVisible) {
        panel.classList.remove('active');
        document.removeEventListener('click', closeNotificationPanelOnOutsideClick);
    } else {
        panel.classList.add('active');
        loadNotificationPanel();
        // Close panel when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeNotificationPanelOnOutsideClick);
        }, 100);
    }
}

// Create notification panel HTML
function createNotificationPanel() {
    const panel = document.createElement('div');
    panel.id = 'notificationPanel';
    panel.className = 'notification-panel';
    
    panel.innerHTML = `
        <div class="notification-panel-header">
            <h4>Notifications</h4>
            <button class="mark-all-read-btn" onclick="markAllNotificationsRead()">Mark all read</button>
        </div>
        <div class="notification-panel-content" id="notificationPanelContent">
            <!-- Notifications will be loaded here -->
        </div>
        <div class="notification-panel-footer">
            <button class="view-all-btn" onclick="viewAllNotifications()">View All</button>
        </div>
    `;
    
    document.body.appendChild(panel);
}

// Load notifications into panel
function loadNotificationPanel() {
    const content = document.getElementById('notificationPanelContent');
    if (!content) return;
    
    if (notifications.length === 0) {
        content.innerHTML = `
            <div class="no-notifications">
                <div class="no-notifications-icon">🔔</div>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    // Sort notifications by timestamp (newest first)
    const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
    
    const notificationsHTML = sortedNotifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
             data-notification-id="${notification.id}"
             onclick="handleNotificationClick(${notification.id})">
            <div class="notification-icon ${notification.type}">
                ${getNotificationIcon(notification.type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatNotificationTime(notification.timestamp)}</div>
            </div>
            ${!notification.read ? '<div class="notification-dot"></div>' : ''}
        </div>
    `).join('');
    
    content.innerHTML = notificationsHTML;
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        offer: '💰',
        reminder: '⏰',
        welcome: '👋',
        contract: '📋',
        payment: '💳',
        milestone: '🎯',
        system: '⚙️'
    };
    return icons[type] || '🔔';
}

// Format notification timestamp
function formatNotificationTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
}

// Handle notification click
function handleNotificationClick(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    // Mark as read
    notification.read = true;
    updateNotificationCount();
    
    // Close panel
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.remove('active');
    }
    
    // Navigate to relevant section
    if (notification.actionUrl) {
        showSection(notification.actionUrl);
    }
    
    // Show success message
    showNotification('Notification opened', 'info');
}

// Mark all notifications as read
function markAllNotificationsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    
    updateNotificationCount();
    loadNotificationPanel();
    showNotification('All notifications marked as read', 'success');
}

// View all notifications (placeholder)
function viewAllNotifications() {
    showNotification('All notifications view - coming soon!', 'info');
    toggleNotificationPanel();
}

// Update notification count badge
function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const countElement = document.querySelector('.notification-count');
    
    if (countElement) {
        if (unreadCount > 0) {
            countElement.textContent = unreadCount;
            countElement.style.display = 'block';
        } else {
            countElement.style.display = 'none';
        }
    }
}

// Close notification panel when clicking outside
function closeNotificationPanelOnOutsideClick(event) {
    const panel = document.getElementById('notificationPanel');
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (panel && !panel.contains(event.target) && !notificationBtn.contains(event.target)) {
        panel.classList.remove('active');
        document.removeEventListener('click', closeNotificationPanelOnOutsideClick);
    }
}

// Add new notification (utility function)
function addNotification(title, message, type = 'system', actionUrl = null) {
    const notification = {
        id: notifications.length + 1,
        title: title,
        message: message,
        type: type,
        timestamp: new Date(),
        read: false,
        actionUrl: actionUrl
    };
    
    notifications.unshift(notification); // Add to beginning
    updateNotificationCount();
    
    // If panel is open, refresh it
    const panel = document.getElementById('notificationPanel');
    if (panel && panel.classList.contains('active')) {
        loadNotificationPanel();
    }
}

// User dropdown functions
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('active');
        
        // Close dropdown when clicking outside
        if (dropdown.classList.contains('active')) {
            setTimeout(() => {
                document.addEventListener('click', closeUserDropdownOnOutsideClick);
            }, 100);
        } else {
            document.removeEventListener('click', closeUserDropdownOnOutsideClick);
        }
    }
}

function closeUserDropdownOnOutsideClick(event) {
    const dropdown = document.getElementById('userDropdownMenu');
    const badge = document.getElementById('userTypeBadge');
    
    if (dropdown && !dropdown.contains(event.target) && !badge.contains(event.target)) {
        dropdown.classList.remove('active');
        document.removeEventListener('click', closeUserDropdownOnOutsideClick);
    }
}

// Preferences management
let preferencesData = {};

function openPreferences() {
    const modal = document.getElementById('preferencesModal');
    if (modal) {
        // Close dropdown
        const dropdown = document.getElementById('userDropdownMenu');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
        
        // Load saved preferences
        loadPreferencesData();
        populatePreferencesForm();
        
        modal.classList.add('active');
        
        // Setup real-time updates for summary
        setupPreferencesListeners();
    }
}

function closePreferences() {
    const modal = document.getElementById('preferencesModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function loadPreferencesData() {
    const key = `sponsoracareer_preferences_${currentUser?.email}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        preferencesData = JSON.parse(saved);
    }
}

function populatePreferencesForm() {
    if (!preferencesData || Object.keys(preferencesData).length === 0) return;
    
    // Populate form fields
    if (preferencesData.durationMin) document.getElementById('prefDurationMin').value = preferencesData.durationMin;
    if (preferencesData.durationMax) document.getElementById('prefDurationMax').value = preferencesData.durationMax;
    if (preferencesData.optimalAmount) document.getElementById('prefOptimalAmount').value = preferencesData.optimalAmount;
    if (preferencesData.servicesRequested) document.getElementById('prefServicesRequested').value = preferencesData.servicesRequested;
    
    // Handle down payment checkbox and amount
    if (preferencesData.downPayment) {
        document.getElementById('prefDownPayment').checked = true;
        toggleDownPaymentAmount();
        if (preferencesData.downPaymentAmount) {
            document.getElementById('prefDownPaymentAmount').value = preferencesData.downPaymentAmount;
        }
    }
    
    // Update summary
    updatePreferencesSummary();
}

function setupPreferencesListeners() {
    const inputs = ['prefDurationMin', 'prefDurationMax', 'prefOptimalAmount', 'prefDownPaymentAmount'];
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.removeEventListener('input', updatePreferencesSummary);
            input.addEventListener('input', updatePreferencesSummary);
        }
    });
    
    const checkbox = document.getElementById('prefDownPayment');
    if (checkbox) {
        checkbox.removeEventListener('change', updatePreferencesSummary);
        checkbox.addEventListener('change', updatePreferencesSummary);
    }
}

function toggleDownPaymentAmount() {
    const checkbox = document.getElementById('prefDownPayment');
    const amountGroup = document.getElementById('downPaymentAmountGroup');
    
    if (checkbox && amountGroup) {
        if (checkbox.checked) {
            amountGroup.style.display = 'block';
        } else {
            amountGroup.style.display = 'none';
            document.getElementById('prefDownPaymentAmount').value = '';
        }
        updatePreferencesSummary();
    }
}

function updatePreferencesSummary() {
    const durationMin = parseInt(document.getElementById('prefDurationMin')?.value) || 0;
    const durationMax = parseInt(document.getElementById('prefDurationMax')?.value) || 0;
    const optimalAmount = parseFloat(document.getElementById('prefOptimalAmount')?.value) || 0;
    const downPayment = document.getElementById('prefDownPayment')?.checked;
    const downPaymentAmount = parseFloat(document.getElementById('prefDownPaymentAmount')?.value) || 0;
    
    // Update summary display
    const summaryDuration = document.getElementById('summaryDuration');
    if (summaryDuration) {
        if (durationMin && durationMax) {
            summaryDuration.textContent = `${durationMin}-${durationMax} months`;
        } else {
            summaryDuration.textContent = 'Not set';
        }
    }
    
    const summaryAmount = document.getElementById('summaryAmount');
    if (summaryAmount) {
        if (optimalAmount) {
            summaryAmount.textContent = formatCurrency(optimalAmount);
        } else {
            summaryAmount.textContent = 'Not set';
        }
    }
    
    const summaryDownPayment = document.getElementById('summaryDownPayment');
    if (summaryDownPayment) {
        if (downPayment && downPaymentAmount > 0) {
            summaryDownPayment.textContent = `Yes, up to ${formatCurrency(downPaymentAmount)}`;
        } else if (downPayment) {
            summaryDownPayment.textContent = 'Yes (amount not specified)';
        } else {
            summaryDownPayment.textContent = 'Not required';
        }
    }
}

function savePreferences() {
    const form = document.getElementById('preferencesForm');
    if (!form) return;
    
    // Validate form
    const durationMin = parseInt(document.getElementById('prefDurationMin')?.value);
    const durationMax = parseInt(document.getElementById('prefDurationMax')?.value);
    const optimalAmount = parseFloat(document.getElementById('prefOptimalAmount')?.value);
    
    if (!durationMin || !durationMax || !optimalAmount) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (durationMin >= durationMax) {
        showNotification('Maximum duration must be greater than minimum duration', 'error');
        return;
    }
    
    // Collect preferences data
    preferencesData = {
        durationMin: durationMin,
        durationMax: durationMax,
        optimalAmount: optimalAmount,
        servicesRequested: document.getElementById('prefServicesRequested')?.value || '',
        downPayment: document.getElementById('prefDownPayment')?.checked || false,
        downPaymentAmount: parseFloat(document.getElementById('prefDownPaymentAmount')?.value) || 0,
        updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    const key = `sponsoracareer_preferences_${currentUser?.email}`;
    localStorage.setItem(key, JSON.stringify(preferencesData));
    
    // Close modal
    closePreferences();
    
    // Show success message
    showNotification('Preferences saved successfully!', 'success');
    
    console.log('Preferences saved:', preferencesData);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session data
        sessionStorage.removeItem('sponsoracareer_user');
        localStorage.removeItem('sponsoracareer_user');
        
        // Redirect to login
        window.location.href = 'index.html';
    }
}

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 15px;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    }
    
    .notification.success { background: #28a745; }
    .notification.error { background: #dc3545; }
    .notification.info { background: #007bff; }
    .notification.warning { background: #ffc107; color: #333; }
    
    .notification button {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .offer-card, .contract-card, .milestone-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .offer-card:hover, .contract-card:hover, .milestone-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    
    .offer-header, .contract-header, .milestone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .offer-status, .contract-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .offer-status.pending, .contract-status.active {
        background: #fff3cd;
        color: #856404;
    }
    
    .offer-status.accepted, .contract-status.completed {
        background: #d4edda;
        color: #155724;
    }
    
    .offer-status.declined {
        background: #f8d7da;
        color: #721c24;
    }
    
    .offer-amount, .contract-amount {
        font-size: 1.5rem;
        font-weight: 700;
        color: #007bff;
        margin-bottom: 10px;
    }
    
    .offer-terms, .contract-terms {
        display: flex;
        gap: 15px;
        margin-bottom: 10px;
    }
    
    .offer-terms span, .contract-terms span {
        background: #f8f9fa;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #666;
    }
    
    .offer-message {
        color: #555;
        font-style: italic;
        margin: 15px 0;
        line-height: 1.5;
    }
    
    .offer-actions, .contract-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #e9ecef;
    }
    
    .progress-bar {
        background: #e9ecef;
        border-radius: 10px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 5px;
    }
    
    .progress-fill {
        background: #28a745;
        height: 100%;
        transition: width 0.3s ease;
    }
    
    .milestone-card.completed {
        opacity: 0.7;
        background: #f8f9fa;
    }
    
    .milestone-progress {
        font-weight: 600;
        color: #007bff;
    }
    
    .milestone-description {
        color: #666;
        margin: 10px 0;
    }
    
    .milestone-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #e9ecef;
    }
    
    .milestone-date {
        font-size: 0.85rem;
        color: #666;
    }
    
    /* Notification Panel Styles */
    .notification-panel {
        position: fixed;
        top: 70px;
        right: 20px;
        width: 350px;
        max-height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 1000;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e9ecef;
    }
    
    .notification-panel.active {
        display: flex;
        animation: slideInDown 0.3s ease;
    }
    
    @keyframes slideInDown {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .notification-panel-header {
        padding: 15px 20px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
    }
    
    .notification-panel-header h4 {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
    }
    
    .mark-all-read-btn {
        background: none;
        border: none;
        color: #007bff;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.3s ease;
    }
    
    .mark-all-read-btn:hover {
        background: rgba(0,123,255,0.1);
    }
    
    .notification-panel-content {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
    }
    
    .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 15px 20px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.3s ease;
        position: relative;
    }
    
    .notification-item:hover {
        background: #f8f9fa;
    }
    
    .notification-item:last-child {
        border-bottom: none;
    }
    
    .notification-item.unread {
        background: rgba(0,123,255,0.02);
        border-left: 3px solid #007bff;
    }
    
    .notification-item.read {
        opacity: 0.7;
    }
    
    .notification-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
        width: 24px;
        text-align: center;
    }
    
    .notification-content {
        flex: 1;
        min-width: 0;
    }
    
    .notification-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
        font-size: 0.9rem;
    }
    
    .notification-message {
        color: #666;
        font-size: 0.85rem;
        line-height: 1.4;
        margin-bottom: 4px;
    }
    
    .notification-time {
        color: #999;
        font-size: 0.75rem;
    }
    
    .notification-dot {
        position: absolute;
        top: 18px;
        right: 15px;
        width: 8px;
        height: 8px;
        background: #007bff;
        border-radius: 50%;
    }
    
    .notification-panel-footer {
        padding: 12px 20px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
        text-align: center;
    }
    
    .view-all-btn {
        background: none;
        border: none;
        color: #007bff;
        font-size: 0.9rem;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 6px;
        transition: background 0.3s ease;
        font-weight: 500;
    }
    
    .view-all-btn:hover {
        background: rgba(0,123,255,0.1);
    }
    
    .no-notifications {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .no-notifications-icon {
        font-size: 2.5rem;
        margin-bottom: 15px;
        opacity: 0.5;
    }
    
    .no-notifications p {
        margin: 0;
        font-size: 0.9rem;
    }
    
    /* Responsive adjustments for notification panel */
    @media (max-width: 768px) {
        .notification-panel {
            width: 320px;
            right: 10px;
            top: 60px;
        }
    }
    
    @media (max-width: 480px) {
        .notification-panel {
            width: calc(100vw - 20px);
            right: 10px;
            left: 10px;
        }
    }
`;

// Add styles to document
if (!document.getElementById('dashboard-dynamic-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-dynamic-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

console.log('🎯 Dashboard JavaScript loaded successfully!');
