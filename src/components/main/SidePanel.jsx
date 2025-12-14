import React, { useState, useEffect } from 'react';
import { generateCSS, generateDesignTokens } from '../../utils/css-generator';
import { Crown, Settings, HelpCircle, Undo2, Redo2 } from 'lucide-react';
import MainTabs from './MainTabs';
import ElementSelector from './ElementSelector';
import ChangesList from './ChangesList';
import ProUpgrade from './ProUpgrade';
import AIGeneration from '../edit/AIGeneration';
import ApiKeySettings from '../settings/ApiKeySettings';
import useEditorStore from '../../stores/editorStore';
import Toggle from '../common/Toggle';
import Typography from '../edit/Typography';
import Background from '../edit/Background';
import Appearance from '../edit/Appearance';
import Spacing from '../edit/Spacing';
import Border from '../edit/Border';
import Layout from '../edit/Layout';
import BoxShadow from '../edit/BoxShadow';
import PresetManager from '../edit/PresetManager';
import PageSettings from '../page/PageSettings';

// ... imports

export function SidePanel() {
    const [showProModal, setShowProModal] = useState(false);
    const [hoverData, setHoverData] = useState(null);
    const { activeTab, setActiveTab, isPro, isInspectMode, applyToSimilar, setApplyToSimilar, setSelectedElement, setCurrentStyles, setInspectMode, undo, redo, history, historyIndex } = useEditorStore();

    useEffect(() => {
        const handleMessage = (message) => {
            console.log('SidePanel: Received message', message.type);

            if (message.type === 'ELEMENT_SELECTED') {
                setSelectedElement(message.data);
                // Also update hover data for the preview
                setHoverData({
                    tagName: message.data.tagName,
                    selector: message.data.selector,
                    width: Math.round(message.data.rect.width) + 'px',
                    height: Math.round(message.data.rect.height) + 'px',
                    fontSize: message.data.styles.fontSize,
                    color: message.data.styles.color,
                    backgroundColor: message.data.styles.backgroundColor,
                    borderRadius: message.data.styles.borderRadius,
                    className: message.data.className
                });
                // Switch to edit tab if not already there
                setActiveTab('edit');
            } else if (message.type === 'INSPECT_MODE_ENABLED') {
                setInspectMode(true);
            } else if (message.type === 'INSPECT_MODE_DISABLED') {
                setInspectMode(false);
            }
        };

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(handleMessage);
        }

        return () => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.removeListener(handleMessage);
            }
        };
    }, [setSelectedElement, setInspectMode, setActiveTab]);

    return (
        <div className="flex flex-col h-screen bg-surface-dark">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-dark">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">V</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold">Visual CSS Editor</h1>
                        <p className="text-xs text-text-muted">v1.0.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Undo/Redo Buttons */}
                    <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className={`p-1.5 rounded hover:bg-surface transition-colors ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'text-text-secondary'}`}
                            title="Undo"
                        >
                            <Undo2 size={16} />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= (history?.length || 0) - 1}
                            className={`p-1.5 rounded hover:bg-surface transition-colors ${historyIndex >= (history?.length || 0) - 1 ? 'opacity-30 cursor-not-allowed' : 'text-text-secondary'}`}
                            title="Redo"
                        >
                            <Redo2 size={16} />
                        </button>
                    </div>

                    {!isPro && (
                        <button
                            onClick={() => setShowProModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-secondary to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                            <Crown size={12} />
                            Upgrade
                        </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-surface text-text-secondary">
                        <HelpCircle size={18} />
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <MainTabs />

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'edit' && (
                    <>
                        <ElementSelector />

                        {/* Hover Preview - Shows when inspecting */}
                        {isInspectMode && hoverData && (
                            <div className="mx-4 mb-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-lg animate-pulse-slow">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Live Preview</span>
                                </div>

                                {/* Element Tag & Selector */}
                                <div className="flex items-center gap-2 mb-2">
                                    <code className="px-2 py-0.5 bg-surface rounded text-xs font-mono text-blue-400">
                                        {hoverData.tagName}
                                    </code>
                                    <code className="text-xs font-mono text-text-secondary truncate flex-1">
                                        {hoverData.selector}
                                    </code>
                                </div>

                                {/* Class Names */}
                                {hoverData.className && (
                                    <div className="mb-2">
                                        <span className="text-xs text-text-muted">Classes: </span>
                                        <span className="text-xs font-mono text-orange-400 break-all">
                                            {typeof hoverData.className === 'string' ? hoverData.className : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Size */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-muted">Size:</span>
                                        <span className="text-xs font-mono text-text-primary">
                                            {hoverData.width} × {hoverData.height}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-muted">Font:</span>
                                        <span className="text-xs font-mono text-text-primary">
                                            {hoverData.fontSize}
                                        </span>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-4 h-4 rounded border border-border shadow-sm"
                                            style={{ backgroundColor: hoverData.color }}
                                            title="Text Color"
                                        ></div>
                                        <span className="text-xs text-text-muted">Color</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div
                                            className="w-4 h-4 rounded border border-border shadow-sm"
                                            style={{ backgroundColor: hoverData.backgroundColor }}
                                            title="Background Color"
                                        ></div>
                                        <span className="text-xs text-text-muted">BG</span>
                                    </div>
                                    {hoverData.borderRadius && hoverData.borderRadius !== '0px' && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-text-muted">Radius:</span>
                                            <span className="text-xs font-mono text-text-primary">{hoverData.borderRadius}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Apply to Similar Toggle */}
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <span className="text-sm text-text-secondary">Apply to similar elements</span>
                            <div className="flex items-center gap-2">
                                {!isPro && <span className="pro-badge">Pro</span>}
                                <Toggle
                                    checked={applyToSimilar}
                                    onChange={setApplyToSimilar}
                                    disabled={!isPro}
                                />
                            </div>
                        </div>

                        {/* Edit Sections */}
                        <Typography />
                        <Background />
                        <Appearance />
                        <Spacing />
                        <Border />
                        <Layout />
                        <BoxShadow />
                        <AIGeneration />
                        <PresetManager />

                        {/* Changes List */}
                        <div className="border-t border-border mt-4">
                            <ChangesList />
                        </div>
                    </>
                )}

                {activeTab === 'page' && <PageSettings />}

                {activeTab === 'css' && (
                    isPro ? (
                        <CSSView />
                    ) : (
                        <div className="p-6 text-center">
                            <Crown size={48} className="mx-auto mb-4 text-secondary" />
                            <h3 className="text-lg font-semibold mb-2">Pro Feature</h3>
                            <p className="text-sm text-text-secondary mb-4">
                                Upgrade to Pro to view and export generated CSS
                            </p>
                            <button
                                onClick={() => setShowProModal(true)}
                                className="btn bg-gradient-to-r from-secondary to-purple-600 text-white"
                            >
                                <Crown size={14} />
                                Upgrade to Pro
                            </button>
                        </div>
                    )
                )}

                {activeTab === 'settings' && <ApiKeySettings />}
            </div>

            {/* Pro Modal */}
            {showProModal && <ProUpgrade onClose={() => setShowProModal(false)} />}
        </div>
    );
}

// CSS View Component
function CSSView() {
    const { editedElements } = useEditorStore();
    const [copied, setCopied] = useState(false);
    const [format, setFormat] = useState('formatted'); // 'formatted', 'minified', 'tokens'

    // Import the CSS generator utilities
    const generateCSSOutput = () => {
        if (editedElements.length === 0) return '/* No changes yet */';

        if (format === 'tokens') {
            // Generate design tokens
            return generateDesignTokens(editedElements);
        }

        // Use the generateCSS utility with appropriate options
        return generateCSS(editedElements, {
            minify: format === 'minified',
            includeComments: format === 'formatted'
        });
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generateCSSOutput());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleExport = () => {
        const css = generateCSSOutput();
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'tokens' ? 'design-tokens.css' : 'styles.css';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 space-y-4">
            {/* Format Selection */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Format:</span>
                <div className="flex gap-1">
                    {['formatted', 'minified', 'tokens'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFormat(f)}
                            className={`px-2 py-1 text-xs rounded ${format === f
                                ? 'bg-primary text-white'
                                : 'bg-surface text-text-secondary hover:bg-surface-light'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Header with actions */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Generated CSS</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="btn btn-secondary text-xs"
                    >
                        Export
                    </button>
                    <button
                        onClick={handleCopy}
                        className="btn btn-secondary text-xs"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* CSS Output */}
            <pre className="p-4 bg-surface rounded-lg text-xs font-mono text-text-primary overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {generateCSSOutput()}
            </pre>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{editedElements.length} element(s) modified</span>
                <span>{generateCSSOutput().length} characters</span>
            </div>
        </div>
    );
}

export default SidePanel;
