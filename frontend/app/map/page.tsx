'use client';

import { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import MapView from '@/components/MapView';

interface Room {
  id: number;
  name: string;
  theme: string;
  difficulty: number;
  // Pricing from /api/rooms: min/max plus a convenient "from" price
  price_min?: number | null;
  price_max?: number | null;
  price?: number | null;
  currency: string;
  latitude: number;
  longitude: number;
  venue_name: string;
  city: string;
}

export default function MapPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    fetch(`${API_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data.rooms ?? []);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background)]">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="font-serif text-xl text-[var(--warm-gray)]">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)]">
      <SiteHeader />
      <div
        className="border-b border-[var(--warm-gray)]/12 px-4 py-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: 'var(--cream-white)' }}
      >
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Escape Rooms Map
        </h1>
        <p className="mt-1 text-[var(--warm-gray)]">
          {rooms.length} room{rooms.length !== 1 ? 's' : ''} across London
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <MapView rooms={rooms} />
      </div>
    </main>
  );
}