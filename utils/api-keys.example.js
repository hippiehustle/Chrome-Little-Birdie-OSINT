// API Keys Configuration Template
// Copy this file to api-keys.js and add your own API keys

const API_KEYS = {
    // HaveIBeenPwned API Key (for full breach checking)
    // Get yours at: https://haveibeenpwned.com/API/Key
    HIBP_API_KEY: '',

    // Shodan API Key (for advanced port scanning and IoT device search)
    // Get yours at: https://account.shodan.io/
    SHODAN_API_KEY: '',

    // VirusTotal API Key (for URL/domain reputation checking)
    // Get yours at: https://www.virustotal.com/gui/join-us
    VIRUSTOTAL_API_KEY: '',

    // Hunter.io API Key (for email finding and verification)
    // Get yours at: https://hunter.io/api
    HUNTER_API_KEY: '',

    // WhoisXML API Key (for comprehensive WHOIS data)
    // Get yours at: https://whoisxmlapi.com/
    WHOISXML_API_KEY: '',

    // IPInfo API Key (for IP geolocation)
    // Get yours at: https://ipinfo.io/
    IPINFO_API_KEY: '',

    // SecurityTrails API Key (for DNS history and subdomain discovery)
    // Get yours at: https://securitytrails.com/
    SECURITYTRAILS_API_KEY: ''
};

// Helper function to check if API key is configured
function hasApiKey(service) {
    return API_KEYS[`${service.toUpperCase()}_API_KEY`] &&
           API_KEYS[`${service.toUpperCase()}_API_KEY`].length > 0;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_KEYS, hasApiKey };
}
