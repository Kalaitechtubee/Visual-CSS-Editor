import React, { useState } from 'react';
import { X, Crown, Check, Zap, Sparkles, Code, Image, Layers } from 'lucide-react';
import Button from '../common/Button';
import useEditorStore from '../../stores/editorStore';

const FEATURES = [
    { icon: Layers, text: 'Apply changes to similar elements globally' },
    { icon: Sparkles, text: 'Save unlimited presets' },
    { icon: Image, text: 'Export screenshots (PNG)' },
    { icon: Code, text: 'View & copy full page CSS' },
    { icon: Zap, text: 'AI-powered code generation' },
    { icon: Code, text: 'Convert to React, Vue, Angular' }
];

export function ProUpgrade({ onClose }) {
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const { setIsPro } = useEditorStore();

    const handleUpgrade = () => {
        // In production, integrate with Stripe
        console.log('Upgrade to Pro:', selectedPlan);
        setIsPro(true);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-dark border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto fade-in">
                {/* Header */}
                <div className="relative p-6 text-center bg-gradient-to-br from-secondary/20 to-purple-600/20 border-b border-border">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded hover:bg-surface text-text-secondary"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center">
                        <Crown size={32} className="text-white" />
                    </div>

                    <h2 className="text-xl font-bold mb-2">Upgrade to Pro</h2>
                    <p className="text-text-secondary text-sm">
                        Unlock all features and supercharge your workflow
                    </p>
                </div>

                {/* Features */}
                <div className="p-6 space-y-4 border-b border-border">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                        Pro Features
                    </h3>
                    <ul className="space-y-3">
                        {FEATURES.map((feature, index) => (
                            <li key={index} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                    <feature.icon size={16} className="text-secondary" />
                                </div>
                                <span className="text-sm">{feature.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Pricing */}
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setSelectedPlan('monthly')}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${selectedPlan === 'monthly'
                                    ? 'border-secondary bg-secondary/10'
                                    : 'border-border hover:border-border-light'
                                }`}
                        >
                            <div className="text-sm text-text-secondary mb-1">Monthly</div>
                            <div className="text-2xl font-bold">$4.99</div>
                            <div className="text-xs text-text-muted">/month</div>
                        </button>

                        <button
                            onClick={() => setSelectedPlan('yearly')}
                            className={`p-4 rounded-xl border-2 transition-all text-left relative ${selectedPlan === 'yearly'
                                    ? 'border-secondary bg-secondary/10'
                                    : 'border-border hover:border-border-light'
                                }`}
                        >
                            <div className="absolute -top-2 right-2 px-2 py-0.5 bg-success text-white text-xs font-medium rounded">
                                Save 50%
                            </div>
                            <div className="text-sm text-text-secondary mb-1">Yearly</div>
                            <div className="text-2xl font-bold">$29.99</div>
                            <div className="text-xs text-text-muted">/year</div>
                        </button>
                    </div>

                    <Button
                        fullWidth
                        variant="pro"
                        size="lg"
                        onClick={handleUpgrade}
                    >
                        <Crown size={18} />
                        Upgrade Now
                    </Button>

                    <p className="text-xs text-center text-text-muted">
                        7-day free trial • Cancel anytime
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ProUpgrade;
