// Registration Page JavaScript

// Global state
let currentStep = 1;
let selectedUserType = null;
let registrationData = {};

// Initialize registration page
document.addEventListener('DOMContentLoaded', function() {
    initializeRegistration();
    setupEventListeners();
    
    // Check if user type was passed from login page
    const urlParams = new URLSearchParams(window.location.search);
    const userType = urlParams.get('type');
    if (userType && ['sponsor', 'dreamer'].includes(userType)) {
        selectUserType(userType);
        nextStep();
    }
});

// Initialize registration
function initializeRegistration() {
    currentStep = 1;
    selectedUserType = null;
    registrationData = {};
    
    // Show first step
    showStep(1);
    
    console.log('🎯 Registration page initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Basic info form
    const basicInfoForm = document.getElementById('basicInfoForm');
    if (basicInfoForm) {
        basicInfoForm.addEventListener('submit', handleBasicInfoSubmit);
    }
    
    // Preferences form
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handleRegistrationSubmit);
    }
    
    // Real-time validation
    setupRealTimeValidation();
    
    // Password confirmation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    if (password && confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
    
    // Email display update
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', updateEmailDisplay);
    }
}

// Select user type
function selectUserType(userType) {
    selectedUserType = userType;
    registrationData.userType = userType;
    
    // Update UI
    const cards = document.querySelectorAll('.user-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        if (card.classList.contains(`${userType}-card`)) {
            card.classList.add('selected');
        }
    });
    
    // Update type indicator for next step
    updateTypeIndicator(userType);
    
    console.log('Selected user type:', userType);
}

// Update type indicator
function updateTypeIndicator(userType) {
    const indicator = document.getElementById('selectedTypeIndicator');
    const icon = document.getElementById('selectedTypeIcon');
    const text = document.getElementById('selectedTypeText');
    
    if (indicator && icon && text) {
        if (userType === 'sponsor') {
            indicator.className = 'selected-type-indicator sponsor';
            icon.textContent = '💼';
            text.textContent = 'Sponsor Account';
        } else {
            indicator.className = 'selected-type-indicator';
            icon.textContent = '🌟';
            text.textContent = 'Dreamer Account';
        }
    }
}

