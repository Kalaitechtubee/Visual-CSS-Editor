# Visual CSS Editor

A powerful Chrome extension for visually editing CSS on any webpage with AI-powered code generation.

## Features

### Free Features
- 🔍 **Element Inspection** - Hover and click to select any element
- ✏️ **Visual CSS Editing** - Edit typography, colors, spacing, and more
- 📋 **Copy CSS** - Export styles for individual elements
- 💾 **Presets** - Save and load style presets

### Pro Features ($4.99/mo or $29.99/yr)
- 🎯 **Apply to Similar** - Apply changes to matching elements globally
- 📸 **Screenshot Export** - Export elements or viewport as PNG
- 🤖 **AI Code Generation** - Generate complete HTML/CSS/JS code
- ⚛️ **Framework Conversion** - Convert to React, Vue, or Angular
- 📊 **Design System** - Generate design tokens and style guides

## Installation

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Load in Chrome
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Shift + I` | Toggle inspect mode |
| `Ctrl + Shift + E` | Open extension panel |
| `Escape` | Exit inspect mode |
| `Ctrl + Z` | Undo last change |
| `Ctrl + Shift + Z` | Redo change |

## Tech Stack

- **React 18** - UI framework
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Groq API** - AI code generation

## Project Structure

```
src/
├── components/
│   ├── common/      # Reusable UI components
│   ├── edit/        # Style editing sections
│   ├── main/        # Main panel components
│   └── page/        # Page-level settings
├── hooks/           # Custom React hooks
├── stores/          # Zustand state stores
├── content/         # Content scripts
├── background/      # Service worker
└── utils/           # Utility functions
```

## License

MIT © Visual CSS Editor
