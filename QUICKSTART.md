# Kaotic OSINT - Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Generate Icons (1 minute)

1. Open `create-icons.html` in your browser
2. Click each download link (icon16, icon48, icon128)
3. Save all icons to the `icons` folder

## Step 2: Load Extension (1 minute)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `Kaotic_Claude` folder
5. Done! The extension icon appears in your toolbar

## Step 3: Try It Out (3 minutes)

### Test Username Search:
1. Click the extension icon
2. Enter a username (try: `octocat` for GitHub)
3. Click "Search Across Platforms"
4. See results across 20+ platforms!

### Test Domain Intelligence:
1. Click the **Domain** tab
2. Enter a domain (try: `google.com`)
3. Click **WHOIS** or **DNS**
4. View detailed information!

### Test Social Media:
1. Click the **Social** tab
2. Enter a username
3. Select platforms to check
4. Click "Aggregate Profiles"

### Test Breach Check:
1. Click the **Breach** tab
2. Enter an email address
3. Click "Check Breaches"
4. See if the email appears in data breaches

## Features at a Glance

| Feature | What It Does |
|---------|-------------|
| **Username Tab** | Search 20+ platforms for a username/email |
| **Domain Tab** | WHOIS, DNS, subdomain discovery, port scanning |
| **Social Tab** | Aggregate profiles from social media platforms |
| **Breach Tab** | Check emails against breach databases |
| **Export** | Save results as JSON file |
| **Auto-Analysis** | Extracts data from any webpage you visit |

## Tips

- **Press Enter** in any input field to start the search
- **Export results** before closing the popup (they're saved locally too)
- **Check multiple platforms** at once in the Social tab
- **Add API keys** in `utils/api-keys.js` for enhanced features

## Common Issues

**Extension won't load?**
- Make sure you generated the icons first
- Check that all files are in the folder

**No results?**
- Wait a few seconds (searches take time)
- Some platforms may block automated checks
- Try a different username/domain

**CORS errors?**
- This is normal for some sites
- The extension uses workarounds where possible
- Results may be limited on certain platforms

## Next Steps

1. Read the full `README.md` for detailed documentation
2. Add your own API keys for better results
3. Try the page analysis feature on any website
4. Explore different OSINT queries

## Need Help?

- Check `README.md` for full documentation
- Review the Troubleshooting section
- Inspect Chrome console for error messages

---

**Remember**: Use this tool ethically and with proper authorization!
