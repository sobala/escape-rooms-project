'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RoomCard from '@/components/RoomCard';
import type { RoomCardData } from '@/components/RoomCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DIFFICULTY_PILLS = [
  { value: 0, label: 'All', dot: null },
  { value: 1, label: 'Easy', dot: '#10b981' },
  { value: 2, label: 'Medium', dot: '#f59e0b' },
  { value: 3, label: 'Hard', dot: '#ef4444' },
  { value: 4, label: 'Expert', dot: '#7c3aed' },
] as const;

export default function Home() {
  const [rooms, setRooms] = useState<RoomCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<number>(0);

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data.rooms ?? []);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = difficultyFilter === 0
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
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            escaperoomsnearme.io
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white font-medium transition-colors">
              Home
            </Link>
            <Link href="/map" className="text-[#3b82f6] hover:text-blue-400 font-semibold transition-colors">
              Map
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero - dark navy/teal, atmospheric */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#0f172a]">
        {/* Atmospheric overlay - dramatic lighting feel */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 20%, rgba(59,130,246,0.15) 0%, transparent 50%),
                              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(124,58,237,0.1) 0%, transparent 40%),
                              linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.8) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f172a]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl">
            DISCOVER YOUR NEXT ADVENTURE IN LONDON
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Find escape rooms by difficulty—from beginner-friendly to expert. Filter, compare, and book your next challenge.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/map"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white rounded-xl bg-[#3b82f6] hover:bg-blue-500 shadow-xl shadow-blue-500/30 transition-all duration-200 border-0"
            >
              Explore Map
            </Link>
            <Link
              href="#featured-rooms"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white rounded-xl border-2 border-white/80 hover:bg-white/10 transition-all duration-200"
            >
              Browse Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Quick filter pills - dark charcoal */}
      <section className="bg-[#374151] border-y border-gray-600/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {DIFFICULTY_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setDifficultyFilter(pill.value)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  difficultyFilter === pill.value
                    ? 'bg-white/15 text-white ring-1 ring-white/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {pill.dot && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: pill.dot }}
                  />
                )}
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rooms - dark section */}
      <section id="featured-rooms" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Featured rooms
          </h2>
          <p className="mt-2 text-gray-400">
            {difficultyFilter === 0
              ? 'Popular escape rooms in London'
              : `Showing ${displayRooms.length} room${displayRooms.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-[#374151] animate-pulse border border-gray-600/50"
              >
                <div className="aspect-video bg-gray-600/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-600/50 rounded w-3/4" />
                  <div className="h-4 bg-gray-600/50 rounded w-1/2" />
                  <div className="h-4 bg-gray-600/50 rounded w-1/4" />
                  <div className="h-6 bg-gray-600/50 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayRooms.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-[#374151] border border-gray-600/50">
            <p className="text-gray-400">No rooms match your filters.</p>
            <button
              onClick={() => setDifficultyFilter(0)}
              className="mt-4 text-[#3b82f6] font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

        {!loading && filteredRooms.length > 9 && (
          <div className="mt-12 text-center">
            <Link
              href="/map"
              className="inline-flex items-center text-[#3b82f6] font-semibold hover:underline"
            >
              View all on map
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* Footer CTA - light slice for readability (40% light) */}
      <section className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Ready to play?
            </h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              Explore all rooms on the map and find one near you.
            </p>
            <Link
              href="/map"
              className="mt-8 inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white rounded-xl bg-[#3b82f6] hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-colors"
            >
              Open map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
