# DPSI INDIA CORE KIOSK 2.0
**Delhi Public School Indirapuram — Interactive India Map Kiosk**
*Enhanced Kiosk Map by AI Lab  (Er.Shashank Jangid)*

---

## 📁 Project Structure

```
dpsi-kiosk/
├── index.html          ← Main HTML (this project)
├── style.css           ← All styling & animations
├── script.js           ← App logic, map init, modals
├── mapdata.js          ← Simplemaps country map data  [EXTERNAL]
├── countrymap.js       ← Simplemaps engine            [EXTERNAL]
│
├── assets/
│   ├── chakra.webp     ← Indian Flag image (used on kiosk saver screen)
│   └── dpsi-logo.webp  ← DPSI school logo
│
├── sounds/
│   ├── start-click.mp3 ← Plays when entering the map screen
│   ├── zoom.mp3        ← Plays when a state is tapped
│   ├── back.mp3        ← Plays when returning to home
│   └── ambient.mp3     ← Background loop on map screen
│
└── videos/
    ├── INAP.mp4        ← Andhra Pradesh
    ├── INAR.mp4        ← Arunachal Pradesh
    ├── INAS.mp4        ← Assam
    ├── INBR.mp4        ← Bihar
    ├── INCT.mp4        ← Chhattisgarh
    ├── INGA.mp4        ← Goa
    ├── INGJ.mp4        ← Gujarat
    ├── INHR.mp4        ← Haryana
    ├── INHP.mp4        ← Himachal Pradesh
    ├── INJH.mp4        ← Jharkhand
    ├── INKA.mp4        ← Karnataka
    ├── INKL.mp4        ← Kerala
    ├── INMP.mp4        ← Madhya Pradesh
    ├── INMH.mp4        ← Maharashtra
    ├── INMN.mp4        ← Manipur
    ├── INML.mp4        ← Meghalaya
    ├── INMZ.mp4        ← Mizoram
    ├── INNL.mp4        ← Nagaland
    ├── INOR.mp4        ← Odisha
    ├── INPB.mp4        ← Punjab
    ├── INRJ.mp4        ← Rajasthan
    ├── INSK.mp4        ← Sikkim
    ├── INTN.mp4        ← Tamil Nadu
    ├── INTG.mp4        ← Telangana
    ├── INTR.mp4        ← Tripura
    ├── INUP.mp4        ← Uttar Pradesh
    ├── INUT.mp4        ← Uttarakhand
    ├── INWB.mp4        ← West Bengal
    ├── INAN.mp4        ← Andaman & Nicobar
    ├── INCH.mp4        ← Chandigarh
    ├── INDH.mp4        ← Dadra, NH & Daman Diu
    ├── INDL.mp4        ← Delhi
    ├── INJK.mp4        ← Jammu & Kashmir
    ├── INLA.mp4        ← Ladakh
    ├── INLD.mp4        ← Lakshadweep
    └── INPY.mp4        ← Puducherry
```

> **Videos are optional.** If a video file is missing for a state, a "Visual Tour Coming Soon" placeholder is shown automatically.

---

## 🚀 How to Run

1. Place all files in the same folder keeping the structure above.
2. Open a local web server (do **not** open `index.html` directly from the file system — browsers block audio/video autoplay and local file access):

   ```bash
   # Python 3
   python -m http.server 8080

   # Node.js (if installed)
   npx serve .
   ```

3. Open `http://localhost:8080` in a full-screen browser (press **F11**).

### Kiosk / Touchscreen Setup
- Set the browser to **kiosk mode**: `chrome --kiosk http://localhost:8080`
- The app auto-returns to the saver screen after **2 minutes** of inactivity.
- Press **Escape** or tap **⏎ HOME** to return to the saver at any time.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Saver Screen** | Animated Indian flag, floating DPSI logo, particle field, ripple touch prompt |
| **Interactive Map** | Simplemaps India map — tap any state to open its info modal |
| **State Modal** | Autoplay video tour, key facts (pop, area, language, known for) |
| **Search** | Live search dropdown for all 28 states + 8 UTs |
| **Incredible India** | 16 amazing facts about India in a card grid overlay |
| **HUD** | Live clock, compass, state label, quick stats bar |
| **Inactivity Toast** | 10-second countdown warning before returning home |
| **Sound FX** | Tap, zoom, back, and ambient audio |
| **Watermark Cover** | Gradient overlays hide the Simplemaps trial watermark |

---

## 🛠 Fixes Applied in v2

### 1. Map Top Gap / Jitter
- `#map-container` now uses `top: 128px` (60px topbar + 52px actionbar + 16px padding) — no gap.
- Added `contain: strict`, `backface-visibility: hidden` to eliminate sub-pixel jitter.
- SVG paths use `vector-effect: non-scaling-stroke` and `shape-rendering: geometricPrecision`.

### 2. Wrong State Highlighted (Himachal Pradesh → Jammu fix)
- Removed the manual `SVG path click` listener — only Simplemaps' `click_state` hook is used.
- All per-region `color`, `hover_color`, `active_color` overrides in `mapdata.js` are cleared at runtime so no stale state colour persists.

### 3. Video Scanlines Removed
- The `.video-scanlines` `<div>` is completely removed from `index.html` and its CSS deleted.
- Videos now display clean with no overlay noise.

### 4. Saver Screen Elements Shifted Up
- `#screen-saver` uses `padding-bottom: 16vh` to push flag, logo, and touch prompt upward.
- Flag (Indian flag image from `assets/chakra.webp`) floats gently — no rotation.
- Logo card and touch prompt also sit higher on the screen.

### 5. Loading Screen Enhanced
- India silhouette draw-on SVG animation during the ~5s map load.
- 7-cell animated hexagonal progress grid.
- Animated progress bar with shimmer + cycling status messages.
- Smooth fade-out once `simplemaps` finishes rendering.

### 6. Action Bar Stats Fixed
- Stats row now uses `flex: 1` with `min-width: 0` and `overflow: hidden` — no wrapping or overflow at any screen size.
- Each stat item separated by a subtle border line.

---

## 🎨 Customisation

### Changing State Data
Edit the `STATE_INFO` object in `script.js`:
```js
INMH: {
  name:    'Maharashtra',
  capital: 'Mumbai',
  pop:     '126M',
  area:    '307,713 km²',
  lang:    'Marathi',
  known:   'Bollywood, Ajanta Caves, Gateway of India'
},
```

### Changing Map Colors
In `script.js` → `initMap()`:
```js
s.state_color       = '#0d1a2e';   // default fill
s.state_hover_color = '#FF9933';   // hover fill
s.active_color      = '#FF9933';   // clicked fill
s.border_color      = '#00f2ff';   // border color
```

### Inactivity Timeout
In `script.js`:
```js
const INACTIVE_MS = 120_000;  // 2 minutes — change as needed
const WARN_SEC    = 10;       // countdown seconds
```

---

## 📋 Browser Requirements

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Edge 90+   | ✅ Full |
| Firefox 88+| ✅ Full |
| Safari 14+ | ✅ Full |

> **Recommended:** Google Chrome in kiosk mode on a 1920×1080 or 1280×800 touchscreen.

---

## 📞 Credits

- **Built by:** DPSI AI Lab by Er.Shashank Jangid
- **Map Engine:** [Simplemaps Country Map](https://simplemaps.com/resources/svg-in)
- **Fonts:** Google Fonts — Orbitron, Rajdhani
- **School:** Delhi Public School Indirapuram

---

*© 2025 Delhi Public School Indirapuram. All rights reserved.*
