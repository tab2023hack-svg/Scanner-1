
// FIX: The useLocalStorage hook's return type uses `React.Dispatch`, which requires `React` to be imported.
import React, { useState, useEffect } from 'react';

function getValue<T,>(key: string, initialValue: T | (() => T)): T {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
        try {
            return JSON.parse(savedValue, (k, v) => {
                // Reviver function to correctly parse date strings back to Date objects
                if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v)) {
                    return new Date(v);
                }
                return v;
            });
        } catch (error) {
            console.error('Error parsing JSON from localStorage', error);
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
}

export function useLocalStorage<T,>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => getValue(key, initialValue));

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error setting localStorage key “' + key + '”:', error);
        }
    }, [key, value]);

    return [value, setValue];
}