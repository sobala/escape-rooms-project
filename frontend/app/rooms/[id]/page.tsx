'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoomById, formatPrice, formatDifficulty, formatPlayerRange } from '@/lib/api-client';

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Parse room ID from URL
  let roomId: number | null = null;
  if (params?.id) {
    const parsed = parseInt(params.id as string, 10);
    if (!isNaN(parsed) && parsed > 0) {
      roomId = parsed;
    }
  }
  
  const { room, loading, error } = useRoomById(roomId);

  // Debug logging
  useEffect(() => {
    console.log('📄 Room Detail Page - Params:', params);
    console.log('📄 Room Detail Page - Parsed Room ID:', roomId);
    console.log('📄 Room Detail Page - Raw param ID:', params?.id);
    if (roomId) {
      console.log('✅ Valid room ID, will fetch:', roomId);
    } else {
      console.warn('⚠️ Invalid room ID from params:', params?.id);
    }
  }, [params, roomId]);

  useEffect(() => {
    if (error) {
      console.error('❌ Room fetch error:', error);
      console.error('❌ Error details:', {
        roomId,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        fullUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/rooms/${roomId}`
      });
    }
  }, [error, roomId]);

  useEffect(() => {
    if (room) {
      console.log('✅ Room loaded successfully:', room);
    }
  }, [room]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Invalid Room ID</h1>
          <p className="text-gray-600 mb-6">The room ID in the URL is invalid.</p>
          <button
            onClick={() => router.push('/map')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (error || (!loading && !room)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || `Room with ID ${roomId} does not exist.`}
          </p>
          <div className="text-sm text-gray-500 mb-4 bg-gray-100 p-4 rounded">
            <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
            <p><strong>Room ID:</strong> {roomId}</p>
            <p><strong>Requested URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/rooms/{roomId}</p>
            <p className="mt-2 text-xs">
              💡 Debug: <a 
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/debug/room/${roomId}`} 
                target="_blank" 
                className="text-blue-600 underline"
              >
                Check room status
              </a>
            </p>
          </div>
          <button
            onClick={() => router.push('/map')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  // Type guard: ensure room is not null before rendering
  if (!room) {
    return null;
  }

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'bg-gray-500';
    if (difficulty <= 2) return 'bg-green-500';
    if (difficulty === 3) return 'bg-yellow-500';
    if (difficulty === 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDifficultyLabel = (difficulty: number | null) => {
    if (!difficulty) return 'Unknown';
    const labels = ['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
    return labels[difficulty] || `${difficulty}/5`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/map')}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Map
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4">{room.name}</h1>
                {room.theme && (
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    {room.theme}
                  </div>
                )}
                {room.venue && (
                  <p className="text-blue-100 text-lg">
                    📍 {room.venue.name} • {room.venue.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-8 p-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Room</h2>
                {room.description ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{room.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available.</p>
                )}
              </section>

              {/* Details Grid */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {room.difficulty !== null && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getDifficultyColor(room.difficulty)}`}></div>
                        <span className="font-semibold text-gray-900">
                          {getDifficultyLabel(room.difficulty)} ({room.difficulty}/5)
                        </span>
                      </div>
                    </div>
                  )}

                  {room.duration_minutes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Duration</div>
                      <div className="font-semibold text-gray-900">{room.duration_minutes} minutes</div>
                    </div>
                  )}

                  {(room.min_players || room.max_players) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Group Size</div>
                      <div className="font-semibold text-gray-900">
                        {formatPlayerRange(room.min_players, room.max_players, null)}
                      </div>
                    </div>
                  )}

                  {room.success_rate !== null && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                      <div className="font-semibold text-gray-900">{room.success_rate.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Venue Information */}
              {room.venue && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue Information</h2>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Address</div>
                      <div className="font-medium text-gray-900">
                        {room.venue.address || 'Address not available'}
                      </div>
                    </div>
                    {room.venue.phone && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Phone</div>
                        <div className="font-medium text-gray-900">
                          <a href={`tel:${room.venue.phone}`} className="text-blue-600 hover:text-blue-700">
                            {room.venue.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="text-center mb-6">
                  {room.price !== null ? (
                    <div>
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {room.currency === 'GBP' ? '£' : '$'}{room.price.toFixed(2)}
                      </div>
                      <div className="text-gray-600 text-sm">per person</div>
                    </div>
                  ) : (
                    <div className="text-gray-600">Price available on venue website</div>
                  )}
                </div>

                {room.venue?.website ? (
                  <a
                    href={room.venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-600 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    Book Now →
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full bg-gray-400 text-white text-center py-4 px-6 rounded-lg font-semibold text-lg cursor-not-allowed"
                  >
                    Booking Unavailable
                  </button>
                )}

                <p className="text-xs text-gray-500 text-center mt-4">
                  You'll be redirected to the venue's website to complete your booking.
                </p>
              </div>

              {/* Quick Info */}
              <div className="bg-white border rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-gray-900">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  {room.theme && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Theme:</span>
                      <span className="font-medium text-gray-900">{room.theme}</span>
                    </div>
                  )}
                  {room.difficulty !== null && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium text-gray-900">{room.difficulty}/5</span>
                    </div>
                  )}
                  {room.duration_minutes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">{room.duration_minutes} min</span>
                    </div>
                  )}
                  {(room.min_players || room.max_players) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Players:</span>
                      <span className="font-medium text-gray-900">
                        {room.min_players || '?'}-{room.max_players || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Link */}
              <a
                href="/map"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 text-center py-3 px-6 rounded-lg font-medium transition-colors"
              >
                View on Map
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
