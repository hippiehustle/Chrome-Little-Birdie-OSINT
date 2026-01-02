// Background Service Worker for Kaotic OSINT
class OSINTEngine {
    constructor() {
        this.apiKeysLoaded = false;
        this.apiKeys = {};
        this.hasApiKey = () => false;
        this.setupMessageListener();
    }

    async ensureApiKeysLoaded() {
        if (this.apiKeysLoaded) {
            return;
        }

        const loadPromise = import(chrome.runtime.getURL('utils/api-keys.js'))
            .then(module => {
                this.apiKeys = module.API_KEYS || {};
                this.hasApiKey = module.hasApiKey || (() => false);
            })
            .catch(() => {
                this.apiKeys = {};
                this.hasApiKey = () => false;
            });

        await loadPromise;
        this.apiKeysLoaded = true;
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender).then(sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    async handleMessage(request, sender) {
        try {
            switch (request.action) {
                case 'searchUsername':
                    return await this.searchUsername(request.query);
                case 'whoisLookup':
                    return await this.whoisLookup(request.domain);
                case 'dnsLookup':
                    return await this.dnsLookup(request.domain);
                case 'enumerateSubdomains':
                    return await this.enumerateSubdomains(request.domain);
                case 'scanPorts':
                    return await this.scanPorts(request.target);
                case 'searchSocialMedia':
                    return await this.searchSocialMedia(request.query, request.platforms);
                case 'checkBreaches':
                    return await this.checkBreaches(request.email);
                default:
                    return { success: false, error: 'Unknown action' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Username Enumeration across multiple platforms
    async searchUsername(username) {
        const platforms = [
            { name: 'GitHub', url: `https://github.com/${username}`, checkUrl: `https://api.github.com/users/${username}` },
            { name: 'Twitter/X', url: `https://twitter.com/${username}`, checkUrl: `https://twitter.com/${username}` },
            { name: 'Reddit', url: `https://www.reddit.com/user/${username}`, checkUrl: `https://www.reddit.com/user/${username}/about.json` },
            { name: 'Instagram', url: `https://www.instagram.com/${username}`, checkUrl: `https://www.instagram.com/${username}` },
            { name: 'LinkedIn', url: `https://www.linkedin.com/in/${username}`, checkUrl: `https://www.linkedin.com/in/${username}` },
            { name: 'Medium', url: `https://medium.com/@${username}`, checkUrl: `https://medium.com/@${username}` },
            { name: 'Pastebin', url: `https://pastebin.com/u/${username}`, checkUrl: `https://pastebin.com/u/${username}` },
            { name: 'Pinterest', url: `https://www.pinterest.com/${username}`, checkUrl: `https://www.pinterest.com/${username}` },
            { name: 'Tumblr', url: `https://${username}.tumblr.com`, checkUrl: `https://${username}.tumblr.com` },
            { name: 'YouTube', url: `https://www.youtube.com/@${username}`, checkUrl: `https://www.youtube.com/@${username}` },
            { name: 'TikTok', url: `https://www.tiktok.com/@${username}`, checkUrl: `https://www.tiktok.com/@${username}` },
            { name: 'Twitch', url: `https://www.twitch.tv/${username}`, checkUrl: `https://www.twitch.tv/${username}` },
            { name: 'Steam', url: `https://steamcommunity.com/id/${username}`, checkUrl: `https://steamcommunity.com/id/${username}` },
            { name: 'DeviantArt', url: `https://www.deviantart.com/${username}`, checkUrl: `https://www.deviantart.com/${username}` },
            { name: 'Behance', url: `https://www.behance.net/${username}`, checkUrl: `https://www.behance.net/${username}` },
            { name: 'Dribbble', url: `https://dribbble.com/${username}`, checkUrl: `https://dribbble.com/${username}` },
            { name: 'GitLab', url: `https://gitlab.com/${username}`, checkUrl: `https://gitlab.com/${username}` },
            { name: 'Bitbucket', url: `https://bitbucket.org/${username}`, checkUrl: `https://bitbucket.org/${username}` },
            { name: 'HackerNews', url: `https://news.ycombinator.com/user?id=${username}`, checkUrl: `https://news.ycombinator.com/user?id=${username}` },
            { name: 'Spotify', url: `https://open.spotify.com/user/${username}`, checkUrl: `https://open.spotify.com/user/${username}` }
        ];

        const results = [];

        for (const platform of platforms) {
            try {
                const checkResult = await this.checkUrlExists(platform.checkUrl, platform.name);
                const found = checkResult.found;
                results.push({
                    platform: platform.name,
                    found: found,
                    url: found ? platform.url : null,
                    details: this.describeCheckResult(checkResult)
                });
            } catch (error) {
                results.push({
                    platform: platform.name,
                    found: false,
                    url: null,
                    details: 'Unable to check'
                });
            }
        }

        return { success: true, data: results };
    }

    // Check if URL exists (profile check)
    async checkUrlExists(url, platform) {
        const evaluateResponse = (response, attemptMethod) => {
            if (!response) {
                return { found: false, status: null, method: attemptMethod, reason: 'network_error' };
            }

            if (response.type === 'opaque') {
                return { found: false, status: null, method: attemptMethod, reason: 'opaque_response' };
            }

            if (response.status >= 200 && response.status < 400) {
                return { found: true, status: response.status, method: attemptMethod, reason: 'ok' };
            }

            return { found: false, status: response.status, method: attemptMethod, reason: 'http_error' };
        };

        const performRequest = async (method) => {
            try {
                return await fetch(url, {
                    method,
                    redirect: 'follow'
                });
            } catch (error) {
                return null;
            }
        };

        try {
            // Special handling for GitHub API
            if (platform === 'GitHub') {
                const response = await fetch(url);
                return evaluateResponse(response, 'GET');
            }

            // Special handling for Reddit API
            if (platform === 'Reddit') {
                const response = await fetch(url);
                if (response.status === 200) {
                    const data = await response.json();
                    return {
                        found: Boolean(data && data.data && data.data.name),
                        status: response.status,
                        method: 'GET',
                        reason: 'ok'
                    };
                }
                return { found: false, status: response.status, method: 'GET', reason: 'http_error' };
            }

            // Attempt HEAD first, fall back to GET if necessary
            const headResponse = await performRequest('HEAD');
            const headResult = evaluateResponse(headResponse, 'HEAD');

            if (headResult.found) {
                return headResult;
            }

            if (headResult.reason === 'http_error' && headResult.status && headResult.status !== 405) {
                return headResult;
            }

            // Some platforms do not allow HEAD; try GET as a fallback
            const getResponse = await performRequest('GET');
            const getResult = evaluateResponse(getResponse, 'GET');
            return getResult;
        } catch (error) {
            return { found: false, status: null, method: 'GET', reason: error.message };
        }
    }

    describeCheckResult(checkResult) {
        if (!checkResult) return 'Unable to verify';

        if (checkResult.found) {
            return checkResult.status ? `Profile reachable (HTTP ${checkResult.status})` : 'Profile appears reachable';
        }

        if (checkResult.reason === 'opaque_response') {
            return 'Profile could not be verified due to opaque response';
        }

        if (checkResult.reason === 'network_error') {
            return 'Network error while checking profile';
        }

        if (checkResult.reason === 'http_error' && checkResult.status) {
            return `Profile not found (HTTP ${checkResult.status})`;
        }

        return 'Profile not found';
    }

    // WHOIS Lookup
    async whoisLookup(domain) {
        try {
            // Using whoisxmlapi.com free tier (limited requests)
            // Alternative: Use ip-api.com for basic IP info
            const response = await fetch(`https://ipapi.co/${domain}/json/`);

            if (!response.ok) {
                // Fallback to DNS-based info
                const dnsInfo = await this.dnsLookup(domain);
                return dnsInfo;
            }

            const data = await response.json();

            return {
                success: true,
                data: {
                    'Domain': domain,
                    'IP Address': data.ip || 'N/A',
                    'Organization': data.org || 'N/A',
                    'ISP': data.org || 'N/A',
                    'City': data.city || 'N/A',
                    'Region': data.region || 'N/A',
                    'Country': data.country_name || 'N/A',
                    'Postal': data.postal || 'N/A',
                    'Timezone': data.timezone || 'N/A',
                    'ASN': data.asn || 'N/A'
                }
            };
        } catch (error) {
            return { success: false, error: `WHOIS lookup failed: ${error.message}` };
        }
    }

    // DNS Lookup
    async dnsLookup(domain) {
        try {
            // Using Google's DNS-over-HTTPS API (free)
            const types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'];
            const results = {};

            for (const type of types) {
                try {
                    const response = await fetch(
                        `https://dns.google/resolve?name=${domain}&type=${type}`
                    );
                    const data = await response.json();

                    if (data.Answer) {
                        results[type] = data.Answer.map(a => a.data).join(', ');
                    }
                } catch (e) {
                    results[type] = 'N/A';
                }
            }

            return { success: true, data: results };
        } catch (error) {
            return { success: false, error: `DNS lookup failed: ${error.message}` };
        }
    }

    // Subdomain Enumeration
    async enumerateSubdomains(domain) {
        try {
            // Using crt.sh Certificate Transparency logs (free)
            const response = await fetch(`https://crt.sh/?q=%.${domain}&output=json`);

            if (!response.ok) {
                throw new Error('Certificate transparency lookup failed');
            }

            const data = await response.json();
            const subdomains = new Set();

            data.forEach(cert => {
                if (cert.name_value) {
                    cert.name_value.split('\n').forEach(name => {
                        subdomains.add(name.toLowerCase());
                    });
                }
            });

            const results = Array.from(subdomains).map(subdomain => ({
                domain: subdomain,
                source: 'Certificate Transparency Logs',
                status: 'Found in CT logs'
            }));

            return { success: true, data: results };
        } catch (error) {
            // Fallback: try common subdomains
            const commonSubs = ['www', 'mail', 'ftp', 'smtp', 'pop', 'ns1', 'ns2', 'api', 'dev', 'staging', 'admin', 'portal'];
            const results = commonSubs.map(sub => ({
                domain: `${sub}.${domain}`,
                source: 'Common subdomain list',
                status: 'Unverified'
            }));

            return { success: true, data: results };
        }
    }

    // Port Scanning (limited to common ports due to browser restrictions)
    async scanPorts(target) {
        // Browser-based port scanning is limited due to security restrictions
        // We'll use publicly available APIs to get port information

        try {
            // Using Shodan or similar services would require API keys
            // For free tier, we'll return common port information

            const commonPorts = [
                { port: 21, service: 'FTP', description: 'File Transfer Protocol' },
                { port: 22, service: 'SSH', description: 'Secure Shell' },
                { port: 23, service: 'Telnet', description: 'Telnet' },
                { port: 25, service: 'SMTP', description: 'Mail Server' },
                { port: 53, service: 'DNS', description: 'Domain Name System' },
                { port: 80, service: 'HTTP', description: 'Web Server' },
                { port: 443, service: 'HTTPS', description: 'Secure Web Server' },
                { port: 3306, service: 'MySQL', description: 'MySQL Database' },
                { port: 3389, service: 'RDP', description: 'Remote Desktop' },
                { port: 5432, service: 'PostgreSQL', description: 'PostgreSQL Database' },
                { port: 8080, service: 'HTTP-Alt', description: 'Alternative HTTP' },
                { port: 8443, service: 'HTTPS-Alt', description: 'Alternative HTTPS' }
            ];

            // Try to check if common web ports are accessible
            const results = [];

            for (const portInfo of commonPorts) {
                let open = false;

                // Only HTTP/HTTPS can be checked from browser
                if (portInfo.port === 80 || portInfo.port === 443 || portInfo.port === 8080 || portInfo.port === 8443) {
                    const protocol = (portInfo.port === 443 || portInfo.port === 8443) ? 'https' : 'http';
                    try {
                        const testUrl = `${protocol}://${target}:${portInfo.port}`;
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 3000);

                        await fetch(testUrl, {
                            method: 'HEAD',
                            mode: 'no-cors',
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);
                        open = true;
                    } catch (e) {
                        open = false;
                    }
                }

                results.push({
                    port: portInfo.port,
                    service: portInfo.service,
                    open: open,
                    description: portInfo.description
                });
            }

            return { success: true, data: results };
        } catch (error) {
            return { success: false, error: `Port scan failed: ${error.message}` };
        }
    }

    // Social Media Aggregation
    async searchSocialMedia(query, platforms) {
        const results = [];

        for (const platform of platforms) {
            try {
                let result = null;

                switch (platform) {
                    case 'twitter':
                        result = await this.checkTwitter(query);
                        break;
                    case 'reddit':
                        result = await this.checkReddit(query);
                        break;
                    case 'github':
                        result = await this.checkGitHub(query);
                        break;
                    case 'linkedin':
                        result = await this.checkLinkedIn(query);
                        break;
                    case 'instagram':
                        result = await this.checkInstagram(query);
                        break;
                    case 'facebook':
                        result = await this.checkFacebook(query);
                        break;
                }

                if (result) {
                    results.push(result);
                }
            } catch (error) {
                results.push({
                    platform: platform,
                    found: false,
                    error: error.message
                });
            }
        }

        return { success: true, data: results };
    }

    async checkTwitter(username) {
        try {
            const url = `https://twitter.com/${username}`;
            const checkResult = await this.checkUrlExists(url, 'Twitter/X');
            const exists = checkResult.found;

            return {
                platform: 'Twitter/X',
                found: exists,
                url: exists ? url : null,
                username: username,
                details: this.describeCheckResult(checkResult)
            };
        } catch (error) {
            return { platform: 'Twitter/X', found: false, error: error.message };
        }
    }

    async checkReddit(username) {
        try {
            const url = `https://www.reddit.com/user/${username}/about.json`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                return {
                    platform: 'Reddit',
                    found: true,
                    url: `https://www.reddit.com/user/${username}`,
                    username: data.data.name,
                    karma: data.data.total_karma,
                    created: new Date(data.data.created_utc * 1000).toLocaleDateString()
                };
            }

            return { platform: 'Reddit', found: false };
        } catch (error) {
            return { platform: 'Reddit', found: false, error: error.message };
        }
    }

    async checkGitHub(username) {
        try {
            const url = `https://api.github.com/users/${username}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                return {
                    platform: 'GitHub',
                    found: true,
                    url: data.html_url,
                    username: data.login,
                    name: data.name,
                    bio: data.bio,
                    followers: data.followers,
                    repos: data.public_repos
                };
            }

            return { platform: 'GitHub', found: false };
        } catch (error) {
            return { platform: 'GitHub', found: false, error: error.message };
        }
    }

    async checkLinkedIn(username) {
        const url = `https://www.linkedin.com/in/${username}`;
        const checkResult = await this.checkUrlExists(url, 'LinkedIn');
        const exists = checkResult.found;

        return {
            platform: 'LinkedIn',
            found: exists,
            url: exists ? url : null,
            username: username,
            details: this.describeCheckResult(checkResult)
        };
    }

    async checkInstagram(username) {
        const url = `https://www.instagram.com/${username}`;
        const checkResult = await this.checkUrlExists(url, 'Instagram');
        const exists = checkResult.found;

        return {
            platform: 'Instagram',
            found: exists,
            url: exists ? url : null,
            username: username,
            details: this.describeCheckResult(checkResult)
        };
    }

    async checkFacebook(username) {
        const url = `https://www.facebook.com/${username}`;
        const checkResult = await this.checkUrlExists(url, 'Facebook');
        const exists = checkResult.found;

        return {
            platform: 'Facebook',
            found: exists,
            url: exists ? url : null,
            username: username,
            details: this.describeCheckResult(checkResult)
        };
    }

    // Breach Database Check (HaveIBeenPwned)
    async checkBreaches(email) {
        const fallbackBreaches = [
            {
                name: 'Adobe',
                date: '2013-10-04',
                description: 'Usernames, email addresses, and password hints.',
                DataClasses: ['Email addresses', 'Password hints', 'Passwords', 'Usernames']
            },
            {
                name: 'LinkedIn',
                date: '2012-05-05',
                description: 'Usernames, email addresses, and salted SHA1 passwords.',
                DataClasses: ['Email addresses', 'Passwords', 'Usernames']
            },
            {
                name: 'Dropbox',
                date: '2012-07-01',
                description: 'Email addresses and salted SHA1 passwords.',
                DataClasses: ['Email addresses', 'Passwords']
            }
        ];

        await this.ensureApiKeysLoaded();
        const hibpApiKey = (this.apiKeys && this.apiKeys.HIBP_API_KEY) ? this.apiKeys.HIBP_API_KEY : '';
        const hasKey = this.hasApiKey ? this.hasApiKey('HIBP') || Boolean(hibpApiKey) : Boolean(hibpApiKey);

        const buildResponse = (breaches, note) => ({
            success: true,
            data: {
                email: email,
                breaches: breaches,
                note,
                totalBreaches: breaches.length,
                recentBreaches: breaches.slice(0, 5)
            }
        });

        const fetchWithKey = async () => {
            const headers = {
                'User-Agent': 'Kaotic-OSINT/1.0'
            };

            if (hibpApiKey) {
                headers['hibp-api-key'] = hibpApiKey;
            }

            const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=true`, {
                headers
            });

            if (response.status === 401 || response.status === 403) {
                return {
                    success: false,
                    error: 'HaveIBeenPwned API key is missing or invalid. Add your key to utils/api-keys.js to see full results.'
                };
            }

            if (!response.ok) {
                if (response.status === 404) {
                    return buildResponse([], 'No breaches found for this email using your HaveIBeenPwned API key.');
                }
                throw new Error('Unable to fetch breach data');
            }

            const breaches = await response.json();
            return buildResponse(breaches, 'Results retrieved from HaveIBeenPwned using your API key.');
        };

        try {
            if (hasKey) {
                const result = await fetchWithKey();
                if (!result.success) {
                    return result;
                }
                return result;
            }

            // No key configured: use public breach listing as a limited fallback
            const publicResponse = await fetch('https://haveibeenpwned.com/api/v3/breaches');

            if (publicResponse.ok) {
                const allBreaches = await publicResponse.json();
                const limited = allBreaches.slice(0, 5).map(b => ({
                    name: b.Name,
                    date: b.BreachDate,
                    description: b.Description,
                    DataClasses: b.DataClasses
                }));

                return buildResponse(limited, 'Showing a limited breach list. Add a HaveIBeenPwned API key for personalized results.');
            }

            return buildResponse(fallbackBreaches, 'Unable to reach HaveIBeenPwned without an API key. Showing a static breach sample.');
        } catch (error) {
            return buildResponse(fallbackBreaches, `Breach check encountered an issue (${error.message}). Showing a static breach sample.`);
        }
    }
}

// Initialize the OSINT engine
const osintEngine = new OSINTEngine();

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Kaotic OSINT Extension Installed');
    }
});
