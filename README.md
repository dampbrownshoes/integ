# Launch Banner Mobile Fix

A web application featuring a responsive launch banner that displays properly on both desktop and mobile devices.

## Features

- 🚀 Responsive launch banner with gradient background
- 📱 Mobile-optimized design with proper viewport handling
- ✨ Smooth animations and hover effects
- 🎯 Sticky positioning (desktop) / relative positioning (mobile)
- 💾 Remembers user preference if banner is closed
- 🔧 Built-in debugging and visibility logging

## Quick Start

1. Start a local server:
   ```bash
   npm run start
   # or
   python3 -m http.server 8080
   ```

2. Open http://localhost:8080 in your browser

3. Test mobile view by:
   - Resizing browser window to mobile size
   - Using browser dev tools device emulation
   - Opening on actual mobile device

## Mobile Fixes Implemented

- Added proper viewport meta tag for mobile rendering
- Responsive breakpoints at 768px and 480px
- Flexible banner layout that stacks on mobile
- Optimized font sizes for mobile readability
- Touch-friendly button sizes
- Proper spacing and padding for mobile screens

## Testing

The banner includes console logging to help debug visibility issues. Open browser dev tools to see:
- Banner visibility status
- Viewport dimensions
- Mobile detection
- Orientation change handling