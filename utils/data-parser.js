// Data Parser Utilities for OSINT Operations

class DataParser {
    // Parse and validate email addresses
    static parseEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            valid: emailRegex.test(email),
            username: email.split('@')[0],
            domain: email.split('@')[1]
        };
    }

    // Parse and extract username from social media URLs
    static parseUsername(url) {
        const patterns = {
            twitter: /twitter\.com\/([a-zA-Z0-9_]+)/,
            github: /github\.com\/([a-zA-Z0-9-]+)/,
            linkedin: /linkedin\.com\/in\/([a-zA-Z0-9-]+)/,
            instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/,
            reddit: /reddit\.com\/u(?:ser)?\/([a-zA-Z0-9_-]+)/
        };

        for (const [platform, pattern] of Object.entries(patterns)) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: platform,
                    username: match[1]
                };
            }
        }

        return null;
    }

    // Parse domain from URL
    static parseDomain(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return {
                protocol: urlObj.protocol.replace(':', ''),
                domain: urlObj.hostname,
                subdomain: this.getSubdomain(urlObj.hostname),
                rootDomain: this.getRootDomain(urlObj.hostname),
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname
            };
        } catch (error) {
            return null;
        }
    }

    // Extract subdomain from hostname
    static getSubdomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length > 2) {
            return parts.slice(0, -2).join('.');
        }
        return null;
    }

    // Extract root domain
    static getRootDomain(hostname) {
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            return parts.slice(-2).join('.');
        }
        return hostname;
    }

    // Parse IP address and determine version
    static parseIP(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

        if (ipv4Regex.test(ip)) {
            return {
                version: 'IPv4',
                valid: this.validateIPv4(ip),
                ip: ip
            };
        } else if (ipv6Regex.test(ip)) {
            return {
                version: 'IPv6',
                valid: true,
                ip: ip
            };
        }

        return { valid: false };
    }

    // Validate IPv4 address
    static validateIPv4(ip) {
        const parts = ip.split('.');
        return parts.every(part => {
            const num = parseInt(part);
            return num >= 0 && num <= 255;
        });
    }

    // Parse phone number
    static parsePhoneNumber(phone) {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');

        return {
            raw: phone,
            digits: digits,
            length: digits.length,
            possiblyValid: digits.length >= 10 && digits.length <= 15
        };
    }

    // Extract metadata from text
    static extractMetadata(text) {
        return {
            emails: this.extractEmails(text),
            urls: this.extractURLs(text),
            phones: this.extractPhones(text),
            ips: this.extractIPs(text),
            hashes: this.extractHashes(text)
        };
    }

    // Extract emails from text
    static extractEmails(text) {
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        return [...new Set(text.match(emailRegex) || [])];
    }

    // Extract URLs from text
    static extractURLs(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        return [...new Set(text.match(urlRegex) || [])];
    }

    // Extract phone numbers from text
    static extractPhones(text) {
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        return [...new Set(text.match(phoneRegex) || [])];
    }

    // Extract IP addresses from text
    static extractIPs(text) {
        const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
        const ips = text.match(ipRegex) || [];
        return [...new Set(ips.filter(ip => this.validateIPv4(ip)))];
    }

    // Extract hash values (MD5, SHA1, SHA256)
    static extractHashes(text) {
        const hashes = {
            md5: [],
            sha1: [],
            sha256: []
        };

        const md5Regex = /\b[a-fA-F0-9]{32}\b/g;
        const sha1Regex = /\b[a-fA-F0-9]{40}\b/g;
        const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;

        hashes.md5 = [...new Set(text.match(md5Regex) || [])];
        hashes.sha1 = [...new Set(text.match(sha1Regex) || [])];
        hashes.sha256 = [...new Set(text.match(sha256Regex) || [])];

        return hashes;
    }

    // Format results for display
    static formatResults(results, type) {
        const timestamp = new Date().toISOString();

        return {
            type: type,
            timestamp: timestamp,
            results: results,
            summary: this.generateSummary(results, type)
        };
    }

    // Generate summary of results
    static generateSummary(results, type) {
        if (Array.isArray(results)) {
            return {
                total: results.length,
                found: results.filter(r => r.found).length,
                notFound: results.filter(r => !r.found).length
            };
        }

        return {
            total: Object.keys(results).length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataParser;
}
