"use client";

// Barre de navigation principale

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LineChart, PieChart, Search, Sprout } from "lucide-react";

const LINKS = [
  { href: "/portfolio", label: "Portefeuille", icon: Briefcase },
  { href: "/portfolio/analyse", label: "Analyse", icon: PieChart },
  { href: "/assets", label: "Assets", icon: Search },
  { href: "/simulation", label: "Simulation", icon: LineChart },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-3 bg-ink-1/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-fg-0">
          <Sprout className="w-5 h-5 text-sage" aria-hidden />
          Advisory&nbsp;Lab
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/portfolio"
                ? pathname === "/portfolio"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-ink-3 text-fg-0"
                    : "text-fg-2 hover:text-fg-1 hover:bg-ink-2"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
