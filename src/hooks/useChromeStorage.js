import { useState, useEffect, useCallback } from 'react';

export function useChromeStorage(key, defaultValue) {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial value
    useEffect(() => {
        const loadValue = async () => {
            try {
                const result = await chrome.storage.sync.get(key);
                if (result[key] !== undefined) {
                    setValue(result[key]);
                }
            } catch (error) {
                console.error('Error loading from chrome storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadValue();
    }, [key]);

    // Listen for changes
    useEffect(() => {
        const handleChange = (changes, areaName) => {
            if (areaName === 'sync' && changes[key]) {
                setValue(changes[key].newValue);
            }
        };

        chrome.storage.onChanged.addListener(handleChange);
        return () => chrome.storage.onChanged.removeListener(handleChange);
    }, [key]);

    // Save value
    const setStoredValue = useCallback(async (newValue) => {
        try {
            const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
            await chrome.storage.sync.set({ [key]: valueToStore });
            setValue(valueToStore);
        } catch (error) {
            console.error('Error saving to chrome storage:', error);
        }
    }, [key, value]);

    return [value, setStoredValue, isLoading];
}

// Local storage hook (for larger data)
export function useChromeLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadValue = async () => {
            try {
                const result = await chrome.storage.local.get(key);
                if (result[key] !== undefined) {
                    setValue(result[key]);
                }
            } catch (error) {
                console.error('Error loading from local storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadValue();
    }, [key]);

    useEffect(() => {
        const handleChange = (changes, areaName) => {
            if (areaName === 'local' && changes[key]) {
                setValue(changes[key].newValue);
            }
        };

        chrome.storage.onChanged.addListener(handleChange);
        return () => chrome.storage.onChanged.removeListener(handleChange);
    }, [key]);

    const setStoredValue = useCallback(async (newValue) => {
        try {
            const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
            await chrome.storage.local.set({ [key]: valueToStore });
            setValue(valueToStore);
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }, [key, value]);

    return [value, setStoredValue, isLoading];
}

export default useChromeStorage;
