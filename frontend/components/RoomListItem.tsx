'use client';

import Link from 'next/link';
import type { RoomCardData } from '@/components/RoomCard';

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
  return currency === 'GBP' ? `£${price.toFixed(0)}` : `£${price.toFixed(0)}`;
}

export default function RoomListItem({ room }: { room: RoomCardData }) {
  const difficultyStyle = getDifficultyStyle(room.difficulty);

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--warm-gray)]/10 p-4 transition-all duration-200 hover:border-[var(--warm-gray)]/20 sm:gap-6 sm:p-5"
      style={{
        backgroundColor: '#faf8f5',
        boxShadow: '0 4px 20px rgba(45,42,38,0.06)',
      }}
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--warm-gray)]/15 sm:h-24 sm:w-32">
        {room.primary_image_url ? (
          <img
            src={room.primary_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(212,163,115,0.25) 0%, rgba(132,169,140,0.2) 100%)`,
            }}
          />
        )}
        <div className="absolute top-1.5 left-1.5">
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: difficultyStyle.bg,
              color: difficultyStyle.text,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {difficultyStyle.label}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-serif font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] truncate sm:line-clamp-1">
          {room.name}
        </h3>
        {room.venue_name && (
          <p className="mt-0.5 truncate text-sm text-[var(--warm-gray)]">{room.venue_name}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {room.theme && (
            <span className="inline-block rounded-full border border-[var(--warm-gray)]/20 px-2.5 py-0.5 text-xs text-[var(--warm-gray)]">
              {room.theme}
            </span>
          )}
          {room.city && (
            <span className="text-xs text-[var(--warm-gray)]">{room.city}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-semibold text-[var(--foreground)]">
          {formatPrice(room.price, room.currency)}
        </div>
        <div className="text-xs text-[var(--warm-gray)]">/ person</div>
        <span
          className="mt-2 inline-flex items-center text-sm font-semibold text-[var(--accent)] transition-colors group-hover:text-[var(--accent-hover)]"
        >
          Discover
          <svg className="ml-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
