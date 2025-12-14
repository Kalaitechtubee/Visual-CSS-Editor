import React from 'react';
import { Edit3, FileCode, Settings, Sparkles, Key } from 'lucide-react';
import useEditorStore from '../../stores/editorStore';

export function MainTabs() {
    const { activeTab, setActiveTab, isPro } = useEditorStore();

    const tabs = [
        { id: 'edit', label: 'Edit', icon: Edit3 },
        { id: 'page', label: 'Page', icon: Settings },
        { id: 'css', label: 'CSS', icon: FileCode, pro: true },
        { id: 'settings', label: 'Settings', icon: Key }
    ];

    return (
        <div className="flex border-b border-border bg-surface-dark">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeTab === tab.id
                        ? 'text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                    {tab.pro && !isPro && (
                        <span className="pro-badge">Pro</span>
                    )}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
}

export default MainTabs;
