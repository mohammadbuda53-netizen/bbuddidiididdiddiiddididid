// app.js - Main application JavaScript file

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Craftsman Work App initialized');
    
    // Check if we're on the login page
    if (document.getElementById('loginForm')) {
        initializeAuthPage();
    }
    
    // Check if we're on the dashboard page
    if (document.getElementById('projectForm')) {
        initializeDashboard();
    }
});

function initializeAuthPage() {
    // Show/hide registration form
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginContainer = document.querySelector('.auth-form-container');
    const registerContainer = document.getElementById('registerContainer');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginContainer.classList.toggle('hidden');
            registerContainer.classList.toggle('hidden');
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            registerContainer.classList.toggle('hidden');
            loginContainer.classList.toggle('hidden');
        });
    }
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }
    
    // Registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistrationFormSubmit);
    }
}

function initializeDashboard() {
    // Load user profile
    loadUserProfile();
    
    // Load projects and populate dropdowns
    loadProjectsForDropdown();
    loadProjectsList();
    
    // Load time entries
    loadTimeEntries();
    
    // Setup form submissions
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectFormSubmit);
    }
    
    const timeEntryForm = document.getElementById('timeEntryForm');
    if (timeEntryForm) {
        timeEntryForm.addEventListener('submit', handleTimeEntryFormSubmit);
    }
}

function showAuthMessage(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `auth-message ${isSuccess ? 'success' : 'error'}`;
        element.style.display = 'block';
        
        // Clear message after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

async function handleLoginFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const credentials = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Store token in localStorage
            localStorage.setItem('token', result.token);
            
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            showAuthMessage('authMessage', result.error || 'Login failed', false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('authMessage', 'An error occurred during login', false);
    }
}

async function handleRegistrationFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const userData = Object.fromEntries(formData.entries());
    
    // Check if passwords match
    if (userData.password !== userData.confirmPassword) {
        showAuthMessage('regMessage', 'Passwords do not match', false);
        return;
    }
    
    // Remove confirmPassword from the data to send to server
    delete userData.confirmPassword;
    
    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAuthMessage('regMessage', result.message, true);
            
            // Reset password fields
            form.reset();
            
            // Switch to login form after a delay
            setTimeout(() => {
                document.getElementById('registerContainer').classList.add('hidden');
                document.querySelector('.auth-form-container').classList.remove('hidden');
            }, 2000);
        } else {
            showAuthMessage('regMessage', result.error || 'Registration failed', false);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage('regMessage', 'An error occurred during registration', false);
    }
}

async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userProfile = document.getElementById('userProfile');
            const user = await response.json();
            
            userProfile.innerHTML = `
                <h3>Welcome, ${user.username}!</h3>
                <p><strong>User ID:</strong> ${user.id}</p>
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                <button id="logoutBtn" class="btn btn-secondary">Logout</button>
            `;
            
            // Add logout button listener
            document.getElementById('logoutBtn').addEventListener('click', logout);
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // User might need to log in again
        window.location.href = '/login';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

async function loadProjectsForDropdown() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        const response = await fetch('/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const projects = await response.json();
            const selectElement = document.getElementById('timeProjectId');
            
            // Clear existing options except the first placeholder
            selectElement.innerHTML = '<option value="">Select a project</option>';
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading projects for dropdown:', error);
    }
}

async function loadProjectsList() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        const response = await fetch('/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const projects = await response.json();
            const projectsList = document.getElementById('projectsList');
            
            if (projects.length === 0) {
                projectsList.innerHTML = '<p>No projects yet. Create your first project!</p>';
                return;
            }
            
            projectsList.innerHTML = projects.map(project => {
                return `
                    <div class="list-item">
                        <div class="item-title">${project.name}</div>
                        <div class="item-meta">
                            <span>Client: ${project.client || 'N/A'}</span>
                            <span>Status: ${project.status}</span>
                        </div>
                        <div class="item-meta">
                            <small>Created: ${new Date(project.created_at).toLocaleDateString()}</small>
                        </div>
                        <div class="actions">
                            <button class="btn action-btn btn-secondary" onclick="updateProject(${project.id})">Edit</button>
                            <button class="btn action-btn btn-danger" onclick="deleteProject(${project.id})">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading projects list:', error);
    }
}

async function loadTimeEntries() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        const response = await fetch('/api/time-entries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const timeEntries = await response.json();
            const timeEntriesList = document.getElementById('timeEntriesList');
            
            if (timeEntries.length === 0) {
                timeEntriesList.innerHTML = '<p>No time entries yet. Log your first work time!</p>';
                return;
            }
            
            timeEntriesList.innerHTML = timeEntries.map(entry => {
                return `
                    <div class="list-item">
                        <div class="item-title">Project: ${entry.project_name || 'N/A'}</div>
                        <div class="item-meta">
                            <span>Worker: ${entry.user_name || 'N/A'}</span>
                            <span>Duration: ${calculateDuration(entry.start_date, entry.end_date)}</span>
                        </div>
                        <div class="item-meta">
                            <small>${formatDateTime(entry.start_date)} to ${formatDateTime(entry.end_date)}</small>
                        </div>
                        <div class="item-meta">
                            <small>Description: ${entry.task_description || 'N/A'}</small>
                        </div>
                        <div class="actions">
                            <button class="btn action-btn btn-secondary" onclick="editTimeEntry(${entry.id})">Edit</button>
                            <button class="btn action-btn btn-danger" onclick="deleteTimeEntry(${entry.id})">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading time entries:', error);
    }
}

async function handleProjectFormSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    const projectData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(result.message, 'success');
            form.reset();
            loadProjectsForDropdown();
            loadProjectsList();
        } else {
            showNotification(result.error || 'Failed to create project', 'error');
        }
    } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Error creating project', 'error');
    }
}

async function handleTimeEntryFormSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    const timeEntryData = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/api/time-entries', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(timeEntryData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification(result.message, 'success');
            form.reset();
            loadTimeEntries();
        } else {
            showNotification(result.error || 'Failed to log time', 'error');
        }
    } catch (error) {
        console.error('Error creating time entry:', error);
        showNotification('Error logging time', 'error');
    }
}

// Helper functions
function showNotification(message, type = 'success') {
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else {
        notification.style.backgroundColor = '#dc3545';
    }
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffHrs = Math.floor(diffMs / 3600000); // hours
    const diffMins = Math.floor((diffMs % 3600000) / 60000); // minutes
    
    return `${diffHrs}h ${diffMins}m`;
}

function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
}

// Placeholder functions for edit/delete actions that will be implemented later
function updateProject(id) {
    alert(`Editing project ${id} - Implementation needed`);
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Project deleted successfully', 'success');
            loadProjectsForDropdown();
            loadProjectsList();
        } else {
            const result = await response.json();
            showNotification(result.error || 'Failed to delete project', 'error');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Error deleting project', 'error');
    }
}

function editTimeEntry(id) {
    alert(`Editing time entry ${id} - Implementation needed`);
}

async function deleteTimeEntry(id) {
    if (!confirm('Are you sure you want to delete this time entry?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    try {
        const response = await fetch(`/api/time-entries/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Time entry deleted successfully', 'success');
            loadTimeEntries();
        } else {
            const result = await response.json();
            showNotification(result.error || 'Failed to delete time entry', 'error');
        }
    } catch (error) {
        console.error('Error deleting time entry:', error);
        showNotification('Error deleting time entry', 'error');
    }
}