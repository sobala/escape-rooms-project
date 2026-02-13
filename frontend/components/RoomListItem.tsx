'use client';

import Link from 'next/link';
import type { RoomCardData } from '@/components/RoomCard';

const DIFFICULTY_CONFIG = [
  { level: 1, label: 'Easy', bg: 'rgba(107,127,103,0.15)', text: '#9BAA97' },
  { level: 2, label: 'Easy', bg: 'rgba(107,127,103,0.15)', text: '#9BAA97' },
  { level: 3, label: 'Medium', bg: 'rgba(184,155,98,0.12)', text: '#D4C4A0' },
  { level: 4, label: 'Hard', bg: 'rgba(168,96,90,0.12)', text: '#D4A09A' },
  { level: 5, label: 'Expert', bg: 'rgba(92,40,36,0.2)', text: '#D4A09A' },
];

function getDifficultyStyle(difficulty: number | null) {
  if (!difficulty) return DIFFICULTY_CONFIG[2];
  return DIFFICULTY_CONFIG[Math.min(Math.max(difficulty - 1, 0), 4)];
}

function formatPriceRange(
  priceMin: number | null,
  priceMax: number | null,
  fallbackPrice: number | null,
  currency: string | null
): string {
  const symbol = currency === 'GBP' || !currency ? '£' : '£';
  const fmt = (value: number) => value.toFixed(0);

  if (priceMin != null && priceMax != null) {
    if (priceMin === priceMax) {
      return `${symbol}${fmt(priceMin)}`;
    }
    return `${symbol}${fmt(priceMin)}–${symbol}${fmt(priceMax)}`;
  }

  if (priceMin != null) {
    return `From ${symbol}${fmt(priceMin)}`;
  }

  if (priceMax != null) {
    return `Up to ${symbol}${fmt(priceMax)}`;
  }

  if (fallbackPrice != null) {
    return `${symbol}${fmt(fallbackPrice)}`;
  }

  return 'Price on request';
}

export default function RoomListItem({ room }: { room: RoomCardData }) {
  const difficultyStyle = getDifficultyStyle(room.difficulty);

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex items-center gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition-all hover:border-[var(--accent)]/20 hover:bg-[var(--accent-muted)]/30 sm:gap-6 sm:p-5"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-[var(--border-subtle)] sm:h-24 sm:w-32">
        {room.primary_image_url ? (
          <img
            src={room.primary_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--border-subtle)]" />
        )}
        <div className="absolute top-2 left-2">
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: difficultyStyle.bg,
              color: difficultyStyle.text,
            }}
          >
            {difficultyStyle.label}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] truncate sm:line-clamp-1">
          {room.name}
        </h3>
        {room.venue_name && (
          <p className="mt-0.5 truncate text-sm text-[var(--foreground-muted)]">{room.venue_name}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {room.theme && (
            <span className="text-xs text-[var(--foreground-muted)]">{room.theme}</span>
          )}
          {room.city && (
            <span className="text-xs text-[var(--foreground-muted)]">{room.city}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-semibold text-[var(--foreground)]">
          {formatPriceRange(room.price_min, room.price_max, room.price, room.currency)}
        </div>
        <div className="text-xs text-[var(--foreground-muted)]">/ person</div>
        <span className="mt-1 inline-flex items-center text-sm font-medium text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors">
          View →
        </span>
      </div>
    </Link>
  );
}
