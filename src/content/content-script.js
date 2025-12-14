// content-script.js
// Enhanced Content Script for Visual CSS Editor
// Complete UI extraction with precise DOM structure, styles, and assets
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
        const classes = element.className.trim().split(/\s+/).filter(c => c && !c.includes('vce-'));
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
    while (current && current !== document.body && parts.length < 5) {
        parts.unshift(getElementSelector(current));
        current = current.parentElement;
    }
    return parts.join(' > ');
}

// Extract complete DOM structure with all nested elements
function extractDOMStructure(element, maxDepth = 10, currentDepth = 0) {
    if (!element || currentDepth > maxDepth) return null;
    const node = {
        tagName: element.tagName.toLowerCase(),
        attributes: {},
        styles: getComputedStylesObject(element),
        textContent: null,
        children: []
    };
    // Extract attributes
    Array.from(element.attributes).forEach(attr => {
        // Skip event handlers and internal attributes
        if (!attr.name.startsWith('on') && !attr.name.includes('vce-')) {
            node.attributes[attr.name] = attr.value;
        }
    });
    // Handle text nodes
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
        node.textContent = element.childNodes[0].textContent.trim();
    }
    // Extract children
    Array.from(element.children).forEach(child => {
        // Skip script, style, and our own elements
        if (!['SCRIPT', 'STYLE', 'LINK', 'META'].includes(child.tagName) &&
            !child.id?.includes('vce-')) {
            const childNode = extractDOMStructure(child, maxDepth, currentDepth + 1);
            if (childNode) {
                node.children.push(childNode);
            }
        }
    });
    return node;
}

// Convert DOM structure to clean HTML with exact structure
function domStructureToHTML(node, indent = 0) {
    if (!node) return '';
    const indentStr = ' '.repeat(indent);
    const tag = node.tagName;

    // Build attributes string
    let attrsStr = '';
    if (node.attributes) {
        Object.entries(node.attributes).forEach(([key, value]) => {
            // Include all relevant attributes
            if (key !== 'style') { // We'll handle styles separately
                attrsStr += ` ${key}="${value}"`;
            }
        });
    }
    // Self-closing tags
    if (['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag)) {
        return `${indentStr}<${tag}${attrsStr} />`;
    }
    // Has text content only
    if (node.textContent && node.children.length === 0) {
        return `${indentStr}<${tag}${attrsStr}>${node.textContent}</${tag}>`;
    }
    // Has children
    let html = `${indentStr}<${tag}${attrsStr}>`;

    if (node.children.length > 0) {
        html += '\n';
        node.children.forEach(child => {
            html += domStructureToHTML(child, indent + 1) + '\n';
        });
        html += indentStr;
    }

    html += `</${tag}>`;

    return html;
}

// Get clean HTML content - ENHANCED VERSION
function getElementHTML(element, maxLength = 15000) {
    if (!element) return '';
    try {
        // Extract complete DOM structure
        const domStructure = extractDOMStructure(element);

        // Convert to HTML
        const html = domStructureToHTML(domStructure);
        // Truncate if needed
        if (html.length > maxLength) {
            return html.substring(0, maxLength) + '\n<!-- truncated -->';
        }
        return html;
    } catch (error) {
        console.error('VCE: Error getting HTML:', error);
        return `<${element.tagName.toLowerCase()}>${element.textContent?.substring(0, 100) || ''}...</${element.tagName.toLowerCase()}>`;
    }
}

// Helper to get effective background color (traversing up if transparent)
function getEffectiveBackgroundColor(element) {
    let current = element;
    while (current) {
        const bg = window.getComputedStyle(current).backgroundColor;
        // Check if not transparent (rgba(0, 0, 0, 0) or transparent)
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
        }
        current = current.parentElement;
    }
    return 'rgb(255, 255, 255)'; // Default to white
}

