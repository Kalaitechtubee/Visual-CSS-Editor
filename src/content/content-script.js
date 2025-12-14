// Enhanced Content Script for Visual CSS Editor
// Properly captures HTML, styles, and handles element selection

let isInspectMode = false;
let hoveredElement = null;
let selectedElement = null;
let overlay = null;
let tooltip = null;

// Safe message sending
function safeSendMessage(message, callback) {
    try {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.log('VCE: Message not delivered');
                return;
            }
            if (callback) callback(response);
        });
    } catch (error) {
        console.log('VCE: Could not send message', error);
    }
}

// Create overlay
function createOverlay() {
    if (overlay) return;
    
    overlay = document.createElement('div');
    overlay.id = 'vce-overlay';
    overlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 2147483646;
        border: 2px solid #007AFF;
        background: rgba(0, 122, 255, 0.1);
        transition: all 0.1s ease;
        display: none;
        box-shadow: 0 0 0 1px rgba(0, 122, 255, 0.3);
    `;
    document.body.appendChild(overlay);
}

// Create tooltip
function createTooltip() {
    if (tooltip) return;
    
    tooltip = document.createElement('div');
    tooltip.id = 'vce-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        background: #1C1C1E;
        color: #FFFFFF;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: -apple-system, sans-serif;
        font-size: 11px;
        pointer-events: none;
        display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        max-width: 320px;
    `;
    document.body.appendChild(tooltip);
}

// Get element selector
function getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    
    if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).filter(c => c);
        if (classes.length > 0) {
            return `${element.tagName.toLowerCase()}.${classes[0]}`;
        }
    }
    
    return element.tagName.toLowerCase();
}

// Get element path
function getElementPath(element) {
    const parts = [];
    let current = element;
    
    while (current && current !== document.body && parts.length < 3) {
        parts.unshift(getElementSelector(current));
        current = current.parentElement;
    }
    
    return parts.join(' > ');
}

// Get clean HTML content - FIXED VERSION
function getElementHTML(element, maxLength = 8000) {
    if (!element) return '';
    
    try {
        // Clone to avoid modifying original
        const clone = element.cloneNode(true);
        
        // Remove scripts and event handlers
        const scripts = clone.querySelectorAll('script, style, link');
        scripts.forEach(s => s.remove());
        
        // Remove inline event handlers
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        // Get HTML
        let html = clone.outerHTML;
        
        // Clean up whitespace
        html = html.replace(/\s+/g, ' ');
        html = html.replace(/>\s+</g, '><');
        
        // Format for readability
        let formatted = '';
        let indent = 0;
        const parts = html.split(/(<[^>]+>)/g).filter(Boolean);
        
        parts.forEach(part => {
            if (part.startsWith('</')) {
                indent = Math.max(0, indent - 2);
                formatted += '\n' + ' '.repeat(indent) + part;
            } else if (part.startsWith('<') && !part.endsWith('/>')) {
                formatted += '\n' + ' '.repeat(indent) + part;
                if (!part.startsWith('<!') && !part.match(/<(br|hr|img|input|meta|link)/i)) {
                    indent += 2;
                }
            } else {
                formatted += part.trim() ? '\n' + ' '.repeat(indent) + part.trim() : '';
            }
        });
        
        // Truncate if needed
        if (formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength) + '\n<!-- truncated -->';
        }
        
        return formatted.trim();
    } catch (error) {
        console.error('VCE: Error getting HTML:', error);
        return `<${element.tagName.toLowerCase()}>${element.textContent?.substring(0, 100) || ''}...</${element.tagName.toLowerCase()}>`;
    }
}

// Get computed styles - COMPLETE VERSION
function getComputedStylesObject(element) {
    const computed = window.getComputedStyle(element);
    
    return {
        // Typography
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textAlign: computed.textAlign,
        textDecoration: computed.textDecoration,
        textTransform: computed.textTransform,
        color: computed.color,
        
        // Background
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage !== 'none' ? computed.backgroundImage : undefined,
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundRepeat: computed.backgroundRepeat,
        
        // Appearance
        opacity: computed.opacity,
        borderRadius: computed.borderRadius,
        cursor: computed.cursor,
        
        // Spacing
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        
        // Border
        borderTopWidth: computed.borderTopWidth,
        borderRightWidth: computed.borderRightWidth,
        borderBottomWidth: computed.borderBottomWidth,
        borderLeftWidth: computed.borderLeftWidth,
        borderTopStyle: computed.borderTopStyle,
        borderRightStyle: computed.borderRightStyle,
        borderBottomStyle: computed.borderBottomStyle,
        borderLeftStyle: computed.borderLeftStyle,
        borderTopColor: computed.borderTopColor,
        borderRightColor: computed.borderRightColor,
        borderBottomColor: computed.borderBottomColor,
        borderLeftColor: computed.borderLeftColor,
        
        // Layout
        display: computed.display,
        position: computed.position,
        flexDirection: computed.flexDirection,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        gap: computed.gap,
        gridTemplateColumns: computed.gridTemplateColumns !== 'none' ? computed.gridTemplateColumns : undefined,
        gridTemplateRows: computed.gridTemplateRows !== 'none' ? computed.gridTemplateRows : undefined,
        
        // Effects
        boxShadow: computed.boxShadow !== 'none' ? computed.boxShadow : undefined,
        filter: computed.filter !== 'none' ? computed.filter : undefined,
        transform: computed.transform !== 'none' ? computed.transform : undefined,
        
        // Size
        width: computed.width,
        height: computed.height,
        minWidth: computed.minWidth,
        minHeight: computed.minHeight,
        maxWidth: computed.maxWidth !== 'none' ? computed.maxWidth : undefined,
        maxHeight: computed.maxHeight !== 'none' ? computed.maxHeight : undefined,
        
        // Overflow
        overflow: computed.overflow,
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
    };
}

