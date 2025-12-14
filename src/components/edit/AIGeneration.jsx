// AIGeneration.jsx
import React, { useState, useEffect } from 'react';
import {
    Sparkles, Code2, FileCode, Loader2, Check, Copy,
    Download, X, AlertCircle, ChevronDown, ChevronUp, Zap, Settings
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import {
    generateReactTailwind,
    generateHtmlCssJs
} from '../../utils/groq-service';
import {
    generateReactGemini,
    generateHtmlGemini,
    GEMINI_MODELS
} from '../../utils/gemini-service';

export function AIGeneration() {
    const [isOpen, setIsOpen] = useState(true);
    const {
        selectedSelector,
        currentStyles,
        selectedHtml,
        selectedAssets,
        selectedDomStructure,
        preferences,
        updatePreferences
    } = useEditorStore();
    // Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState('idle');
    const [generatedCode, setGeneratedCode] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [generationType, setGenerationType] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    // AI Configuration
    const aiProvider = preferences?.aiProvider || 'groq';
    const geminiModel = preferences?.geminiModel || 'gemini-2.0-flash';
    const setAiProvider = (provider) => {
        updatePreferences({ aiProvider: provider });
    };
    const setGeminiModel = (model) => {
        updatePreferences({ geminiModel: model });
    };
    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);
    // Reset when selection changes
    useEffect(() => {
        setGeneratedCode('');
        setError('');
        setGenerationStep('idle');
    }, [selectedSelector]);
    // Validate before generation
    const validateGeneration = () => {
        if (!selectedSelector) {
            setError('Please select an element first using Inspect mode');
            return false;
        }
        if (!currentStyles || Object.keys(currentStyles).length === 0) {
            setError('No styles found for selected element');
            return false;
        }
        return true;
    };
    // Perform generation with proper error handling
    const performGeneration = async (type, groqFn, geminiFn, args) => {
        if (!validateGeneration()) return;
        setIsGenerating(true);
        setError('');
        console.log(`Starting ${type} generation with ${aiProvider}...`);
        setGenerationType(type);
        setGenerationStep('analyzing');
        try {
            setGenerationStep('generating');
            let result = '';
            if (aiProvider === 'gemini') {
                result = await geminiFn(...args, geminiModel);
            } else {
                result = await groqFn(...args);
            }
            if (!result || result.length < 50) {
                throw new Error('Generated code is too short or empty');
            }
            setGeneratedCode(result);
            setGenerationStep('complete');
            setShowCodeModal(true);
        } catch (err) {
            console.error('Generation failed:', err);
            setGenerationStep('error');
            let errorMsg = `Generation Failed (${aiProvider === 'groq' ? 'Groq' : 'Gemini'}): `;
            const isQuotaError = err.message.includes('429') ||
                err.message.toLowerCase().includes('quota') ||
                err.message.toLowerCase().includes('rate limit');
            if (isQuotaError) {
                errorMsg = `${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} free quota exhausted. Please try again in 5-10 seconds.`;
            } else if (err.message.includes('API key') || err.message.includes('401')) {
                errorMsg = `Invalid ${aiProvider === 'groq' ? 'Groq' : 'Gemini'} API key. Please check your settings.`;
            } else {
                errorMsg += err.message || 'Please try again.';
            }
            setError(errorMsg);
        } finally {
            setIsGenerating(false);
            setGenerationStep('idle');
        }
    };
    // Generate React component
    const handleGenerateReact = () => {
        const args = [
            selectedSelector,
            currentStyles || {},
            { tagName: 'div' },
            selectedHtml || '',
            selectedAssets || [],
            null
        ];
        performGeneration('react', generateReactTailwind, generateReactGemini, args);
    };
    // Generate HTML
    const handleGenerateHtml = () => {
        const args = [
            selectedSelector,
            currentStyles || {},
            { tagName: 'div' },
            selectedHtml || '',
            selectedAssets || [],
            null
        ];
        performGeneration('html', generateHtmlCssJs, generateHtmlGemini, args);
    };
    // Copy code
    const copyGeneratedCode = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };
    // Download code
    const downloadGeneratedCode = () => {
        try {
            let filename = 'generated-code.txt';
            let mimeType = 'text/plain';
            if (generationType === 'react') {
                filename = 'Component.jsx';
                mimeType = 'text/javascript';
            } else if (generationType === 'html') {
                filename = 'index.html';
                mimeType = 'text/html';
            }
            const blob = new Blob([generatedCode], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download code');
        }
    };
    return (
        <div className="border-b border-border">
            {/* Header */}
            <div
                className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-surface-light transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-primary" />
                    <h3 className="text-base font-semibold">AI Generation</h3>
                    <div className="flex items-center gap-2">
                        {/* Provider Toggle */}
                        <div className="flex bg-surface-light rounded-md p-0.5 mr-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setAiProvider('groq'); }}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${aiProvider === 'groq' ? 'bg-surface shadow text-primary' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                <Zap size={10} />
                                Groq
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setAiProvider('gemini'); }}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${aiProvider === 'gemini' ? 'bg-surface shadow text-primary' : 'text-text-muted hover:text-text-primary'}`}
                            >
                                <Sparkles size={10} />
                                Gemini
                            </button>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isGenerating
                            ? 'bg-primary/10 text-primary animate-pulse'
                            : 'bg-surface-light text-text-muted'
                            }`}>
                            {generationStep === 'idle' ? 'Ready' : generationStep.charAt(0).toUpperCase() + generationStep.slice(1)}
                        </span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>
            {/* Content */}
            {isOpen && (
                <div className="p-4 space-y-4">
                    {/* Gemini Model Selector */}
                    {aiProvider === 'gemini' && (
                        <div className="bg-surface-light p-2 rounded-lg border border-border/50">
                            <label className="block text-[10px] uppercase text-text-muted font-bold mb-1 ml-1">Gemini Model</label>
                            <div className="relative">
                                <select
                                    value={geminiModel}
                                    onChange={(e) => setGeminiModel(e.target.value)}
                                    className="w-full bg-surface border border-border text-xs rounded p-1.5 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                                >
                                    {GEMINI_MODELS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
                            </div>
                        </div>
                    )}
                    {/* Error display */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 flex items-start gap-3 animate-in fade-in duration-200">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {/* Selected element info */}
                    {selectedSelector && (
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-text-muted font-medium">Selected Element:</span>
                                <Check size={16} className="text-primary" />
                            </div>
                            <div className="overflow-x-auto py-1 -mx-1 px-1">
                                <code className="text-primary font-mono text-sm">{selectedSelector}</code>
                            </div>
                            {currentStyles && (
                                <div className="mt-2 text-text-muted">
                                    {Object.keys(currentStyles).length} styles detected
                                </div>
                            )}
                            {selectedHtml && (
                                <div className="mt-1 text-text-muted">
                                    HTML: {selectedHtml.length} characters
                                </div>
                            )}
                        </div>
                    )}
                    {/* Warning if no selection */}
                    {!selectedSelector && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400 flex items-start gap-3">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>Select an element using Inspect mode to enable AI generation</span>
                        </div>
                    )}
                    {/* Generation buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleGenerateReact}
                            disabled={isGenerating || !selectedSelector}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-surface disabled:opacity-50 text-white py-5 px-6 rounded-xl text-sm font-medium flex flex-col items-center gap-3 transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {isGenerating && generationType === 'react' ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <Code2 size={24} />
                            )}
                            <span>React + Tailwind</span>
                        </button>
                        <button
                            onClick={handleGenerateHtml}
                            disabled={isGenerating || !selectedSelector}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-surface disabled:opacity-50 text-white py-5 px-6 rounded-xl text-sm font-medium flex flex-col items-center gap-3 transition-all disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {isGenerating && generationType === 'html' ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <FileCode size={24} />
                            )}
                            <span>HTML + CSS + JS</span>
                        </button>
                    </div>
                    {/* Loading indicator */}
                    {isGenerating && (
                        <div className="p-5 bg-surface rounded-xl animate-in fade-in duration-200 border border-border">
                            <div className="flex items-center gap-4 mb-4">
                                <Loader2 size={24} className="animate-spin text-primary" />
                                <div>
                                    <div className="text-base font-medium">
                                        {generationStep === 'analyzing' && 'Analyzing selected element...'}
                                        {generationStep === 'generating' && 'Generating clean code...'}
                                    </div>
                                    <div className="text-sm text-text-muted mt-1">
                                        This usually takes 5–15 seconds
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${generationStep === 'analyzing' ? 'bg-primary' : 'bg-border'}`} />
                                <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${generationStep === 'generating' || generationStep === 'complete' ? 'bg-primary' : 'bg-border'}`} />
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-dark rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-border overflow-hidden">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 border-b border-border gap-4">
                            <div className="flex items-center gap-4">
                                {generationType === 'react' ? (
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <Code2 size={24} className="text-blue-400" />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-orange-500/20 rounded-xl">
                                        <FileCode size={24} className="text-orange-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-white">
                                        {generationType === 'react' ? 'React + Tailwind Component' : 'HTML + CSS + JS'}
                                    </h3>
                                    <p className="text-sm text-text-muted">
                                        {generatedCode.split('\n').length} lines • {generatedCode.length} characters
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={copyGeneratedCode}
                                    className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={16} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy Code
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={downloadGeneratedCode}
                                    className="px-4 py-2.5 bg-surface hover:bg-surface-light rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-border"
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    className="p-2.5 hover:bg-surface-light rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        {/* Code Content */}
                        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0d1117]">
                            <pre className="text-sm font-mono text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                                <code>{generatedCode}</code>
                            </pre>
                        </div>
                        {/* Footer */}
                        <div className="p-4 sm:p-5 border-t border-border bg-surface-dark/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-3">
                                <span className="text-text-muted flex items-center gap-2">
                                    <Zap size={14} className="text-primary" />
                                    Generated with{' '}
                                    {aiProvider === 'gemini'
                                        ? (GEMINI_MODELS.find(m => m.id === geminiModel)?.name || 'Gemini')
                                        : 'Groq AI (Llama 3.1 70B)'
                                    }
                                </span>
                                <span className="text-text-muted">
                                    Ready to copy and paste into your project
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIGeneration;