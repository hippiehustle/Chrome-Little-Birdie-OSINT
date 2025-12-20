// Popup UI Controller
class OSINTPopup {
    constructor() {
        this.results = {};
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupEventListeners();
        this.loadStoredResults();
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Username enumeration
        document.getElementById('username-search').addEventListener('click', () => {
            const query = document.getElementById('username-input').value.trim();
            if (query) this.searchUsername(query);
        });

        // Domain intelligence
        document.getElementById('whois-lookup').addEventListener('click', () => {
            const query = document.getElementById('domain-input').value.trim();
            if (query) this.performWhoisLookup(query);
        });

        document.getElementById('dns-lookup').addEventListener('click', () => {
            const query = document.getElementById('domain-input').value.trim();
            if (query) this.performDNSLookup(query);
        });

        document.getElementById('subdomain-enum').addEventListener('click', () => {
            const query = document.getElementById('domain-input').value.trim();
            if (query) this.enumerateSubdomains(query);
        });

        document.getElementById('port-scan').addEventListener('click', () => {
            const query = document.getElementById('domain-input').value.trim();
            if (query) this.scanPorts(query);
        });

        // Social media aggregation
        document.getElementById('social-search').addEventListener('click', () => {
            const query = document.getElementById('social-input').value.trim();
            const platforms = Array.from(document.querySelectorAll('.platform-checks input:checked'))
                .map(cb => cb.value);
            if (query && platforms.length > 0) {
                this.searchSocialMedia(query, platforms);
            }
        });

        // Breach check
        document.getElementById('breach-search').addEventListener('click', () => {
            const email = document.getElementById('breach-input').value.trim();
            if (email) this.checkBreaches(email);
        });

        // Export and clear
        document.getElementById('export-btn').addEventListener('click', () => this.exportResults());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());

        // Enter key support
        ['username-input', 'domain-input', 'social-input', 'breach-input'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const tab = id.split('-')[0];
                    if (tab === 'username') document.getElementById('username-search').click();
                    else if (tab === 'breach') document.getElementById('breach-search').click();
                    else if (tab === 'social') document.getElementById('social-search').click();
                }
            });
        });
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        setTimeout(() => {
            status.className = 'status';
        }, 5000);
    }

    async searchUsername(query) {
        this.showStatus('Searching for username across platforms...', 'info');
        const resultsDiv = document.getElementById('username-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Searching...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'searchUsername',
                query: query
            });

            if (response.success) {
                this.results.username = response.data;
                this.displayUsernameResults(response.data);
                this.showStatus(`Found ${response.data.length} results`, 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    displayUsernameResults(data) {
        const resultsDiv = document.getElementById('username-results');
        resultsDiv.innerHTML = '';

        data.forEach(result => {
            const item = document.createElement('div');
            item.className = `result-item ${result.found ? 'result-found' : 'result-not-found'}`;
            item.innerHTML = `
                <h3>${result.platform}</h3>
                <p><strong>Status:</strong> ${result.found ? 'Found' : 'Not Found'}</p>
                ${result.url ? `<p><a href="${result.url}" target="_blank">View Profile</a></p>` : ''}
                ${result.details ? `<p>${result.details}</p>` : ''}
            `;
            resultsDiv.appendChild(item);
        });
    }

    async performWhoisLookup(domain) {
        this.showStatus('Performing WHOIS lookup...', 'info');
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Looking up WHOIS data...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'whoisLookup',
                domain: domain
            });

            if (response.success) {
                this.results.whois = response.data;
                this.displayDomainResults(response.data, 'WHOIS Information');
                this.showStatus('WHOIS lookup completed', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    async performDNSLookup(domain) {
        this.showStatus('Performing DNS lookup...', 'info');
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Looking up DNS records...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'dnsLookup',
                domain: domain
            });

            if (response.success) {
                this.results.dns = response.data;
                this.displayDomainResults(response.data, 'DNS Records');
                this.showStatus('DNS lookup completed', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    async enumerateSubdomains(domain) {
        this.showStatus('Enumerating subdomains...', 'info');
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Finding subdomains...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'enumerateSubdomains',
                domain: domain
            });

            if (response.success) {
                this.results.subdomains = response.data;
                this.displaySubdomainResults(response.data);
                this.showStatus(`Found ${response.data.length} subdomains`, 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    async scanPorts(target) {
        this.showStatus('Scanning common ports...', 'info');
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Scanning ports...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'scanPorts',
                target: target
            });

            if (response.success) {
                this.results.ports = response.data;
                this.displayPortResults(response.data);
                this.showStatus('Port scan completed', 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    displayDomainResults(data, title) {
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = `<h3>${title}</h3>`;

        const item = document.createElement('div');
        item.className = 'result-item';

        let html = '';
        for (const [key, value] of Object.entries(data)) {
            html += `<p><strong>${key}:</strong> ${value}</p>`;
        }
        item.innerHTML = html;
        resultsDiv.appendChild(item);
    }

    displaySubdomainResults(data) {
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = '<h3>Subdomains Found</h3>';

        data.forEach(subdomain => {
            const item = document.createElement('div');
            item.className = 'result-item result-found';
            item.innerHTML = `
                <h3>${subdomain.domain}</h3>
                ${subdomain.ip ? `<p><strong>IP:</strong> ${subdomain.ip}</p>` : ''}
                ${subdomain.status ? `<p><strong>Status:</strong> ${subdomain.status}</p>` : ''}
            `;
            resultsDiv.appendChild(item);
        });
    }

    displayPortResults(data) {
        const resultsDiv = document.getElementById('domain-results');
        resultsDiv.innerHTML = '<h3>Open Ports</h3>';

        data.forEach(port => {
            const item = document.createElement('div');
            item.className = `result-item ${port.open ? 'result-found' : 'result-not-found'}`;
            item.innerHTML = `
                <h3>Port ${port.port}</h3>
                <p><strong>Service:</strong> ${port.service}</p>
                <p><strong>Status:</strong> ${port.open ? 'Open' : 'Closed'}</p>
            `;
            resultsDiv.appendChild(item);
        });
    }

    async searchSocialMedia(query, platforms) {
        this.showStatus(`Searching ${platforms.length} platforms...`, 'info');
        const resultsDiv = document.getElementById('social-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Aggregating social media profiles...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'searchSocialMedia',
                query: query,
                platforms: platforms
            });

            if (response.success) {
                this.results.social = response.data;
                this.displaySocialResults(response.data);
                this.showStatus(`Found profiles on ${response.data.filter(r => r.found).length} platforms`, 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    displaySocialResults(data) {
        const resultsDiv = document.getElementById('social-results');
        resultsDiv.innerHTML = '';

        data.forEach(result => {
            const item = document.createElement('div');
            item.className = `result-item ${result.found ? 'result-found' : 'result-not-found'}`;
            item.innerHTML = `
                <h3>${result.platform}</h3>
                <p><strong>Status:</strong> ${result.found ? 'Profile Found' : 'Not Found'}</p>
                ${result.url ? `<p><a href="${result.url}" target="_blank">View Profile</a></p>` : ''}
                ${result.username ? `<p><strong>Username:</strong> ${result.username}</p>` : ''}
                ${result.followers ? `<p><strong>Followers:</strong> ${result.followers}</p>` : ''}
                ${result.bio ? `<p><strong>Bio:</strong> ${result.bio}</p>` : ''}
            `;
            resultsDiv.appendChild(item);
        });
    }

    async checkBreaches(email) {
        this.showStatus('Checking breach databases...', 'info');
        const resultsDiv = document.getElementById('breach-results');
        resultsDiv.innerHTML = '<div class="loading"></div> Checking for data breaches...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'checkBreaches',
                email: email
            });

            if (response.success) {
                this.results.breaches = response.data;
                this.displayBreachResults(response.data);
                if (response.data.breaches && response.data.breaches.length > 0) {
                    this.showStatus(`Warning: Found in ${response.data.breaches.length} breaches!`, 'error');
                } else {
                    this.showStatus('No breaches found', 'success');
                }
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    displayBreachResults(data) {
        const resultsDiv = document.getElementById('breach-results');
        resultsDiv.innerHTML = '';

        if (data.breaches && data.breaches.length > 0) {
            data.breaches.forEach(breach => {
                const item = document.createElement('div');
                item.className = 'result-item result-warning';
                item.innerHTML = `
                    <h3>${breach.Name || breach.name}</h3>
                    <p><strong>Date:</strong> ${breach.BreachDate || breach.date || 'Unknown'}</p>
                    <p><strong>Compromised Data:</strong> ${breach.DataClasses ? breach.DataClasses.join(', ') : 'Unknown'}</p>
                    <p>${breach.Description || breach.description || ''}</p>
                `;
                resultsDiv.appendChild(item);
            });
        } else {
            const item = document.createElement('div');
            item.className = 'result-item result-found';
            item.innerHTML = '<p>No breaches found for this email address.</p>';
            resultsDiv.appendChild(item);
        }
    }

    exportResults() {
        const data = {
            timestamp: new Date().toISOString(),
            results: this.results
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kaotic-osint-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showStatus('Results exported successfully', 'success');
    }

    clearAll() {
        this.results = {};
        document.querySelectorAll('.results').forEach(div => {
            div.innerHTML = '';
        });
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.value = '';
        });
        this.showStatus('All data cleared', 'info');
    }

    loadStoredResults() {
        chrome.storage.local.get(['lastResults'], (data) => {
            if (data.lastResults) {
                this.results = data.lastResults;
            }
        });
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new OSINTPopup();
});
