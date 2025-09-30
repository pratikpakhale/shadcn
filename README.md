# 🎨 Shadcn Hub

A modern component registry explorer with advanced library management and automatic URL tracking via browser extension.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

## ✨ Features

### 🔍 **Registry Explorer**
- Browse multiple UI component registries in one place
- Preview components in an embedded iframe
- Search and filter registries
- Quick external link access
- Includes shadcn/ui, 21st.dev, and more

### 📚 **Library Management**
- Create custom library folders to organize components
- Add components to multiple libraries simultaneously
- Collapsible library views with item counts
- Edit and delete libraries
- Persistent storage with localStorage

### 🔖 **Component Favorites**
- Favorite entire registries for quick access
- Favorites appear at the top of the list
- Toggle favorites mode to view your libraries
- Track individual component URLs

### 🔌 **Browser Extension** (Optional)
- Automatically captures iframe navigation URLs
- Real-time URL tracking as you browse components
- Visual indicator when extension is active
- Works with SPAs and traditional navigation

### 🎯 **Smart URL Handling**
- Edit URLs before saving
- Pre-selects libraries that already contain a component
- Shows "Already added" indicators
- Fallback to manual URL entry without extension

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install
# or
npm install

# Run development server
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Browser Extension (Optional but Recommended)

For automatic URL tracking, install the browser extension:

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Refresh the app


## 📖 Usage

### Basic Workflow

1. **Browse Registries**: Select a registry from the sidebar
2. **Navigate Components**: Click through components in the iframe
3. **Add to Library**: Hover over the iframe and click "Add to Library"
4. **Organize**: Select which libraries to save the component to
5. **Access Later**: Toggle library mode to view your saved components

### Creating Libraries

1. Click the Library icon in the sidebar header
2. Click "New Library"
3. Enter a name (e.g., "Buttons", "Forms", "Favorites")
4. Add components to your library

### With Extension

When the extension is installed:
- URLs are automatically captured as you navigate
- Green "Extension Active" indicator appears
- "Auto-tracked" badge shows on the URL field
- No need to manually copy-paste URLs

### Without Extension

- Navigate to a component
- Open it in a new tab to see the full URL
- Copy the URL from the address bar
- Paste it into the URL field in the dialog

## 🏗️ Project Structure

```
shadcn/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main application component
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── extension/            # Browser extension
│   ├── manifest.json     # Extension config
│   ├── content-script.js # URL tracking script
│   ├── background.js     # Background worker
│   └── README.md        # Extension docs
├── lib/                  # Utilities
│   └── utils.ts         # Helper functions
├── public/              # Static assets
└── EXTENSION_SETUP.md  # Extension setup guide
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **State Management**: React Hooks
- **Storage**: localStorage
- **Extension**: Chrome Extension Manifest V3

## 🎨 Customization

### Adding New Registries

Edit the `fetchRegistries()` function in `app/page.tsx`:

```typescript
// Add custom registry
const customRegistry = "https://your-registry.com/"
if (!domains.includes(customRegistry)) {
  domains.push(customRegistry)
}
```

### Theming

The app uses CSS custom properties for theming. Edit `app/globals.css` to customize colors:

```css
.dark {
  --background: oklch(0.08 0 0);
  --foreground: oklch(0.92 0 0);
  /* ... more theme variables */
}
```

## 📝 Scripts

```bash
# Development
pnpm dev          # Start dev server

# Production
pnpm build        # Build for production
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint
```

## 🐛 Troubleshooting

### Extension Not Working
- Verify it's enabled in `chrome://extensions/`
- Check that "Developer mode" is ON
- Reload the extension after changes
- Check browser console for errors

### URLs Not Saving
- Ensure you've selected at least one library
- Verify the URL field is not empty
- Check localStorage isn't full or blocked

### Components Not Loading
- Check your internet connection
- Verify the registry URL is accessible
- Some registries may block iframe embedding
