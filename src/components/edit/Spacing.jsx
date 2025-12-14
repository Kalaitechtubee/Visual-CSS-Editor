import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Move, Link, Unlink } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

export function Spacing() {
    const [isOpen, setIsOpen] = useState(true);
    const [linkMargin, setLinkMargin] = useState(false);
    const [linkPadding, setLinkPadding] = useState(false);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    // Safe access with defaults
    const margin = currentStyles.margin || { top: 0, right: 0, bottom: 0, left: 0 };
    const padding = currentStyles.padding || { top: 0, right: 0, bottom: 0, left: 0 };

    const updateMargin = (side, value) => {
        const newMargin = { ...margin, [side]: value };

        if (linkMargin) {
            Object.keys(newMargin).forEach(key => {
                newMargin[key] = value;
            });
        }

        setCurrentStyles({ margin: newMargin });

        sendMessage({
            type: 'APPLY_STYLES',
            styles: {
                marginTop: `${newMargin.top}px`,
                marginRight: `${newMargin.right}px`,
                marginBottom: `${newMargin.bottom}px`,
                marginLeft: `${newMargin.left}px`
            }
        });
    };

    const updatePadding = (side, value) => {
        const newPadding = { ...padding, [side]: value };

        if (linkPadding) {
            Object.keys(newPadding).forEach(key => {
                newPadding[key] = value;
            });
        }

        setCurrentStyles({ padding: newPadding });

        sendMessage({
            type: 'APPLY_STYLES',
            styles: {
                paddingTop: `${newPadding.top}px`,
                paddingRight: `${newPadding.right}px`,
                paddingBottom: `${newPadding.bottom}px`,
                paddingLeft: `${newPadding.left}px`
            }
        });
    };

    const SpacingInput = ({ value, onChange, label }) => (
        <div className="text-center">
            <label className="text-xs text-text-muted block mb-1">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={0}
                className="w-14 text-center"
            />
        </div>
    );

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Move size={14} className="text-text-secondary" />
                    <h3>Spacing</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-6 fade-in">
                    {/* Margin */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="label mb-0">Margin</label>
                            <button
                                onClick={() => setLinkMargin(!linkMargin)}
                                className={`p-1.5 rounded ${linkMargin ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
                                title={linkMargin ? 'Unlink values' : 'Link values'}
                            >
                                {linkMargin ? <Link size={12} /> : <Unlink size={12} />}
                            </button>
                        </div>
                        <div className="relative p-4 border-2 border-dashed border-warning/50 rounded-lg bg-warning/5">
                            <div className="flex flex-col items-center gap-2">
                                <SpacingInput
                                    value={margin.top}
                                    onChange={(v) => updateMargin('top', v)}
                                    label="Top"
                                />
                                <div className="flex items-center justify-between w-full">
                                    <SpacingInput
                                        value={margin.left}
                                        onChange={(v) => updateMargin('left', v)}
                                        label="Left"
                                    />
                                    <div className="w-16 h-10 bg-surface-dark rounded flex items-center justify-center text-xs text-text-muted">
                                        Element
                                    </div>
                                    <SpacingInput
                                        value={margin.right}
                                        onChange={(v) => updateMargin('right', v)}
                                        label="Right"
                                    />
                                </div>
                                <SpacingInput
                                    value={margin.bottom}
                                    onChange={(v) => updateMargin('bottom', v)}
                                    label="Bottom"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Padding */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="label mb-0">Padding</label>
                            <button
                                onClick={() => setLinkPadding(!linkPadding)}
                                className={`p-1.5 rounded ${linkPadding ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
                                title={linkPadding ? 'Unlink values' : 'Link values'}
                            >
                                {linkPadding ? <Link size={12} /> : <Unlink size={12} />}
                            </button>
                        </div>
                        <div className="relative p-4 border-2 border-dashed border-success/50 rounded-lg bg-success/5">
                            <div className="flex flex-col items-center gap-2">
                                <SpacingInput
                                    value={padding.top}
                                    onChange={(v) => updatePadding('top', v)}
                                    label="Top"
                                />
                                <div className="flex items-center justify-between w-full">
                                    <SpacingInput
                                        value={padding.left}
                                        onChange={(v) => updatePadding('left', v)}
                                        label="Left"
                                    />
                                    <div className="w-16 h-10 bg-surface-dark rounded flex items-center justify-center text-xs text-text-muted">
                                        Content
                                    </div>
                                    <SpacingInput
                                        value={padding.right}
                                        onChange={(v) => updatePadding('right', v)}
                                        label="Right"
                                    />
                                </div>
                                <SpacingInput
                                    value={padding.bottom}
                                    onChange={(v) => updatePadding('bottom', v)}
                                    label="Bottom"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Spacing;

