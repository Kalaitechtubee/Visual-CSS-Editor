import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Code2, FileCode, Loader2, Check, Copy, 
    Download, X, AlertCircle, ChevronDown, ChevronUp, Zap 
} from 'lucide-react';
import useEditorStore from '../../stores/editorStore';
import { 
    generateReactTailwind, 
    generateHtmlCssJs 
} from '../../utils/groq-service';

export function AIGeneration() {
    const [isOpen, setIsOpen] = useState(true);
    const { selectedSelector, currentStyles, selectedHtml } = useEditorStore();

    // Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState('idle');
    const [generatedCode, setGeneratedCode] = useState('');
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [generationType, setGenerationType] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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
        
        console.log('Validation passed:', {
            selector: selectedSelector,
            stylesCount: Object.keys(currentStyles).length,
            htmlLength: selectedHtml?.length || 0
        });
        
        return true;
    };

    // Perform generation with proper error handling
    const performGeneration = async (type, generatorFn, args) => {
        if (!validateGeneration()) return;
        
        setIsGenerating(true);
        setError('');
        setGenerationType(type);
        setGenerationStep('analyzing');

        try {
            console.log(`Starting ${type} generation...`);
            console.log('Args:', { 
                selector: args[0], 
                stylesCount: Object.keys(args[1] || {}).length,
                htmlLength: args[3]?.length || 0 
            });
            
            setGenerationStep('generating');
            
            const result = await generatorFn(...args);
            
            if (!result || result.length < 50) {
                throw new Error('Generated code is too short or empty');
            }
            
            console.log(`${type} generation successful:`, result.length, 'characters');
            
            setGeneratedCode(result);
            setGenerationStep('complete');
            setShowCodeModal(true);
        } catch (err) {
            console.error(`${type} generation error:`, err);
            
            // User-friendly error messages
            let errorMsg = 'Failed to generate code. ';
            if (err.message.includes('API key')) {
                errorMsg += 'Please configure your Groq API key in settings.';
            } else if (err.message.includes('429')) {
                errorMsg += 'Rate limit exceeded. Please try again in a moment.';
            } else if (err.message.includes('401')) {
                errorMsg += 'Invalid API key. Please check your settings.';
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
        console.log('Generate React clicked');
        
        performGeneration('react', generateReactTailwind, [
            selectedSelector,
            currentStyles || {},
            { tagName: 'div' },
            selectedHtml || ''
        ]);
    };

    // Generate HTML
    const handleGenerateHtml = () => {
        console.log('Generate HTML clicked');
        
        performGeneration('html', generateHtmlCssJs, [
            selectedSelector,
            currentStyles || {},
            { tagName: 'div' },
            selectedHtml || ''
        ]);
    };

    // Copy code
    const copyGeneratedCode = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
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
            console.error('Download failed:', err);
            setError('Failed to download code');
        }
    };

    return (
        <div className="border-b border-border">
            {/* Header */}
            <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-surface-light transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <h3 className="text-sm font-semibold">AI Generation</h3>
                    {selectedSelector && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                            Ready
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {/* Content */}
            {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Error display */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2 animate-in fade-in duration-200">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Selected element info */}
                    {selectedSelector && (
                        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-text-muted font-medium">Selected Element:</span>
                                <Check size={14} className="text-primary" />
                            </div>
                            <code className="text-primary font-mono block truncate">{selectedSelector}</code>
                            {currentStyles && (
                                <div className="mt-1 text-text-muted">
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
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400 flex items-start gap-2">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>Select an element using Inspect mode to enable AI generation</span>
                        </div>
                    )}

                    {/* Generation buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleGenerateReact}
                            disabled={isGenerating || !selectedSelector}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-surface disabled:opacity-50 text-white p-3 rounded-lg text-xs font-medium flex flex-col items-center gap-2 transition-all disabled:cursor-not-allowed"
                        >
                            {isGenerating && generationType === 'react' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Code2 size={18} />
                            )}
                            <span>React + Tailwind</span>
                        </button>

                        <button
                            onClick={handleGenerateHtml}
                            disabled={isGenerating || !selectedSelector}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-surface disabled:opacity-50 text-white p-3 rounded-lg text-xs font-medium flex flex-col items-center gap-2 transition-all disabled:cursor-not-allowed"
                        >
                            {isGenerating && generationType === 'html' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <FileCode size={18} />
                            )}
                            <span>HTML + CSS</span>
                        </button>
                    </div>

                    {/* Loading indicator */}
                    {isGenerating && (
                        <div className="p-4 bg-surface rounded-lg animate-in fade-in duration-200">
                            <div className="flex items-center gap-3 mb-3">
                                <Loader2 size={20} className="animate-spin text-primary" />
                                <div>
                                    <div className="text-sm font-medium">
                                        {generationStep === 'analyzing' && 'Analyzing design...'}
                                        {generationStep === 'generating' && 'Generating code...'}
                                    </div>
                                    <div className="text-xs text-text-muted">
                                        This may take a few seconds
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <div className={`h-1 flex-1 rounded-full transition-colors ${generationStep === 'analyzing' ? 'bg-primary' : 'bg-border'}`} />
                                <div className={`h-1 flex-1 rounded-full transition-colors ${generationStep === 'generating' ? 'bg-primary' : 'bg-border'}`} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-dark rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border animate-in slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                {generationType === 'react' ? (
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Code2 size={20} className="text-blue-400" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <FileCode size={20} className="text-orange-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {generationType === 'react' ? 'React Component' : 'HTML Code'}
                                    </h3>
                                    <p className="text-xs text-text-muted">
                                        {generatedCode.split('\n').length} lines • {generatedCode.length} characters
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={copyGeneratedCode}
                                    className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={14} />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            Copy
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={downloadGeneratedCode}
                                    className="px-3 py-2 bg-surface hover:bg-surface-light rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Code Content */}
                        <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
                            <pre className="text-sm font-mono text-text-primary leading-relaxed whitespace-pre-wrap">
                                <code>{generatedCode}</code>
                            </pre>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-surface-dark">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-text-muted flex items-center gap-2">
                                    <Zap size={12} className="text-primary" />
                                    Generated with Groq AI (Llama 3.3 70B)
                                </span>
                                <span className="text-text-muted">
                                    Ready to copy and use
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