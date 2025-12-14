# Visual CSS Editor - Development Guide

## 🛑 IMPOTANT: How to Load the Extension
**You MUST load the `dist` folder, not the project root.**

1. Run `npm run build` (or `npm run watch` for auto-updates).
2. Go to `chrome://extensions`.
3. Click "Load Unpacked".
4. Select `D:\Kalai projects\visual-css-editor\dist`.

## Why?
This extension is built with React and Vite. browsers cannot run React source code (JSX) directly. The code must be compiled into standard JavaScript, which is what the `dist` folder contains.

## Development Workflow
1. Open a terminal.
2. Run `npm run watch`.
3. Make changes to files in `src/`.
4. The extension will automatically rebuild.
5. Go to `chrome://extensions` and click the **Reload** icon on the extension card.

## Troubleshooting
- **"Failed to load extension"**: You are likely loading the root folder. Load `dist` instead.
- **"Manifest missing"**: You are loading a folder that doesn't have a manifest. ensuring `npm run build` has finished successfully.
