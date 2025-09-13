// DOM Elements
const authSelection = document.querySelector('.auth-selection');
const sponsorSignin = document.getElementById('sponsor-signin');
const dreamerSignin = document.getElementById('dreamer-signin');
const successMessage = document.getElementById('success-message');
const successTitle = document.getElementById('success-title');
const successText = document.getElementById('success-text');

// Demo user credentials for testing
const demoUsers = {
    sponsor: {
        email: 'sponsor@example.com',
        password: 'sponsor123'
    },
    dreamer: {
        email: 'dreamer@example.com',
        password: 'dreamer123'
    }
};

// Show sign-in form for selected user type
function showSignIn(userType) {
    // Hide selection screen
    authSelection.classList.add('hidden');
    
    // Show appropriate sign-in form
    if (userType === 'sponsor') {
        sponsorSignin.classList.remove('hidden');
        // Focus on email field
        setTimeout(() => {
            document.getElementById('sponsor-email').focus();
        }, 100);
    } else if (userType === 'dreamer') {
        dreamerSignin.classList.remove('hidden');
        // Focus on email field
        setTimeout(() => {
            document.getElementById('dreamer-email').focus();
        }, 100);
    }
}

// Show user type selection screen
function showSelection() {
    // Hide all forms and messages
    sponsorSignin.classList.add('hidden');
    dreamerSignin.classList.add('hidden');
    successMessage.classList.add('hidden');
    
    // Show selection screen
    authSelection.classList.remove('hidden');
    
    // Clear form data
    clearForms();
}

// Clear all form data
function clearForms() {
    document.getElementById('sponsor-form').reset();
    document.getElementById('dreamer-form').reset();
    
    // Remove any error styling
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
    
    // Remove any error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

// Handle form submission
function handleSignIn(event, userType) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    // Clear previous errors
    clearErrors(form);
    
    // Validate form
    if (!validateForm(email, password, form)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('.signin-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    form.classList.add('loading');
    
    // Simulate authentication delay
    setTimeout(() => {
        // Check credentials (in a real app, this would be an API call)
        const isValidUser = authenticateUser(email, password, userType);
        
        if (isValidUser) {
            // Success - show success message
            showSuccessMessage(userType, email, remember);
        } else {
            // Failed authentication
            showAuthError(form, 'Invalid email or password. Please try again.');
        }
        
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        form.classList.remove('loading');
    }, 1500);
}

// Validate form inputs
function validateForm(email, password, form) {
    let isValid = true;
    
    // Email validation
    const emailInput = form.querySelector('input[type="email"]');
    if (!email) {
        showFieldError(emailInput, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    const passwordInput = form.querySelector('input[type="password"]');
    if (!password) {
        showFieldError(passwordInput, 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    }
    
    return isValid;
}

// Check if email format is valid
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show field-specific error
function showFieldError(input, message) {
    input.classList.add('error');
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '5px';
    
    // Insert after the input
    input.parentNode.appendChild(errorDiv);
    
    // Focus on the error field
    input.focus();
}

// Show general authentication error
function showAuthError(form, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message auth-error';
    errorDiv.innerHTML = `
        <div style="
            background: #f8d7da;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
            text-align: center;
        ">
            <strong>⚠️ ${message}</strong>
        </div>
    `;
    
    // Insert at the top of the form
    const formHeader = form.querySelector('.form-header');
    formHeader.parentNode.insertBefore(errorDiv, formHeader.nextSibling);
}

// Clear all error messages and styling
function clearErrors(form) {
    // Remove error styling from inputs
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
    
    // Remove error messages
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}

// Authenticate user (demo implementation)
function authenticateUser(email, password, userType) {
    // In a real application, this would make an API call to your backend
    // For demo purposes, we'll check against predefined credentials
    const demoUser = demoUsers[userType];
    
    // Check if credentials match demo user OR allow any email with password length >= 6
    return (email === demoUser.email && password === demoUser.password) || 
           (isValidEmail(email) && password.length >= 6);
}

// Show success message
function showSuccessMessage(userType, email, remember) {
    // Hide sign-in form
    if (userType === 'sponsor') {
        sponsorSignin.classList.add('hidden');
    } else {
        dreamerSignin.classList.add('hidden');
    }
    
    // Update success message content
    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    successTitle.textContent = `Welcome, ${userTypeDisplay}!`;
    successText.innerHTML = `
        You have successfully signed in as a <strong>${userTypeDisplay}</strong>.<br>
        <small style="color: #888; margin-top: 10px; display: block;">
            Signed in as: ${email}
            ${remember ? ' (Remember me enabled)' : ''}
        </small>
    `;
    
    // Show success message
    successMessage.classList.remove('hidden');
    
    // Store user session (demo)
    if (remember) {
        localStorage.setItem('sponsoracareer_user', JSON.stringify({
            email: email,
            userType: userType,
            loginTime: new Date().toISOString()
        }));
    } else {
        sessionStorage.setItem('sponsoracareer_user', JSON.stringify({
            email: email,
            userType: userType,
            loginTime: new Date().toISOString()
        }));
    }
}

// Handle forgot password
function showForgotPassword(userType) {
    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    alert(`Forgot Password for ${userTypeDisplay}\n\nIn a real application, this would:\n• Send a password reset email\n• Redirect to a password reset page\n• Provide security questions\n\nDemo credentials:\n${userType}@example.com\nPassword: ${userType}123`);
}

// Handle sign up
function showSignUp(userType) {
    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    alert(`Create ${userTypeDisplay} Account\n\nIn a real application, this would:\n• Redirect to a registration form\n• Collect additional profile information\n• Send verification emails\n• Set up user preferences\n\nFor demo purposes, you can sign in with any valid email and password (6+ characters).`);
}

// Add input event listeners for real-time validation feedback
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to all email and password inputs
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // Remove error styling when user starts typing
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                
                // Remove associated error message
                const errorMsg = this.parentNode.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });
        
        input.addEventListener('blur', function() {
            // Validate on blur for better UX
            const value = this.value.trim();
            
            if (this.type === 'email' && value && !isValidEmail(value)) {
                showFieldError(this, 'Please enter a valid email address');
            } else if (this.type === 'password' && value && value.length < 6) {
                showFieldError(this, 'Password must be at least 6 characters');
            }
        });
    });
    
    // Check for existing session on page load
    checkExistingSession();
});

