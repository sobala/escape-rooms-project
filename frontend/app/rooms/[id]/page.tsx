'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { useRoomById, formatPlayerRange } from '@/lib/api-client';

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'rgba(107,127,103,0.15)',
  2: 'rgba(107,127,103,0.15)',
  3: 'rgba(184,155,98,0.12)',
  4: 'rgba(168,96,90,0.12)',
  5: 'rgba(92,40,36,0.2)',
};

export default function RoomDetailPage() {
  const params = useParams();

  let roomId: number | null = null;
  if (params?.id) {
    const parsed = parseInt(params.id as string, 10);
    if (!isNaN(parsed) && parsed > 0) {
      roomId = parsed;
    }
  }

  const { room, loading, error } = useRoomById(roomId);

  useEffect(() => {
    if (error) {
      console.error('Room fetch error:', error);
    }
  }, [error, roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="mt-4 text-sm text-[var(--foreground-muted)]">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Invalid Room ID
          </h1>
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">The room ID in the URL is invalid.</p>
          <Link
            href="/map"
            className="mt-8 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
          >
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  if (error || (!loading && !room)) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Room Not Found
          </h1>
          <p className="mt-4 text-sm text-[var(--foreground-muted)]">
            {error || `Room with ID ${roomId} does not exist.`}
          </p>
          <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left text-sm text-[var(--foreground-muted)]">
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
            <p><strong>Room ID:</strong> {roomId}</p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/debug/room/${roomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-medium text-[var(--accent)] hover:underline"
            >
              Check room status
            </a>
          </div>
          <Link
            href="/map"
            className="mt-8 inline-block rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]"
          >
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  const getDifficultyLabel = (difficulty: number | null) => {
    if (!difficulty) return 'Unknown';
    const labels: Record<number, string> = {
      1: 'Very Easy',
      2: 'Easy',
      3: 'Medium',
      4: 'Hard',
      5: 'Expert',
    };
    return labels[difficulty] || `${difficulty}/5`;
  };

  const formatPriceRange = (
    priceMin: number | null,
    priceMax: number | null,
    fallbackPrice: number | null,
    currency: string | null
  ): { main: string | null; subtitle: string | null } => {
    const symbol = currency === 'GBP' || !currency ? '£' : '£';
    const fmt = (value: number) => value.toFixed(2);

    if (priceMin != null && priceMax != null) {
      if (priceMin === priceMax) {
        return { main: `${symbol}${fmt(priceMin)}`, subtitle: 'per person' };
      }
      return {
        main: `${symbol}${fmt(priceMin)}–${symbol}${fmt(priceMax)}`,
        subtitle: 'per person',
      };
    }

    if (priceMin != null) {
      return {
        main: `${symbol}${fmt(priceMin)}`,
        subtitle: 'per person (from)',
      };
    }

    if (priceMax != null) {
      return {
        main: `${symbol}${fmt(priceMax)}`,
        subtitle: 'per person (up to)',
      };
    }

    if (fallbackPrice != null) {
      return { main: `${symbol}${fmt(fallbackPrice)}`, subtitle: 'per person' };
    }

    return { main: null, subtitle: null };
  };

  const difficultyBg = room.difficulty ? DIFFICULTY_COLORS[room.difficulty] ?? 'rgba(107,127,103,0.15)' : 'rgba(107,127,103,0.15)';
  const difficultyText = room.difficulty === 1 || room.difficulty === 2 ? '#9BAA97' : room.difficulty === 3 ? '#D4C4A0' : '#D4A09A';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/map"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Map
        </Link>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
          {/* Hero - image or gradient */}
          <div className="relative min-h-[12rem] sm:min-h-[14rem]">
            {room.primary_image_url ? (
              <>
                <img
                  src={room.primary_image_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                  }}
                />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #2C2E28 0%, #343632 50%, #242620 100%)' }}
              />
            )}
            <div className="relative p-8 sm:p-10">
              <h1
                className={`text-2xl font-semibold tracking-tight sm:text-3xl ${
                  room.primary_image_url ? 'text-white drop-shadow-md' : 'text-[var(--foreground)]'
                }`}
              >
                {room.name}
              </h1>
              {room.theme && (
              <span
                className={`mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-medium ${
                  room.primary_image_url
                    ? 'border border-white/40 bg-white/20 text-white backdrop-blur-sm'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
                }`}
              >
                  {room.theme}
                </span>
              )}
              {room.venue && (
                <p
                  className={`mt-4 ${
                    room.primary_image_url ? 'text-white/95' : 'text-[var(--foreground-muted)]'
                  }`}
                >
                  {room.venue.name} · {room.venue.city}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="grid gap-8 p-6 md:grid-cols-3 md:p-8">
            <div className="md:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                  About This Room
                </h2>
                {room.description ? (
                  <p className="mt-4 whitespace-pre-line leading-relaxed text-[var(--foreground-muted)]">
                    {room.description}
                  </p>
                ) : (
                  <p className="mt-4 italic text-[var(--foreground-muted)]">No description available.</p>
                )}
              </section>

              {/* Room Details */}
              <section>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                  Room Details
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {room.difficulty !== null && (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-alt)] p-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Difficulty
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium"
                          style={{ backgroundColor: difficultyBg, color: difficultyText }}
                        >
                          {getDifficultyLabel(room.difficulty)} ({room.difficulty}/5)
                        </span>
                      </div>
                    </div>
                  )}

                  {room.duration_minutes && (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-alt)] p-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Duration
                      </div>
                      <div className="mt-1 font-semibold text-[var(--foreground)]">
                        {room.duration_minutes} minutes
                      </div>
                    </div>
                  )}

                  {(room.min_players || room.max_players) && (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-alt)] p-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Group Size
                      </div>
                      <div className="mt-1 font-semibold text-[var(--foreground)]">
                        {formatPlayerRange(room.min_players, room.max_players, null)}
                      </div>
                    </div>
                  )}

                  {room.success_rate !== null && (
                    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-alt)] p-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Success Rate
                      </div>
                      <div className="mt-1 font-semibold text-[var(--foreground)]">
                        {room.success_rate.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Venue Information */}
              {room.venue && (
                <section>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                    Venue Information
                  </h2>
                  <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background-alt)] p-5 space-y-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                        Address
                      </div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">
                        {room.venue.address || 'Address not available'}
                      </div>
                    </div>
                    {room.venue.phone && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                          Phone
                        </div>
                        <div className="mt-1 font-medium text-[var(--foreground)]">
                          <a
                            href={`tel:${room.venue.phone}`}
                            className="text-[var(--accent)] hover:underline"
                          >
                            {room.venue.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <div className="rounded-[var(--radius-lg)] border-2 border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="text-center">
                  {(() => {
                    const { main, subtitle } = formatPriceRange(
                      (room as any).price_min ?? null,
                      (room as any).price_max ?? null,
                      room.price,
                      room.currency
                    );
                    if (!main) {
                      return <div className="text-[var(--foreground-muted)]">Price on venue website</div>;
                  }
                    return (
                      <>
                        <div className="text-3xl font-semibold text-[var(--foreground)]">
                          {main}
                        </div>
                        {subtitle && (
                          <div className="mt-1 text-sm text-[var(--foreground-muted)]">{subtitle}</div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {room.venue?.website ? (
                  <a
                    href={room.venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--accent)] py-4 px-6 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-accent)] transition-all hover:bg-[var(--accent-hover)]"
                  >
                    Book Now →
                  </a>
                ) : (
                  <button
                    disabled
                    className="mt-6 w-full rounded-full bg-[var(--border-subtle)] py-4 px-6 text-sm font-medium text-[var(--foreground-muted)] cursor-not-allowed"
                  >
                    Booking Unavailable
                  </button>
                )}

                <p className="mt-4 text-center text-xs text-[var(--foreground-muted)]">
                  You&apos;ll be redirected to the venue&apos;s website to complete your booking.
                </p>
              </div>

              {/* Quick Info */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Quick Info
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {room.theme && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--foreground-muted)]">Theme</span>
                      <span className="font-medium text-[var(--foreground)]">{room.theme}</span>
                    </div>
                  )}
                  {room.difficulty !== null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--foreground-muted)]">Difficulty</span>
                      <span className="font-medium text-[var(--foreground)]">{room.difficulty}/5</span>
                    </div>
                  )}
                  {room.duration_minutes && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--foreground-muted)]">Duration</span>
                      <span className="font-medium text-[var(--foreground)]">{room.duration_minutes} min</span>
                    </div>
                  )}
                  {(room.min_players || room.max_players) && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--foreground-muted)]">Players</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {room.min_players ?? '?'}–{room.max_players ?? '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/map"
                className="flex w-full items-center justify-center rounded-full border border-[var(--border)] bg-transparent py-3 px-6 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                View on Map
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
