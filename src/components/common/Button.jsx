import React from 'react';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    onClick,
    className = '',
    icon: Icon
}) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-input transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary hover:bg-primary-hover text-white focus:ring-primary',
        secondary: 'bg-surface-light hover:bg-surface border border-border text-text-primary focus:ring-surface-light',
        ghost: 'bg-transparent hover:bg-surface text-text-secondary hover:text-text-primary focus:ring-surface',
        danger: 'bg-danger hover:bg-danger-hover text-white focus:ring-danger',
        pro: 'bg-gradient-to-r from-secondary to-purple-500 hover:from-secondary-hover hover:to-purple-600 text-white focus:ring-secondary'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
}

export default Button;
