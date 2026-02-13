'use client';

import Link from 'next/link';

export interface RoomCardData {
  id: number;
  name: string;
  theme: string | null;
  difficulty: number | null;
  price_min: number | null;
  price_max: number | null;
  price: number | null;
  currency: string | null;
  venue_name: string | null;
  city: string | null;
  primary_image_url?: string | null;
  duration_minutes?: number | null;
}

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

export default function RoomCard({ room }: { room: RoomCardData }) {
  const difficultyStyle = getDifficultyStyle(room.difficulty);

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all hover:border-[var(--accent)]/25 hover:shadow-[var(--shadow-md)]"
    >
      <div className="relative aspect-video overflow-hidden bg-[var(--border-subtle)]">
        {room.primary_image_url ? (
          <img
            src={room.primary_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #2C2E28 0%, #343632 100%)',
            }}
          />
        )}
        <div className="absolute top-3 left-3">
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: difficultyStyle.bg,
              color: difficultyStyle.text,
            }}
          >
            {difficultyStyle.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent)]">
          {room.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-[var(--foreground-muted)]">
          {room.venue_name || '\u00A0'}
        </p>
        {room.theme && (
          <span className="mt-2 inline-block text-xs text-[var(--foreground-muted)]">
            {room.theme}
          </span>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {formatPriceRange(room.price_min, room.price_max, room.price, room.currency)}
            <span className="ml-1 font-normal text-[var(--foreground-muted)]">/ person</span>
          </span>
          <span className="text-sm font-medium text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
