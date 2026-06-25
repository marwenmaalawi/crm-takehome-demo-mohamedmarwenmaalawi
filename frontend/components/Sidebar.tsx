'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t, type Locale } from '@/lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Icon, type IconName } from './Icon';

export function Sidebar({ locale, year }: { locale: Locale; year: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: { href: string; label: string; icon: IconName }[] = [
    { href: '/', label: t(locale, 'nav.dashboard'), icon: 'dashboard' },
    { href: '/pipeline', label: t(locale, 'nav.pipeline'), icon: 'pipeline' },
    { href: '/opportunities', label: t(locale, 'nav.opportunities'), icon: 'opportunities' },
    { href: '/clients', label: t(locale, 'nav.clients'), icon: 'clients' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const navLink = (item: (typeof items)[number], onClick?: () => void) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={[
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'border-l-[3px] border-brand-600 bg-brand-50 pl-[9px] text-brand-700'
            : 'border-l-[3px] border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        ].join(' ')}
      >
        <Icon
          name={item.icon}
          size={18}
          className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* ── Mobile / tablet: sticky top bar + collapsible drawer (below lg) ── */}
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
          <div className="border-t border-slate-100 px-3 pb-4 pt-2">
            <nav className="flex flex-col gap-0.5">
              {items.map((item) => navLink(item, () => setOpen(false)))}
            </nav>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
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
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex xl:w-60">
        {/* Logo + app name */}
        <div className="shrink-0 border-b border-slate-100 px-5 py-5">
          <div className="text-base font-semibold text-slate-900">{t(locale, 'app.name')}</div>
          <div className="mt-0.5 text-xs text-slate-400">{t(locale, 'app.tagline')}</div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => navLink(item))}
        </nav>

        <div className="flex-1" />

        {/* Footer: language switcher + version */}
        <div className="shrink-0 border-t border-slate-100 px-4 py-4">
          <LanguageSwitcher locale={locale} />
          <div className="mt-3 text-[11px] leading-relaxed text-slate-400">
            <div className="font-medium text-slate-500">v1.0.0</div>
            <div>© {year} Mohamed Marwen Maalawi</div>
          </div>
        </div>
      </aside>
    </>
  );
}
