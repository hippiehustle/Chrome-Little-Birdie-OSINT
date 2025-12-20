// Content Script for Page Analysis and Data Extraction
class PageAnalyzer {
    constructor() {
        this.extractedData = {};
        this.init();
    }

    init() {
        // Listen for messages from popup or background
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'analyzePage') {
                this.analyzePage().then(sendResponse);
                return true;
            }
        });

        // Auto-extract data on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.autoExtract());
        } else {
            this.autoExtract();
        }
    }

    autoExtract() {
        this.extractedData = {
            url: window.location.href,
            domain: window.location.hostname,
            title: document.title,
            emails: this.extractEmails(),
            phones: this.extractPhoneNumbers(),
            socialLinks: this.extractSocialLinks(),
            metadata: this.extractMetadata(),
            forms: this.analyzeForms(),
            scripts: this.analyzeScripts(),
            cookies: this.analyzeCookies()
        };

        // Store extracted data
        chrome.storage.local.set({ pageData: this.extractedData });
    }

    async analyzePage() {
        return {
            success: true,
            data: this.extractedData
        };
    }

    // Extract email addresses from page
    extractEmails() {
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const text = document.body.innerText;
        const emails = text.match(emailRegex) || [];
        return [...new Set(emails)]; // Remove duplicates
    }

    // Extract phone numbers from page
    extractPhoneNumbers() {
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const text = document.body.innerText;
        const phones = text.match(phoneRegex) || [];
        return [...new Set(phones)];
    }

    // Extract social media links
    extractSocialLinks() {
        const links = document.querySelectorAll('a[href]');
        const socialPatterns = {
            twitter: /twitter\.com|x\.com/i,
            facebook: /facebook\.com/i,
            linkedin: /linkedin\.com/i,
            instagram: /instagram\.com/i,
            youtube: /youtube\.com|youtu\.be/i,
            github: /github\.com/i,
            reddit: /reddit\.com/i,
            tiktok: /tiktok\.com/i,
            pinterest: /pinterest\.com/i,
            tumblr: /tumblr\.com/i
        };

        const socialLinks = {};

        links.forEach(link => {
            const href = link.href;
            for (const [platform, pattern] of Object.entries(socialPatterns)) {
                if (pattern.test(href)) {
                    if (!socialLinks[platform]) {
                        socialLinks[platform] = [];
                    }
                    socialLinks[platform].push(href);
                }
            }
        });

        // Remove duplicates
        for (const platform in socialLinks) {
            socialLinks[platform] = [...new Set(socialLinks[platform])];
        }

        return socialLinks;
    }

    // Extract metadata
    extractMetadata() {
        const metadata = {};

        // Meta tags
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) {
                metadata[name] = content;
            }
        });

        // Open Graph data
        const ogTags = document.querySelectorAll('meta[property^="og:"]');
        const openGraph = {};
        ogTags.forEach(tag => {
            const property = tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (property && content) {
                openGraph[property] = content;
            }
        });
        if (Object.keys(openGraph).length > 0) {
            metadata.openGraph = openGraph;
        }

        // Twitter Card data
        const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
        const twitterCard = {};
        twitterTags.forEach(tag => {
            const name = tag.getAttribute('name');
            const content = tag.getAttribute('content');
            if (name && content) {
                twitterCard[name] = content;
            }
        });
        if (Object.keys(twitterCard).length > 0) {
            metadata.twitterCard = twitterCard;
        }

        return metadata;
    }

    // Analyze forms on the page
    analyzeForms() {
        const forms = document.querySelectorAll('form');
        const formData = [];

        forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input, textarea, select');
            const fields = [];

            inputs.forEach(input => {
                fields.push({
                    type: input.type || input.tagName.toLowerCase(),
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder
                });
            });

            formData.push({
                index: index,
                action: form.action,
                method: form.method,
                fieldCount: fields.length,
                fields: fields
            });
        });

        return formData;
    }

    // Analyze scripts
    analyzeScripts() {
        const scripts = document.querySelectorAll('script[src]');
        const scriptData = [];

        scripts.forEach(script => {
            const src = script.src;
            scriptData.push({
                src: src,
                external: !src.startsWith(window.location.origin),
                async: script.async,
                defer: script.defer
            });
        });

        // Detect common analytics/tracking scripts
        const trackers = [];
        scriptData.forEach(script => {
            if (/google-analytics|googletagmanager|gtag/i.test(script.src)) {
                trackers.push('Google Analytics');
            }
            if (/facebook\.net|connect\.facebook/i.test(script.src)) {
                trackers.push('Facebook Pixel');
            }
            if (/hotjar/i.test(script.src)) {
                trackers.push('Hotjar');
            }
            if (/segment\.(com|io)/i.test(script.src)) {
                trackers.push('Segment');
            }
        });

        return {
            total: scriptData.length,
            external: scriptData.filter(s => s.external).length,
            trackers: [...new Set(trackers)],
            scripts: scriptData.slice(0, 10) // Limit to first 10
        };
    }

    // Analyze cookies
    analyzeCookies() {
        const cookies = document.cookie.split(';');
        return {
            count: cookies.length,
            hasCookies: cookies.length > 0 && cookies[0] !== ''
        };
    }

    // Extract all links from page
    extractLinks() {
        const links = document.querySelectorAll('a[href]');
        const linkData = {
            internal: [],
            external: [],
            total: links.length
        };

        links.forEach(link => {
            const href = link.href;
            if (href.startsWith(window.location.origin)) {
                linkData.internal.push(href);
            } else if (href.startsWith('http')) {
                linkData.external.push(href);
            }
        });

        // Remove duplicates
        linkData.internal = [...new Set(linkData.internal)];
        linkData.external = [...new Set(linkData.external)];

        return linkData;
    }

    // Detect technologies used
    detectTechnologies() {
        const tech = {
            frameworks: [],
            libraries: [],
            cms: [],
            analytics: []
        };

        // Check for common frameworks
        if (window.React || document.querySelector('[data-reactroot], [data-reactid]')) {
            tech.frameworks.push('React');
        }
        if (window.Vue || document.querySelector('[data-v-]')) {
            tech.frameworks.push('Vue.js');
        }
        if (window.angular || document.querySelector('[ng-app], [data-ng-app]')) {
            tech.frameworks.push('Angular');
        }
        if (window.jQuery || window.$) {
            tech.libraries.push('jQuery');
        }

        // Check for CMS
        if (document.querySelector('meta[name="generator"]')) {
            const generator = document.querySelector('meta[name="generator"]').content;
            tech.cms.push(generator);
        }

        // Check for WordPress
        if (document.querySelector('link[href*="wp-content"], link[href*="wp-includes"]')) {
            tech.cms.push('WordPress');
        }

        return tech;
    }
}

// Initialize the page analyzer
const pageAnalyzer = new PageAnalyzer();

// Context menu for quick OSINT actions
document.addEventListener('contextmenu', (e) => {
    // Store selected text for potential OSINT queries
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        chrome.storage.local.set({ selectedText: selectedText });
    }
});
