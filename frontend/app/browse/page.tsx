'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import RoomCard from '@/components/RoomCard';
import RoomListItem from '@/components/RoomListItem';
import type { RoomCardData } from '@/components/RoomCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DIFFICULTY_OPTIONS = [
  { value: 0, label: 'All', color: null },
  { value: 1, label: 'Easy', color: '#84a98c' },
  { value: 2, label: 'Medium', color: '#d4a373' },
  { value: 3, label: 'Hard', color: '#c1666b' },
  { value: 4, label: 'Expert', color: '#6b4e71' },
] as const;

const DURATION_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'under60', label: 'Under 60 min' },
  { value: '60-90', label: '60–90 min' },
  { value: '90plus', label: '90+ min' },
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
  primary_image_url?: string | null;
  duration_minutes?: number | null;
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
    primary_image_url: room.primary_image_url ?? null,
    duration_minutes: room.duration_minutes ?? null,
  };
}

type ViewMode = 'tile' | 'list';

function filterRooms(
  rooms: RoomCardData[],
  difficultyFilter: number,
  themeFilter: string,
  durationFilter: string
): RoomCardData[] {
  let filtered = rooms;

  if (difficultyFilter > 0) {
    filtered = filtered.filter((r) => {
      if (!r.difficulty) return false;
      if (difficultyFilter === 1) return r.difficulty <= 2;
      if (difficultyFilter === 2) return r.difficulty === 3;
      if (difficultyFilter === 3) return r.difficulty === 4;
      if (difficultyFilter === 4) return r.difficulty === 5;
      return true;
    });
  }

  if (themeFilter) {
    filtered = filtered.filter(
      (r) => r.theme && r.theme.toLowerCase().includes(themeFilter.toLowerCase())
    );
  }

  if (durationFilter && durationFilter !== '') {
    filtered = filtered.filter((r) => {
      const d = r.duration_minutes ?? 0;
      if (durationFilter === 'under60') return d > 0 && d < 60;
      if (durationFilter === '60-90') return d >= 60 && d <= 90;
      if (durationFilter === '90plus') return d > 90;
      return true;
    });
  }

  return filtered;
}

export default function BrowsePage() {
  const [rooms, setRooms] = useState<RoomCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tile');
  const [difficultyFilter, setDifficultyFilter] = useState(0);
  const [themeFilter, setThemeFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');

  const loadRooms = () => {
    setLoading(true);
    setFetchError(null);
    fetch(`${API_URL}/api/rooms`)
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data.rooms) ? data.rooms : Array.isArray(data) ? data : [];
        setRooms(list.map((r: Record<string, unknown>) => mapApiRoomToCard(r as Parameters<typeof mapApiRoomToCard>[0])));
      })
      .catch((err) => {
        setRooms([]);
        setFetchError(err instanceof Error ? err.message : 'Failed to load rooms');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const themes = Array.from(new Set(rooms.map((r) => r.theme).filter(Boolean))) as string[];
  const filteredRooms = filterRooms(rooms, difficultyFilter, themeFilter, durationFilter);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title + view toggle */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Browse rooms
            </h1>
            <p className="mt-1 text-[var(--warm-gray)]">
              {loading
                ? 'Loading...'
                : `${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''} in London`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-sm text-[var(--warm-gray)]">View:</span>
            <div
              className="inline-flex rounded-full p-1"
              style={{ backgroundColor: 'rgba(45,42,38,0.08)' }}
            >
              <button
                onClick={() => setViewMode('tile')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'tile'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Tiles
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
          </div>
        </div>

        {/* Filters - warm panel */}
        <div
          className="mb-8 rounded-2xl border border-[var(--warm-gray)]/12 p-5 sm:p-6"
          style={{ backgroundColor: 'var(--cream-white)', boxShadow: 'var(--shadow-soft)' }}
        >
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--warm-gray)]">
            Filters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficultyFilter(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      difficultyFilter === opt.value
                        ? opt.color
                          ? opt.value === 4
                            ? 'text-[#f5f1e8] shadow-sm'
                            : 'text-[#2d2a26] shadow-sm'
                          : 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)] shadow-sm'
                        : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                    }`}
                    style={
                      difficultyFilter === opt.value && opt.color
                        ? { backgroundColor: opt.color }
                        : difficultyFilter === opt.value
                          ? {}
                          : undefined
                    }
                  >
                    {opt.color && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            difficultyFilter === opt.value ? 'rgba(45,42,38,0.5)' : opt.color,
                        }}
                      />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Theme</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setThemeFilter('')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    !themeFilter
                      ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                  }`}
                >
                  All themes
                </button>
                {themes.sort().map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setThemeFilter(theme)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      themeFilter === theme
                        ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)] shadow-sm'
                        : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value || 'all'}
                    onClick={() => setDurationFilter(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      durationFilter === opt.value
                        ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)] shadow-sm'
                        : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(difficultyFilter > 0 || themeFilter || durationFilter) && (
              <button
                onClick={() => {
                  setDifficultyFilter(0);
                  setThemeFilter('');
                  setDurationFilter('');
                }}
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className={viewMode === 'tile' ? 'grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
            {[...Array(viewMode === 'tile' ? 6 : 8)].map((_, i) => (
              <div
                key={i}
                className={`animate-pulse overflow-hidden rounded-2xl border border-[var(--warm-gray)]/10 ${
                  viewMode === 'list' ? 'flex gap-4 p-4' : ''
                }`}
                style={{ backgroundColor: 'var(--cream)', boxShadow: 'var(--shadow-soft)' }}
              >
                <div className={viewMode === 'tile' ? 'aspect-video bg-[var(--warm-gray)]/15' : 'h-24 w-24 shrink-0 rounded-xl bg-[var(--warm-gray)]/15 sm:h-32 sm:w-32'} />
                <div className="flex-1 space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-[var(--warm-gray)]/20" />
                  <div className="h-3 w-1/2 rounded bg-[var(--warm-gray)]/15" />
                  <div className="mt-2 h-4 w-1/4 rounded bg-[var(--warm-gray)]/15" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div
            className="rounded-2xl border border-[var(--warm-gray)]/12 py-16 text-center"
            style={{ backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow-soft)' }}
          >
            {fetchError ? (
              <>
                <p className="text-[var(--warm-gray)]">Could not load rooms. {fetchError}</p>
                <p className="mt-2 text-sm text-[var(--warm-gray)]/80">API: {API_URL}/api/rooms</p>
                <button
                  onClick={loadRooms}
                  className="mt-4 rounded-full bg-[var(--gold)] px-5 py-2.5 font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Retry
                </button>
              </>
            ) : difficultyFilter > 0 || themeFilter ? (
              <>
                <p className="text-[var(--warm-gray)]">No rooms match your filters.</p>
                <button
                  onClick={() => {
                    setDifficultyFilter(0);
                    setThemeFilter('');
                  }}
                  className="mt-4 font-semibold text-[var(--accent)] hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-[var(--warm-gray)]">No rooms found.</p>
                <p className="mt-2 text-sm text-[var(--warm-gray)]/80">Make sure the backend is running at {API_URL}</p>
                <button
                  onClick={loadRooms}
                  className="mt-4 rounded-full bg-[var(--gold)] px-5 py-2.5 font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        ) : viewMode === 'tile' ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => (
              <RoomListItem key={room.id} room={room} />
            ))}
          </div>
        )}

        {!loading && filteredRooms.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/map"
              className="inline-flex items-center font-semibold text-[var(--accent)] hover:underline"
            >
              View all on map
              <svg className="ml-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
