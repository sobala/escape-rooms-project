'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { useRoomById, formatPlayerRange } from '@/lib/api-client';

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#84a98c',
  2: '#84a98c',
  3: '#d4a373',
  4: '#c1666b',
  5: '#6b4e71',
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
          <div
            className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
            style={{ borderTopColor: 'transparent' }}
          />
          <p className="mt-4 font-medium text-[var(--warm-gray)]">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Invalid Room ID
          </h1>
          <p className="mt-4 text-[var(--warm-gray)]">The room ID in the URL is invalid.</p>
          <Link
            href="/map"
            className="mt-8 rounded-full bg-[var(--gold)] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
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
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Room Not Found
          </h1>
          <p className="mt-4 text-[var(--warm-gray)]">
            {error || `Room with ID ${roomId} does not exist.`}
          </p>
          <div
            className="mt-6 rounded-2xl border border-[var(--warm-gray)]/15 p-4 text-left text-sm text-[var(--warm-gray)]"
            style={{ backgroundColor: 'var(--cream)' }}
          >
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
            className="mt-8 inline-block rounded-full bg-[var(--gold)] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
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

  const difficultyBg = room.difficulty ? DIFFICULTY_COLORS[room.difficulty] ?? '#84a98c' : '#84a98c';
  const difficultyText = room.difficulty === 4 || room.difficulty === 5 ? '#f5f1e8' : '#2d2a26';

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

        <div
          className="overflow-hidden rounded-2xl border border-[var(--warm-gray)]/10"
          style={{ boxShadow: '0 8px 32px rgba(45,42,38,0.08)' }}
        >
          {/* Hero */}
          <div
            className="p-8 text-white sm:p-10"
            style={{ background: 'linear-gradient(135deg, #f1efe6 0%, #f3efe6 50%, #f0eee5 100%)' }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                  {room.name}
                </h1>
                {room.theme && (
                  <span
                    className="mt-3 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
                  >
                    {room.theme}
                  </span>
                )}
                {room.venue && (
                  <p className="mt-4 text-[#e8e4dc]">
                    {room.venue.name} · {room.venue.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid gap-8 p-6 md:grid-cols-3 md:p-8">
            <div className="md:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  About This Room
                </h2>
                {room.description ? (
                  <p className="mt-4 whitespace-pre-line leading-relaxed text-[var(--warm-gray)]">
                    {room.description}
                  </p>
                ) : (
                  <p className="mt-4 italic text-[var(--warm-gray)]">No description available.</p>
                )}
              </section>

              {/* Room Details */}
              <section>
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  Room Details
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {room.difficulty !== null && (
                    <div
                      className="rounded-2xl border border-[var(--warm-gray)]/10 p-4"
                      style={{ backgroundColor: 'var(--cream)' }}
                    >
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--warm-gray)]">
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
                    <div
                      className="rounded-2xl border border-[var(--warm-gray)]/10 p-4"
                      style={{ backgroundColor: 'var(--cream)' }}
                    >
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--warm-gray)]">
                        Duration
                      </div>
                      <div className="mt-1 font-semibold text-[var(--foreground)]">
                        {room.duration_minutes} minutes
                      </div>
                    </div>
                  )}

                  {(room.min_players || room.max_players) && (
                    <div
                      className="rounded-2xl border border-[var(--warm-gray)]/10 p-4"
                      style={{ backgroundColor: 'var(--cream)' }}
                    >
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--warm-gray)]">
                        Group Size
                      </div>
                      <div className="mt-1 font-semibold text-[var(--foreground)]">
                        {formatPlayerRange(room.min_players, room.max_players, null)}
                      </div>
                    </div>
                  )}

                  {room.success_rate !== null && (
                    <div
                      className="rounded-2xl border border-[var(--warm-gray)]/10 p-4"
                      style={{ backgroundColor: 'var(--cream)' }}
                    >
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--warm-gray)]">
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
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    Venue Information
                  </h2>
                  <div
                    className="mt-4 rounded-2xl border border-[var(--warm-gray)]/10 p-5 space-y-4"
                    style={{ backgroundColor: 'var(--cream)' }}
                  >
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--warm-gray)]">
                        Address
                      </div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">
                        {room.venue.address || 'Address not available'}
                      </div>
                    </div>
                    {room.venue.phone && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wider text-[var(--warm-gray)]">
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
              <div
                className="rounded-2xl border-2 border-[var(--accent)]/20 p-6"
                style={{ backgroundColor: 'var(--cream)' }}
              >
                <div className="text-center">
                  {room.price !== null ? (
                    <>
                      <div className="font-serif text-4xl font-semibold text-[var(--foreground)]">
                        {room.currency === 'GBP' ? '£' : '$'}{room.price.toFixed(2)}
                      </div>
                      <div className="mt-1 text-sm text-[var(--warm-gray)]">per person</div>
                    </>
                  ) : (
                    <div className="text-[var(--warm-gray)]">Price on venue website</div>
                  )}
                </div>

                {room.venue?.website ? (
                  <a
                    href={room.venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--gold)] py-4 px-6 font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Book Now →
                  </a>
                ) : (
                  <button
                    disabled
                    className="mt-6 w-full rounded-full bg-[var(--warm-gray)]/30 py-4 px-6 font-semibold text-[var(--warm-gray)] cursor-not-allowed"
                  >
                    Booking Unavailable
                  </button>
                )}

                <p className="mt-4 text-center text-xs text-[var(--warm-gray)]">
                  You&apos;ll be redirected to the venue&apos;s website to complete your booking.
                </p>
              </div>

              {/* Quick Info */}
              <div
                className="rounded-2xl border border-[var(--warm-gray)]/10 p-6"
                style={{ backgroundColor: 'var(--cream)', boxShadow: '0 4px 20px rgba(45,42,38,0.06)' }}
              >
                <h3 className="font-serif text-lg font-semibold text-[var(--foreground)]">
                  Quick Info
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {room.theme && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--warm-gray)]">Theme</span>
                      <span className="font-medium text-[var(--foreground)]">{room.theme}</span>
                    </div>
                  )}
                  {room.difficulty !== null && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--warm-gray)]">Difficulty</span>
                      <span className="font-medium text-[var(--foreground)]">{room.difficulty}/5</span>
                    </div>
                  )}
                  {room.duration_minutes && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--warm-gray)]">Duration</span>
                      <span className="font-medium text-[var(--foreground)]">{room.duration_minutes} min</span>
                    </div>
                  )}
                  {(room.min_players || room.max_players) && (
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--warm-gray)]">Players</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {room.min_players ?? '?'}–{room.max_players ?? '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/map"
                className="flex w-full items-center justify-center rounded-full border-2 border-[var(--warm-gray)]/20 bg-transparent py-3 px-6 font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--warm-gray)]/10"
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
