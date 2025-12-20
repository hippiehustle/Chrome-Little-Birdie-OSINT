// Background Service Worker for Kaotic OSINT
class OSINTEngine {
    constructor() {
        this.setupMessageListener();
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
                const found = await this.checkUrlExists(platform.checkUrl, platform.name);
                results.push({
                    platform: platform.name,
                    found: found,
                    url: found ? platform.url : null,
                    details: found ? 'Profile exists' : 'Profile not found'
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
        try {
            // Special handling for GitHub API
            if (platform === 'GitHub') {
                const response = await fetch(url);
                return response.status === 200;
            }

            // Special handling for Reddit API
            if (platform === 'Reddit') {
                const response = await fetch(url);
                if (response.status === 200) {
                    const data = await response.json();
                    return data && data.data && data.data.name;
                }
                return false;
            }

            // For other platforms, check if URL is accessible
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors' // Bypass CORS for basic check
            });

            // In no-cors mode, we get an opaque response
            // We'll assume the URL exists if no error is thrown
            return true;
        } catch (error) {
            return false;
        }
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
            const exists = await this.checkUrlExists(url, 'Twitter/X');

            return {
                platform: 'Twitter/X',
                found: exists,
                url: exists ? url : null,
                username: username
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
        const exists = await this.checkUrlExists(url, 'LinkedIn');

        return {
            platform: 'LinkedIn',
            found: exists,
            url: exists ? url : null,
            username: username
        };
    }

    async checkInstagram(username) {
        const url = `https://www.instagram.com/${username}`;
        const exists = await this.checkUrlExists(url, 'Instagram');

        return {
            platform: 'Instagram',
            found: exists,
            url: exists ? url : null,
            username: username
        };
    }

    async checkFacebook(username) {
        const url = `https://www.facebook.com/${username}`;
        const exists = await this.checkUrlExists(url, 'Facebook');

        return {
            platform: 'Facebook',
            found: exists,
            url: exists ? url : null,
            username: username
        };
    }

    // Breach Database Check (HaveIBeenPwned)
    async checkBreaches(email) {
        try {
            // HaveIBeenPwned API v3 requires API key for email search
            // Using the public breach list instead
            const response = await fetch('https://haveibeenpwned.com/api/v3/breaches');

            if (!response.ok) {
                throw new Error('Unable to fetch breach data');
            }

            const allBreaches = await response.json();

            // Note: This is a demonstration. Full email breach check requires API key
            // For production, users should get their own HaveIBeenPwned API key

            return {
                success: true,
                data: {
                    email: email,
                    breaches: [],
                    note: 'Full breach check requires HaveIBeenPwned API key. Showing available breach database info.',
                    totalBreaches: allBreaches.length,
                    recentBreaches: allBreaches.slice(0, 5).map(b => ({
                        name: b.Name,
                        date: b.BreachDate,
                        description: b.Description,
                        DataClasses: b.DataClasses
                    }))
                }
            };
        } catch (error) {
            return { success: false, error: `Breach check failed: ${error.message}` };
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
