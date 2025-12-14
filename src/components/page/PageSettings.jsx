import React, { useState, useEffect } from 'react';
import {
    Globe, Image, Download, Copy, FileCode, Sparkles,
    Loader2, X, Check, Code2, AlertCircle, Zap
} from 'lucide-react';
import Button from '../common/Button';
import ColorPicker from '../common/ColorPicker';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';
import { generateCSS } from '../../utils/css-generator';
import {
    generateReactTailwind,
    generateHtmlCssJs,
    generateFullPageReact,
    generateFullPageHtml,
} from '../../utils/groq-service';

export function PageSettings() {
    const [bgColor, setBgColor] = useState('#ffffff');
    const [fontFamily, setFontFamily] = useState('inherit');
    const { isPro, editedElements, selectedSelector, currentStyles, selectedHtml } = useEditorStore();

    // AI Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState('idle'); // idle, analyzing, generating, complete
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

    const handleExportViewport = async () => {
        if (!isPro) return;
        sendMessage({
            type: 'EXPORT_VIEWPORT',
            format: 'png'
        }, (response) => {
            if (response?.error) {
                setError('Export failed: ' + response.error);
            }
        });
    };

    const handleExportCSS = () => {
        try {
            const css = generateCSS(editedElements, { includeComments: true });
            const blob = new Blob([css], { type: 'text/css' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `styles-${Date.now()}.css`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export CSS');
            console.error(err);
        }
    };

    const handleExportHTML = () => {
        try {
            const css = generateCSS(editedElements, { includeComments: true });
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Styles</title>
  <style>
${css}
  </style>
</head>
<body>
  <!-- Add your HTML content here -->
</body>
</html>`;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `page-${Date.now()}.html`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to export HTML');
            console.error(err);
        }
    };

    // Helper for improved generation UX
    const performGeneration = async (type, generatorFn, args) => {
        setIsGenerating(true);
        setError('');
        setGenerationType(type);
        setGenerationStep('analyzing');

        try {
            setGenerationStep('generating');

            const result = await generatorFn(...args);

            console.log(`Generated ${type} code:`, result);
            setGeneratedCode(result);
            setGenerationStep('complete');
            setShowCodeModal(true);
        } catch (err) {
            console.error(`${type} generation error:`, err);
            setError(err.message || 'Failed to generate code. Check console for details.');
        } finally {
            setIsGenerating(false);
            setGenerationStep('idle');
        }
    };

    // Generate React + Tailwind code for selected element
    const handleGenerateReact = () => {
        console.log('Generate React clicked');
        if (!selectedSelector) {
            setError('Please select an element first using Inspect mode');
            return;
        }

        performGeneration('react', generateReactTailwind, [
            selectedSelector,
            currentStyles || {},
            { tagName: 'div' },
            selectedHtml || ''
        ]);
    };

    // Generate HTML + CSS + JS code for selected element
    const handleGenerateHtml = () => {
        console.log('Generate HTML clicked');
        if (!selectedSelector) {
            setError('Please select an element first using Inspect mode');
            return;
        }

        performGeneration('html', generateHtmlCssJs, [
            selectedSelector,
            currentStyles || {},
            { tagName: 'div' },
            selectedHtml || ''
        ]);
    };

    // Generate full page React
    const handleGenerateFullPageReact = () => {
        console.log('Generate Full Page React clicked');
        if (!editedElements || editedElements.length === 0) {
            setError('No edited elements. Modify some styles first.');
            return;
        }

        performGeneration('fullReact', generateFullPageReact, [editedElements]);
    };

    // Generate full page HTML
    const handleGenerateFullPageHtml = () => {
        console.log('Generate Full Page HTML clicked');
        if (!editedElements || editedElements.length === 0) {
            setError('No edited elements. Modify some styles first.');
            return;
        }

        performGeneration('fullHtml', generateFullPageHtml, [editedElements]);
    };

    // Copy code to clipboard
    const copyGeneratedCode = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setError('Failed to copy to clipboard');
        }
    };

    // Download generated code
    const downloadGeneratedCode = () => {
        try {
            let filename = 'generated-code.txt';
            let type = 'text/plain';

            if (generationType === 'react' || generationType === 'fullReact') {
                filename = 'Component.jsx';
                type = 'text/javascript';
            } else if (generationType === 'html' || generationType === 'fullHtml') {
                filename = 'index.html';
                type = 'text/html';
            }

            const blob = new Blob([generatedCode], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download code');
        }
    };

    return (
        <div className="p-4 space-y-6 relative">
            {/* Loading Overlay */}
            {isGenerating && (
                <div className="absolute inset-0 bg-surface-dark/95 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 rounded-lg animate-in fade-in duration-200">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                        <Loader2 size={48} className="animate-spin text-blue-400 relative z-10" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        {generationStep === 'analyzing' && 'Analyzing Design...'}
                        {generationStep === 'generating' && 'Writing Code...'}
                        {generationStep === 'formatting' && 'Finishing Up...'}
                    </h3>

                    <p className="text-sm text-blue-200/70 max-w-[200px] leading-relaxed">
                        {generationStep === 'analyzing' && 'Understanding your styles and layout structure.'}
                        {generationStep === 'generating' && 'Using Groq Llama-3 to generate production-ready code.'}
                    </p>

                    <div className="mt-6 flex gap-2">
                        <div className={`h-1 w-20 rounded-full transition-colors duration-500 ${generationStep === 'analyzing' ? 'bg-blue-500' : 'bg-blue-900'}`} />
                        <div className={`h-1 w-20 rounded-full transition-colors duration-500 ${generationStep === 'generating' ? 'bg-blue-500' : 'bg-blue-900'}`} />
                        <div className={`h-1 w-20 rounded-full transition-colors duration-500 ${generationStep === 'complete' ? 'bg-blue-500' : 'bg-blue-900'}`} />
                    </div>
                </div>
            )}

            {/* Page Background */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    <Globe size={14} />
                    Page Background
                </div>

                <ColorPicker
                    label="Page Background"
                    value={bgColor}
                    onChange={(color) => {
                        setBgColor(color);
                        sendMessage({
                            type: 'APPLY_PAGE_STYLES',
                            styles: { backgroundColor: color }
                        });
                    }}
                />

                <div>
                    <label className="block text-sm font-medium mb-2">Base Font</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => {
                            setFontFamily(e.target.value);
                            sendMessage({
                                type: 'APPLY_PAGE_STYLES',
                                styles: { fontFamily: e.target.value }
                            });
                        }}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                    >
                        <option value="inherit">Default</option>
                        <option value="-apple-system, BlinkMacSystemFont, sans-serif">System</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Inter', sans-serif">Inter</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                    </select>
                </div>
            </div>

            {/* Export Options */}
            <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    <Download size={14} />
                    EXPORT
                </div>

                <div className="space-y-2">
                    <button
                        onClick={handleExportViewport}
                        disabled={!isPro}
                        className="w-full px-4 py-2.5 bg-surface hover:bg-surface-light border border-border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Image size={16} />
                        Export Viewport as PNG
                        {!isPro && <span className="ml-auto text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">Pro</span>}
                    </button>

                    <button
                        onClick={handleExportCSS}
                        className="w-full px-4 py-2.5 bg-surface hover:bg-surface-light border border-border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <FileCode size={16} />
                        Export CSS File
                    </button>

                    <button
                        onClick={handleExportHTML}
                        className="w-full px-4 py-2.5 bg-surface hover:bg-surface-light border border-border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <FileCode size={16} />
                        Export HTML + CSS
                    </button>
                </div>
            </div>

            {/* AI Code Generation */}
            <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary uppercase tracking-wide">
                    <Sparkles size={14} className="text-primary" />
                    AI GENERATION
                </div>

                {/* Error display */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Selected Element Indicator */}
                {selectedSelector && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-text-muted font-medium">Selected:</span>
                            <Check size={14} className="text-primary" />
                        </div>
                        <code className="text-primary font-mono block truncate">{selectedSelector}</code>
                    </div>
                )}

                {/* Section Code Generation Buttons */}
                <button
                    onClick={handleGenerateReact}
                    disabled={isGenerating || !selectedSelector}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-surface disabled:opacity-50 border border-blue-500 disabled:border-border rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                >
                    {isGenerating && generationType === 'react' ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Code2 size={18} />
                    )}
                    Generate Section Code
                </button>

                {/* Full Page Generation Button */}
                <button
                    onClick={handleGenerateFullPageHtml}
                    disabled={isGenerating || editedElements.length === 0}
                    className="w-full px-4 py-3 bg-surface hover:bg-surface-light disabled:opacity-50 border border-border rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                >
                    {isGenerating && generationType === 'fullHtml' ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <FileCode size={18} />
                    )}
                    Generate Full Page
                </button>

                {/* Convert to React Button */}
                <button
                    onClick={handleGenerateFullPageReact}
                    disabled={isGenerating || editedElements.length === 0}
                    className="w-full px-4 py-3 bg-surface hover:bg-surface-light disabled:opacity-50 border border-border rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
                >
                    {isGenerating && generationType === 'fullReact' ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Sparkles size={18} />
                    )}
                    Convert to React
                </button>

                {!selectedSelector && (
                    <p className="text-xs text-text-muted text-center">
                        Select an element using Inspect mode first
                    </p>
                )}

                {editedElements.length === 0 && selectedSelector && (
                    <p className="text-xs text-text-muted text-center">
                        Edit some styles to enable full page generation
                    </p>
                )}
            </div>

            {/* Generated Code Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface-dark rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                {(generationType === 'react' || generationType === 'fullReact') ? (
                                    <Code2 size={20} className="text-blue-400" />
                                ) : (
                                    <FileCode size={20} className="text-orange-400" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {generationType === 'react' && 'React Component'}
                                        {generationType === 'html' && 'HTML Code'}
                                        {generationType === 'fullReact' && 'Full React App'}
                                        {generationType === 'fullHtml' && 'Full HTML Page'}
                                    </h3>
                                    <p className="text-xs text-text-muted">
                                        {generatedCode.split('\n').length} lines
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={copyGeneratedCode}
                                    className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={downloadGeneratedCode}
                                    className="px-3 py-2 bg-surface hover:bg-surface-light rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowCodeModal(false)}
                                    className="p-2 hover:bg-surface rounded-lg"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Code Content */}
                        <div className="flex-1 overflow-auto p-6 bg-[#0d1117]">
                            <pre className="text-sm font-mono text-text-primary leading-relaxed">
                                <code>{generatedCode}</code>
                            </pre>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border text-center">
                            <p className="text-xs text-text-muted">
                                Generated with Groq AI • Ready to use
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PageSettings;