// Show specific step
function showStep(stepNumber) {
    // Hide all steps
    const steps = document.querySelectorAll('.registration-step');
    steps.forEach(step => step.classList.remove('active'));
    
    // Show target step
    const targetStep = document.querySelector(`#${getStepId(stepNumber)}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = stepNumber;
        
        // Update step indicators
        updateStepIndicators(stepNumber);
        
        // Focus first input in step
        setTimeout(() => {
            const firstInput = targetStep.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

// Get step ID by number
function getStepId(stepNumber) {
    const stepIds = [
        'user-type-selection',
        'basic-info-step', 
        'profile-info-step',
        'preferences-step',
        'success-step'
    ];
    return stepIds[stepNumber - 1];
}

// Update step indicators
function updateStepIndicators(currentStep) {
    const indicators = document.querySelectorAll('.step');
    indicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            indicator.classList.add('completed');
        } else if (stepNum === currentStep) {
            indicator.classList.add('active');
        }
    });
}

// Next step
function nextStep() {
    if (!selectedUserType && currentStep === 1) {
        showError('Please select an account type to continue');
        return;
    }
    
    if (currentStep === 3) {
        // Show appropriate profile form
        showProfileForm(selectedUserType);
        updateProfileStepTitle(selectedUserType);
    }
    
    if (currentStep < 5) {
        showStep(currentStep + 1);
    }
}

// Previous step
function previousStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// Show profile form based on user type
function showProfileForm(userType) {
    const dreamerForm = document.getElementById('dreamerProfileForm');
    const sponsorForm = document.getElementById('sponsorProfileForm');
    
    if (userType === 'dreamer') {
        dreamerForm.style.display = 'block';
        sponsorForm.style.display = 'none';
    } else {
        dreamerForm.style.display = 'none';
        sponsorForm.style.display = 'block';
    }
}

// Update profile step title
function updateProfileStepTitle(userType) {
    const title = document.getElementById('profileStepTitle');
    if (title) {
        title.textContent = userType === 'dreamer' ? 'Dreamer Profile' : 'Sponsor Profile';
    }
}

// Handle basic info form submission
async function handleBasicInfoSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const basicInfo = {};
    
    // Extract form data
    for (let [key, value] of formData.entries()) {
        basicInfo[key] = value.trim();
    }
    
    // Validate form
    if (!validateBasicInfo(basicInfo)) {
        return;
    }
    
    // Store data
    registrationData = { ...registrationData, ...basicInfo };
    
    // Move to next step
    nextStep();
}

// Validate basic info
function validateBasicInfo(data) {
    let isValid = true;
    
    // Clear previous errors
    clearFormErrors();
    
    // Required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    requiredFields.forEach(field => {
        if (!data[field]) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (data.password && data.password.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    // Password confirmation
    if (data.password !== data.confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

// Handle registration submission
async function handleRegistrationSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const preferences = {
        emailNotifications: [],
        privacySettings: []
    };
    
    // Extract preferences
    for (let [key, value] of formData.entries()) {
        if (key === 'emailNotifications' || key === 'privacySettings') {
            preferences[key].push(value);
        } else if (key !== 'agreeToTerms') {
            preferences[key] = value;
        }
    }
    
    // Check terms agreement
    if (!formData.get('agreeToTerms')) {
        showError('You must agree to the Terms of Service and Privacy Policy');
        return;
    }
    
    // Collect profile data
    const profileData = collectProfileData();
    
    // Combine all registration data
    const completeRegistrationData = {
        ...registrationData,
        profileData,
        preferences
    };
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Creating Account...';
    
    try {
        // Register user
        await registerUser(completeRegistrationData);
        
        // Show success step
        showStep(5);
        
        // Update success email display
        const successEmail = document.getElementById('successEmail');
        if (successEmail) {
            successEmail.textContent = registrationData.email;
        }
        
    } catch (error) {
        console.error('Registration failed:', error);
        showError(error.message || 'Registration failed. Please try again.');
        
        // Reset button
        submitBtn.classList.remove('loading');
        submitBtn.textContent = originalText;
    }
}

// Collect profile data from forms
function collectProfileData() {
    const profileData = {};
    
    if (selectedUserType === 'dreamer') {
        const form = document.getElementById('dreamerProfileForm');
        const formData = new FormData(form);
        
        // Extract form data
        for (let [key, value] of formData.entries()) {
            if (key === 'fundingTypes') {
                if (!profileData.fundingTypes) profileData.fundingTypes = [];
                profileData.fundingTypes.push(value);
            } else {
                profileData[key] = value.trim();
            }
        }
        
        // Calculate financial totals
        if (profileData.weeklyNeed && profileData.expectedDurationMin && profileData.expectedDurationMax) {
            const weeklyNeed = parseFloat(profileData.weeklyNeed);
            const minDuration = parseInt(profileData.expectedDurationMin);
            const maxDuration = parseInt(profileData.expectedDurationMax);
            
            profileData.minTotalFunding = weeklyNeed * minDuration * 4.33;
            profileData.maxTotalFunding = weeklyNeed * maxDuration * 4.33;
        }
        
    } else if (selectedUserType === 'sponsor') {
        const form = document.getElementById('sponsorProfileForm');
        const formData = new FormData(form);
        
        // Extract form data
        for (let [key, value] of formData.entries()) {
            if (key === 'preferredFundingTypes' || key === 'industries') {
                if (!profileData[key]) profileData[key] = [];
                profileData[key].push(value);
            } else {
                profileData[key] = value.trim();
            }
        }
    }
    
    return profileData;
}

// Register user with API
async function registerUser(data) {
    try {
        // Prepare registration payload
        const payload = {
            email: data.email,
            password: data.password,
            userType: data.userType,
            firstName: data.firstName,
            lastName: data.lastName,
            location: data.location,
            phone: data.phone,
            profileData: data.profileData,
            preferences: data.preferences
        };
        
        // Call registration API
        const response = await window.apiClient.register(
            payload.email,
            payload.password,
            payload.userType,
            false // Don't remember for registration
        );
        
        // Send additional profile data if registration successful
        if (response.user && payload.profileData) {
            try {
                await window.apiClient.saveProfile(payload.profileData);
            } catch (profileError) {
                console.warn('Profile save failed:', profileError);
                // Don't fail registration if profile save fails
            }
        }
        
        // Send verification email
        await sendVerificationEmail(payload.email);
        
        return response;
        
    } catch (error) {
        throw new Error(error.message || 'Registration failed');
    }
}

// Send verification email (simulated)
async function sendVerificationEmail(email) {
    // In a real application, this would trigger an actual email
    console.log(`📧 Verification email sent to: ${email}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Store verification token (in real app, this would be handled server-side)
    const verificationToken = generateVerificationToken();
    localStorage.setItem(`verification_${email}`, verificationToken);
    
    return { success: true, token: verificationToken };
}

// Generate verification token
function generateVerificationToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Resend verification email
async function resendVerification() {
    if (!registrationData.email) {
        showError('Email address not found');
        return;
    }
    
    try {
        await sendVerificationEmail(registrationData.email);
        showSuccess('Verification email sent successfully!');
    } catch (error) {
        showError('Failed to resend verification email');
    }
}

// Validation functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
    } else {
        clearFieldError('confirmPassword');
    }
}