// Update overlay position
function updateOverlay(element) {
    if (!overlay || !element) return;
    
    const rect = element.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = `${rect.top}px`;
    overlay.style.left = `${rect.left}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
}

// Update tooltip
function updateTooltip(element, event) {
    if (!tooltip || !element) return;
    
    const selector = getElementSelector(element);
    const tagName = element.tagName.toLowerCase();
    const size = `${Math.round(element.offsetWidth)}×${Math.round(element.offsetHeight)}`;
    const text = element.textContent?.trim().substring(0, 30) || '';
    
    tooltip.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div>
                <span style="color: #007AFF; font-weight: 600;">${tagName}</span>
                <span style="color: #98989D;"> ${selector}</span>
            </div>
            ${text ? `<div style="color: #636366; font-size: 10px;">${text}${text.length >= 30 ? '...' : ''}</div>` : ''}
            <div style="color: #636366; font-size: 10px;">${size}</div>
        </div>
    `;
    
    tooltip.style.display = 'block';
    
    let x = event.clientX + 15;
    let y = event.clientY + 15;
    
    const tooltipRect = tooltip.getBoundingClientRect();
    if (x + tooltipRect.width > window.innerWidth) {
        x = event.clientX - tooltipRect.width - 15;
    }
    if (y + tooltipRect.height > window.innerHeight) {
        y = event.clientY - tooltipRect.height - 15;
    }
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

// Hide overlay and tooltip
function hideOverlayAndTooltip() {
    if (overlay) overlay.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
}

// Event handlers
function handleMouseMove(event) {
    if (!isInspectMode) return;
    
    const element = event.target;
    if (element.id === 'vce-overlay' || element.id === 'vce-tooltip') return;
    
    if (element !== hoveredElement) {
        hoveredElement = element;
        updateOverlay(element);
    }
    updateTooltip(element, event);
}

function handleClick(event) {
    if (!isInspectMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    if (element.id === 'vce-overlay' || element.id === 'vce-tooltip') return;
    
    selectedElement = element;
    
    // Update overlay style
    if (overlay) {
        overlay.style.borderColor = '#34C759';
        overlay.style.background = 'rgba(52, 199, 89, 0.15)';
    }
    
    // Get all element data
    const selector = getElementSelector(element);
    const path = getElementPath(element);
    const styles = getComputedStylesObject(element);
    const html = getElementHTML(element);
    
    console.log('VCE: Element selected');
    console.log('VCE: Selector:', selector);
    console.log('VCE: HTML length:', html.length);
    console.log('VCE: Styles count:', Object.keys(styles).length);
    
    // Send complete data to extension
    safeSendMessage({
        type: 'ELEMENT_SELECTED',
        data: {
            selector,
            path,
            tagName: element.tagName.toLowerCase(),
            className: element.className,
            styles,
            html,
            textContent: element.textContent?.substring(0, 200),
            rect: {
                top: element.getBoundingClientRect().top,
                left: element.getBoundingClientRect().left,
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        }
    });
    
    disableInspectMode();
}

function handleKeyDown(event) {
    if (event.key === 'Escape' && isInspectMode) {
        disableInspectMode();
    }
}

// Enable/Disable inspect mode
function enableInspectMode() {
    isInspectMode = true;
    createOverlay();
    createTooltip();
    
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    
    console.log('VCE: Inspect mode enabled');
    safeSendMessage({ type: 'INSPECT_MODE_ENABLED' });
}

function disableInspectMode() {
    isInspectMode = false;
    hoveredElement = null;
    
    hideOverlayAndTooltip();
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    
    if (overlay) {
        overlay.style.borderColor = '#007AFF';
        overlay.style.background = 'rgba(0, 122, 255, 0.1)';
    }
    
    console.log('VCE: Inspect mode disabled');
    safeSendMessage({ type: 'INSPECT_MODE_DISABLED' });
}

// Apply styles
function applyStyles(selector, styles) {
    const element = selectedElement || document.querySelector(selector);
    if (!element) return;
    
    Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
    });
    
    safeSendMessage({
        type: 'STYLES_APPLIED',
        data: { selector, styles }
    });
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('VCE: Received', message.type);
    
    switch (message.type) {
        case 'TOGGLE_INSPECT_MODE':
            isInspectMode ? disableInspectMode() : enableInspectMode();
            sendResponse({ success: true, isInspectMode });
            break;
            
        case 'ENABLE_INSPECT_MODE':
            enableInspectMode();
            sendResponse({ success: true });
            break;
            
        case 'DISABLE_INSPECT_MODE':
            disableInspectMode();
            sendResponse({ success: true });
            break;
            
        case 'APPLY_STYLES':
            applyStyles(message.selector, message.styles);
            sendResponse({ success: true });
            break;
            
        case 'GET_ELEMENT_STYLES':
            if (selectedElement) {
                sendResponse({
                    success: true,
                    styles: getComputedStylesObject(selectedElement),
                    html: getElementHTML(selectedElement)
                });
            } else {
                sendResponse({ success: false, error: 'No element selected' });
            }
            break;
            
        case 'GET_ELEMENT_HTML':
            if (selectedElement) {
                sendResponse({
                    success: true,
                    html: getElementHTML(selectedElement)
                });
            } else {
                sendResponse({ success: false, error: 'No element selected' });
            }
            break;
            
        case 'PING':
            sendResponse({ success: true });
            break;
    }
    
    return true;
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (overlay) overlay.remove();
    if (tooltip) tooltip.remove();
});

console.log('VCE: Content script ready');