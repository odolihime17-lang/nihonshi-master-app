'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to get or generate a unique ID for the current device.
 * Stores the ID in localStorage for persistence.
 */
export function useUser() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Only run on client side
        const storedId = localStorage.getItem('nihonshi_master_user_id');

        if (storedId) {
            setUserId(storedId);
        } else {
            // Generate a random ID: device_ + 8 char hex
            const newId = `device_${Math.random().toString(36).substring(2, 10)}`;
            localStorage.setItem('nihonshi_master_user_id', newId);
            setUserId(newId);
        }
    }, []);

    return { userId, isLoading: userId === null };
}
