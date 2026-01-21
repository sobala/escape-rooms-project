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
  latitude: number;
  longitude: number;
  venue_name: string;
  city: string;
}

interface MapViewProps {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export default function MapView({ rooms, onRoomClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!token) {
      console.error('Mapbox token not found!');
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
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
    if (!map.current || !mapLoaded || !rooms.length) return;

    console.log('Adding markers for', rooms.length, 'rooms');

    const getMarkerColor = (difficulty: number) => {
      if (difficulty <= 2) return '#10b981';
      if (difficulty === 3) return '#f59e0b';
      if (difficulty === 4) return '#ef4444';
      return '#7c3aed';
    };

    rooms.forEach((room) => {
      if (!room.latitude || !room.longitude) {
        console.log('Skipping room without coordinates:', room.name);
        return;
      }

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = getMarkerColor(room.difficulty);
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            ${room.name}
          </h3>
          <p style="margin: 4px 0; color: #666; font-size: 14px;">
            <strong>${room.venue_name}</strong>
          </p>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>Theme:</strong> ${room.theme}
          </p>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>Difficulty:</strong> ${room.difficulty}/5
          </p>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>Price:</strong> £${room.price}
          </p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([room.longitude, room.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        if (onRoomClick) {
          onRoomClick(room);
        }
      });
    });

    if (rooms.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      rooms.forEach(room => {
        if (room.latitude && room.longitude) {
          bounds.extend([room.longitude, room.latitude]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 13
      });
    }

  }, [rooms, mapLoaded, onRoomClick]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '600px' }}
      />
      
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg">
        <h4 className="font-bold mb-2 text-sm">Difficulty</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Easy (1-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
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