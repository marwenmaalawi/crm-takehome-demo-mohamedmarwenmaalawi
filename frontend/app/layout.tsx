import type { Metadata } from 'next';
import './globals.css';
import { getLocale } from '@/lib/server-locale';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'CRM Commercial — Suivi des opportunités',
  description: 'Module CRM interne : clients, opportunités, pipeline.',
  creator: 'Mohamed Marwen Maalawi',
  authors: [{ name: 'Mohamed Marwen Maalawi' }],
  applicationName: 'CRM Commercial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const year = new Date().getFullYear();

  return (
    <html lang={locale}>
      <body data-owner="Mohamed-Marwen-Maalawi">
        <div className="min-h-screen lg:flex">
          <Sidebar locale={locale} year={year} />
          <main className="min-w-0 flex-1 px-4 py-6 md:px-6 xl:px-8 xl:py-8 3xl:px-12">
            {/* Fluid: fills 1366/1080p, caps only on very wide screens for readability. */}
            <div className="mx-auto w-full max-w-[1700px] 3xl:max-w-[2100px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
