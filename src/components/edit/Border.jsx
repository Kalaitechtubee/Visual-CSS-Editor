import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Square, Link, Unlink } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge'];

export function Border() {
    const [isOpen, setIsOpen] = useState(true);
    const [linkBorder, setLinkBorder] = useState(true);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    // Default values for sides
    const defaultSides = { top: 0, right: 0, bottom: 0, left: 0 };
    const defaultStyles = { top: 'none', right: 'none', bottom: 'none', left: 'none' };
    const defaultColors = { top: 'transparent', right: 'transparent', bottom: 'transparent', left: 'transparent' };

    // Safe access
    const borderWidth = currentStyles.borderWidth || defaultSides;
    const borderStyle = currentStyles.borderStyle || defaultStyles;
    const borderColor = currentStyles.borderColor || defaultColors;

    const updateBorder = (side, property, value) => {
        const propertyKey = `border${property.charAt(0).toUpperCase() + property.slice(1)}`;

        // Get current values from safe variables
        let currentValues;
        if (property === 'width') currentValues = borderWidth;
        else if (property === 'style') currentValues = borderStyle;
        else currentValues = borderColor;

        const newValue = { ...currentValues, [side]: value };

        if (linkBorder) {
            Object.keys(newValue).forEach(key => {
                newValue[key] = value;
            });
        }

        setCurrentStyles({ [propertyKey]: newValue });

        const styles = {};
        ['top', 'right', 'bottom', 'left'].forEach(s => {
            const cssProperty = `border${s.charAt(0).toUpperCase() + s.slice(1)}${property.charAt(0).toUpperCase() + property.slice(1)}`;
            if (property === 'width') {
                styles[cssProperty] = `${newValue[s]}px`;
            } else {
                styles[cssProperty] = newValue[s];
            }
        });

        sendMessage({
            type: 'APPLY_STYLES',
            styles
        });
    };

    const BorderSide = ({ side, label }) => (
        <div className="p-3 bg-surface rounded-lg space-y-3">
            <div className="text-xs font-medium text-text-secondary uppercase">{label}</div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-xs text-text-muted">Width</label>
                    <input
                        type="number"
                        value={borderWidth[side]}
                        onChange={(e) => updateBorder(side, 'width', Number(e.target.value))}
                        min={0}
                        max={20}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="text-xs text-text-muted">Style</label>
                    <select
                        value={borderStyle[side]}
                        onChange={(e) => updateBorder(side, 'style', e.target.value)}
                        className="w-full"
                    >
                        {BORDER_STYLES.map(style => (
                            <option key={style} value={style}>
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <ColorPicker
                label="Color"
                value={borderColor[side]}
                onChange={(color) => updateBorder(side, 'color', color)}
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
                    <Square size={14} className="text-text-secondary" />
                    <h3>Border</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Edit all sides together</span>
                        <button
                            onClick={() => setLinkBorder(!linkBorder)}
                            className={`p-1.5 rounded flex items-center gap-1.5 text-xs ${linkBorder ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
                                }`}
                        >
                            {linkBorder ? <Link size={12} /> : <Unlink size={12} />}
                            {linkBorder ? 'Linked' : 'Unlinked'}
                        </button>
                    </div>

                    {linkBorder ? (
                        <BorderSide side="top" label="All Sides" />
                    ) : (
                        <div className="space-y-3">
                            <BorderSide side="top" label="Top" />
                            <BorderSide side="right" label="Right" />
                            <BorderSide side="bottom" label="Bottom" />
                            <BorderSide side="left" label="Left" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Border;

