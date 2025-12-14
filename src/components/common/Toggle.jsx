import React from 'react';

export function Toggle({ checked, onChange, label, description }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-fast ${checked ? 'bg-primary' : 'bg-border'
                    }`}
            >
                <span
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-fast ${checked ? 'translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}
                />
            </button>
            {(label || description) && (
                <div className="flex flex-col">
                    {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
                    {description && <span className="text-xs text-text-secondary">{description}</span>}
                </div>
            )}
        </label>
    );
}

export default Toggle;