// Helper to calculate contrast ratio
function getContrastRatio(foreground, background) {
    const getLuminance = (rgb) => {
        const [r, g, b] = rgb.match(/\d+/g).map(Number).map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    try {
        const lum1 = getLuminance(foreground);
        const lum2 = getLuminance(background);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    } catch (e) {
        return 0; // Fail safe
    }
}

// Get computed styles - COMPLETE VERSION
function getComputedStylesObject(element) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    // Contextual analysis
    const isTransparent = computed.backgroundColor === 'rgba(0, 0, 0, 0)' || computed.backgroundColor === 'transparent';
    const effectiveBg = getEffectiveBackgroundColor(element);
    const contrastRatio = getContrastRatio(computed.color, isTransparent ? effectiveBg : computed.backgroundColor);

    return {
        // Context (New)
        _context: {
            isTransparent,
            visuallyTransparent: isTransparent, // Explicit flag for AI
            effectiveBackgroundColor: effectiveBg,
            contrastRatio: contrastRatio.toFixed(2),
            hasLowContrast: contrastRatio < 4.5, // WCAG AA standard
            parentTag: element.parentElement ? element.parentElement.tagName.toLowerCase() : null
        },

        // Dimensions (EXACT)
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        minWidth: computed.minWidth !== '0px' ? computed.minWidth : undefined,
        minHeight: computed.minHeight !== '0px' ? computed.minHeight : undefined,
        maxWidth: computed.maxWidth !== 'none' ? computed.maxWidth : undefined,
        maxHeight: computed.maxHeight !== 'none' ? computed.maxHeight : undefined,
        // Typography
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing !== 'normal' ? computed.letterSpacing : undefined,
        textAlign: computed.textAlign,
        textDecoration: computed.textDecoration !== 'none solid rgb(0, 0, 0)' ? computed.textDecoration : undefined,
        textTransform: computed.textTransform !== 'none' ? computed.textTransform : undefined,
        whiteSpace: computed.whiteSpace !== 'normal' ? computed.whiteSpace : undefined,
        wordBreak: computed.wordBreak !== 'normal' ? computed.wordBreak : undefined,
        color: computed.color,
        // Background
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage !== 'none' ? computed.backgroundImage : undefined,
        backgroundSize: computed.backgroundSize !== 'auto' ? computed.backgroundSize : undefined,
        backgroundPosition: computed.backgroundPosition !== '0% 0%' ? computed.backgroundPosition : undefined,
        backgroundRepeat: computed.backgroundRepeat !== 'repeat' ? computed.backgroundRepeat : undefined,
        backgroundAttachment: computed.backgroundAttachment !== 'scroll' ? computed.backgroundAttachment : undefined,
        backgroundClip: computed.backgroundClip !== 'border-box' ? computed.backgroundClip : undefined,
        // Appearance
        opacity: computed.opacity !== '1' ? computed.opacity : undefined,
        visibility: computed.visibility !== 'visible' ? computed.visibility : undefined,
        cursor: computed.cursor !== 'auto' ? computed.cursor : undefined,
        // Border
        borderRadius: computed.borderRadius !== '0px' ? computed.borderRadius : undefined,
        borderTopWidth: computed.borderTopWidth !== '0px' ? computed.borderTopWidth : undefined,
        borderRightWidth: computed.borderRightWidth !== '0px' ? computed.borderRightWidth : undefined,
        borderBottomWidth: computed.borderBottomWidth !== '0px' ? computed.borderBottomWidth : undefined,
        borderLeftWidth: computed.borderLeftWidth !== '0px' ? computed.borderLeftWidth : undefined,
        borderTopStyle: computed.borderTopStyle !== 'none' ? computed.borderTopStyle : undefined,
        borderRightStyle: computed.borderRightStyle !== 'none' ? computed.borderRightStyle : undefined,
        borderBottomStyle: computed.borderBottomStyle !== 'none' ? computed.borderBottomStyle : undefined,
        borderLeftStyle: computed.borderLeftStyle !== 'none' ? computed.borderLeftStyle : undefined,
        borderTopColor: computed.borderTopColor !== 'rgb(0, 0, 0)' ? computed.borderTopColor : undefined,
        borderRightColor: computed.borderRightColor !== 'rgb(0, 0, 0)' ? computed.borderRightColor : undefined,
        borderBottomColor: computed.borderBottomColor !== 'rgb(0, 0, 0)' ? computed.borderBottomColor : undefined,
        borderLeftColor: computed.borderLeftColor !== 'rgb(0, 0, 0)' ? computed.borderLeftColor : undefined,
        // Spacing (EXACT)
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        // Layout
        display: computed.display,
        position: computed.position,
        top: computed.top !== 'auto' ? computed.top : undefined,
        right: computed.right !== 'auto' ? computed.right : undefined,
        bottom: computed.bottom !== 'auto' ? computed.bottom : undefined,
        left: computed.left !== 'auto' ? computed.left : undefined,
        zIndex: computed.zIndex !== 'auto' ? computed.zIndex : undefined,
        // Flexbox
        flexDirection: computed.flexDirection !== 'row' ? computed.flexDirection : undefined,
        flexWrap: computed.flexWrap !== 'nowrap' ? computed.flexWrap : undefined,
        justifyContent: computed.justifyContent !== 'normal' ? computed.justifyContent : undefined,
        alignItems: computed.alignItems !== 'normal' ? computed.alignItems : undefined,
        alignContent: computed.alignContent !== 'normal' ? computed.alignContent : undefined,
        gap: computed.gap !== 'normal' ? computed.gap : undefined,
        rowGap: computed.rowGap !== 'normal' ? computed.rowGap : undefined,
        columnGap: computed.columnGap !== 'normal' ? computed.columnGap : undefined,
        flex: computed.flex !== '0 1 auto' ? computed.flex : undefined,
        flexGrow: computed.flexGrow !== '0' ? computed.flexGrow : undefined,
        flexShrink: computed.flexShrink !== '1' ? computed.flexShrink : undefined,
        flexBasis: computed.flexBasis !== 'auto' ? computed.flexBasis : undefined,
        // Grid
        gridTemplateColumns: computed.gridTemplateColumns !== 'none' ? computed.gridTemplateColumns : undefined,
        gridTemplateRows: computed.gridTemplateRows !== 'none' ? computed.gridTemplateRows : undefined,
        gridTemplateAreas: computed.gridTemplateAreas !== 'none' ? computed.gridTemplateAreas : undefined,
        gridAutoFlow: computed.gridAutoFlow !== 'row' ? computed.gridAutoFlow : undefined,
        gridAutoColumns: computed.gridAutoColumns !== 'auto' ? computed.gridAutoColumns : undefined,
        gridAutoRows: computed.gridAutoRows !== 'auto' ? computed.gridAutoRows : undefined,
        // Effects
        boxShadow: computed.boxShadow !== 'none' ? computed.boxShadow : undefined,
        textShadow: computed.textShadow !== 'none' ? computed.textShadow : undefined,
        filter: computed.filter !== 'none' ? computed.filter : undefined,
        backdropFilter: computed.backdropFilter !== 'none' ? computed.backdropFilter : undefined,
        transform: computed.transform !== 'none' ? computed.transform : undefined,
        transformOrigin: computed.transformOrigin !== '50% 50% 0px' ? computed.transformOrigin : undefined,
        // Overflow
        overflow: computed.overflow !== 'visible' ? computed.overflow : undefined,
        overflowX: computed.overflowX !== 'visible' ? computed.overflowX : undefined,
        overflowY: computed.overflowY !== 'visible' ? computed.overflowY : undefined,
        // Transitions & Animations
        transition: computed.transition !== 'all 0s ease 0s' ? computed.transition : undefined,
        animation: computed.animation !== 'none' ? computed.animation : undefined,
        // Other
        objectFit: computed.objectFit !== 'fill' ? computed.objectFit : undefined,
        objectPosition: computed.objectPosition !== '50% 50%' ? computed.objectPosition : undefined,
        pointerEvents: computed.pointerEvents !== 'auto' ? computed.pointerEvents : undefined,
        userSelect: computed.userSelect !== 'auto' ? computed.userSelect : undefined,
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

// Extract ALL assets (images, icons, SVGs, background images, videos)
function getElementAssets(element) {
    const assets = [];
    const seenUrls = new Set();
    // Helper to resolve and add asset
    const addAsset = (type, url, refElement, additionalInfo = {}) => {
        if (!url || url === 'none' || seenUrls.has(url)) return;
        // Handle data URIs separately
        if (url.startsWith('data:')) {
            const dataType = url.split(':')[1]?.split(';')[0] || 'unknown';
            assets.push({
                type: 'data-uri',
                dataType,
                url: url.substring(0, 200) + '...', // Truncate data URIs
                tagName: refElement.tagName.toLowerCase(),
                selector: getElementSelector(refElement),
                ...additionalInfo
            });
            return;
        }
        // Resolve relative URLs
        try {
            const absoluteUrl = new URL(url, window.location.href).href;
            if (seenUrls.has(absoluteUrl)) return;
            seenUrls.add(absoluteUrl);
            assets.push({
                type,
                url: absoluteUrl,
                tagName: refElement.tagName.toLowerCase(),
                selector: getElementSelector(refElement),
                ...additionalInfo
            });
        } catch (e) {
            // Invalid URL, still track it
            assets.push({
                type,
                url,
                tagName: refElement.tagName.toLowerCase(),
                selector: getElementSelector(refElement),
                error: 'Invalid URL',
                ...additionalInfo
            });
        }
    };
    // Helper to extract URL from CSS url()
    const extractUrlFromCSS = (cssValue) => {
        const match = cssValue.match(/url\(['"]?(.*?)['"]?\)/);
        return match ? match[1] : null;
    };
    // Recursive function to traverse all elements
    const traverse = (el) => {
        if (!el || el.id?.includes('vce-')) return;
        const computed = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        // 1. Background Images
        if (computed.backgroundImage && computed.backgroundImage !== 'none') {
            // Handle multiple background images
            const bgImages = computed.backgroundImage.split(/,\s*(?=url)/);
            bgImages.forEach(bgImg => {
                const url = extractUrlFromCSS(bgImg);
                if (url) {
                    addAsset('background-image', url, el, {
                        backgroundSize: computed.backgroundSize,
                        backgroundPosition: computed.backgroundPosition,
                        backgroundRepeat: computed.backgroundRepeat
                    });
                }
            });
        }
        // 2. IMG tags
        if (tag === 'img') {
            if (el.src) {
                addAsset('img', el.src, el, {
                    alt: el.alt || '',
                    width: el.width,
                    height: el.height,
                    srcset: el.srcset || undefined
                });
            }
            if (el.srcset) {
                // Parse srcset
                el.srcset.split(',').forEach(src => {
                    const [url] = src.trim().split(' ');
                    if (url) addAsset('img-srcset', url, el);
                });
            }
        }
        // 3. SVG elements
        if (tag === 'svg') {
            // Inline SVG - capture the code
            const svgCode = el.outerHTML;
            if (svgCode.length < 5000) { // Only if reasonable size
                assets.push({
                    type: 'svg-inline',
                    code: svgCode,
                    tagName: 'svg',
                    selector: getElementSelector(el),
                    width: el.getAttribute('width'),
                    height: el.getAttribute('height')
                });
            }
            // SVG with xlink:href or href images
            const images = el.querySelectorAll('image');
            images.forEach(img => {
                const href = img.getAttribute('href') || img.getAttribute('xlink:href');
                if (href) addAsset('svg-image', href, el);
            });
        }
        // 4. PICTURE elements
        if (tag === 'picture') {
            const sources = el.querySelectorAll('source');
            sources.forEach(source => {
                if (source.srcset) {
                    addAsset('picture-source', source.srcset, el, {
                        media: source.media,
                        type: source.type
                    });
                }
            });
        }
        // 5. VIDEO elements
        if (tag === 'video') {
            if (el.poster) addAsset('video-poster', el.poster, el);
            if (el.src) addAsset('video-source', el.src, el);

            const sources = el.querySelectorAll('source');
            sources.forEach(source => {
                if (source.src) {
                    addAsset('video-source', source.src, el, {
                        type: source.type
                    });
                }
            });
        }
        // 6. AUDIO elements
        if (tag === 'audio' && el.src) {
            addAsset('audio-source', el.src, el);
        }
        // 7. IFRAME elements
        if (tag === 'iframe' && el.src) {
            addAsset('iframe', el.src, el);
        }
        // 8. Icon fonts (detect common patterns)
        const classList = Array.from(el.classList || []);
        const hasIconClass = classList.some(cls =>
            /^(fa|icon|material-icons|glyphicon|bi-|lucide-)/.test(cls)
        );
        if (hasIconClass) {
            assets.push({
                type: 'icon-font',
                classes: classList.join(' '),
                tagName: tag,
                selector: getElementSelector(el),
                fontFamily: computed.fontFamily,
                content: computed.content
            });
        }
        // 9. Pseudo-element content images (::before, ::after)
        try {
            const before = window.getComputedStyle(el, '::before');
            if (before.content && before.content !== 'none') {
                const url = extractUrlFromCSS(before.content);
                if (url) addAsset('pseudo-before', url, el);
            }
            const after = window.getComputedStyle(el, '::after');
            if (after.content && after.content !== 'none') {
                const url = extractUrlFromCSS(after.content);
                if (url) addAsset('pseudo-after', url, el);
            }
        } catch (e) {
            // Pseudo-element access might fail in some cases
        }
        // 10. Mask images
        if (computed.maskImage && computed.maskImage !== 'none') {
            const url = extractUrlFromCSS(computed.maskImage);
            if (url) addAsset('mask-image', url, el);
        }
        // 11. Clip-path with URL
        if (computed.clipPath && computed.clipPath.includes('url')) {
            const url = extractUrlFromCSS(computed.clipPath);
            if (url) addAsset('clip-path', url, el);
        }
        // Traverse children
        Array.from(el.children).forEach(traverse);
    };
    // Start traversal from the selected element
    traverse(element);
    console.log(`VCE: Found ${assets.length} assets`);

    return assets.slice(0, 50); // Limit to prevent payload issues
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
    const assets = getElementAssets(element);
    const domStructure = extractDOMStructure(element);
    console.log('VCE: Element selected');
    console.log('VCE: Selector:', selector);
    console.log('VCE: HTML length:', html.length);
    console.log('VCE: Styles count:', Object.keys(styles).filter(k => styles[k] !== undefined).length);
    console.log('VCE: Assets found:', assets.length);
    console.log('VCE: DOM depth:', JSON.stringify(domStructure).length);
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
            assets,
            domStructure, // Include complete DOM structure
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
                    html: getElementHTML(selectedElement),
                    assets: getElementAssets(selectedElement),
                    domStructure: extractDOMStructure(selectedElement)
                });
            } else {
                sendResponse({ success: false, error: 'No element selected' });
            }
            break;
        case 'GET_ELEMENT_HTML':
            if (selectedElement) {
                sendResponse({
                    success: true,
                    html: getElementHTML(selectedElement),
                    domStructure: extractDOMStructure(selectedElement)
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

console.log('VCE: Enhanced content script ready');