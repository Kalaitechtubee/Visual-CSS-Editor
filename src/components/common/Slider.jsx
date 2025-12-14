import React from 'react';

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, unit = '' }) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                {label && <label className="label">{label}</label>}
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        min={min}
                        max={max}
                        step={step}
                        className="w-14 px-2 py-1 text-xs text-right rounded bg-surface border border-border"
                    />
                    {unit && <span className="text-xs text-text-muted w-6">{unit}</span>}
                </div>
            </div>
            <input
                type="range"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full"
            />
        </div>
    );
}

export default Slider;
