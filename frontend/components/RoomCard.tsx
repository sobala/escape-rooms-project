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
  { level: 1, label: 'Easy', bg: '#10b981', dot: 'bg-[#10b981]' },
  { level: 2, label: 'Easy', bg: '#10b981', dot: 'bg-[#10b981]' },
  { level: 3, label: 'Medium', bg: '#f59e0b', dot: 'bg-[#f59e0b]' },
  { level: 4, label: 'Hard', bg: '#ef4444', dot: 'bg-[#ef4444]' },
  { level: 5, label: 'Expert', bg: '#7c3aed', dot: 'bg-[#7c3aed]' },
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
    <article className="group bg-[#374151] rounded-xl overflow-hidden shadow-xl shadow-black/20 border border-gray-600/50 hover:shadow-2xl hover:border-gray-500/60 transition-all duration-300 hover:scale-[1.02]">
      <Link href={`/rooms/${room.id}`} className="block">
        {/* 16:9 Image - moody lighting placeholder */}
        <div className="relative aspect-video overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-gray-900/40 to-gray-800/60"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.6) 50%, rgba(51,65,85,0.4) 100%), url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234f46e5' fill-opacity='0.08'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Subtle vignette */}
          <div className="absolute inset-0 ring-inset ring-1 ring-white/5" />
          {/* Difficulty badge - top left */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-lg"
              style={{ backgroundColor: difficultyStyle.bg }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${difficultyStyle.dot}`} />
              {difficultyStyle.label}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-white group-hover:text-[#3b82f6] transition-colors line-clamp-2">
            {room.name}
          </h3>
          {room.venue_name && (
            <p className="mt-1 text-sm text-gray-400">{room.venue_name}</p>
          )}
          {room.theme && (
            <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-gray-600/50 text-gray-300 text-xs font-medium border border-gray-500/30">
              {room.theme}
            </span>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-lg font-bold text-white">
              {formatPrice(room.price, room.currency)}
              <span className="text-gray-400 font-normal text-sm"> / person</span>
            </span>
            <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#3b82f6] text-white text-sm font-semibold shadow-lg shadow-blue-500/25 group-hover:bg-blue-500 transition-colors">
              View Details
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
