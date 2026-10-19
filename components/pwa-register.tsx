'use client'

import { useEffect } from 'react'

/** Registers public/sw.js so the app works offline and can be installed (manifest.json). */
export function PwaRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((error) => {
                console.warn('Service worker registration failed', error)
            })
        }
    }, [])

    return null
}
