# Progressive Web App (PWA) & Mobile UX

## Overview
The Cue Junction system is built to operate flawlessly on any device. Rather than building separate iOS and Android applications, the system leverages PWA (Progressive Web App) technologies to install directly from the browser onto the device's home screen.

## Core Capabilities

### 1. App Installation
- Includes a valid `manifest.json` and a registered Service Worker (`sw.js`).
- Users visiting via Chrome or Safari on mobile devices are prompted to "Add to Home Screen".
- When launched from the home screen, the app runs in `standalone` mode, stripping away the browser URL bar and navigation controls, making it feel identical to a native app.

### 2. Touch-Optimized Layouts
The UI uses responsive Tailwind classes (`sm:`, `md:`, `lg:`) to completely mutate the layout based on the device:
- **Desktop**: Features a persistent, wide left-hand navigation sidebar and dense data tables.
- **Tablet (iPad)**: Grid layouts naturally reflow (e.g., 4 columns to 2 columns).
- **Mobile**: The sidebar vanishes, replaced by a sticky top-header and a bottom Hamburger menu that triggers a full-screen drawer overlay.
- Buttons, inputs, and dropdowns (using Shadcn UI) feature expanded tap targets to prevent accidental mis-clicks on touch screens.

### 3. Client-side Caching & Polish
- Uses `next-themes` to support system-level Dark Mode and Light Mode, instantly matching the device's preference.
- The Service Worker caches static assets (fonts, icons, CSS) to ensure the shell of the application loads instantly, even on poor network connections inside the cafe.
- Toast notifications provide tactile feedback for touch actions (e.g., adding to cart, starting a session).
