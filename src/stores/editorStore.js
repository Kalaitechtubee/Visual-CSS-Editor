// Editor Store with HTML Content Support
// File: src/stores/editorStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useEditorStore = create(
    persist(
        (set, get) => ({
            // Selected element info
            selectedSelector: null,
            selectedElement: null,
            selectedPath: null,
            selectedHtml: '', // NEW: Store HTML content for AI generation
            currentStyles: {},

            // Edited elements history
            editedElements: [],
            history: [], // Undo/Redo history
            historyIndex: -1,

            // Undo/Redo Actions
            addToHistory: (state) => {
                const { history, historyIndex } = get();
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(state);

                // Limit history size
                if (newHistory.length > 50) newHistory.shift();

                set({
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                });
            },

            undo: () => {
                const { history, historyIndex } = get();
                if (historyIndex > 0) {
                    const prevIndex = historyIndex - 1;
                    const prevState = history[prevIndex];
                    set({
                        editedElements: prevState,
                        historyIndex: prevIndex
                    });
                }
            },

            redo: () => {
                const { history, historyIndex } = get();
                if (historyIndex < history.length - 1) {
                    const nextIndex = historyIndex + 1;
                    const nextState = history[nextIndex];
                    set({
                        editedElements: nextState,
                        historyIndex: nextIndex
                    });
                }
            },

            // Editor state
            activeTab: 'edit',
            isInspectMode: false,
            isPro: false,

            // ... actions
            setActiveTab: (tab) => {
                set({ activeTab: tab });
            },

            // User preferences
            preferences: {
                theme: 'dark',
                autoApply: true,
                applyToSimilar: false,
            },

            // Actions
            setSelectedElement: (data) => {
                console.log('Store: Setting selected element', data);
                set({
                    selectedSelector: data.selector,
                    selectedElement: data.tagName,
                    selectedPath: data.path,
                    selectedHtml: data.html || '', // Store HTML content
                    currentStyles: data.styles || {},
                });
            },

            updateCurrentStyles: (newStyles) => {
                const current = get().currentStyles;
                const updated = { ...current, ...newStyles };
                set({ currentStyles: updated });

                // Add to edited elements if not already there
                const selector = get().selectedSelector;
                if (selector) {
                    get().addEditedElement(selector, updated);
                }
            },

            addEditedElement: (selector, styles) => {
                const edited = get().editedElements;
                const existingIndex = edited.findIndex(el => el.selector === selector);

                if (existingIndex >= 0) {
                    // Update existing element
                    const updated = [...edited];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        styles: { ...updated[existingIndex].styles, ...styles },
                        lastModified: Date.now(),
                    };
                    set({ editedElements: updated });
                } else {
                    // Add new element
                    const newElement = {
                        selector,
                        styles,
                        html: get().selectedHtml || '', // Include HTML content
                        tagName: get().selectedElement,
                        path: get().selectedPath,
                        createdAt: Date.now(),
                        lastModified: Date.now(),
                    };
                    set({ editedElements: [...edited, newElement] });
                }

                // Add to history
                get().addToHistory(get().editedElements);
            },

            removeEditedElement: (selector) => {
                const edited = get().editedElements;
                set({
                    editedElements: edited.filter(el => el.selector !== selector)
                });
                get().addToHistory(get().editedElements);
            },

            clearEditedElements: () => {
                set({ editedElements: [] });
                get().addToHistory([]);
            },

            setInspectMode: (isActive) => {
                set({ isInspectMode: isActive });
            },

            toggleInspectMode: () => {
                const current = get().isInspectMode;
                set({ isInspectMode: !current });
            },

            setProStatus: (isPro) => {
                set({ isPro });
            },

            setIsPro: (isPro) => {
                set({ isPro });
            },

            updatePreferences: (newPrefs) => {
                set({
                    preferences: { ...get().preferences, ...newPrefs }
                });
            },

            // Reset selected element
            clearSelection: () => {
                set({
                    selectedSelector: null,
                    selectedElement: null,
                    selectedPath: null,
                    selectedHtml: '',
                    currentStyles: {},
                });
            },

            // Export edited elements as CSS
            exportAsCSS: () => {
                const elements = get().editedElements;
                let css = '/* Generated by Visual CSS Editor */\n\n';

                elements.forEach(el => {
                    css += `${el.selector} {\n`;
                    Object.entries(el.styles).forEach(([prop, value]) => {
                        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                        css += `  ${cssProp}: ${value};\n`;
                    });
                    css += '}\n\n';
                });

                return css;
            },

            // Get element by selector
            getEditedElement: (selector) => {
                return get().editedElements.find(el => el.selector === selector);
            },

            // Statistics
            getStats: () => {
                const elements = get().editedElements;
                return {
                    totalElements: elements.length,
                    totalStyles: elements.reduce((sum, el) => sum + Object.keys(el.styles).length, 0),
                    lastModified: elements.length > 0
                        ? Math.max(...elements.map(el => el.lastModified))
                        : null,
                };
            },
        }),
        {
            name: 'vce-editor-store',
            partialize: (state) => ({
                editedElements: state.editedElements,
                preferences: state.preferences,
                isPro: state.isPro,
            }),
        }
    )
);

export default useEditorStore;