function updateEmailDisplay() {
    const email = document.getElementById('email').value;
    const emailDisplay = document.getElementById('emailDisplay');
    
    if (emailDisplay) {
        emailDisplay.textContent = email || 'your-email@example.com';
    }
}

// Real-time validation setup
function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            // Clear error on input
            if (this.classList.contains('error')) {
                clearFieldError(this.id || this.name);
            }
        });
    });
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.id || field.name;
    
    // Clear previous error
    clearFieldError(fieldName);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(fieldName, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(fieldName, 'Please enter a valid email address');
        return false;
    }
    
    // Password validation
    if (field.type === 'password' && fieldName === 'password' && value && value.length < 8) {
        showFieldError(fieldName, 'Password must be at least 8 characters long');
        return false;
    }
    
    // Number validation
    if (field.type === 'number' && value) {
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        const numValue = parseFloat(value);
        
        if (min && numValue < parseFloat(min)) {
            showFieldError(fieldName, `Value must be at least ${min}`);
            return false;
        }
        
        if (max && numValue > parseFloat(max)) {
            showFieldError(fieldName, `Value must be no more than ${max}`);
            return false;
        }
    }
    
    return true;
}

// Error handling functions
function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    // Add error class
    formGroup.classList.add('error');
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    // Remove error classes
    formGroup.classList.remove('error');
    field.classList.remove('error');
    
    // Remove error message
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function clearFormErrors() {
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
        group.classList.remove('error');
    });
    
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
    });
    
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
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
}

function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Terms and Privacy functions
function showTerms() {
    alert('Terms of Service\n\nThis is a demo application. In a real application, this would show the complete Terms of Service document.');
}

function showPrivacy() {
    alert('Privacy Policy\n\nThis is a demo application. In a real application, this would show the complete Privacy Policy document.');
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    // ESC to go back
    if (event.key === 'Escape' && currentStep > 1) {
        previousStep();
    }
    
    // Enter to continue (if not in form)
    if (event.key === 'Enter' && !event.target.matches('input, textarea, button')) {
        if (currentStep === 1 && selectedUserType) {
            nextStep();
        }
    }
});

// Add notification styles
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
`;

// Add styles to document
if (!document.getElementById('registration-notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'registration-notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

console.log('🎯 Registration JavaScript loaded successfully!');
