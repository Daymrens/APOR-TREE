"use client";

import { useEffect } from "react";

export default function PWAProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("SW registered:", reg.scope);
          })
          .catch((err) => {
            if (process.env.NODE_ENV === "development") console.warn("SW registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
