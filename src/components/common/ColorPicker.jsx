import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

const PRESET_COLORS = [
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#000000',
    '#FFFFFF', '#8E8E93', '#636366', '#48484A', '#3A3A3C'
];

export function ColorPicker({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '#000000');
    const containerRef = useRef(null);

    useEffect(() => {
        setInputValue(value || '#000000');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
            onChange(newValue);
        }
    };

    const handleColorChange = (color) => {
        onChange(color);
        setInputValue(color);
    };

    const handlePresetClick = (color) => {
        onChange(color);
        setInputValue(color);
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="label">{label}</label>
            )}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-10 h-10 rounded-input border-2 border-border shadow-sm hover:shadow-md transition-shadow duration-fast overflow-hidden"
                    style={{ backgroundColor: value || '#000000' }}
                />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={() => setInputValue(value || '#000000')}
                    className="flex-1 px-3 py-2 text-sm rounded-input bg-surface border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="#000000"
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 p-3 bg-surface-dark rounded-card shadow-dropdown border border-border fade-in">
                    <HexColorPicker color={value || '#000000'} onChange={handleColorChange} />
                    <div className="grid grid-cols-5 gap-1.5 mt-3">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => handlePresetClick(color)}
                                className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${value === color ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ColorPicker;
