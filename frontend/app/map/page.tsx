'use client';

import { useState, useEffect } from 'react';
import MapView from '@/components/MapView';

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

export default function MapPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    fetch(`${API_URL}/api/rooms`)
      .then(res => res.json())
      .then(data => {
        console.log('Loaded rooms from API:', data.rooms.length);
        console.log('Room IDs:', data.rooms.map((r: Room) => r.id));
        setRooms(data.rooms);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading rooms:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <p className="text-xl text-gray-300">Loading map...</p>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-[#0f172a]">
      <div className="p-4 bg-[#0f172a] border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Escape Rooms Map</h1>
        <p className="text-gray-400">
          {rooms.length} rooms across London
        </p>
      </div>
      
      <div className="flex-1">
        <MapView rooms={rooms} />
      </div>
    </main>
  );
}