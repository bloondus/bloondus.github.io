# 🚊 No More Trama

A static web application that displays real-time public transport departures from your current location.

## Features

✅ **Automatic Location Detection** - Uses browser geolocation to find nearby stops  
✅ **Real-time Departures** - Shows next 6 departures (tram, bus, train)  
✅ **Clickable Lines** - Tap any departure to see all stops on that route  
✅ **Route Visualization** - Interactive list showing all stops with distances  
✅ **Manual Search** - Search stations by name  
✅ **Auto-refresh** - Updates every 60 seconds  
✅ **Adjustable Radius** - Search 50-1000 meters  
✅ **WebView Ready** - Works in Android/iOS WebView apps  
✅ **PWA Ready** - Progressive Web App manifest included  
✅ **No Backend** - 100% client-side, no API keys needed  

## Project Structure

```
No More Trama/
├── index.html          # Main HTML file
├── style.css           # Styles (responsive, WebView-optimized)
├── app.js              # Application logic
├── manifest.json       # PWA manifest
└── README.md           # This file
```

## API Used

This app uses the **Swiss Public Transport API** ([transport.opendata.ch](https://transport.opendata.ch/)):

- `GET /v1/locations` - Find nearby stations
- `GET /v1/stationboard` - Get departures
- `GET /v1/connections` - Get route information and stops

**No API key required** - Free and open API.

## How to Deploy on GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it (e.g., `no-more-trama`)
3. Make it **public**

### Step 2: Push Files to GitHub

```bash
cd "/home/dark/Dokumente/applika/zürich/No Mor Trama"

# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: No More Trama app"

# Add remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch
4. Click **Save**
5. Your app will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## How to Use

### Open in Browser
Simply open `index.html` in your browser or visit your GitHub Pages URL.

### Allow Location Access
The app will ask for location permission - click **Allow** to automatically find nearby stations.
### Manual Search
If location is denied or unavailable, use the search box to find stations by name.

### View Route Details
Click on any departure card to see all stops on that route. The modal shows:
- All stops on the route from your station to the destination
- Distance to each stop (if location is available)
- Your current stop is highlighted

### Refresh
Departures auto-refresh every 60 seconds. Click "Refresh" to update manually.
Departures auto-refresh every 60 seconds. Click "Refresh" to update manually.

## WebView Integration

### Android WebView

```java
WebView webView = findViewById(R.id.webview);
WebSettings settings = webView.getSettings();
settings.setJavaScriptEnabled(true);
settings.setGeolocationEnabled(true);

webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, 
            GeolocationPermissions.Callback callback) {
        callback.invoke(origin, true, false);
    }
});

webView.loadUrl("https://YOUR_USERNAME.github.io/YOUR_REPO/");
```

### iOS WKWebView (Swift)

```swift
import WebKit

let webView = WKWebView()
let url = URL(string: "https://YOUR_USERNAME.github.io/YOUR_REPO/")!
let request = URLRequest(url: url)

// Enable location access in Info.plist:
// NSLocationWhenInUseUsageDescription

webView.load(request)
```

## Browser Requirements

- Modern browser with JavaScript enabled
- Geolocation API support
- HTTPS (required for geolocation)

## Supported Browsers

✅ Chrome/Edge (Desktop & Mobile)  
✅ Safari (Desktop & Mobile)  
✅ Firefox (Desktop & Mobile)  
✅ Android WebView  
✅ iOS WKWebView  

## Local Development

Simply open `index.html` in your browser. For HTTPS (required for geolocation):

```bash
# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000
```

Note: Localhost doesn't require HTTPS for geolocation.

## Customization

### Change Search Radius
Default is 50m. Edit in `app.js`:

```javascript
searchRadius: 50, // Change this value
```

### Change Auto-refresh Interval
Default is 60 seconds. Edit in `app.js`:

```javascript
state.autoRefreshInterval = setInterval(() => {
    // ...
}, 60000); // Change this value (milliseconds)
```

### Change Number of Departures
Default is 6. Edit in `app.js`:

```javascript
await fetchDepartures(state.currentStation.name, 6); // Change this number
```

### Customize Colors
Edit CSS variables in `style.css`:

```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    /* ... */
}
```

## Troubleshooting

### Location not detected
- Check browser permissions
- Ensure HTTPS (or localhost)
- Try manual search

### No departures shown
- Check internet connection
- Verify station name
- Increase search radius

### App not updating
- Check auto-refresh (every 60s)
- Click "Refresh" manually
- Check browser console for errors

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **API**: Swiss Transport API (OpenData)
- **Storage**: None (stateless)
- **Authentication**: None required
- **CORS**: Enabled by API
- **Offline**: Not supported (requires API)

## License

This project uses the Swiss Public Transport API which is free and open.  
Code is provided as-is for educational purposes.

## Credits

- Transport data: [transport.opendata.ch](https://transport.opendata.ch/)
- Icons: Unicode emoji
- Developed for GitHub Pages deployment

---

**Enjoy your tram rides! 🚊**
