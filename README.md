# Kaotic OSINT - Chrome Extension

A comprehensive Open Source Intelligence (OSINT) toolkit for Chrome that enables effective intelligence gathering using free OSINT strategies.

## Features

### 1. Username/Email Enumeration
Search for usernames and email addresses across 20+ platforms including:
- GitHub, Twitter/X, Reddit, Instagram, LinkedIn, Facebook
- Medium, Pastebin, Pinterest, Tumblr, YouTube, TikTok
- Twitch, Steam, DeviantArt, Behance, Dribbble
- GitLab, Bitbucket, HackerNews, Spotify

### 2. Domain & IP Intelligence
- **WHOIS Lookup**: Get domain registration information, organization details, and geolocation
- **DNS Lookup**: Query A, AAAA, MX, TXT, NS, and CNAME records
- **Subdomain Enumeration**: Discover subdomains using Certificate Transparency logs
- **Port Scanning**: Check common ports for web services

### 3. Social Media Aggregation
Aggregate social media profiles across multiple platforms:
- Automatic profile detection
- Follower counts and bio information (where available)
- Direct links to profiles
- Multi-platform search capability

### 4. NSFW Profile Scanning
- Opt-in NSFW tab that probes many public adult platforms via anonymous HEAD/GET requests
- Supports username/email/phone inputs (normalized to platform-friendly identifiers)
- Consent gate, per-result status, and transparent “found / not found / inconclusive” messaging

### 5. Breach Database Check
- Integration with HaveIBeenPwned API (with optional API key)
- Check email addresses against known data breaches
- View breach details including compromised data types
- Track recent security breaches
- Fallback to a limited breach list when no API key is configured so you still see meaningful results
- Add your `HIBP_API_KEY` to `utils/api-keys.js` for personalized, email-specific breach checks; without it, the Breach tab shows a limited sample/global data set only

### 6. Page Analysis (Auto-Extract)
Automatically analyzes web pages to extract:
- Email addresses and phone numbers
- Social media links
- Metadata (Open Graph, Twitter Card)
- Form analysis
- Script and tracker detection
- Technology stack detection

## Installation

### Method 1: Load Unpacked Extension (Development Mode)

1. **Generate Icons** (Required for first-time setup):
   - Open `create-icons.html` in your browser
   - Click the download links to save all three icon sizes (16x16, 48x48, 128x128)
   - Save the icons to the `icons` folder

2. **Load the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `Kaotic_Claude` folder
   - The extension icon should appear in your toolbar

3. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Kaotic OSINT" and click the pin icon

### Method 2: Package and Install

```bash
# Create a zip file of the extension (excluding unnecessary files)
# On Windows PowerShell:
Compress-Archive -Path .\* -DestinationPath kaotic-osint.zip -Exclude *.yaml,desktop.ini

# Then load the unpacked folder as described in Method 1
```

## Usage

### Basic Usage

1. **Click the extension icon** to open the popup interface
2. **Select a tab** for the type of OSINT operation:
   - **Username**: Search for usernames/emails across platforms
   - **Domain**: Perform domain intelligence operations
   - **Social**: Aggregate social media profiles
   - **Breach**: Check for data breaches
   - **NSFW**: Opt-in scan of public adult platforms (requires consent checkbox)

3. **Enter your query** in the input field
4. **Click the action button** to start the search
5. **View results** in the results panel
6. **Export results** using the Export button (saves as JSON)
7. **NSFW tab**: Check the consent box before running an NSFW scan.

### Advanced Features

#### API Keys Configuration
For enhanced functionality, add your own API keys in `utils/api-keys.js`:

```javascript
const API_KEYS = {
    HIBP_API_KEY: 'your-key-here',        // HaveIBeenPwned
    SHODAN_API_KEY: 'your-key-here',      // Shodan
    VIRUSTOTAL_API_KEY: 'your-key-here',  // VirusTotal
    HUNTER_API_KEY: 'your-key-here',      // Hunter.io
    WHOISXML_API_KEY: 'your-key-here',    // WhoisXML
    IPINFO_API_KEY: 'your-key-here',      // IPInfo
    SECURITYTRAILS_API_KEY: 'your-key-here' // SecurityTrails
};
```

