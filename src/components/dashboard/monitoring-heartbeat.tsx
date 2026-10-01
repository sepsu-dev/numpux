"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

export function MonitoringHeartbeat() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === "visible") {
        void apiFetch("/api/monitoring", { method: "POST", keepalive: true }).catch(() => {});
      }
    };
    ping();
    const interval = window.setInterval(ping, 60_000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
