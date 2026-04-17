"use client"

import { useEffect } from "react"

export function InstallCacheCleanup() {
  useEffect(() => {
    const cleanup = async () => {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      }
    }

    cleanup().catch((err) => console.error("Install cache cleanup failed:", err))
  }, [])

  return null
}