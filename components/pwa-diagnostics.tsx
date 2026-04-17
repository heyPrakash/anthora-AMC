"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePWAInstall } from "@/hooks/use-pwa-install"

type DiagnosticState = "checking" | "pass" | "warn" | "fail"

type DiagnosticItem = {
  label: string
  state: DiagnosticState
  message: string
}

const stateStyles: Record<DiagnosticState, string> = {
  checking: "bg-muted text-muted-foreground",
  pass: "bg-green-100 text-green-800",
  warn: "bg-yellow-100 text-yellow-800",
  fail: "bg-red-100 text-red-800",
}

const stateLabels: Record<DiagnosticState, string> = {
  checking: "Checking",
  pass: "OK",
  warn: "Needs attention",
  fail: "Failed",
}

export function PwaDiagnostics() {
  const { canInstall, installed } = usePWAInstall()
  const [serviceWorker, setServiceWorker] = useState<DiagnosticItem>({
    label: "Service worker",
    state: "checking",
    message: "Checking registration status...",
  })
  const [manifest, setManifest] = useState<DiagnosticItem>({
    label: "Manifest",
    state: "checking",
    message: "Checking manifest.json...",
  })
  const [https, setHttps] = useState<DiagnosticItem>({
    label: "HTTPS",
    state: "checking",
    message: "Checking secure context...",
  })

  useEffect(() => {
    const secure = window.isSecureContext || window.location.protocol === "https:" || window.location.hostname === "localhost"
    setHttps({
      label: "HTTPS",
      state: secure ? "pass" : "fail",
      message: secure ? "Site is running in a secure context." : "Native PWA install requires HTTPS.",
    })

    const checkServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        setServiceWorker({
          label: "Service worker",
          state: "fail",
          message: "This browser does not support service workers.",
        })
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const controller = navigator.serviceWorker.controller
        setServiceWorker({
          label: "Service worker",
          state: registration.active && controller ? "pass" : "warn",
          message: registration.active && controller
            ? "Service worker is active and controlling this page."
            : "Service worker is registered, but this page is not controlled yet.",
        })
      } catch {
        setServiceWorker({
          label: "Service worker",
          state: "fail",
          message: "Service worker registration is not ready.",
        })
      }
    }

    const checkManifest = async () => {
      try {
        const response = await fetch("/manifest.json", { cache: "no-store" })
        if (!response.ok) throw new Error("Manifest request failed")
        const data = await response.json()
        const hasRequiredFields = Boolean(data.name || data.short_name) && Boolean(data.start_url) && Boolean(data.display) && Array.isArray(data.icons) && data.icons.length > 0

        setManifest({
          label: "Manifest",
          state: hasRequiredFields ? "pass" : "warn",
          message: hasRequiredFields ? "manifest.json is linked and has required install fields." : "manifest.json is reachable but missing recommended install fields.",
        })
      } catch {
        setManifest({
          label: "Manifest",
          state: "fail",
          message: "manifest.json could not be loaded.",
        })
      }
    }

    checkServiceWorker()
    checkManifest()
  }, [])

  const installPrompt: DiagnosticItem = installed
    ? {
        label: "Install prompt",
        state: "pass",
        message: "App is already installed in this browser context.",
      }
    : canInstall
      ? {
          label: "Install prompt",
          state: "pass",
          message: "Native install prompt is available. The Install App button can be shown.",
        }
      : {
          label: "Install prompt",
          state: "warn",
          message: "beforeinstallprompt has not fired yet. If this stays unchanged, it is a PWA eligibility/browser condition.",
        }

  const diagnostics = [serviceWorker, manifest, https, installPrompt]

  return (
    <Card>
      <CardHeader>
        <CardTitle>PWA Diagnostics</CardTitle>
        <CardDescription>Check whether this browser session is eligible for the native install prompt.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {diagnostics.map((item) => (
          <div key={item.label} className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-foreground">{item.label}</div>
              <div className="text-sm text-muted-foreground">{item.message}</div>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${stateStyles[item.state]}`}>
              {stateLabels[item.state]}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}