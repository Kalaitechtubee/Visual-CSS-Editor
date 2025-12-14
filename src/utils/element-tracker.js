// Element Tracking Utilities

/**
 * Generate a unique CSS selector for an element
 */
export function generateSelector(element) {
    if (!element) return '';

    // ID is the most specific
    if (element.id) {
        return `#${element.id}`;
    }

    // Check for useful classes
    if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).filter(c => {
            // Filter out utility classes and dynamic classes
            return c && !c.match(/^(js-|is-|has-|hover:|focus:|active:|disabled:|[0-9])/);
        });

        if (classes.length > 0) {
            const tagName = element.tagName.toLowerCase();
            return `${tagName}.${classes.slice(0, 2).join('.')}`;
        }
    }

    // Fallback to tag with nth-child
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;

    if (parent) {
        const siblings = Array.from(parent.children).filter(
            child => child.tagName === element.tagName
        );
        const index = siblings.indexOf(element);

        if (siblings.length > 1) {
            return `${tagName}:nth-of-type(${index + 1})`;
        }
    }

    return tagName;
}

/**
 * Create editable element record
 */
export function createEditedElement(element, selector) {
    const computed = window.getComputedStyle(element);

    return {
        selector,
        tagName: element.tagName.toLowerCase(),
        originalStyles: {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            margin: computed.margin,
            padding: computed.padding,
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow
        },
        newStyles: {},
        timestamp: Date.now(),
        changeCount: 0
    };
}

/**
 * Find similar elements on the page
 */
export function findSimilarElements(element) {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;

    // Find by class
    if (className && typeof className === 'string') {
        const primaryClass = className.split(' ')[0];
        if (primaryClass) {
            return Array.from(document.getElementsByClassName(primaryClass));
        }
    }

    // Find by tag and similar position
    const parent = element.parentElement;
    if (parent) {
        return Array.from(parent.querySelectorAll(tagName));
    }

    return [element];
}

/**
 * Calculate diff between original and new styles
 */
export function calculateStyleDiff(originalStyles, newStyles) {
    const diff = {};

    Object.keys(newStyles).forEach(key => {
        if (originalStyles[key] !== newStyles[key]) {
            diff[key] = {
                from: originalStyles[key],
                to: newStyles[key]
            };
        }
    });

    return diff;
}

export default {
    generateSelector,
    createEditedElement,
    findSimilarElements,
    calculateStyleDiff
};
