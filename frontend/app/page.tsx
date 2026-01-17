'use client';

import { useState, useEffect } from 'react';

interface Room {
  id: number;
  name: string;
  theme: string;
  difficulty: number;
  price: number;
  city: string;
}

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/rooms')
      .then(res => res.json())
      .then(data => {
        setRooms(data.rooms);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading rooms...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          Escape Room Finder
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div 
              key={room.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                {room.name}
              </h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-semibold">Theme:</span> {room.theme}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Difficulty:</span> {room.difficulty}/5
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Price:</span> ${room.price}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">City:</span> {room.city}
                </p>
              </div>
              <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}