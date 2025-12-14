import { useCallback } from 'react';
import useEditorStore from '../stores/editorStore';

export function useElementStyles() {
    const { currentStyles, setCurrentStyles, addEditedElement, updateEditedElement, selectedSelector, applyToSimilar } = useEditorStore();

    const applyStyle = useCallback((property, value) => {
        // Update local state
        setCurrentStyles({ [property]: value });

        // Convert to CSS format
        let cssProperty = property;
        let cssValue = value;

        // Handle special cases
        switch (property) {
            case 'fontSize':
            case 'lineHeight':
                cssValue = `${value}px`;
                break;
            case 'opacity':
                cssValue = value / 100;
                break;
            case 'rotation':
                cssProperty = 'transform';
                cssValue = `rotate(${value}deg)`;
                break;
            case 'backgroundBlur':
                cssProperty = 'backdropFilter';
                cssValue = `blur(${value}px)`;
                break;
        }

        // Send to content script
        chrome.runtime.sendMessage({
            type: 'APPLY_STYLES',
            styles: { [cssProperty]: cssValue },
            applyToSimilar // Pass the flag
        });

        // Track the change
        if (selectedSelector) {
            updateEditedElement(selectedSelector, { [cssProperty]: cssValue });
        }
    }, [setCurrentStyles, updateEditedElement, selectedSelector, applyToSimilar]);

    const applyMultipleStyles = useCallback((styles) => {
        setCurrentStyles(styles);

        const cssStyles = {};
        Object.entries(styles).forEach(([property, value]) => {
            let cssProperty = property;
            let cssValue = value;

            switch (property) {
                case 'fontSize':
                case 'lineHeight':
                    cssValue = `${value}px`;
                    break;
                case 'opacity':
                    cssValue = value / 100;
                    break;
                case 'rotation':
                    cssProperty = 'transform';
                    cssValue = `rotate(${value}deg)`;
                    break;
            }

            cssStyles[cssProperty] = cssValue;
        });

        chrome.runtime.sendMessage({
            type: 'APPLY_STYLES',
            styles: cssStyles,
            applyToSimilar
        });

        if (selectedSelector) {
            updateEditedElement(selectedSelector, cssStyles);
        }
    }, [setCurrentStyles, updateEditedElement, selectedSelector, applyToSimilar]);

    const resetStyles = useCallback(() => {
        chrome.runtime.sendMessage({
            type: 'RESET_ELEMENT_STYLES'
        });
    }, []);

    const getComputedStyles = useCallback(async () => {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { type: 'GET_ELEMENT_STYLES' },
                (response) => {
                    if (response?.success) {
                        resolve(response.styles);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }, []);

    return {
        currentStyles,
        applyStyle,
        applyMultipleStyles,
        resetStyles,
        getComputedStyles
    };
}

export default useElementStyles;
