import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

const FONT_FAMILIES = [
    { value: 'inherit', label: 'Default' },
    { value: '-apple-system, BlinkMacSystemFont, sans-serif', label: 'System' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' }
];

const FONT_WEIGHTS = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semibold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
];

const LETTER_SPACING = [
    { value: 'normal', label: 'Normal' },
    { value: '-0.05em', label: 'Tight' },
    { value: '0.05em', label: 'Wide' },
    { value: '0.1em', label: 'Wider' }
];

export function Typography() {
    const [isOpen, setIsOpen] = useState(true);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    const updateStyle = (property, value) => {
        setCurrentStyles({ [property]: value });

        // Apply to page
        sendMessage({
            type: 'APPLY_STYLES',
            styles: { [property]: property === 'fontSize' || property === 'lineHeight' ? `${value}px` : value }
        });
    };

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Type size={14} className="text-text-secondary" />
                    <h3>Typography</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    {/* Font Family */}
                    <div>
                        <label className="label">Typeface</label>
                        <select
                            value={currentStyles.fontFamily}
                            onChange={(e) => updateStyle('fontFamily', e.target.value)}
                            className="w-full"
                        >
                            {FONT_FAMILIES.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Weight and Size */}
                    <div className="form-grid">
                        <div>
                            <label className="label">Weight</label>
                            <select
                                value={currentStyles.fontWeight}
                                onChange={(e) => updateStyle('fontWeight', e.target.value)}
                                className="w-full"
                            >
                                {FONT_WEIGHTS.map(weight => (
                                    <option key={weight.value} value={weight.value}>{weight.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Size (px)</label>
                            <input
                                type="number"
                                value={currentStyles.fontSize}
                                onChange={(e) => updateStyle('fontSize', e.target.value)}
                                min="1"
                                max="200"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Line Height and Letter Spacing */}
                    <div className="form-grid">
                        <div>
                            <label className="label">Line Height (px)</label>
                            <input
                                type="number"
                                value={currentStyles.lineHeight}
                                onChange={(e) => updateStyle('lineHeight', e.target.value)}
                                min="1"
                                max="300"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="label">Letter Spacing</label>
                            <select
                                value={currentStyles.letterSpacing}
                                onChange={(e) => updateStyle('letterSpacing', e.target.value)}
                                className="w-full"
                            >
                                {LETTER_SPACING.map(spacing => (
                                    <option key={spacing.value} value={spacing.value}>{spacing.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                        <label className="label">Alignment</label>
                        <div className="flex gap-1">
                            {[
                                { value: 'left', icon: AlignLeft },
                                { value: 'center', icon: AlignCenter },
                                { value: 'right', icon: AlignRight },
                                { value: 'justify', icon: AlignJustify }
                            ].map(({ value, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => updateStyle('textAlign', value)}
                                    className={`flex-1 p-2 rounded-input transition-colors ${currentStyles.textAlign === value
                                        ? 'bg-primary text-white'
                                        : 'bg-surface hover:bg-surface-light text-text-secondary'
                                        }`}
                                >
                                    <Icon size={16} className="mx-auto" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Color */}
                    <ColorPicker
                        label="Color"
                        value={currentStyles.color}
                        onChange={(color) => updateStyle('color', color)}
                    />
                </div>
            )}
        </div>
    );
}

export default Typography;
