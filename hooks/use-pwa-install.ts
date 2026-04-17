'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installedState = false
const listeners = new Set<(state: { canInstall: boolean; installed: boolean }) => void>()

const notifyListeners = () => {
  const state = { canInstall: Boolean(deferredPrompt), installed: installedState }
  listeners.forEach((listener) => listener(state))
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(Boolean(deferredPrompt))
  const [installed, setInstalled] = useState(installedState)

  useEffect(() => {
    const syncState = (state: { canInstall: boolean; installed: boolean }) => {
      setCanInstall(state.canInstall)
      setInstalled(state.installed)
    }

    listeners.add(syncState)
    syncState({ canInstall: Boolean(deferredPrompt), installed: installedState })

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      console.log('Install prompt available')
      notifyListeners()
    }

    const installedHandler = () => {
      installedState = true
      deferredPrompt = null
      notifyListeners()
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      listeners.delete(syncState)
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      notifyListeners()
      return
    }

    console.log('Install prompt triggered')
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User ${outcome}`)
    deferredPrompt = null
    notifyListeners()
  }

  return { installApp, installed, canInstall }
}
