"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async () => {
          await navigator.serviceWorker.ready

          if (!navigator.serviceWorker.controller && sessionStorage.getItem("sw-controlled") !== "true") {
            sessionStorage.setItem("sw-controlled", "true")
            window.location.reload()
          }
        })
        .catch((err) => console.error("SW registration failed:", err))
    }
  }, [])

  return null
}
