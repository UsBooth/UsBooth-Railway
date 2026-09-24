"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Booth = {
  id: string;
  type: "SOLO" | "COUPLE" | "RANDOM";
  name: string;
  roomCode: string;
};

type User = {
  id: string;
  email: string;
  displayName: string;
  username?: string | null;
};

type AppSidebarProps = {
  user: User | null;
  booths?: Booth[];
  limit?: number;
  mobileOpen?: boolean;
  onClose?: () => void;
};

const FULL_ACCESS_EMAILS = new Set([
  "usboothphotographs@gmail.com",
  "vawesh.srivastava@gmail.com",
  "garimagupta67576@gmail.com",
]);

export default function AppSidebar({
  user,
  booths = [],
  limit = 5,
  mobileOpen = false,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  const isFullAccess = user?.email
    ? FULL_ACCESS_EMAILS.has(user.email.trim().toLowerCase())
    : false;

  const effectiveLimit = isFullAccess ? null : limit;

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    if (path === "/booth/single") return pathname === "/booth/single";
    return pathname.startsWith(path);
  }

  function closeMobileMenu() {
    onClose?.();
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/";
    }
  }

  const hasBoothSpace =
    effectiveLimit === null || booths.length < effectiveLimit;

  const mainLinks = [
    { href: "/", label: "Home", icon: "⌂" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard", icon: "◈" }] : []),
    ...(user ? [{ href: "/account", label: "My Booths", icon: "▣" }] : []),
    ...(user ? [{ href: "/memories", label: "Memories", icon: "♡" }] : []),
    { href: "/templates", label: "Templates", icon: "✦" },
    { href: "/booth/single", label: "Quick Booth", icon: "◎" },
    { href: "/join", label: "Join a Room", icon: "↗" },
  ];

  const exploreLinks = [
    { href: "/pricing", label: "Plans & Pricing", icon: "◇", sub: "Choose your plan" },
    { href: "/suggestions", label: "Suggestions", icon: "✧" },
    { href: "/about", label: "Help & About", icon: "?" },
    { href: "/contact", label: "Contact Us", icon: "✉" },
    ...(user && isFullAccess
      ? [{ href: "/admin/suggestions", label: "Admin Suggestions", icon: "◆" }]
      : []),
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-mobile-backdrop"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`app-sidebar usbooth-sidebar ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="UsBooth navigation"
      >
        <div className="sidebar-top">
          <Link
            href="/"
            className="sidebar-logo"
            onClick={closeMobileMenu}
            aria-label="UsBooth home"
          >
            USBOOTH<span>♥</span>
          </Link>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav usbooth-sidebar-nav" aria-label="Main">
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <span className="sidebar-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <section className="sidebar-booths" aria-label="Your booths">
            <div className="sidebar-divider" />
            <div className="sidebar-section-title">
              <span>YOUR BOOTHS</span>
              <small>
                {booths.length}/{effectiveLimit === null ? "∞" : effectiveLimit}
              </small>
            </div>

            {booths.length > 0 ? (
              <div className="sidebar-booth-list">
                {booths.map((booth) => (
                  <Link
                    key={booth.id}
                    href={`/booth/${booth.id}`}
                    className={`sidebar-booth ${pathname === `/booth/${booth.id}` ? "active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <span className="sidebar-booth-heart" aria-hidden="true">
                      {booth.type === "SOLO" ? "◎" : booth.type === "COUPLE" ? "♥" : "✦"}
                    </span>
                    <span className="sidebar-booth-info">
                      <strong>{booth.name}</strong>
                      <small>{booth.roomCode}</small>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="sidebar-empty">Your saved booths will appear here.</p>
            )}

            {hasBoothSpace ? (
              <Link
                href="/account?create=true"
                className="sidebar-create"
                onClick={closeMobileMenu}
              >
                <span aria-hidden="true">＋</span>
                CREATE BOOTH
              </Link>
            ) : (
              <div className="sidebar-limit">
                <span aria-hidden="true">✓</span>
                {effectiveLimit}/{effectiveLimit} booths used
              </div>
            )}
          </section>
        )}

        <div className="sidebar-spacer" />

        <section className="sidebar-bottom">
          <div className="sidebar-section-heading">EXPLORE</div>

          <nav className="sidebar-secondary-nav" aria-label="Explore">
            {exploreLinks.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="sidebar-link-copy">
                  <strong>{item.label}</strong>
                  {item.sub && <small>{item.sub}</small>}
                </span>
              </Link>
            ))}
          </nav>

          {!user ? (
            <div className="sidebar-auth-actions">
              <Link
                href="/login"
                className="sidebar-auth-login"
                onClick={closeMobileMenu}
              >
                LOG IN
              </Link>
              <Link
                href="/register"
                className="sidebar-register"
                onClick={closeMobileMenu}
              >
                CREATE ACCOUNT
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="sidebar-user sidebar-user-dashboard"
                onClick={closeMobileMenu}
                aria-label="Open dashboard"
              >
                <div className="sidebar-user-avatar" aria-hidden="true">
                  {user.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="sidebar-user-info">
                  <strong>{user.displayName || "UsBooth User"}</strong>
                  <small>{user.username ? `@${user.username}` : user.email}</small>
                  <span>OPEN DASHBOARD →</span>
                </div>
              </Link>

              <button
                type="button"
                className="sidebar-logout"
                onClick={logout}
              >
                <span aria-hidden="true">↪</span>
                LOG OUT
              </button>
            </>
          )}
        </section>
      </aside>
    </>
  );
}
