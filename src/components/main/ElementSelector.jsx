import React from 'react';
import { MousePointer, Crosshair } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

export function ElementSelector() {
    const { selectedSelector, isInspectMode, toggleInspectMode, setInspectMode } = useEditorStore();

    const handleToggleInspect = async () => {
        // Check if we're in Chrome extension context
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            try {
                // Get active tab and send message to content script via background
                chrome.runtime.sendMessage({ type: 'TOGGLE_INSPECT_MODE' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('VCE Panel: Could not send message', chrome.runtime.lastError.message);
                        // Still toggle local state for UI feedback
                        toggleInspectMode();
                        return;
                    }
                    if (response?.success) {
                        setInspectMode(response.isInspectMode);
                        console.log('VCE Panel: Inspect mode toggled', response.isInspectMode);
                    }
                });
            } catch (error) {
                console.error('VCE Panel: Error toggling inspect mode', error);
                toggleInspectMode();
            }
        } else {
            // Dev mode - just toggle local state
            toggleInspectMode();
        }
    };

    return (
        <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Selected Element</h2>
                <button
                    onClick={handleToggleInspect}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isInspectMode
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-surface-light text-text-secondary'
                        }`}
                >
                    {isInspectMode ? <Crosshair size={14} /> : <MousePointer size={14} />}
                    {isInspectMode ? 'Inspecting...' : 'Inspect'}
                </button>
            </div>

            {selectedSelector ? (
                <div className="p-3 bg-surface rounded-lg">
                    <code className="text-sm text-primary font-mono break-all">
                        {selectedSelector}
                    </code>
                </div>
            ) : (
                <div className="p-4 bg-surface rounded-lg text-center">
                    <MousePointer size={24} className="mx-auto mb-2 text-text-muted" />
                    <p className="text-sm text-text-secondary">
                        Click "Inspect" and select an element on the page
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        or press <kbd className="px-1.5 py-0.5 bg-surface-dark rounded text-xs">Alt + Shift + I</kbd>
                    </p>
                </div>
            )}
        </div>
    );
}

export default ElementSelector;
