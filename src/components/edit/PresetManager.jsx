import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, Trash2, Download, Upload, Bookmark } from 'lucide-react';
import Button from '../common/Button';
import useEditorStore from '../../stores/editorStore';
import { sendMessage } from '../../utils/chrome-api';

export function PresetManager() {
    const [isOpen, setIsOpen] = useState(true);
    const [newPresetName, setNewPresetName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);
    const { currentStyles, presets, addPreset, deletePreset, setCurrentStyles, isPro } = useEditorStore();

    // Safe access
    const presetList = presets || [];

    const handleSavePreset = () => {
        if (!newPresetName.trim()) return;

        addPreset({
            name: newPresetName.trim(),
            styles: { ...currentStyles }
        });

        setNewPresetName('');
        setShowSaveInput(false);
    };

    const handleApplyPreset = (preset) => {
        setCurrentStyles(preset.styles);

        // Apply styles to selected element
        sendMessage({
            type: 'APPLY_STYLES',
            styles: preset.styles
        });
    };

    const handleExportPresets = () => {
        const data = JSON.stringify(presets, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vce-presets.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportPresets = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    imported.forEach(preset => addPreset(preset));
                }
            } catch (err) {
                console.error('Failed to import presets:', err);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="border-b border-border">
            <div
                className="section-header px-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Bookmark size={14} className="text-text-secondary" />
                    <h3>Presets</h3>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                    {/* Save Preset */}
                    {showSaveInput ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="Preset name..."
                                className="flex-1"
                                autoFocus
                            />
                            <Button size="sm" onClick={handleSavePreset}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(false)}>Cancel</Button>
                        </div>
                    ) : (
                        <Button
                            fullWidth
                            variant="secondary"
                            onClick={() => setShowSaveInput(true)}
                            icon={Save}
                        >
                            Save Current as Preset
                        </Button>
                    )}

                    {/* Preset List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {presetList.map((preset, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-surface rounded-lg hover:bg-surface-light group"
                            >
                                <button
                                    onClick={() => handleApplyPreset(preset)}
                                    className="flex-1 text-left text-sm"
                                >
                                    {preset.name}
                                </button>
                                <button
                                    onClick={() => deletePreset(preset.name)}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-danger/20 text-danger transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Import/Export */}
                    {isPro && (
                        <div className="flex gap-2 pt-2 border-t border-border">
                            <Button size="sm" variant="ghost" onClick={handleExportPresets} className="flex-1">
                                <Download size={14} />
                                Export
                            </Button>
                            <label className="flex-1">
                                <Button size="sm" variant="ghost" className="w-full" as="span">
                                    <Upload size={14} />
                                    Import
                                </Button>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportPresets}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PresetManager;

