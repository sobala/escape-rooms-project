'use client';

import Link from 'next/link';

export interface RoomCardData {
  id: number;
  name: string;
  theme: string | null;
  difficulty: number | null;
  price: number | null;
  currency: string | null;
  venue_name: string | null;
  city: string | null;
  primary_image_url?: string | null;
  duration_minutes?: number | null;
}

const DIFFICULTY_CONFIG = [
  { level: 1, label: 'Easy', bg: '#84a98c', text: '#2d2a26' },
  { level: 2, label: 'Easy', bg: '#84a98c', text: '#2d2a26' },
  { level: 3, label: 'Medium', bg: '#d4a373', text: '#2d2a26' },
  { level: 4, label: 'Hard', bg: '#c1666b', text: '#f5f1e8' },
  { level: 5, label: 'Expert', bg: '#6b4e71', text: '#f5f1e8' },
];

function getDifficultyStyle(difficulty: number | null) {
  if (!difficulty) return DIFFICULTY_CONFIG[2];
  return DIFFICULTY_CONFIG[Math.min(Math.max(difficulty - 1, 0), 4)];
}

function formatPrice(price: number | null, currency: string | null): string {
  if (price == null) return 'Price on request';
  if (currency === 'GBP') return `£${price.toFixed(0)}`;
  return `£${price.toFixed(0)}`;
}

export default function RoomCard({ room }: { room: RoomCardData }) {
  const difficultyStyle = getDifficultyStyle(room.difficulty);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 transition-all duration-300 hover:border-[var(--warm-gray)]/30 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: '#e2dfd4',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(0,0,0,0.06), 0 12px 40px rgba(45,80,22,0.14)',
      }}
    >
      <Link href={`/rooms/${room.id}`} className="flex min-h-0 flex-1 flex-col">
        {/* 16:9 image area - photo or placeholder */}
        <div className="relative aspect-video shrink-0 overflow-hidden rounded-t-2xl bg-[var(--warm-gray)]/20">
          {room.primary_image_url ? (
            <>
              <img
                src={room.primary_image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {/* Overlay for depth and text contrast */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%), radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.2) 100%)',
                }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(30,45,25,0.5) 0%, rgba(20,35,18,0.7) 40%, rgba(15,25,12,0.85) 100%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 60% at 50% 85%, rgba(201,166,107,0.18) 0%, transparent 50%), radial-gradient(ellipse 100% 80% at 50% 50%, rgba(45,80,22,0.2) 0%, transparent 60%)',
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.25) 80%, rgba(0,0,0,0.45) 100%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)',
                }}
              />
            </>
          )}
          <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
          {/* Difficulty badge - pops from dark background */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: difficultyStyle.bg,
                color: difficultyStyle.text,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {difficultyStyle.label}
            </span>
          </div>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col p-6"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          {/* Room title - deep olive for weight */}
          <h3 className="font-serif text-xl font-semibold leading-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] line-clamp-2" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>
            {room.name}
          </h3>
          {/* Venue: fixed 2 lines of space */}
          <p className="mt-1.5 min-h-[2.5rem] line-clamp-2 text-sm leading-tight text-[var(--warm-gray)]">
            {room.venue_name || '\u00A0'}
          </p>
          {room.theme && (
            <span className="mt-3 self-start inline-block rounded-full border border-[var(--warm-gray)]/25 px-3 py-1 text-xs font-medium text-[var(--warm-gray)]">
              {room.theme}
            </span>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <span className="text-base font-semibold text-[var(--foreground)]">
              {formatPrice(room.price, room.currency)}
              <span className="ml-1 font-normal text-[var(--warm-gray)] text-sm">/ person</span>
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 group-hover:shadow-lg"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 10px rgba(63,95,74,0.3)',
              }}
            >
              Discover
              <svg className="ml-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
