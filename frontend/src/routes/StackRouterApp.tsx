// frontend/src/routes/StackRouterApp.tsx
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { HotkeyBadge } from "@/components/dashboard/HotkeyBadge";
import { Panel } from "@/components/dashboard/Panel";
import { StatusDot } from "@/components/dashboard/StatusDot";
import { useDashboardStore } from "@/store/useDashboardStore";
import { dashboardPages, type DashboardPage } from "./pageRegistry";
import { StackPagePlaceholder } from "./StackPagePlaceholder";

export function StackRouterApp() {
  const [activePageId, setActivePageId] = useState(dashboardPages[0].id);
  const setActivePage = useDashboardStore((state) => state.setActivePage);
  const activePage = useMemo(() => dashboardPages.find((page) => page.id === activePageId) ?? dashboardPages[0], [activePageId]);

  function selectPage(page: DashboardPage) {
    setActivePageId(page.id);
    setActivePage(page.title);
    window.history.replaceState(null, "", `?stackPreview=1&page=${page.id}`);
  }

  return (
    <DashboardShell
      header={<StackHeader activePage={activePage} />}
      leftRail={<StackNavigation activePage={activePage} onSelectPage={selectPage} />}
      main={<StackPagePlaceholder page={activePage} />}
      rightRail={<StackRouteDetails page={activePage} />}
      assistantRail={<StackAssistantRail page={activePage} />}
    />
  );
}

function StackHeader({ activePage }: { activePage: DashboardPage }) {
  return (
    <header className="flex h-[72px] items-center justify-between gap-4 px-5">
      <div>
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-muted-foreground">JARVIS Stack Migration</p>
        <h1 className="font-mono text-lg uppercase tracking-[0.16em]">{activePage.title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <StatusDot status="ok" label="preview only" />
        <HotkeyBadge label="Command" keys={["Ctrl", "K"]} />
      </div>
    </header>
  );
}

function StackNavigation({ activePage, onSelectPage }: { activePage: DashboardPage; onSelectPage: (page: DashboardPage) => void }) {
  const groups = ["main", "system", "workbench"] as const;

  return (
    <Panel title="Pages" eyebrow="13 Slots" description="Neue Zielstruktur ohne alte App zu ersetzen.">
      <nav className="space-y-5" aria-label="Stack Migration Pages">
        {groups.map((group) => (
          <div key={group}>
            <p className="mb-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{group}</p>
            <div className="grid gap-1">
              {dashboardPages.filter((page) => page.group === group).map((page) => {
                const active = page.id === activePage.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => onSelectPage(page)}
                    className={
                      active
                        ? "rounded-md border border-primary bg-primary/10 px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.12em] text-foreground"
                        : "rounded-md border border-transparent px-3 py-2 text-left font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground hover:border-border hover:text-foreground"
                    }
                  >
                    {page.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </Panel>
  );
}

function StackRouteDetails({ page }: { page: DashboardPage }) {
  return (
    <Panel title="Route Contract" eyebrow="Details" description="Jeder Slot bekommt spaeter eigene Datenquellen und Komponenten.">
      <dl className="space-y-3 font-mono text-xs">
        <div>
          <dt className="text-muted-foreground">id</dt>
          <dd className="text-foreground">{page.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">path</dt>
          <dd className="text-foreground">{page.path}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">group</dt>
          <dd className="text-foreground">{page.group}</dd>
        </div>
      </dl>
    </Panel>
  );
}

function StackAssistantRail({ page }: { page: DashboardPage }) {
  return (
    <Panel title="JARVIS Sidebar" eyebrow="Copilot Slot" description="Kontext zur aktiven Page ist vorbereitet.">
      <p className="text-sm leading-6 text-muted-foreground">
        Aktiver Kontext: <span className="font-mono text-foreground">{page.title}</span>
      </p>
      <div className="mt-4">
        <HotkeyBadge label="Toggle" keys={["Ctrl", "J"]} />
      </div>
    </Panel>
  );
}
