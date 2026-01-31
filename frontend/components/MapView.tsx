'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Room {
  id: number;
  name: string;
  theme: string;
  difficulty: number;
  price: number;
  currency: string;
  venue_name: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  rooms: Room[];
}

function offsetPins(rooms: Room[]): Room[] {
  const grouped = new Map<string, Room[]>();
  
  rooms.forEach(room => {
    if (!room.latitude || !room.longitude) return;
    
    const key = `${room.latitude},${room.longitude}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(room);
  });
  
  const offsetRooms: Room[] = [];
  
  grouped.forEach(roomsAtLocation => {
    if (roomsAtLocation.length === 1) {
      offsetRooms.push(roomsAtLocation[0]);
    } else {
      roomsAtLocation.forEach((room, index) => {
        const angle = (index / roomsAtLocation.length) * 2 * Math.PI;
        const radius = 0.0008;
        
        offsetRooms.push({
          ...room,
          latitude: room.latitude + (Math.cos(angle) * radius),
          longitude: room.longitude + (Math.sin(angle) * radius),
        });
      });
    }
  });
  
  return offsetRooms;
}

export default function MapView({ rooms }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
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
      filtered = filtered.filter(r => r.theme === themeFilter);
    }
    
    if (difficultyFilter) {
      filtered = filtered.filter(r => r.difficulty === Number(difficultyFilter));
    }
    
    setFilteredRooms(filtered);
  }, [rooms, themeFilter, difficultyFilter]);

  // Get unique themes from rooms
  const uniqueThemes = Array.from(new Set(rooms.map(r => r.theme).filter(Boolean)));

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
      zoom: 11
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully');
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || !filteredRooms.length) return;

    console.log('Adding markers for', filteredRooms.length, 'rooms');

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    const offsetRooms = offsetPins(filteredRooms);

    offsetRooms.forEach((room) => {
      if (!room.latitude || !room.longitude) return;

      // Ensure room has valid ID before creating marker
      if (!room.id) {
        console.warn('Room missing ID, skipping marker:', room);
        return;
      }

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '30px';  // Smaller pins
      el.style.height = '30px';
      el.style.cursor = 'pointer';
      
      const getColor = (diff: number) => {
        if (diff <= 2) return '#84a98c';
        if (diff === 3) return '#d4a373';
        if (diff === 4) return '#c1666b';
        return '#6b4e71';
      };

      el.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: ${getColor(room.difficulty)};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <span style="
            transform: rotate(45deg);
            font-weight: bold;
            color: white;
            font-size: 12px;
            ">
            ${room.difficulty || '?'}
            </span>
        </div>
        `;

      const roomId = room.id;
      console.log('📍 Creating marker for room:', {
        id: roomId,
        name: room.name,
        fullRoom: room
      });
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 12px; min-width: 220px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            ${room.name || 'Unknown Room'}
            </h3>
            <p style="margin: 4px 0; color: #666; font-size: 13px;">
            📍 ${room.venue_name || 'Unknown Venue'}
            </p>
            <p style="margin: 4px 0; font-size: 13px;">
            <strong>Theme:</strong> ${room.theme || 'N/A'}
            </p>
            <p style="margin: 4px 0; font-size: 13px;">
            <strong>Difficulty:</strong> ${room.difficulty || '?'}/5
            </p>
            <p style="margin: 4px 0; font-size: 13px;">
            <strong>Price:</strong> £${room.price || 'N/A'}
            </p>
            <p style="margin: 4px 0; font-size: 11px; color: #999;">
            Room ID: ${roomId}
            </p>
            <button 
            id="room-detail-btn-${roomId}"
            onclick="console.log('🔘 Clicking View Details for room ID:', ${roomId}); window.location.href='/rooms/${roomId}'"
            style="
                width: 100%;
                margin-top: 12px;
                padding: 8px 16px;
                background: #3F5F4A;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            "
            onmouseover="this.style.background='#354f42'"
            onmouseout="this.style.background='#3F5F4A'"
            >
            View Details
            </button>
        </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([room.longitude, room.latitude])
        .setPopup(popup)
        .addTo(map.current!);
        
      el.addEventListener('click', () => {
        
      });
    });

    if (offsetRooms.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      offsetRooms.forEach(room => {
        if (room.latitude && room.longitude) {
          bounds.extend([room.longitude, room.latitude]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 13
      });
    }

  }, [filteredRooms, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '600px' }}
      />
      
      {/* Filter Panel - warm style to match site */}
      <div
        className="absolute top-4 left-4 z-10 max-w-sm rounded-2xl shadow-lg border border-[var(--warm-gray)]/15"
        style={{ backgroundColor: 'var(--cream)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--warm-gray)]/12 p-4">
          <h2 className="font-serif text-lg font-semibold text-[var(--foreground)]">
            {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-colors"
          >
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Theme</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setThemeFilter('')}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    !themeFilter
                      ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                  }`}
                >
                  All themes
                </button>
                {uniqueThemes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setThemeFilter(theme)}
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      themeFilter === theme
                        ? 'bg-[rgba(45,42,38,0.12)] text-[var(--foreground)] shadow-sm'
                        : 'text-[var(--warm-gray)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full rounded-full border border-[var(--warm-gray)]/25 bg-[var(--cream)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                <option value="">All difficulties</option>
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
              className="w-full rounded-full border border-[var(--warm-gray)]/20 bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--warm-gray)] transition-colors hover:bg-[var(--warm-gray)]/10"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      {/* Selected Room Card */}
      {selectedRoom && (
        <div
          className="absolute bottom-4 left-1/2 z-10 mx-4 w-full max-w-md -translate-x-1/2 rounded-2xl border shadow-lg"
          style={{
            backgroundColor: 'var(--cream)',
            borderColor: 'rgba(107,101,96,0.2)',
            boxShadow: 'var(--shadow-card)',
          }}
        />
      )}

      {/* Legend - warm style */}
      <div
        className="absolute bottom-4 right-4 z-10 rounded-2xl border p-4 shadow-lg"
        style={{
          backgroundColor: 'var(--cream)',
          borderColor: 'rgba(107,101,96,0.15)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h4 className="mb-2 font-serif text-sm font-semibold text-[var(--foreground)]">Difficulty</h4>
        <div className="space-y-1.5 text-xs text-[var(--warm-gray)]">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#84a98c' }} />
            <span>Easy (1–2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#d4a373' }} />
            <span>Medium (3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#c1666b' }} />
            <span>Hard (4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#6b4e71' }} />
            <span>Expert (5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}