'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      setCanInstall(true)
      console.log('Install prompt available')
    }

    const installedHandler = () => {
      setInstalled(true)
      setCanInstall(false)
      deferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      setCanInstall(false)
      return
    }

    console.log('Install prompt triggered')
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User ${outcome}`)
    deferredPrompt = null
    setCanInstall(false)
  }

  return { installApp, installed, canInstall }
}
