'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t, type Locale } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Sidebar({ locale, year }: { locale: Locale; year: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = [
    { href: '/', label: t(locale, 'nav.dashboard'), icon: '▦' },
    { href: '/pipeline', label: t(locale, 'nav.pipeline'), icon: '▤' },
    { href: '/opportunities', label: t(locale, 'nav.opportunities'), icon: '◇' },
    { href: '/clients', label: t(locale, 'nav.clients'), icon: '◎' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navLink = (item: (typeof items)[number], onClick?: () => void) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        isActive(item.href)
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span aria-hidden className="text-base">{item.icon}</span>
      {item.label}
    </Link>
  );

  return (
    <>
      {/* ── Mobile / tablet: top bar + collapsible drawer (below lg) ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" onClick={() => setOpen(false)} className="leading-tight">
            <span className="block text-base font-semibold text-slate-900">{t(locale, 'app.name')}</span>
            <span className="block text-[11px] text-slate-400">{t(locale, 'app.tagline')}</span>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-lg leading-none text-slate-700 hover:bg-slate-50"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {open ? (
          <div className="border-t border-slate-100 px-3 pb-3 pt-2">
            <nav className="flex flex-col gap-1">
              {items.map((item) => navLink(item, () => setOpen(false)))}
            </nav>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-[11px] leading-tight text-slate-400">
                v1.0.0 · © {year} Mohamed Marwen Maalawi
              </span>
              <div className="w-20 shrink-0">
                <LanguageSwitcher locale={locale} />
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* ── Desktop: sticky full-height vertical sidebar (lg and up) ── */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex xl:w-60 xl:px-4">
        <div className="px-2">
          <div className="text-lg font-semibold text-slate-900">{t(locale, 'app.name')}</div>
          <div className="text-xs text-slate-400">{t(locale, 'app.tagline')}</div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">{items.map((item) => navLink(item))}</nav>

        <div className="flex-1" />

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <LanguageSwitcher locale={locale} />
          <div className="px-1 text-[11px] leading-relaxed text-slate-400">
            <div>v1.0.0</div>
            <div>© {year} Mohamed Marwen Maalawi</div>
          </div>
        </div>
      </aside>
    </>
  );
}
