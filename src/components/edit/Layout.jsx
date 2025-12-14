import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

const DISPLAY_OPTIONS = [
    { value: 'block', label: 'Block' },
    { value: 'inline', label: 'Inline' },
    { value: 'inline-block', label: 'Inline Block' },
    { value: 'flex', label: 'Flex' },
    { value: 'inline-flex', label: 'Inline Flex' },
    { value: 'grid', label: 'Grid' },
    { value: 'none', label: 'None' }
];

const JUSTIFY_OPTIONS = [
    { value: 'flex-start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'End' },
    { value: 'space-between', label: 'Space Between' },
    { value: 'space-around', label: 'Space Around' },
    { value: 'space-evenly', label: 'Space Evenly' }
];

const ALIGN_OPTIONS = [
    { value: 'flex-start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'flex-end', label: 'End' },
    { value: 'stretch', label: 'Stretch' },
    { value: 'baseline', label: 'Baseline' }
];

export function Layout() {
    const [isOpen, setIsOpen] = useState(true);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    const isFlexOrGrid = ['flex', 'inline-flex', 'grid'].includes(currentStyles.display);

    const updateStyle = (property, value) => {
        setCurrentStyles({ [property]: value });

        sendMessage({
            type: 'APPLY_STYLES',
            styles: { [property]: property === 'gap' ? `${value}px` : value }
        });
    };

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <LayoutGrid size={14} className="text-text-secondary" />
                    <h3>Layout</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    {/* Display */}
                    <div>
                        <label className="label">Display</label>
                        <select
                            value={currentStyles.display}
                            onChange={(e) => updateStyle('display', e.target.value)}
                            className="w-full"
                        >
                            {DISPLAY_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Flex/Grid Controls */}
                    {isFlexOrGrid && (
                        <>
                            <div className="form-grid">
                                <div>
                                    <label className="label">Horizontal Align</label>
                                    <select
                                        value={currentStyles.justifyContent}
                                        onChange={(e) => updateStyle('justifyContent', e.target.value)}
                                        className="w-full"
                                    >
                                        {JUSTIFY_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Vertical Align</label>
                                    <select
                                        value={currentStyles.alignItems}
                                        onChange={(e) => updateStyle('alignItems', e.target.value)}
                                        className="w-full"
                                    >
                                        {ALIGN_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Gap</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={currentStyles.gap}
                                        onChange={(e) => updateStyle('gap', Number(e.target.value))}
                                        min={0}
                                        className="flex-1"
                                    />
                                    <span className="text-text-muted text-sm">px</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default Layout;