// Check for existing user session
function checkExistingSession() {
    const sessionUser = sessionStorage.getItem('sponsoracareer_user');
    const localUser = localStorage.getItem('sponsoracareer_user');
    
    if (sessionUser || localUser) {
        const userData = JSON.parse(sessionUser || localUser);
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
        
        // Auto-login if session is less than 24 hours old
        if (hoursSinceLogin < 24) {
            showSuccessMessage(userData.userType, userData.email, !!localUser);
        } else {
            // Clear expired session
            sessionStorage.removeItem('sponsoracareer_user');
            localStorage.removeItem('sponsoracareer_user');
        }
    }
}

// Add keyboard navigation support
document.addEventListener('keydown', function(event) {
    // ESC key to go back to selection
    if (event.key === 'Escape') {
        if (!authSelection.classList.contains('hidden')) {
            return; // Already on selection screen
        }
        showSelection();
    }
    
    // Enter key on cards to trigger sign-in
    if (event.key === 'Enter' && event.target.classList.contains('user-card')) {
        if (event.target.classList.contains('sponsor-card')) {
            showSignIn('sponsor');
        } else if (event.target.classList.contains('dreamer-card')) {
            showSignIn('dreamer');
        }
    }
});

// Make cards focusable for keyboard navigation
document.addEventListener('DOMContentLoaded', function() {
    const userCards = document.querySelectorAll('.user-card');
    userCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', card.querySelector('h3').textContent);
    });
});

// Add some demo info to console
console.log('🎉 SponsoraCareer Demo Site Loaded!');
console.log('📝 Demo Credentials:');
console.log('   Sponsor: sponsor@example.com / sponsor123');
console.log('   Dreamer: dreamer@example.com / dreamer123');
console.log('💡 Or use any valid email with 6+ character password');
console.log('⌨️  Keyboard shortcuts: ESC to go back, Enter on cards to select');
