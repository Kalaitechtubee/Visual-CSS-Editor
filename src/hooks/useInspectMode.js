import { useCallback, useEffect } from 'react';
import useEditorStore from '../stores/editorStore';

export function useInspectMode() {
    const { isInspectMode, setInspectMode, setSelectedElement, setCurrentStyles } = useEditorStore();

    const toggleInspectMode = useCallback(() => {
        chrome.runtime.sendMessage({ type: 'TOGGLE_INSPECT_MODE' }, (response) => {
            if (response?.success) {
                setInspectMode(response.isInspectMode);
            }
        });
    }, [setInspectMode]);

    const enableInspectMode = useCallback(() => {
        chrome.runtime.sendMessage({ type: 'ENABLE_INSPECT_MODE' }, (response) => {
            if (response?.success) {
                setInspectMode(true);
            }
        });
    }, [setInspectMode]);

    const disableInspectMode = useCallback(() => {
        chrome.runtime.sendMessage({ type: 'DISABLE_INSPECT_MODE' }, (response) => {
            if (response?.success) {
                setInspectMode(false);
            }
        });
    }, [setInspectMode]);

    // Listen for keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Alt + Shift + I
            if (e.altKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                toggleInspectMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleInspectMode]);

    // Listen for element selection from content script
    useEffect(() => {
        const handleMessage = (message) => {
            if (message.type === 'ELEMENT_SELECTED') {
                setSelectedElement(message.data.selector, message.data.path);

                // Parse and set styles
                if (message.data.styles) {
                    const styles = message.data.styles;
                    setCurrentStyles({
                        fontFamily: styles.fontFamily || '',
                        fontSize: String(styles.fontSize || 16),
                        fontWeight: String(styles.fontWeight || 400),
                        lineHeight: String(styles.lineHeight || 24),
                        letterSpacing: styles.letterSpacing || 'normal',
                        textAlign: styles.textAlign || 'left',
                        color: styles.color || '#000000',
                        backgroundColor: styles.backgroundColor || '#ffffff',
                        opacity: styles.opacity || 100,
                        margin: {
                            top: styles.marginTop || 0,
                            right: styles.marginRight || 0,
                            bottom: styles.marginBottom || 0,
                            left: styles.marginLeft || 0
                        },
                        padding: {
                            top: styles.paddingTop || 0,
                            right: styles.paddingRight || 0,
                            bottom: styles.paddingBottom || 0,
                            left: styles.paddingLeft || 0
                        },
                        display: styles.display || 'block'
                    });
                }
            } else if (message.type === 'INSPECT_MODE_DISABLED') {
                setInspectMode(false);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [setSelectedElement, setCurrentStyles, setInspectMode]);

    return {
        isInspectMode,
        toggleInspectMode,
        enableInspectMode,
        disableInspectMode
    };
}

export default useInspectMode;
