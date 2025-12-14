import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Layers } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import Toggle from '../common/Toggle';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

export function BoxShadow() {
    const [isOpen, setIsOpen] = useState(true);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    // Safe access
    const boxShadows = currentStyles.boxShadows || [];

    const addShadow = () => {
        const newShadow = {
            id: Date.now(),
            x: 0,
            y: 4,
            blur: 8,
            spread: 0,
            color: 'rgba(0, 0, 0, 0.25)',
            inset: false
        };

        const newShadows = [...boxShadows, newShadow];
        setCurrentStyles({ boxShadows: newShadows });
        applyShadows(newShadows);
    };

    const updateShadow = (id, property, value) => {
        const newShadows = boxShadows.map(shadow =>
            shadow.id === id ? { ...shadow, [property]: value } : shadow
        );
        setCurrentStyles({ boxShadows: newShadows });
        applyShadows(newShadows);
    };

    const deleteShadow = (id) => {
        const newShadows = boxShadows.filter(shadow => shadow.id !== id);
        setCurrentStyles({ boxShadows: newShadows });
        applyShadows(newShadows);
    };

    const applyShadows = (shadows) => {
        const cssValue = shadows.length === 0 ? 'none' : shadows.map(s =>
            `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`
        ).join(', ');

        sendMessage({
            type: 'APPLY_STYLES',
            styles: { boxShadow: cssValue }
        });
    };

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-text-secondary" />
                    <h3>Box Shadow</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    <button
                        onClick={addShadow}
                        className="btn btn-secondary w-full"
                    >
                        <Plus size={14} />
                        Add Shadow
                    </button>

                    {boxShadows.length === 0 && (
                        <div className="text-center py-4 text-text-muted text-sm">
                            No shadows added yet
                        </div>
                    )}

                    {boxShadows.map((shadow, index) => (
                        <div key={shadow.id} className="p-3 bg-surface rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-text-secondary">Shadow {index + 1}</span>
                                <button
                                    onClick={() => deleteShadow(shadow.id)}
                                    className="p-1 rounded hover:bg-danger/20 text-danger"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-text-muted">X Offset</label>
                                    <input
                                        type="number"
                                        value={shadow.x}
                                        onChange={(e) => updateShadow(shadow.id, 'x', Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted">Y Offset</label>
                                    <input
                                        type="number"
                                        value={shadow.y}
                                        onChange={(e) => updateShadow(shadow.id, 'y', Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted">Blur</label>
                                    <input
                                        type="number"
                                        value={shadow.blur}
                                        onChange={(e) => updateShadow(shadow.id, 'blur', Number(e.target.value))}
                                        min={0}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted">Spread</label>
                                    <input
                                        type="number"
                                        value={shadow.spread}
                                        onChange={(e) => updateShadow(shadow.id, 'spread', Number(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <ColorPicker
                                label="Color"
                                value={shadow.color}
                                onChange={(color) => updateShadow(shadow.id, 'color', color)}
                            />

                            <Toggle
                                checked={shadow.inset}
                                onChange={(checked) => updateShadow(shadow.id, 'inset', checked)}
                                label="Inset"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default BoxShadow;

