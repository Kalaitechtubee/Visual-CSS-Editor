import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, RotateCcw } from 'lucide-react';
import Slider from '../common/Slider';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

const BLEND_MODES = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

export function Appearance() {
    const [isOpen, setIsOpen] = useState(true);
    const [linkRadius, setLinkRadius] = useState(true);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    // Safe access to styles with defaults
    const opacity = currentStyles.opacity ?? 100;
    const rotation = currentStyles.rotation ?? 0;
    const blendMode = currentStyles.mixBlendMode || 'normal';
    const borderRadius = currentStyles.borderRadius || { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };

    const updateStyle = (property, value) => {
        setCurrentStyles({ [property]: value });

        let cssProperty = property;
        let cssValue = value;

        if (property === 'opacity') {
            cssValue = value / 100;
        } else if (property === 'rotation') {
            cssProperty = 'transform';
            cssValue = `rotate(${value}deg)`;
        }

        sendMessage({
            type: 'APPLY_STYLES',
            styles: { [cssProperty]: cssValue }
        });
    };

    const updateBorderRadius = (corner, value) => {
        const newRadius = { ...borderRadius, [corner]: value };

        if (linkRadius) {
            Object.keys(newRadius).forEach(key => {
                newRadius[key] = value;
            });
        }

        setCurrentStyles({ borderRadius: newRadius });

        const cssValue = `${newRadius.topLeft}px ${newRadius.topRight}px ${newRadius.bottomRight}px ${newRadius.bottomLeft}px`;
        sendMessage({
            type: 'APPLY_STYLES',
            styles: { borderRadius: cssValue }
        });
    };

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Eye size={14} className="text-text-secondary" />
                    <h3>Appearance</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    {/* Opacity */}
                    <Slider
                        label="Opacity"
                        value={opacity}
                        onChange={(value) => updateStyle('opacity', value)}
                        min={0}
                        max={100}
                        unit="%"
                    />

                    {/* Rotation */}
                    <div>
                        <label className="label">Rotation</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={rotation}
                                onChange={(e) => updateStyle('rotation', Number(e.target.value))}
                                min={-360}
                                max={360}
                                className="flex-1"
                            />
                            <span className="text-text-muted text-sm">deg</span>
                            <button
                                onClick={() => updateStyle('rotation', 0)}
                                className="p-2 rounded-input bg-surface hover:bg-surface-light"
                                title="Reset rotation"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label mb-0">Border Radius</label>
                            <button
                                onClick={() => setLinkRadius(!linkRadius)}
                                className={`text-xs px-2 py-1 rounded ${linkRadius ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
                                    }`}
                            >
                                {linkRadius ? 'Linked' : 'Unlinked'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-text-muted">Top Left</label>
                                <input
                                    type="number"
                                    value={borderRadius.topLeft}
                                    onChange={(e) => updateBorderRadius('topLeft', Number(e.target.value))}
                                    min={0}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted">Top Right</label>
                                <input
                                    type="number"
                                    value={borderRadius.topRight}
                                    onChange={(e) => updateBorderRadius('topRight', Number(e.target.value))}
                                    min={0}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted">Bottom Left</label>
                                <input
                                    type="number"
                                    value={borderRadius.bottomLeft}
                                    onChange={(e) => updateBorderRadius('bottomLeft', Number(e.target.value))}
                                    min={0}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted">Bottom Right</label>
                                <input
                                    type="number"
                                    value={borderRadius.bottomRight}
                                    onChange={(e) => updateBorderRadius('bottomRight', Number(e.target.value))}
                                    min={0}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Blend Mode */}
                    <div>
                        <label className="label">Blend Mode</label>
                        <select
                            value={blendMode}
                            onChange={(e) => updateStyle('mixBlendMode', e.target.value)}
                            className="w-full"
                        >
                            {BLEND_MODES.map(mode => (
                                <option key={mode} value={mode}>
                                    {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Appearance;