Create a copy of `utils/api-keys.example.js` named `utils/api-keys.js` and populate it with your keys. The Breach tab will use your **HaveIBeenPwned** key (if provided) to return full breach results; without a key, it will fall back to a limited public breach list so the tab remains informative instead of showing an error.

**Free API Key Resources**:
- HaveIBeenPwned: https://haveibeenpwned.com/API/Key
- Shodan: https://account.shodan.io/
- VirusTotal: https://www.virustotal.com/gui/join-us
- Hunter.io: https://hunter.io/api
- WhoisXML: https://whoisxmlapi.com/
- IPInfo: https://ipinfo.io/
- SecurityTrails: https://securitytrails.com/

#### Keyboard Shortcuts
- Press **Enter** in any input field to execute the search
- Use **Tab** to navigate between fields

#### Page Analysis
The extension automatically analyzes any webpage you visit and extracts:
- Contact information (emails, phones)
- Social media links
- Metadata and tracking scripts
- Forms and input fields

Access this data through Chrome DevTools Console or by checking Chrome's storage.

## Architecture

```
Kaotic_Claude/
├── manifest.json           # Extension configuration
├── popup.html             # Main UI interface
├── popup.css              # Styling
├── popup.js               # UI logic and event handlers
├── background.js          # Service worker for API calls
├── content.js             # Page analysis script
├── utils/
│   ├── api-keys.js       # API key configuration
│   └── data-parser.js    # Data parsing utilities
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

## Free OSINT Resources Used

This extension leverages the following free OSINT services:

1. **Certificate Transparency Logs** (crt.sh) - Subdomain enumeration
2. **Google DNS-over-HTTPS** - DNS lookups
3. **IP API** (ipapi.co) - IP geolocation and WHOIS data
4. **GitHub API** - User profile verification
5. **Reddit API** - User information
6. **HaveIBeenPwned API** - Breach database (public list)

## Privacy & Security

- **No Data Collection**: All OSINT operations are performed directly from your browser
- **No Telemetry**: The extension does not send any data to external servers except for OSINT queries
- **Local Storage Only**: Results are stored locally in your browser
- **Open Source**: All code is visible and auditable

## Ethical Use Guidelines

This tool is designed for:
- Security research and testing (with authorization)
- CTF competitions and educational purposes
- Defensive security operations
- Personal privacy auditing

**DO NOT USE FOR**:
- Unauthorized access attempts
- Harassment or stalking
- Illegal surveillance
- Violating privacy laws or terms of service

## Legal Disclaimer

This tool is provided for educational and authorized security testing purposes only. Users are responsible for:
- Obtaining proper authorization before conducting OSINT operations
- Complying with all applicable laws and regulations
- Respecting privacy and terms of service of third-party platforms
- Using the tool ethically and responsibly

The developers assume no liability for misuse of this tool.

## Troubleshooting

### Extension Won't Load
- Ensure all required files are present
- Generate icons using `create-icons.html`
- Check Chrome DevTools for error messages

### API Calls Failing
- Check your internet connection
- Some platforms may block automated requests
- Consider adding API keys for better reliability
- Check browser console for CORS errors

### Results Not Appearing
- Wait for the search to complete (some searches take time)
- Check if the platform is accessible from your network
- Try with a different username/query

### CORS Errors
- Some sites block cross-origin requests
- The extension uses `no-cors` mode where possible
- Results may be limited for certain platforms

## Future Enhancements

Potential features for future versions:
- Reverse image search integration
- Email verification services
- Blockchain address tracking
- Dark web monitoring (with appropriate APIs)
- Custom search engine queries
- Report generation (PDF export)
- Historical data tracking
- Batch processing for multiple queries

## Contributing

This is an open-source project. Contributions are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is provided as-is for educational purposes.

## Support

For issues, questions, or suggestions:
- Check the Troubleshooting section above
- Review Chrome extension documentation
- Test with different queries or platforms

## Changelog

### Version 1.0.0 (Initial Release)
- Username enumeration across 20+ platforms
- Domain intelligence (WHOIS, DNS, subdomains, ports)
- Social media aggregation
- Breach database checking
- Automatic page analysis
- Export functionality
- Modern, responsive UI

---

**Remember**: Always use OSINT tools ethically and with proper authorization. Respect privacy and follow all applicable laws.
