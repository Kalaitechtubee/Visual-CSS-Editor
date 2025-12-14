import React from 'react';
import { Trash2, MousePointer, RefreshCw, Copy } from 'lucide-react';
import Button from '../common/Button';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

export function ChangesList() {
    const { editedElements, removeEditedElement, clearAllEdits } = useEditorStore();

    const handleCopyCSS = (element) => {
        const cssLines = Object.entries(element.newStyles)
            .map(([prop, value]) => `  ${prop}: ${value};`)
            .join('\n');

        const css = `${element.selector} {\n${cssLines}\n}`;
        navigator.clipboard.writeText(css);
    };

    const handleJumpToElement = (selector) => {
        sendMessage({
            type: 'JUMP_TO_ELEMENT',
            selector
        });
    };

    if (editedElements.length === 0) {
        return (
            <div className="p-6 text-center">
                <MousePointer size={32} className="mx-auto mb-3 text-text-muted" />
                <p className="text-sm text-text-secondary">No changes yet</p>
                <p className="text-xs text-text-muted mt-1">
                    Select an element and start editing
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                    Changes ({editedElements.length})
                </h3>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllEdits}
                    icon={RefreshCw}
                >
                    Reset All
                </Button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
                {editedElements.map((element, index) => (
                    <div
                        key={index}
                        className="p-3 bg-surface rounded-lg group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <button
                                onClick={() => handleJumpToElement(element.selector)}
                                className="text-sm font-mono text-primary hover:underline text-left break-all"
                            >
                                {element.selector}
                            </button>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleCopyCSS(element)}
                                    className="p-1 rounded hover:bg-surface-light text-text-secondary"
                                    title="Copy CSS"
                                >
                                    <Copy size={12} />
                                </button>
                                <button
                                    onClick={() => removeEditedElement(element.selector)}
                                    className="p-1 rounded hover:bg-danger/20 text-danger"
                                    title="Remove changes"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-text-muted">
                            {Object.keys(element.newStyles || {}).length} properties changed
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChangesList;

