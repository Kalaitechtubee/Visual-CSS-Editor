import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Palette } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import Slider from '../common/Slider';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

export function Background() {
    const [isOpen, setIsOpen] = useState(true);
    const { currentStyles, setCurrentStyles } = useEditorStore();

    const updateStyle = (property, value) => {
        setCurrentStyles({ [property]: value });

        let cssValue = value;
        if (property === 'backgroundBlur') {
            cssValue = `blur(${value}px)`;
            sendMessage({
                type: 'APPLY_STYLES',
                styles: { backdropFilter: cssValue, WebkitBackdropFilter: cssValue }
            });
            return;
        }

        sendMessage({
            type: 'APPLY_STYLES',
            styles: { [property]: cssValue }
        });
    };

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Palette size={14} className="text-text-secondary" />
                    <h3>Background</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    {/* Background Color */}
                    <ColorPicker
                        label="Background Color"
                        value={currentStyles.backgroundColor}
                        onChange={(color) => updateStyle('backgroundColor', color)}
                    />

                    {/* Background Opacity */}
                    <Slider
                        label="Opacity"
                        value={currentStyles.backgroundOpacity}
                        onChange={(value) => updateStyle('backgroundOpacity', value)}
                        min={0}
                        max={100}
                        unit="%"
                    />

                    {/* Background Blur */}
                    <Slider
                        label="Blur"
                        value={currentStyles.backgroundBlur}
                        onChange={(value) => updateStyle('backgroundBlur', value)}
                        min={0}
                        max={50}
                        unit="px"
                    />
                </div>
            )}
        </div>
    );
}

export default Background;
