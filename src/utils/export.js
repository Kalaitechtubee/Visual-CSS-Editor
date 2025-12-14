// Export Utilities
import html2canvas from 'html2canvas';

/**
 * Export element as PNG
 */
export async function exportElementAsPNG(element, filename = 'element.png') {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
            logging: false
        });

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();

        return true;
    } catch (error) {
        console.error('Failed to export element:', error);
        return false;
    }
}

/**
 * Export viewport as PNG
 */
export async function exportViewportAsPNG(filename = 'viewport.png') {
    try {
        const canvas = await html2canvas(document.body, {
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: window.innerHeight,
            scale: 2,
            logging: false
        });

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();

        return true;
    } catch (error) {
        console.error('Failed to export viewport:', error);
        return false;
    }
}

/**
 * Export CSS as file
 */
export function exportCSSFile(css, filename = 'styles.css') {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Export HTML with embedded CSS
 */
export function exportHTMLFile(html, css, filename = 'page.html') {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            return true;
        } catch (e) {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Export presets as JSON
 */
export function exportPresetsJSON(presets, filename = 'presets.json') {
    const json = JSON.stringify(presets, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
}

export default {
    exportElementAsPNG,
    exportViewportAsPNG,
    exportCSSFile,
    exportHTMLFile,
    copyToClipboard,
    exportPresetsJSON
};
