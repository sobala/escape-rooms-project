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
      style: 'mapbox://styles/sobala/cmlksm1gv00kp01s91oehdctc',
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
        if (diff <= 2) return '#6B7F67';
        if (diff === 3) return '#B89B62';
        if (diff === 4) return '#A8605A';
        return '#5C2824';
      };

      const isSelected = selectedRoom?.id === room.id;

      el.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: ${getColor(room.difficulty)};
            border: ${isSelected ? '4px' : '2px'} solid ${isSelected ? '#ECEEE9' : 'white'};
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
        className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden border-r-0 border-b border-[var(--border)] bg-[var(--surface)] lg:max-h-none lg:w-[340px] lg:border-b-0 lg:border-r"
      >
        {/* Filters */}
        <div className="shrink-0 border-b border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--accent-muted)]/50"
            >
              {showFilters ? 'Hide' : 'Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--foreground-muted)]">Theme</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setThemeFilter('')}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      !themeFilter
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    All
                  </button>
                  {uniqueThemes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setThemeFilter(theme)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      themeFilter === theme
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                        : 'border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--foreground-muted)]">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
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
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-hover)]"
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
                className={`w-full border-b border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)] ${
                  isSelected ? 'bg-[var(--surface-hover)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: difficultyStyle.bg }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">{room.name}</p>
                    <p className="truncate text-xs text-[var(--foreground-muted)]">
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
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--background-alt)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">{selectedRoom.name}</h3>
                <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">{selectedRoom.venue_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="shrink-0 rounded-full p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition-colors"
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
                <span className="text-xs text-[var(--foreground-muted)]">{selectedRoom.theme}</span>
              )}
              <span className="text-sm font-semibold text-[var(--foreground)]">{formatPrice(selectedRoom)}</span>
            </div>

            <Link
              href={`/rooms/${selectedRoom.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] shadow-[var(--shadow-accent)] transition-all hover:bg-[var(--accent-hover)]"
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

        {/* Legend – matches sidebar surface, subtle border */}
        <div className="absolute bottom-4 right-4 z-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 shadow-[var(--shadow-card)]">
          <h4 className="mb-1.5 text-xs font-semibold text-[var(--foreground)]">Difficulty</h4>
          <div className="space-y-1 text-[11px] text-[var(--foreground-muted)]">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#6B7F67' }} />
              <span>Easy (1–2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#B89B62' }} />
              <span>Medium (3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#A8605A' }} />
              <span>Hard (4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#5C2824' }} />
              <span>Expert (5)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
