/**
 * GitHub Progress Sync Module
 * 
 * This module handles GitHub OAuth (Device Flow) authentication and syncs
 * progress data to a progress.json file in your GitHub repository.
 * 
 * SETUP REQUIRED:
 * 1. Go to GitHub Settings > Developer Settings > OAuth Apps
 * 2. Click "New OAuth App"
 * 3. Fill in:
 *    - Application name: Learning Tracker (or any name)
 *    - Homepage URL: https://yourusername.github.io/Planning
 *    - Authorization callback URL: https://yourusername.github.io/Planning
 * 4. After creation, copy the Client ID
 * 5. Replace GITHUB_CLIENT_ID below with your Client ID
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const GITHUB_CONFIG = {
    // Replace with your OAuth App Client ID (get it after registering the OAuth App)
    clientId: 'Ov23liC6izrnZ4NVzKHM',
    
    // Your GitHub username
    owner: 'Harshal750254',
    
    // Repository name
    repo: 'dev-course-tracker',
    
    // Path to progress file in repo (shared across all pages)
    progressPath: 'progress.json',
    
    // Branch to commit to
    branch: 'main'
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const GitHubSync = {
    accessToken: null,
    user: null,
    syncTimeout: null,
    isSyncing: false,
    lastSyncedData: null,
    
    // Initialize the sync module
    init() {
        // Load saved token
        this.accessToken = localStorage.getItem('github_access_token');
        this.user = JSON.parse(localStorage.getItem('github_user') || 'null');
        
        // Create UI elements
        this.createSyncUI();
        
        // If we have a token, validate it and load progress
        if (this.accessToken) {
            this.validateToken();
        }
        
        // Listen for storage changes (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'github_access_token') {
                this.accessToken = e.newValue;
                if (this.accessToken) {
                    this.validateToken();
                } else {
                    this.updateUI('signed-out');
                }
            }
        });
    },
    
    // ========================================================================
    // UI CREATION
    // ========================================================================
    
    createSyncUI() {
        // Find the nav element
        const nav = document.querySelector('nav .nav-content');
        if (!nav) return;
        
        // Create sync container
        const syncContainer = document.createElement('div');
        syncContainer.className = 'github-sync-container';
        syncContainer.innerHTML = `
            <div class="sync-status" id="sync-status" title="Sync status">
                <span class="sync-icon">○</span>
                <span class="sync-text">Local</span>
            </div>
            <button class="github-btn" id="github-auth-btn" onclick="GitHubSync.handleAuthClick()">
                <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span id="auth-btn-text">Sign in</span>
            </button>
        `;
        
        nav.appendChild(syncContainer);
        
        // Add styles
        this.addStyles();
        
        // Update UI based on current state
        this.updateUI(this.accessToken ? 'checking' : 'signed-out');
    },
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .github-sync-container {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-left: auto;
            }
            
            .sync-status {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.75rem;
                color: var(--text-muted, #6e7681);
                padding: 0.35rem 0.6rem;
                background: var(--bg-secondary, #161b22);
                border: 1px solid var(--border-color, #30363d);
                border-radius: 6px;
                cursor: default;
            }
            
            .sync-status.syncing .sync-icon {
                animation: spin 1s linear infinite;
            }
            
            .sync-status.synced {
                color: var(--accent-green-bright, #3fb950);
                border-color: rgba(35, 134, 54, 0.3);
            }
            
            .sync-status.error {
                color: var(--accent-red, #f85149);
                border-color: rgba(248, 81, 73, 0.3);
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .github-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.8rem;
                font-weight: 500;
                padding: 0.45rem 0.85rem;
                background: var(--bg-card, #1c2128);
                color: var(--text-primary, #e6edf3);
                border: 1px solid var(--border-color, #30363d);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .github-btn:hover {
                background: var(--bg-card-hover, #262c36);
                border-color: var(--text-muted, #6e7681);
            }
            
            .github-btn.signed-in {
                background: rgba(35, 134, 54, 0.15);
                border-color: rgba(35, 134, 54, 0.3);
                color: var(--accent-green-bright, #3fb950);
            }
            
            .github-btn svg {
                flex-shrink: 0;
            }
            
            /* Device Flow Modal */
            .device-flow-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(4px);
            }
            
            .device-flow-content {
                background: var(--bg-card, #1c2128);
                border: 1px solid var(--border-color, #30363d);
                border-radius: 12px;
                padding: 2rem;
                max-width: 400px;
                text-align: center;
            }
            
            .device-flow-content h3 {
                font-family: 'JetBrains Mono', monospace;
                color: var(--text-primary, #e6edf3);
                margin-bottom: 1rem;
            }
            
            .device-flow-content p {
                color: var(--text-secondary, #8b949e);
                margin-bottom: 1rem;
                font-size: 0.9rem;
            }
            
            .device-code {
                font-family: 'JetBrains Mono', monospace;
                font-size: 2rem;
                font-weight: bold;
                color: var(--accent-green-bright, #3fb950);
                background: var(--bg-secondary, #161b22);
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                letter-spacing: 0.1em;
                user-select: all;
            }
            
            .device-flow-link {
                display: inline-block;
                color: var(--accent-blue, #58a6ff);
                text-decoration: none;
                font-weight: 500;
                margin-bottom: 1rem;
            }
            
            .device-flow-link:hover {
                text-decoration: underline;
            }
            
            .device-flow-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
                margin-top: 1.5rem;
            }
            
            .device-flow-actions button {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.85rem;
                padding: 0.5rem 1.25rem;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .device-flow-actions .primary-btn {
                background: var(--accent-green, #238636);
                color: white;
                border: none;
            }
            
            .device-flow-actions .primary-btn:hover {
                background: var(--accent-green-bright, #3fb950);
            }
            
            .device-flow-actions .secondary-btn {
                background: transparent;
                color: var(--text-secondary, #8b949e);
                border: 1px solid var(--border-color, #30363d);
            }
            
            .device-flow-actions .secondary-btn:hover {
                color: var(--text-primary, #e6edf3);
                border-color: var(--text-muted, #6e7681);
            }
            
            .device-flow-spinner {
                margin: 1rem 0;
                color: var(--text-muted, #6e7681);
            }
            
            @media (max-width: 768px) {
                .github-sync-container {
                    margin-left: 0;
                    margin-top: 0.5rem;
                }
                
                .sync-status .sync-text {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    updateUI(state, message = '') {
        const statusEl = document.getElementById('sync-status');
        const btnEl = document.getElementById('github-auth-btn');
        const btnTextEl = document.getElementById('auth-btn-text');
        
        if (!statusEl || !btnEl) return;
        
        // Remove all state classes
        statusEl.classList.remove('syncing', 'synced', 'error');
        btnEl.classList.remove('signed-in');
        
        switch (state) {
            case 'signed-out':
                statusEl.querySelector('.sync-icon').textContent = '○';
                statusEl.querySelector('.sync-text').textContent = 'Local';
                btnTextEl.textContent = 'Sign in';
                break;
                
            case 'checking':
                statusEl.classList.add('syncing');
                statusEl.querySelector('.sync-icon').textContent = '◐';
                statusEl.querySelector('.sync-text').textContent = 'Checking...';
                btnTextEl.textContent = 'Sign in';
                break;
                
            case 'signed-in':
                btnEl.classList.add('signed-in');
                statusEl.classList.add('synced');
                statusEl.querySelector('.sync-icon').textContent = '●';
                statusEl.querySelector('.sync-text').textContent = 'Synced';
                btnTextEl.textContent = this.user?.login || 'Signed in';
                break;
                
            case 'syncing':
                btnEl.classList.add('signed-in');
                statusEl.classList.add('syncing');
                statusEl.querySelector('.sync-icon').textContent = '◐';
                statusEl.querySelector('.sync-text').textContent = 'Syncing...';
                break;
                
            case 'synced':
                btnEl.classList.add('signed-in');
                statusEl.classList.add('synced');
                statusEl.querySelector('.sync-icon').textContent = '●';
                statusEl.querySelector('.sync-text').textContent = 'Synced';
                break;
                
            case 'error':
                statusEl.classList.add('error');
                statusEl.querySelector('.sync-icon').textContent = '✕';
                statusEl.querySelector('.sync-text').textContent = message || 'Error';
                break;
        }
    },
    
    // ========================================================================
    // AUTHENTICATION (Personal Access Token)
    // ========================================================================
    
    handleAuthClick() {
        if (this.accessToken) {
            // Already signed in - show menu or sign out
            if (confirm('Sign out from GitHub sync?')) {
                this.signOut();
            }
        } else {
            // Show PAT input modal
            this.showPATModal();
        }
    },
    
    showPATModal() {
        const modal = document.createElement('div');
        modal.className = 'device-flow-modal';
        modal.id = 'pat-modal';
        modal.innerHTML = `
            <div class="device-flow-content">
                <h3>Connect to GitHub</h3>
                <p>Create a Personal Access Token to sync your progress:</p>
                
                <div style="text-align: left; margin: 1rem 0; font-size: 0.85rem; color: var(--text-secondary);">
                    <ol style="padding-left: 1.2rem; line-height: 1.8;">
                        <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" style="color: var(--accent-blue);">GitHub Token Settings</a></li>
                        <li>Note: "<strong>Progress Sync</strong>"</li>
                        <li>Expiration: <strong>90 days</strong> (or custom)</li>
                        <li>Select scope: <strong>repo</strong> (full control)</li>
                        <li>Click <strong>Generate token</strong></li>
                        <li>Copy and paste it below</li>
                    </ol>
                </div>
                
                <input type="password" id="pat-input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                    style="width: 100%; padding: 0.75rem; font-family: 'JetBrains Mono', monospace; 
                    font-size: 0.9rem; background: var(--bg-secondary); border: 1px solid var(--border-color); 
                    border-radius: 6px; color: var(--text-primary); margin: 0.5rem 0;">
                
                <div id="pat-error" style="color: var(--accent-red); font-size: 0.8rem; margin-top: 0.5rem; display: none;"></div>
                
                <div class="device-flow-actions">
                    <button class="primary-btn" onclick="GitHubSync.submitPAT()">
                        Connect
                    </button>
                    <button class="secondary-btn" onclick="GitHubSync.hidePATModal()">
                        Cancel
                    </button>
                </div>
                
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem;">
                    Your token is stored locally and only used to sync with your repo.
                </p>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus the input
        setTimeout(() => document.getElementById('pat-input')?.focus(), 100);
        
        // Allow Enter key to submit
        document.getElementById('pat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitPAT();
        });
    },
    
    hidePATModal() {
        const modal = document.getElementById('pat-modal');
        if (modal) modal.remove();
    },
    
    async submitPAT() {
        const input = document.getElementById('pat-input');
        const errorEl = document.getElementById('pat-error');
        const token = input?.value?.trim();
        
        if (!token) {
            errorEl.textContent = 'Please enter a token';
            errorEl.style.display = 'block';
            return;
        }
        
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            errorEl.textContent = 'Invalid token format. Should start with ghp_ or github_pat_';
            errorEl.style.display = 'block';
            return;
        }
        
        // Test the token
        errorEl.textContent = 'Validating...';
        errorEl.style.color = 'var(--text-muted)';
        errorEl.style.display = 'block';
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                // Token is valid
                this.accessToken = token;
                localStorage.setItem('github_access_token', token);
                
                this.user = await response.json();
                localStorage.setItem('github_user', JSON.stringify(this.user));
                
                this.hidePATModal();
                this.updateUI('signed-in');
                
                // Load progress from GitHub
                await this.loadProgressFromGitHub();
                
            } else if (response.status === 401) {
                errorEl.textContent = 'Invalid or expired token. Please check and try again.';
                errorEl.style.color = 'var(--accent-red)';
            } else {
                errorEl.textContent = 'Error validating token: ' + response.status;
                errorEl.style.color = 'var(--accent-red)';
            }
        } catch (error) {
            console.error('Token validation error:', error);
            errorEl.textContent = 'Network error. Please try again.';
            errorEl.style.color = 'var(--accent-red)';
        }
    },
    
    async validateToken() {
        this.updateUI('checking');
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
                localStorage.setItem('github_user', JSON.stringify(this.user));
                this.updateUI('signed-in');
                
                // Load progress from GitHub
                await this.loadProgressFromGitHub();
            } else {
                // Token invalid
                this.signOut();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.updateUI('error', 'Offline');
        }
    },
    
    async fetchUserInfo() {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
                localStorage.setItem('github_user', JSON.stringify(this.user));
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }
    },
    
    signOut() {
        this.accessToken = null;
        this.user = null;
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_user');
        this.updateUI('signed-out');
    },
    
    // ========================================================================
    // PROGRESS SYNC
    // ========================================================================
    
    async loadProgressFromGitHub() {
        if (!this.accessToken) return;
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.progressPath}?ref=${GITHUB_CONFIG.branch}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                const progress = JSON.parse(content);
                
                // Store the SHA for later updates
                this.progressFileSha = data.sha;
                this.lastSyncedData = progress;
                
                // Apply progress to checkboxes
                this.applyProgressToUI(progress);
                
            } else if (response.status === 404) {
                // File doesn't exist yet, will be created on first save
                this.progressFileSha = null;
                console.log('Progress file not found, will create on first save');
            }
        } catch (error) {
            console.error('Failed to load progress from GitHub:', error);
            this.updateUI('error', 'Load failed');
        }
    },
    
    applyProgressToUI(progress) {
        if (!progress || !progress.items) return;
        
        // Get all checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            const item = checkbox.closest('[data-id]');
            if (!item) return;
            
            const id = item.dataset.id;
            const pagePrefix = this.getPagePrefix();
            const fullId = pagePrefix + id;
            
            if (progress.items[fullId] !== undefined) {
                const wasChecked = checkbox.checked;
                checkbox.checked = progress.items[fullId];
                
                // Update visual state
                if (item.classList.contains('checklist-item')) {
                    if (checkbox.checked) {
                        item.classList.add('checked');
                    } else {
                        item.classList.remove('checked');
                    }
                } else if (item.classList.contains('concept-card')) {
                    if (checkbox.checked) {
                        item.classList.add('checked');
                    } else {
                        item.classList.remove('checked');
                    }
                }
                
                // Also update localStorage to keep it in sync
                const storageKey = this.getLocalStorageKey(id);
                localStorage.setItem(storageKey, checkbox.checked);
            }
        });
        
        // Trigger progress update
        if (typeof updateProgress === 'function') {
            updateProgress();
        }
    },
    
    getPagePrefix() {
        // Determine which page we're on based on the current URL path
        const path = window.location.pathname;
        
        // FastAPI pages
        if (path.includes('python-fastapi')) {
            if (path.includes('concepts.html')) return 'fastapi-concepts-';
            if (path.includes('python-core.html')) return 'python-core-';
            if (path.includes('postgresql.html')) return 'postgresql-';
            return 'fastapi-checklist-';
        }
        
        // Spring Boot pages
        if (path.includes('java-springboot')) {
            if (path.includes('concepts.html')) return 'springboot-concepts-';
            if (path.includes('java-core.html')) return 'java-core-';
            return 'springboot-checklist-';
        }
        
        // Fallback - try to detect from page content
        if (document.querySelector('.logo')?.textContent?.includes('SpringBoot')) {
            if (path.includes('concepts.html')) return 'springboot-concepts-';
            if (path.includes('java-core.html')) return 'java-core-';
            return 'springboot-checklist-';
        }
        
        // Default to FastAPI
        if (path.includes('concepts.html')) return 'fastapi-concepts-';
        if (path.includes('python-core.html')) return 'python-core-';
        if (path.includes('postgresql.html')) return 'postgresql-';
        return 'fastapi-checklist-';
    },
    
    getLocalStorageKey(id) {
        return this.getPagePrefix() + id;
    },
    
    // Called when a checkbox changes
    scheduleSync() {
        if (!this.accessToken) return;
        
        // Debounce - wait 2 seconds of inactivity before syncing
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        
        this.updateUI('syncing');
        
        this.syncTimeout = setTimeout(() => {
            this.syncProgressToGitHub();
        }, 2000);
    },
    
    async syncProgressToGitHub() {
        if (!this.accessToken || this.isSyncing) return;
        
        this.isSyncing = true;
        
        try {
            // Collect all progress from all pages stored in localStorage
            const progress = this.collectAllProgress();
            
            // Check if anything changed
            if (JSON.stringify(progress) === JSON.stringify(this.lastSyncedData)) {
                this.updateUI('synced');
                this.isSyncing = false;
                return;
            }
            
            // Prepare the content
            const content = JSON.stringify(progress, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Create or update the file
            const body = {
                message: `Update progress: ${progress.completed}/${progress.total} completed`,
                content: encodedContent,
                branch: GITHUB_CONFIG.branch
            };
            
            // Include SHA if updating existing file
            if (this.progressFileSha) {
                body.sha = this.progressFileSha;
            }
            
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.progressPath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                this.progressFileSha = data.content.sha;
                this.lastSyncedData = progress;
                this.updateUI('synced');
            } else {
                const error = await response.json();
                console.error('Sync error:', error);
                
                // If SHA mismatch, reload and retry
                if (response.status === 409 || (error.message && error.message.includes('sha'))) {
                    await this.loadProgressFromGitHub();
                    this.syncProgressToGitHub();
                    return;
                }
                
                this.updateUI('error', 'Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            this.updateUI('error', 'Sync error');
        }
        
        this.isSyncing = false;
    },
    
    collectAllProgress() {
        const items = {};
        let completed = 0;
        let total = 0;
        
        // Collect from localStorage - all prefixes (FastAPI + Spring Boot)
        const prefixes = [
            'fastapi-checklist-', 'fastapi-concepts-', 'python-core-', 'postgresql-',
            'springboot-checklist-', 'springboot-concepts-', 'java-core-'
        ];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            for (const prefix of prefixes) {
                if (key.startsWith(prefix)) {
                    const value = localStorage.getItem(key) === 'true';
                    items[key] = value;
                    total++;
                    if (value) completed++;
                    break;
                }
            }
        }
        
        return {
            lastUpdated: new Date().toISOString(),
            completed,
            total,
            items
        };
    }
};

// ============================================================================
// INTEGRATION WITH EXISTING CODE
// ============================================================================

// Override the existing saveState function to also trigger sync
const originalSaveState = typeof saveState === 'function' ? saveState : null;

function saveState(id, checked) {
    // Call original localStorage save using GitHubSync's prefix detection
    const prefix = GitHubSync.getPagePrefix();
    localStorage.setItem(prefix + id, checked);
    
    // Schedule GitHub sync
    GitHubSync.scheduleSync();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GitHubSync.init());
} else {
    GitHubSync.init();
}
