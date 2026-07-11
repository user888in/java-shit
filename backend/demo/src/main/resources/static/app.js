// app.js
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const authForms = document.getElementById('auth-forms');
    const loggedInUI = document.getElementById('logged-in-ui');
    const profileEmail = document.getElementById('profile-email');
    const profileName = document.getElementById('profile-name');
    const profileRole = document.getElementById('profile-role');
    const profileActive = document.getElementById('profile-active');
    const productsList = document.getElementById('products-list');
    const logoutBtn = document.getElementById('logout-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const githubLoginBtn = document.getElementById('github-login-btn');

    // Message container (we'll create it)
    const messageContainer = document.createElement('div');
    messageContainer.id = 'message';
    authForms.parentNode.insertBefore(messageContainer, authForms.nextSibling);

    // Show message function
    function showMessage(text, type) {
        messageContainer.textContent = text;
        messageContainer.className = type === 'success' ? 'success' : 'error';
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }

    // Function to get cookie by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Check for cookies from OAuth2 redirect and store in localStorage
    const accessTokenFromCookie = getCookie('accessToken');
    const refreshTokenFromCookie = getCookie('refreshToken');
    if (accessTokenFromCookie && refreshTokenFromCookie) {
        localStorage.setItem('accessToken', accessTokenFromCookie);
        localStorage.setItem('refreshToken', refreshTokenFromCookie);
        // Remove the cookies
        document.cookie = 'accessToken=; Max-Age=0; Path=/;';
        document.cookie = 'refreshToken=; Max-Age=0; Path=/;';
    }

    // Check if we have a token
    const token = localStorage.getItem('accessToken');
    if (token) {
        showLoggedInUI();
        loadProfile();
        loadProducts();
    } else {
        showAuthForms();
    }

    // Tabs
    function openTab(evt, tabName) {
        const tabcontent = document.getElementsByClassName('tabcontent');
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = 'none';
        }
        const tablinks = document.getElementsByClassName('tablinks');
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(' active', '');
        }
        document.getElementById(tabName).style.display = 'block';
        evt.currentTarget.className += ' active';
    }

    // Open login tab by default
    document.querySelector('.tablinks').click();

    // Login form
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            showMessage('Login successful!', 'success');
            showLoggedInUI();
            loadProfile();
            loadProducts();
        })
        .catch(error => {
            showMessage('Login failed: ' + error.message, 'error');
        });
    });

    // Register form
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            data);
            // Switch to login tab
            document.querySelector('[onclick="openTab(event, \\'Login\\')"]').click();
            // Clear form
            registerForm.reset();
        })
        .catch(error => {
            showMessage('Registration failed: ' + error.message, 'error');
        });
    });

    // Social login buttons
    googleLoginBtn.addEventListener('click', function() {
        window.location.href = '/oauth2/authorization/google';
    });

    githubLoginBtn.addEventListener('click', function() {
        window.location.href = '/oauth2/authorization/github';
    });

    // Logout
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        showMessage('Logged out successfully.', 'success');
        showAuthForms();
    });

    // Functions
    function showAuthForms() {
        authForms.style.display = 'block';
        loggedInUI.style.display = 'none';
    }

    function showLoggedInUI() {
        authForms.style.display = 'none';
        loggedInUI.style.display = 'block';
    }

    function loadProfile() {
        const token = localStorage.getItem('accessToken');
        fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load profile');
            }
            return response.json();
        })
        .then(user => {
            profileEmail.textContent = user.email;
            profileName.textContent = user.name;
            profileRole.textContent = user.role;
            profileActive.textContent = user.active ? 'Yes' : 'No';
        })
        .catch(error => {
            showMessage('Failed to load profile: ' + error.message, 'error');
            // If token is invalid, remove it and show login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            showAuthForms();
        });
    }

    function loadProducts() {
        const token = localStorage.getItem('accessToken');
        fetch('/api/products', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            return response.json();
        })
        .then(products => {
            productsList.innerHTML = '';
            if (products.length === 0) {
                productsList.innerHTML = '<li>No products found.</li>';
            } else {
                products.forEach(product => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span><strong>${product.name}</strong> - $${product.price}</span>
                        <span>ID: ${product.id}</span>
                    `;
                    productsList.appendChild(li);
                });
            }
        })
        .catch(error => {
            showMessage('Failed to load products: ' + error.message, 'error');
        });
    }
});