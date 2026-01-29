'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import RoomCard from '@/components/RoomCard';
import type { RoomCardData } from '@/components/RoomCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DIFFICULTY_PILLS = [
  { value: 0, label: 'All', color: null },
  { value: 1, label: 'Easy', color: '#84a98c' },
  { value: 2, label: 'Medium', color: '#d4a373' },
  { value: 3, label: 'Hard', color: '#c1666b' },
  { value: 4, label: 'Expert', color: '#6b4e71' },
] as const;

function mapApiRoomToCard(room: {
  id: number;
  name: string;
  theme?: string | null;
  difficulty?: number | null;
  price?: number | null;
  currency?: string | null;
  venue_name?: string | null;
  city?: string | null;
}): RoomCardData {
  return {
    id: room.id,
    name: room.name,
    theme: room.theme ?? null,
    difficulty: room.difficulty ?? null,
    price: room.price ?? null,
    currency: room.currency ?? null,
    venue_name: room.venue_name ?? null,
    city: room.city ?? null,
  };
}

export default function Home() {
  const [rooms, setRooms] = useState<RoomCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<number>(0);

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.rooms ?? [];
        setRooms(list.map(mapApiRoomToCard));
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms =
    difficultyFilter === 0
      ? rooms
      : rooms.filter((r) => {
          if (!r.difficulty) return false;
          if (difficultyFilter === 1) return r.difficulty <= 2;
          if (difficultyFilter === 2) return r.difficulty === 3;
          if (difficultyFilter === 3) return r.difficulty === 4;
          if (difficultyFilter === 4) return r.difficulty === 5;
          return true;
        });

  const displayRooms = filteredRooms.slice(0, 9);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />

      {/* Hero - matches tile background with a hint of green */}
      <section
        className="relative flex min-h-[75vh] items-center justify-center overflow-hidden transition-opacity duration-700 ease-out"
        style={{
          background: 'linear-gradient(160deg, #f1efe6 0%, #f3efe6 40%, #f0eee5 70%, #f2f0e7 100%)',
        }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1
            className="animate-hero-1 font-serif text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl text-[var(--foreground)]"
          >
            Discover Your Next Adventure in London
          </h1>
          <p
            className="animate-hero-2 mt-6 max-w-2xl mx-auto text-lg leading-relaxed sm:text-xl text-[var(--warm-gray)]"
          >
            Connect through shared experiences. Find escape rooms that bring friends and families together—curated by difficulty and theme.
          </p>
          <div className="animate-hero-3 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/50"
              style={{
                backgroundColor: 'var(--gold)',
                boxShadow: 'var(--glow-gold), 0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              Explore Map
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-full border-2 border-[var(--warm-gray)]/40 px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-all duration-300 hover:bg-[var(--warm-gray)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--warm-gray)]/20"
            >
              Browse Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Filter pills - warm neutral bg, organic rounded, natural palette */}
      <section
        className="border-y border-[var(--warm-gray)]/12 transition-colors duration-300"
        style={{ backgroundColor: 'var(--cream-white)' }}
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {DIFFICULTY_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setDifficultyFilter(pill.value)}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300"
                style={
                  difficultyFilter === pill.value
                    ? pill.color
                      ? {
                          backgroundColor: pill.color,
                          color: pill.value === 4 ? '#f5f1e8' : '#2d2a26',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                        }
                      : {
                          backgroundColor: 'rgba(45,42,38,0.12)',
                          color: 'var(--foreground)',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        }
                    : {
                        backgroundColor: 'transparent',
                        color: 'var(--warm-gray)',
                      }
                }
              >
                {pill.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        difficultyFilter === pill.value
                          ? pill.value === 4
                            ? 'rgba(245,241,232,0.9)'
                            : 'rgba(45,42,38,0.6)'
                          : pill.color,
                    }}
                  />
                )}
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rooms grid - cream cards, generous spacing */}
      <section
        id="featured-rooms"
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20"
      >
        <div className="mb-12">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Featured rooms
          </h2>
          <p className="mt-2 text-[var(--warm-gray)]">
            {difficultyFilter === 0
              ? 'Popular escape rooms in London'
              : `${displayRooms.length} room${displayRooms.length !== 1 ? 's' : ''} matching your filter`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-[var(--warm-gray)]/10"
                style={{
                  backgroundColor: 'var(--cream)',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <div className="aspect-video bg-[var(--warm-gray)]/15" />
                <div className="space-y-3 p-6">
                  <div className="h-5 w-3/4 rounded bg-[var(--warm-gray)]/20" />
                  <div className="h-4 w-1/2 rounded bg-[var(--warm-gray)]/15" />
                  <div className="h-4 w-1/4 rounded bg-[var(--warm-gray)]/15" />
                  <div className="mt-4 h-10 w-1/3 rounded-lg bg-[var(--warm-gray)]/15" />
                </div>
              </div>
            ))}
          </div>
        ) : displayRooms.length === 0 ? (
          <div
            className="rounded-2xl border border-[var(--warm-gray)]/12 py-16 text-center"
            style={{ backgroundColor: 'var(--cream)', boxShadow: 'var(--shadow-soft)' }}
          >
            <p className="text-[var(--warm-gray)]">No rooms match your filter.</p>
            <button
              onClick={() => setDifficultyFilter(0)}
              className="mt-4 font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
            {displayRooms.map((room, i) => (
              <div
                key={room.id}
                className="animate-card-in h-full"
                style={{ animationDelay: `${Math.min(i * 80, 400)}ms` }}
              >
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredRooms.length > 9 && (
          <div className="mt-14 text-center">
            <Link
              href="/map"
              className="inline-flex items-center font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              View all on map
              <svg className="ml-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* Footer CTA - warm slice */}
      <section
        className="border-t border-[var(--warm-gray)]/12"
        style={{ backgroundColor: 'var(--cream-white)' }}
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Ready to play?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--warm-gray)]">
              Explore all rooms on the map and find one near you.
            </p>
            <Link
              href="/map"
              className="mt-8 inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 4px 20px rgba(63,95,74,0.3)',
              }}
            >
              Open map
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
