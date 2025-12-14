import React, { useState, useEffect } from 'react';
import { Key, Check, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

export function ApiKeySettings() {
    const [apiKey, setApiKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Load saved API key on mount
    useEffect(() => {
        loadApiKey();
    }, []);

    const loadApiKey = async () => {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get(['groqApiKey']);
                if (result.groqApiKey) {
                    setSavedKey(result.groqApiKey);
                    setApiKey(result.groqApiKey);
                }
            } else {
                // Fallback for development
                const localKey = localStorage.getItem('groqApiKey');
                if (localKey) {
                    setSavedKey(localKey);
                    setApiKey(localKey);
                }
            }
        } catch (error) {
            console.error('Failed to load API key:', error);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setStatus({ type: 'error', message: 'Please enter an API key' });
            return;
        }

        if (!apiKey.startsWith('gsk_')) {
            setStatus({ type: 'error', message: 'Invalid Groq API key format (should start with gsk_)' });
            return;
        }

        setIsSaving(true);
        setStatus({ type: '', message: '' });

        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ groqApiKey: apiKey.trim() });
            } else {
                localStorage.setItem('groqApiKey', apiKey.trim());
            }

            setSavedKey(apiKey.trim());
            setStatus({ type: 'success', message: 'API key saved successfully!' });

            // Clear success message after 3 seconds
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error('Failed to save API key:', error);
            setStatus({ type: 'error', message: 'Failed to save API key' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.remove(['groqApiKey']);
            } else {
                localStorage.removeItem('groqApiKey');
            }

            setApiKey('');
            setSavedKey('');
            setStatus({ type: 'success', message: 'API key removed' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error('Failed to clear API key:', error);
            setStatus({ type: 'error', message: 'Failed to clear API key' });
        }
    };

    const hasKey = savedKey.length > 0;
    const keyChanged = apiKey !== savedKey;

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Key size={18} className="text-primary" />
                <div>
                    <h3 className="text-sm font-semibold">Groq API Configuration</h3>
                    <p className="text-xs text-text-muted">Required for AI code generation</p>
                </div>
            </div>

            {/* Status Messages */}
            {status.message && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${status.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                    {status.type === 'success' ? (
                        <Check size={16} className="flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    )}
                    <span>{status.message}</span>
                </div>
            )}

            {/* API Key Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium">
                    API Key {hasKey && <span className="text-green-400 text-xs">(Configured)</span>}
                </label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full px-3 py-2 pr-10 bg-surface border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-light rounded"
                        title={showKey ? 'Hide' : 'Show'}
                    >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <p className="text-xs text-text-muted">
                    Your API key is stored securely in your browser and never shared
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving || !keyChanged}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    {isSaving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check size={16} />
                            Save API Key
                        </>
                    )}
                </button>
                {hasKey && (
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-surface hover:bg-surface-light border border-border rounded-lg text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Instructions */}
            <div className="p-3 bg-surface rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-text-primary mb-2">How to get your API key:</div>
                <ol className="space-y-2 text-text-muted list-decimal list-inside">
                    <li>
                        Visit{' '}
                        <a
                            href="https://console.groq.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                            console.groq.com
                            <ExternalLink size={12} />
                        </a>
                    </li>
                    <li>Sign up or log in to your account</li>
                    <li>Navigate to API Keys section</li>
                    <li>Create a new API key</li>
                    <li>Copy and paste it above</li>
                </ol>
                <div className="pt-2 border-t border-border text-text-muted">
                    <strong>Note:</strong> Groq offers free API access with generous rate limits, perfect for this extension.
                </div>
            </div>

            {/* Security Note */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
                <div className="font-semibold mb-1">🔒 Security</div>
                <p>Your API key is stored locally in your browser using Chrome's secure storage. It's never sent to any third party except Groq's API for code generation.</p>
            </div>
        </div>
    );
}

export default ApiKeySettings;