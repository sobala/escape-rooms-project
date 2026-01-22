'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRoomsMap, useThemes, formatPrice, formatDistance, getDifficultyColor } from '@/lib/api-client';
import type { Room, MapFilters } from '@/lib/types';

interface MapViewProps {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

export default function MapView({
  initialLat = 40.7516,
  initialLng = -73.9800,
  initialZoom = 11
}: MapViewProps) {
  console.log('MapView rendering with:', { initialLat, initialLng, initialZoom });
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<MapFilters>({
    lat: initialLat,
    lng: initialLng,
    radius: 10,
    page: 1,
    page_size: 100,
  });
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch data from API
  const { data, loading, error } = useRoomsMap(filters);
  const { themes } = useThemes();
  
  // =========================================================================
  // Initialize Map
  // =========================================================================
  
  useEffect(() => {
    console.log('=== MAP INIT ===');
    console.log('map.current:', map.current);
    console.log('mapContainer.current:', mapContainer.current);
    
    if (!mapContainer.current) {
        console.log('No container');
        return;
    }
    
    if (map.current) {
        console.log('Map already exists, skipping');
        return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
        console.error('Mapbox token not found!');
        return;
    }

    console.log('Creating map...');
    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [initialLng, initialLat],
        zoom: initialZoom,
    });
    
    console.log('Map created:', map.current);
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
        enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    });
    
    map.current.addControl(geolocateControl, 'top-right');
    
    /*map.current.on('moveend', () => {
        if (!map.current) return;
        
        const center = map.current.getCenter();
        setFilters(prev => ({
        ...prev,
        lat: center.lat,
        lng: center.lng,
        }));
    });*/
    
    map.current.on('load', () => {
        console.log('Map loaded!');
        setMapLoaded(true);

        // Force resize to fix rendering
        setTimeout(() => {
            map.current?.resize();
        }, 100);
    });
    
    return () => {
        console.log('Cleanup');
        map.current?.remove();
        map.current = null;
    };
    }, [initialLat, initialLng, initialZoom]); // Changed from []
  
  // =========================================================================
  // Update Markers when Data Changes
  // =========================================================================
  
  useEffect(() => {
    if (!map.current || !mapLoaded || !data?.rooms) return;
    
    console.log('Adding markers for', data.rooms.length, 'rooms');
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    // Add new markers
    data.rooms.forEach(room => {
        const { venue } = room;
        if (!venue.latitude || !venue.longitude) return;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.cursor = 'pointer';
        
        // Color based on difficulty
        const color = getDifficultyColor(room.difficulty);
        el.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            background: ${color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : color === 'orange' ? '#f97316' : '#ef4444'};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
        ">
            ${room.difficulty || '?'}
        </div>
        `;
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
        .setLngLat([venue.longitude, venue.latitude])
        .addTo(map.current!);
        
        // Add click handler
        el.addEventListener('click', () => {
        setSelectedRoom(room);
        
        // Fly to marker
        map.current?.flyTo({
            center: [venue.longitude!, venue.latitude!],
            zoom: 14,
            duration: 1000
        });
        });
        
        markers.current.push(marker);
    });
    }, [data?.rooms, mapLoaded]);
  
  // =========================================================================
  // Filter Handlers
  // =========================================================================
  
  const updateFilter = useCallback((key: keyof MapFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters({
      lat: filters.lat,
      lng: filters.lng,
      radius: 10,
      page: 1,
      page_size: 100,
    });
  }, [filters.lat, filters.lng]);
  
  // =========================================================================
  // Render
  // =========================================================================
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ 
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '100%'
        }} 
        />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-10">
          Loading rooms...
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-10">
          {error}
        </div>
      )}
      
      {/* Filter Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg z-10 max-w-sm">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {data?.total || 0} Rooms Found
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {showFilters ? 'Hide' : 'Filters'}
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Theme Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Theme</label>
              <select
                value={filters.theme || ''}
                onChange={(e) => updateFilter('theme', e.target.value || undefined)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Themes</option>
                {themes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <div className="flex gap-2">
                <select
                  value={filters.min_difficulty || ''}
                  onChange={(e) => updateFilter('min_difficulty', e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border rounded"
                >
                  <option value="">Min</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="self-center">to</span>
                <select
                  value={filters.max_difficulty || ''}
                  onChange={(e) => updateFilter('max_difficulty', e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 border rounded"
                >
                  <option value="">Max</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            
            {/* Group Size Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Group Size</label>
              <input
                type="number"
                min="1"
                max="20"
                value={filters.group_size || ''}
                onChange={(e) => updateFilter('group_size', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Number of players"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Price (per person)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={filters.max_price || ''}
                onChange={(e) => updateFilter('max_price', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="$"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            
            {/* Radius Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Radius: {filters.radius}km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.radius || 10}
                onChange={(e) => updateFilter('radius', Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                value={filters.sort_by || 'distance'}
                onChange={(e) => updateFilter('sort_by', e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="difficulty">Difficulty</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
            
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Selected Room Card */}
      {selectedRoom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl z-10 max-w-md w-full mx-4">
          <div className="relative">
            {selectedRoom.primary_image_url && (
              <img
                src={selectedRoom.primary_image_url}
                alt={selectedRoom.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}
            <button
              onClick={() => setSelectedRoom(null)}
              className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full hover:bg-black/70"
            >
              ×
            </button>
          </div>
          
          <div className="p-4">
            <h3 className="text-xl font-bold mb-1">{selectedRoom.name}</h3>
            <p className="text-gray-600 mb-2">{selectedRoom.venue.name}</p>
            
            {selectedRoom.short_description && (
              <p className="text-sm text-gray-700 mb-3">
                {selectedRoom.short_description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRoom.theme && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {selectedRoom.theme}
                </span>
              )}
              {selectedRoom.difficulty && (
                <span className={`px-2 py-1 text-xs rounded bg-${getDifficultyColor(selectedRoom.difficulty)}-100 text-${getDifficultyColor(selectedRoom.difficulty)}-700`}>
                  Difficulty: {selectedRoom.difficulty}/5
                </span>
              )}
              {selectedRoom.distance_km && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {formatDistance(selectedRoom.distance_km)}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              {selectedRoom.base_price && (
                <div>
                  <span className="font-medium">Price:</span> {formatPrice(selectedRoom.base_price, selectedRoom.price_per_person)}
                </div>
              )}
              {selectedRoom.duration_minutes && (
                <div>
                  <span className="font-medium">Duration:</span> {selectedRoom.duration_minutes} min
                </div>
              )}
              {(selectedRoom.min_players || selectedRoom.max_players) && (
                <div>
                  <span className="font-medium">Players:</span> {selectedRoom.min_players}-{selectedRoom.max_players}
                </div>
              )}
              {selectedRoom.venue.google_rating && (
                <div>
                  <span className="font-medium">Rating:</span> ⭐ {selectedRoom.venue.google_rating}/5
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <a
                href={`/rooms/${selectedRoom.slug}`}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
              >
                View Details
              </a>
              {selectedRoom.venue.website && (
                <a
                  href={selectedRoom.venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
                >
                  Book Now
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-xs font-medium mb-2">Difficulty</div>
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
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Hard (4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Expert (5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
