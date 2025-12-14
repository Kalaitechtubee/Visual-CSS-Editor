// Chrome API utilities with safety checks for dev mode

/**
 * Safely send a message via chrome.runtime
 * Returns silently if not in Chrome extension context
 */
export function sendMessage(message, callback) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(message, callback);
    } else {
        // In dev mode, just log the message
        console.log('[Dev Mode] Would send message:', message);
        if (callback) callback({ success: false, devMode: true });
    }
}

/**
 * Check if we're running in Chrome extension context
 */
export function isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.runtime?.id !== undefined;
}

/**
 * Safely add a message listener
 */
export function addMessageListener(callback) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(callback);
        return () => chrome.runtime.onMessage.removeListener(callback);
    }
    return () => { }; // No-op cleanup
}

export default { sendMessage, isExtensionContext, addMessageListener };
