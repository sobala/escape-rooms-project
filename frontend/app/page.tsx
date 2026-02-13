'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import RoomCard from '@/components/RoomCard';
import type { RoomCardData } from '@/components/RoomCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function mapApiRoomToCard(room: {
  id: number;
  name: string;
  theme?: string | null;
  difficulty?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  price?: number | null;
  currency?: string | null;
  venue_name?: string | null;
  city?: string | null;
  primary_image_url?: string | null;
  duration_minutes?: number | null;
}): RoomCardData {
  return {
    id: room.id,
    name: room.name,
    theme: room.theme ?? null,
    difficulty: room.difficulty ?? null,
    price_min: room.price_min ?? null,
    price_max: room.price_max ?? null,
    price: room.price ?? null,
    currency: room.currency ?? null,
    venue_name: room.venue_name ?? null,
    city: room.city ?? null,
    primary_image_url: room.primary_image_url ?? null,
    duration_minutes: room.duration_minutes ?? null,
  };
}

export default function Home() {
  const [rooms, setRooms] = useState<RoomCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMiniNav, setShowMiniNav] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/rooms?sort=trending`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.rooms ?? [];
        setRooms(list.map(mapApiRoomToCard));
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = document.getElementById('trending-rooms');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMiniNav(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayRooms = rooms.slice(0, 9);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero + header wrapper – hero extends behind header */}
      <div className="relative">
        <div className="fixed top-0 left-0 right-0 z-30">
          <SiteHeader />
        </div>
        {/* Hero – stairwell background, dark to match content */}
        <section
          className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] pt-14"
        >
        {/* Background image – lifted to de-emphasize LOBBY at bottom */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-no-repeat brightness-95 saturate-90"
          style={{ backgroundImage: 'url(/images/hero-stairwell.png)', backgroundPosition: 'center 20%' }}
          aria-hidden
        />
        {/* Overlay – grey + green, heavier at top/bottom, lighter in middle */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.8) 100%)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(to bottom, rgba(29, 46, 30, 0.45) 0%, rgba(29, 46, 30, 0.22) 40%, rgba(29, 46, 30, 0.22) 60%, rgba(29, 46, 30, 0.38) 100%)',
          }}
          aria-hidden
        />
        {/* Bottom gradient – smooth transition into content */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[20%] min-h-[120px] z-[2] pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #1C1E1A 0%, rgba(28, 30, 26, 0.7) 35%, rgba(28, 30, 26, 0.3) 65%, transparent 100%)',
          }}
          aria-hidden
        />
        {/* Film grain overlay – very subtle */}
        <div
          className="absolute inset-0 z-[3] opacity-[0.11] pointer-events-none grain-overlay"
          aria-hidden
        />
        <div className="relative z-10 max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1
            className="animate-hero-1 text-4xl font-semibold tracking-tight text-[#E2E4DE] sm:text-5xl lg:text-6xl"
          >
            Discover Your Next Adventure in London
          </h1>
          <p
            className="animate-hero-2 mt-6 max-w-xl mx-auto text-base leading-relaxed text-[#8A8C86] sm:text-lg"
          >
            Connect through shared experiences. Find escape rooms that bring friends and families together.
          </p>
          <div className="animate-hero-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-accent)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-lg min-w-[11.5rem]"
            >
              Explore Map
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-full border-[1.5px] border-white/20 px-6 py-3 text-sm font-medium text-[#C8CAC4] transition-all hover:border-white/30 hover:bg-white/5 min-w-[11.5rem]"
            >
              Browse Rooms
            </Link>
          </div>
        </div>

      </section>
      </div>

      {/* Trending rooms */}
      <section
        id="trending-rooms"
        className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10 lg:px-8"
      >
        <div className="mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Trending rooms
          </h2>
          <p className="mt-1.5 text-base text-[var(--foreground-muted)]">
            Most visited in the past 30 days
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
              >
                <div className="aspect-video bg-[var(--border-subtle)]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 rounded bg-[var(--border-subtle)]" />
                  <div className="h-3 w-1/2 rounded bg-[var(--border-subtle)]" />
                  <div className="mt-4 h-9 w-1/3 rounded-lg bg-[var(--border-subtle)]" />
                </div>
              </div>
            ))}
          </div>
        ) : displayRooms.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] py-16 text-center">
            <p className="text-[var(--foreground-muted)]">No rooms found.</p>
            <Link
              href="/browse"
              className="mt-4 inline-block text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Browse rooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayRooms.map((room, i) => (
              <div
                key={room.id}
                className="animate-card-in h-full"
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        )}

        {!loading && rooms.length > 9 && (
          <div className="mt-12 text-center">
            <Link
              href="/map"
              className="inline-flex items-center text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              View all on map
              <svg className="ml-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--background-alt)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
              Ready to play?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-base text-[var(--foreground-muted)]">
              Explore all rooms on the map and find one near you.
            </p>
            <Link
              href="/map"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-accent)] transition-all hover:bg-[var(--accent-hover)]"
            >
              Open map
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky mini-nav – appears when trending section enters viewport */}
      <nav
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-md)] backdrop-blur-sm transition-opacity duration-300 ${
          showMiniNav ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Section navigation"
      >
        <button
          type="button"
          onClick={() => document.getElementById('trending-rooms')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Trending
        </button>
        <span className="text-[var(--border)]" aria-hidden>·</span>
        <Link
          href="/map"
          className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Near You
        </Link>
        <span className="text-[var(--border)]" aria-hidden>·</span>
        <Link
          href="/browse"
          className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Top Rated
        </Link>
      </nav>
    </div>
  );
}
