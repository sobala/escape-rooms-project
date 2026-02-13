'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // check initial state
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showBackground = !isHome || scrolled;

  return (
    <header
      className={`sticky top-0 z-20 backdrop-blur-[1px] transition-colors duration-200 ${
        showBackground ? 'bg-[var(--background)]/97' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={`text-lg font-semibold tracking-tight ${
            isHome && !scrolled ? 'text-[#E2E4DE]' : 'text-[var(--foreground)]'
          }`}
        >
          Escape Room Near Me
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === '/'
                ? isHome && !scrolled ? 'text-[#E2E4DE]' : 'text-[var(--foreground)]'
                : isHome && !scrolled ? 'text-[#8A8C86] hover:text-[#E2E4DE]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Home
          </Link>
          <Link
            href="/browse"
            className={`text-sm font-medium transition-colors ${
              pathname === '/browse'
                ? isHome && !scrolled ? 'text-[#E2E4DE]' : 'text-[var(--foreground)]'
                : isHome && !scrolled ? 'text-[#8A8C86] hover:text-[#E2E4DE]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Browse
          </Link>
          <Link
            href="/map"
            className={`text-sm font-medium transition-colors ${
              pathname === '/map'
                ? 'text-[var(--accent)] font-semibold'
                : isHome && !scrolled ? 'text-[#8A8C86] hover:text-[var(--accent)]' : 'text-[var(--foreground-muted)] hover:text-[var(--accent)]'
            }`}
          >
            Map
          </Link>
        </nav>
      </div>
    </header>
  );
}
