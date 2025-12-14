// Keyboard Shortcuts Utilities

export const SHORTCUTS = {
    TOGGLE_INSPECT: {
        key: 'I',
        altKey: true,
        shiftKey: true,
        description: 'Toggle inspect mode'
    },
    OPEN_PANEL: {
        key: 'E',
        altKey: true,
        shiftKey: true,
        description: 'Open extension panel'
    },
    UNDO: {
        key: 'Z',
        ctrlKey: true,
        description: 'Undo last change'
    },
    REDO: {
        key: 'Z',
        ctrlKey: true,
        shiftKey: true,
        description: 'Redo change'
    },
    SAVE_PRESET: {
        key: 'S',
        ctrlKey: true,
        description: 'Save current preset'
    },
    COPY_CSS: {
        key: 'C',
        ctrlKey: true,
        shiftKey: true,
        description: 'Copy CSS'
    },
    ESCAPE: {
        key: 'Escape',
        description: 'Exit inspect mode'
    }
};

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event, shortcut) {
    return (
        event.key.toUpperCase() === shortcut.key.toUpperCase() &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.metaKey === !!shortcut.metaKey
    );
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut) {
    const parts = [];

    if (shortcut.ctrlKey) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    if (shortcut.altKey) parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    if (shortcut.shiftKey) parts.push('⇧');
    parts.push(shortcut.key);

    return parts.join(' + ');
}

/**
 * Register global keyboard shortcuts handler
 */
export function registerShortcuts(handlers) {
    const handleKeyDown = (event) => {
        // Don't trigger in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        Object.entries(SHORTCUTS).forEach(([name, shortcut]) => {
            if (matchesShortcut(event, shortcut) && handlers[name]) {
                event.preventDefault();
                handlers[name]();
            }
        });
    };

    window.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => window.removeEventListener('keydown', handleKeyDown);
}

export default {
    SHORTCUTS,
    matchesShortcut,
    formatShortcut,
    registerShortcuts
};
