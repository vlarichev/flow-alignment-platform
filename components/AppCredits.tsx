"use client";

import { APP_VERSION } from "@/lib/app-version";

export function AppCredits() {
  const year = new Date().getFullYear();
  return (
    <footer className="shrink-0 border-t border-border/40 px-3 py-1.5">
      <p className="text-center text-[10px] leading-none text-muted-foreground/45">
        Vlad Larichev · {year} · v{APP_VERSION}
      </p>
    </footer>
  );
}
