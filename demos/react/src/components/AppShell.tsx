import { NavLink, Outlet, useLocation } from "react-router-dom";
import { findToolByPath, NAV_ENTRIES } from "../config/tools";
import { Icon } from "./Icon";

export function AppShell() {
  const { pathname } = useLocation();
  const active = findToolByPath(pathname);
  const activeRfc = active && "rfc" in active ? active.rfc : undefined;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-mark">GP</div>
          <div className="app-brand-text">
            <strong>GoPDF.js</strong>
            <span>Browser acceptance</span>
          </div>
        </div>

        <nav className="app-nav" aria-label="Tool routes">
          <div className="app-nav-label">Surfaces</div>
          {NAV_ENTRIES.map((tool) => (
            <NavLink
              key={tool.path}
              to={tool.path}
              end={tool.path === "/"}
              className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`}
            >
              <span className="app-nav-icon">
                <Icon name={tool.icon} size={16} />
              </span>
              <span className="app-nav-copy">
                <strong>{tool.label}</strong>
                <span>{tool.description}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-foot">
          Playwright host
          <br />
          <code>pnpm test:e2e</code>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="app-header-title">{active?.label ?? "GoPDF.js"}</div>
          <div className="app-header-meta">
            {activeRfc ? <span className="badge brand">{activeRfc}</span> : null}
            <span className="badge live">Local</span>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
