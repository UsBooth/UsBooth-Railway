"use client";

import { ReactNode, useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import ToastHost from "./Toast";

type User = {
  id: string;
  email: string;
  displayName: string;
  username?: string | null;
};

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [booths, setBooths] = useState<Array<{
    id: string;
    type: "COUPLE" | "RANDOM";
    name: string;
    roomCode: string;
  }>>([]);

  const [boothLimit, setBoothLimit] = useState(3);

  useEffect(() => {
    checkSession();

    const refreshBooths = () => {
      void checkSession();
    };

    window.addEventListener("usbooth:booths-changed", refreshBooths);
    return () => {
      window.removeEventListener("usbooth:booths-changed", refreshBooths);
    };
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data?.user) {
        setUser(data.user);

        try {
          const boothResponse = await fetch("/api/booths", {
            credentials: "include",
            cache: "no-store",
          });

          const boothData = await boothResponse.json().catch(() => ({}));

          if (boothResponse.ok) {
            setBooths(
              Array.isArray(boothData?.booths)
                ? boothData.booths
                : []
            );

            setBoothLimit(
              typeof boothData?.limit === "number"
                ? boothData.limit
                : 3
            );
          } else {
            setBooths([]);
          }
        } catch {
          setBooths([]);
        }
      } else {
        setUser(null);
        setBooths([]);
      }
    } catch {
      setUser(null);
    } finally {
      setCheckingSession(false);
    }
  }

  return (
    <div className="app-shell">
      {!checkingSession && !mobileSidebarOpen && (
        <button
          type="button"
          className="global-mobile-menu"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileSidebarOpen}
        >
          ☰
        </button>
      )}

      <AppSidebar
        user={user}
        booths={booths}
        limit={boothLimit}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <ToastHost />

      <div className="app-shell-content">
        <div
          className="mobile-shell-safe-area"
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  );
}
