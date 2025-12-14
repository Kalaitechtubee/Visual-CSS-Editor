// Background service worker for Visual CSS Editor
// Handles message passing and side panel management

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    try {
        await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
        console.error('VCE: Failed to open side panel:', error);
    }
});

// Set up side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Ensure content script is injected before sending messages
async function ensureContentScript(tabId) {
    try {
        // Try to ping the content script
        const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
        if (response && response.success) {
            return true;
        }
    } catch (error) {
        // Content script not loaded, inject it
        console.log('VCE: Injecting content script');
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content-script.js']
            });
            await chrome.scripting.insertCSS({
                target: { tabId: tabId },
                files: ['highlighter.css']
            });
            return true;
        } catch (injectError) {
            console.error('VCE: Failed to inject content script:', injectError);
            return false;
        }
    }
    return false;
}

// Send message to content script with retry
async function sendToContentScript(tabId, message) {
    // First ensure content script is loaded
    const isReady = await ensureContentScript(tabId);
    if (!isReady) {
        return { success: false, error: 'Could not inject content script' };
    }

    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                console.log('VCE: Message error:', chrome.runtime.lastError.message);
                resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
                resolve(response || { success: true });
            }
        });
    });
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('VCE Background: Received', message.type);

    // Handle async operations
    (async () => {
        switch (message.type) {
            case 'ELEMENT_SELECTED':
            case 'INSPECT_MODE_ENABLED':
            case 'INSPECT_MODE_DISABLED':
            case 'STYLES_APPLIED':
                // Forward to side panel (ignore errors if not open)
                try {
                    chrome.runtime.sendMessage(message);
                } catch (e) {
                    // Side panel not open, ignore
                }
                break;

            case 'TOGGLE_INSPECT_MODE':
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tabs[0] && tabs[0].id) {
                        const response = await sendToContentScript(tabs[0].id, { type: 'TOGGLE_INSPECT_MODE' });
                        sendResponse(response);
                    } else {
                        sendResponse({ success: false, error: 'No active tab' });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'APPLY_STYLES':
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tabs[0] && tabs[0].id) {
                        const response = await sendToContentScript(tabs[0].id, message);
                        sendResponse(response);
                    } else {
                        sendResponse({ success: false, error: 'No active tab' });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'GET_ELEMENT_STYLES':
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tabs[0] && tabs[0].id) {
                        const response = await sendToContentScript(tabs[0].id, message);
                        sendResponse(response);
                    } else {
                        sendResponse({ success: false, error: 'No active tab' });
                    }
                } catch (error) {
                    sendResponse({ success: false, error: error.message });
                }
                break;

            case 'PING':
                sendResponse({ success: true, message: 'Background script ready' });
                break;

            case 'LOG_ERROR':
                console.error('VCE Error Logged:', message.error);
                // We can also store this in local storage if needed for permanent persistence
                // chrome.storage.local.set({ lastError: message.error });
                break;
        }
    })();

    return true; // Keep message channel open for async response
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle_inspect') {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            await sendToContentScript(tabs[0].id, { type: 'TOGGLE_INSPECT_MODE' });
        }
    }
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('VCE: Visual CSS Editor installed');
        chrome.storage.sync.set({
            presets: [],
            editedElements: [],
            settings: { theme: 'dark', applyToSimilar: false },
            isPro: false
        });
    }
});

console.log('VCE: Background service worker started');
