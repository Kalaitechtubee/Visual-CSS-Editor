import React, { useState, useEffect } from 'react';
import { Key, Check, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';

export function ApiKeySettings() {
    const [activeTab, setActiveTab] = useState('groq'); // 'groq' | 'gemini'
    const [groqKey, setGroqKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [savedGroqKey, setSavedGroqKey] = useState('');
    const [savedGeminiKey, setSavedGeminiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // Load saved API keys on mount
    useEffect(() => {
        loadApiKeys();
    }, []);

    const loadApiKeys = async () => {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                const result = await chrome.storage.sync.get(['groqApiKey', 'geminiApiKey']);
                if (result.groqApiKey) {
                    setSavedGroqKey(result.groqApiKey);
                    setGroqKey(result.groqApiKey);
                }
                if (result.geminiApiKey) {
                    setSavedGeminiKey(result.geminiApiKey);
                    setGeminiKey(result.geminiApiKey);
                }
            } else {
                // Fallback for development
                const localGroq = localStorage.getItem('groqApiKey');
                const localGemini = localStorage.getItem('geminiApiKey');
                if (localGroq) {
                    setSavedGroqKey(localGroq);
                    setGroqKey(localGroq);
                }
                if (localGemini) {
                    setSavedGeminiKey(localGemini);
                    setGeminiKey(localGemini);
                }
            }
        } catch (error) {
            console.error('Failed to load API keys:', error);
        }
    };

    const handleSave = async () => {
        const isGroq = activeTab === 'groq';
        const apiKey = isGroq ? groqKey : geminiKey;
        const keyName = isGroq ? 'Groq' : 'Gemini';

        if (!apiKey.trim()) {
            setStatus({ type: 'error', message: `Please enter a ${keyName} API key` });
            return;
        }

        if (isGroq && !apiKey.startsWith('gsk_')) {
            setStatus({ type: 'error', message: 'Invalid Groq API key format (should start with gsk_)' });
            return;
        }
        // Gemini keys don't have a strict prefix check, usually AIza...

        setIsSaving(true);
        setStatus({ type: '', message: '' });

        try {
            const storageKey = isGroq ? 'groqApiKey' : 'geminiApiKey';

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.set({ [storageKey]: apiKey.trim() });
            } else {
                localStorage.setItem(storageKey, apiKey.trim());
            }

            if (isGroq) setSavedGroqKey(apiKey.trim());
            else setSavedGeminiKey(apiKey.trim());

            setStatus({ type: 'success', message: `${keyName} API key saved successfully!` });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error('Failed to save API key:', error);
            setStatus({ type: 'error', message: 'Failed to save API key' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = async () => {
        const isGroq = activeTab === 'groq';
        const keyName = isGroq ? 'Groq' : 'Gemini';

        try {
            const storageKey = isGroq ? 'groqApiKey' : 'geminiApiKey';

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                await chrome.storage.sync.remove([storageKey]);
            } else {
                localStorage.removeItem(storageKey);
            }

            if (isGroq) {
                setGroqKey('');
                setSavedGroqKey('');
            } else {
                setGeminiKey('');
                setSavedGeminiKey('');
            }

            setStatus({ type: 'success', message: `${keyName} API key removed` });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error('Failed to clear API key:', error);
            setStatus({ type: 'error', message: 'Failed to clear API key' });
        }
    };

    const isGroq = activeTab === 'groq';
    const currentKey = isGroq ? groqKey : geminiKey;
    const savedKey = isGroq ? savedGroqKey : savedGeminiKey;
    const hasKey = savedKey.length > 0;
    const keyChanged = currentKey !== savedKey;

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Key size={18} className="text-primary" />
                <div>
                    <h3 className="text-sm font-semibold">AI Provider Configuration</h3>
                    <p className="text-xs text-text-muted">Configure API keys for code generation</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-surface-light rounded-lg">
                <button
                    onClick={() => { setActiveTab('groq'); setStatus({ type: '', message: '' }); }}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'groq'
                            ? 'bg-surface shadow text-text-primary'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    Groq
                </button>
                <button
                    onClick={() => { setActiveTab('gemini'); setStatus({ type: '', message: '' }); }}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'gemini'
                            ? 'bg-surface shadow text-text-primary'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                >
                    Google Gemini
                </button>
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
                    {isGroq ? 'Groq' : 'Gemini'} API Key {hasKey && <span className="text-green-400 text-xs">(Configured)</span>}
                </label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={currentKey}
                        onChange={(e) => isGroq ? setGroqKey(e.target.value) : setGeminiKey(e.target.value)}
                        placeholder={isGroq ? "gsk_..." : "AIza..."}
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
                    Your API key is stored securely in your browser and never shared.
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
                            Save {isGroq ? 'Groq' : 'Gemini'} Key
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
                    {isGroq ? (
                        <>
                            <li>Visit <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.groq.com</a></li>
                            <li>Create a new API key</li>
                            <li>Free tier available with high limits</li>
                        </>
                    ) : (
                        <>
                            <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                            <li>Create a new API key</li>
                            <li>Free tier available</li>
                        </>
                    )}
                </ol>
            </div>

            {/* Security Note */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
                <div className="font-semibold mb-1">🔒 Security</div>
                <p>Your keys are stored locally in Chrome's secure storage. They are only used to communicate directly with the respective API provider.</p>
            </div>
        </div>
    );
}

export default ApiKeySettings;