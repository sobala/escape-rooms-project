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
        if (diff <= 2) return '#10b981';
        if (diff === 3) return '#f59e0b';
        if (diff === 4) return '#ef4444';
        return '#7c3aed';
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
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            "
            onmouseover="this.style.background='#2563eb'"
            onmouseout="this.style.background='#3b82f6'"
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
      
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg z-10 max-w-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {filteredRooms.length} Rooms
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className="p-4 space-y-4">
            {/* Theme Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={themeFilter}
                onChange={(e) => setThemeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">All Themes</option>
                {uniqueThemes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="1">1 - Very Easy</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Expert</option>
              </select>
            </div>
            
            <button
              onClick={() => {
                setThemeFilter('');
                setDifficultyFilter('');
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Selected Room Card */}
      {selectedRoom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl z-10 max-w-md w-full mx-4">
          
          
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <h4 className="font-bold mb-2 text-sm">Difficulty</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Easy (1-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>Medium (3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Hard (4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600"></div>
            <span>Expert (5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}