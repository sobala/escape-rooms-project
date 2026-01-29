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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--warm-gray)]/10 transition-all duration-300 hover:border-[var(--warm-gray)]/20"
      style={{
        backgroundColor: '#faf8f5',
        boxShadow: '0 4px 20px rgba(45,42,38,0.06)',
      }}
    >
      <Link href={`/rooms/${room.id}`} className="flex min-h-0 flex-1 flex-col">
        {/* 16:9 image area - warm, inviting placeholder */}
        <div className="relative aspect-video shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(212,163,115,0.22) 0%, rgba(132,169,140,0.18) 50%, rgba(107,78,113,0.12) 100%), linear-gradient(180deg, rgba(250,248,245,0.15) 0%, rgba(45,42,38,0.25) 100%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2384a98c' fill-opacity='0.08'%3E%3Cpath d='M0 0h30v30H0V0zm30 30h30v30H30V30z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5" />
          {/* Minimal difficulty badge */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: difficultyStyle.bg,
                color: difficultyStyle.text,
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
              }}
            >
              {difficultyStyle.label}
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-6">
          {/* Room title: 1–2 lines */}
          <h3 className="font-serif text-xl font-semibold leading-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] line-clamp-2">
            {room.name}
          </h3>
          {/* Venue: fixed 2 lines of space; short names leave second line empty */}
          <p className="mt-1.5 min-h-[2.5rem] line-clamp-2 text-sm leading-tight text-[var(--warm-gray)]">
            {room.venue_name || '\u00A0'}
          </p>
          {room.theme && (
            <span className="mt-3 self-start inline-block rounded-full border border-[var(--warm-gray)]/20 px-3 py-1 text-xs font-medium text-[var(--warm-gray)]">
              {room.theme}
            </span>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <span className="text-base font-semibold text-[var(--foreground)]">
              {formatPrice(room.price, room.currency)}
              <span className="ml-1 font-normal text-[var(--warm-gray)] text-sm">/ person</span>
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 group-hover:shadow-md"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 2px 10px rgba(45,107,90,0.25)',
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
