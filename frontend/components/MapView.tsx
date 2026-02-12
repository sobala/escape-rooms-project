'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Room {
  id: number;
  name: string;
  theme: string;
  difficulty: number;
  price_min?: number | null;
  price_max?: number | null;
  price?: number | null;
  currency: string;
  venue_name: string;
  city: string;
  latitude: number;
  longitude: number;
  primary_image_url?: string | null;
}

interface MapViewProps {
  rooms: Room[];
}

function offsetPins(rooms: Room[]): Room[] {
  const grouped = new Map<string, Room[]>();

  rooms.forEach((room) => {
    if (!room.latitude || !room.longitude) return;

    const key = `${room.latitude},${room.longitude}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(room);
  });

  const offsetRooms: Room[] = [];

  grouped.forEach((roomsAtLocation) => {
    if (roomsAtLocation.length === 1) {
      offsetRooms.push(roomsAtLocation[0]);
    } else {
      roomsAtLocation.forEach((room, index) => {
        const angle = (index / roomsAtLocation.length) * 2 * Math.PI;
        const radius = 0.0008;

        offsetRooms.push({
          ...room,
          latitude: room.latitude + Math.cos(angle) * radius,
          longitude: room.longitude + Math.sin(angle) * radius,
        });
      });
    }
  });

  return offsetRooms;
}

function formatPrice(room: Room): string {
  const symbol = room.currency === 'GBP' || !room.currency ? '£' : '£';
  const fmt0 = (value: number) => value.toFixed(0);

  const min = room.price_min ?? null;
  const max = room.price_max ?? null;
  const fallback = room.price ?? null;

  if (min != null && max != null) {
    if (min === max) return `${symbol}${fmt0(min)}`;
    return `${symbol}${fmt0(min)}–${symbol}${fmt0(max)}`;
  }
  if (min != null) return `From ${symbol}${fmt0(min)}`;
  if (max != null) return `Up to ${symbol}${fmt0(max)}`;
  if (fallback != null) return `${symbol}${fmt0(fallback)}`;
  return 'Price on request';
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

export default function MapView({ rooms }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filteredRooms, setFilteredRooms] = useState<Room[]>(rooms);
  const [themeFilter, setThemeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');

  // Update filtered rooms when filters change
  useEffect(() => {
    let filtered = rooms;

    if (themeFilter) {
      filtered = filtered.filter((r) => r.theme === themeFilter);
    }

    if (difficultyFilter) {
      filtered = filtered.filter((r) => r.difficulty === Number(difficultyFilter));
    }

    setFilteredRooms(filtered);
  }, [rooms, themeFilter, difficultyFilter]);

  const uniqueThemes = Array.from(new Set(rooms.map((r) => r.theme).filter(Boolean)));

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      console.error('Mapbox token not found!');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-0.1276, 51.5074],
      zoom: 11,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || !filteredRooms.length) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const offsetRooms = offsetPins(filteredRooms);

    offsetRooms.forEach((room) => {
      if (!room.latitude || !room.longitude || !room.id) return;

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';

      const getColor = (diff: number) => {
        if (diff <= 2) return '#84a98c';
        if (diff === 3) return '#d4a373';
        if (diff === 4) return '#c1666b';
        return '#6b4e71';
      };

      const isSelected = selectedRoom?.id === room.id;

      el.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: ${getColor(room.difficulty)};
            border: ${isSelected ? '4px' : '2px'} solid ${isSelected ? '#2d2a26' : 'white'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <span style="
            transform: rotate(45deg);
            font-weight: bold;
            color: white;
            font-size: 12px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">
            ${room.difficulty || '?'}
            </span>
        </div>
        `;

      const marker = new mapboxgl.Marker(el).setLngLat([room.longitude, room.latitude]).addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedRoom(room);
        map.current?.flyTo({
          center: [room.longitude, room.latitude],
          zoom: 14,
          duration: 400,
        });
      });

      markersRef.current.push(marker);
    });

    if (offsetRooms.length > 0 && !selectedRoom) {
      const bounds = new mapboxgl.LngLatBounds();

      offsetRooms.forEach((room) => {
        if (room.latitude && room.longitude) {
          bounds.extend([room.longitude, room.latitude]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 13,
      });
    }
  }, [filteredRooms, mapLoaded, selectedRoom?.id]);

  return (
    <div className="flex h-full w-full flex-col lg:flex-row">
      {/* Left sidebar - list + filters */}
      <aside
        className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden border-r-0 border-b border-[var(--warm-gray)]/15 lg:max-h-none lg:w-[340px] lg:border-b-0 lg:border-r"
        style={{
          backgroundColor: 'var(--cream-white)',
          boxShadow: '1px 0 0 rgba(107,101,96,0.06)',
        }}
      >
        {/* Filters */}
        <div className="shrink-0 border-b border-[var(--warm-gray)]/12 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-[var(--foreground)]">
              {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-colors"
            >
              {showFilters ? 'Hide' : 'Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--warm-gray)]">Theme</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setThemeFilter('')}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      !themeFilter
                        ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)]'
                        : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    All
                  </button>
                  {uniqueThemes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setThemeFilter(theme)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        themeFilter === theme
                          ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)]'
                          : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--warm-gray)]">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--warm-gray)]/25 bg-white px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  <option value="">All</option>
                  <option value="1">1 – Very easy</option>
                  <option value="2">2 – Easy</option>
                  <option value="3">3 – Medium</option>
                  <option value="4">4 – Hard</option>
                  <option value="5">5 – Expert</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setThemeFilter('');
                  setDifficultyFilter('');
                }}
                className="w-full rounded-lg border border-[var(--warm-gray)]/15 px-3 py-2 text-xs font-medium text-[var(--warm-gray)] transition-colors hover:bg-[var(--warm-gray)]/8"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Room list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredRooms.map((room) => {
            const difficultyStyle = getDifficultyStyle(room.difficulty);
            const isSelected = selectedRoom?.id === room.id;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoom(room)}
                className={`w-full border-b border-[var(--warm-gray)]/8 px-4 py-3 text-left transition-colors hover:bg-[var(--warm-gray)]/6 ${
                  isSelected ? 'bg-[var(--warm-gray)]/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: difficultyStyle.bg }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">{room.name}</p>
                    <p className="truncate text-xs text-[var(--warm-gray)]">
                      {room.venue_name}
                      {room.city ? ` · ${room.city}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[var(--foreground)]">
                    {formatPrice(room)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail tile - opens when room selected */}
        {selectedRoom && (
          <div
            className="shrink-0 border-t border-[var(--warm-gray)]/12 p-4"
            style={{
              backgroundColor: 'var(--cream)',
              boxShadow: '0 -4px 20px rgba(45,42,38,0.06)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-serif font-semibold text-[var(--foreground)]">{selectedRoom.name}</h3>
                <p className="mt-0.5 text-sm text-[var(--warm-gray)]">{selectedRoom.venue_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="shrink-0 rounded-full p-1.5 text-[var(--warm-gray)] hover:bg-[var(--warm-gray)]/15 hover:text-[var(--foreground)] transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: getDifficultyStyle(selectedRoom.difficulty).bg,
                  color: getDifficultyStyle(selectedRoom.difficulty).text,
                }}
              >
                {getDifficultyStyle(selectedRoom.difficulty).label}
              </span>
              {selectedRoom.theme && (
                <span className="rounded-full border border-[var(--warm-gray)]/25 px-2 py-0.5 text-xs text-[var(--warm-gray)]">
                  {selectedRoom.theme}
                </span>
              )}
              <span className="text-sm font-semibold text-[var(--foreground)]">{formatPrice(selectedRoom)}</span>
            </div>

            <Link
              href={`/rooms/${selectedRoom.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 2px 8px rgba(63,95,74,0.3)',
              }}
            >
              View details
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </aside>

      {/* Map */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={mapContainer}
          className="h-full w-full"
          style={{ minHeight: 'calc(100vh - 140px)' }}
        />

        {/* Legend */}
        <div
          className="absolute bottom-4 right-4 z-10 rounded-xl border px-3 py-2.5 shadow-lg"
          style={{
            backgroundColor: 'var(--cream)',
            borderColor: 'rgba(107,101,96,0.15)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h4 className="mb-1.5 font-serif text-xs font-semibold text-[var(--foreground)]">Difficulty</h4>
          <div className="space-y-1 text-[11px] text-[var(--warm-gray)]">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#84a98c' }} />
              <span>Easy (1–2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#d4a373' }} />
              <span>Medium (3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#c1666b' }} />
              <span>Hard (4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#6b4e71' }} />
              <span>Expert (5)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
