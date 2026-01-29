'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--warm-gray)]/15 bg-[var(--cream)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight text-[var(--foreground)]"
        >
          escaperoomsnearme.io
        </Link>
        <nav className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/' ? 'text-[var(--foreground)]' : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
            }`}
          >
            Home
          </Link>
          <Link
            href="/browse"
            className={`text-sm font-medium transition-colors ${
              pathname === '/browse' ? 'text-[var(--foreground)]' : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
            }`}
          >
            Browse
          </Link>
          <Link
            href="/map"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/map' ? 'text-[var(--accent)]' : 'text-[var(--accent)] hover:text-[var(--accent-hover)]'
            }`}
          >
            Map
          </Link>
        </nav>
      </div>
    </header>
  );
}
