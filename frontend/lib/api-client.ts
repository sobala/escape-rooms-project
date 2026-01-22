/**
 * API Client for Escape Room Finder
 * Includes React hooks for easy data fetching
 */

import { useState, useEffect } from 'react';
import type { Room, MapResponse, MapFilters, ThemesResponse, RoomDetail } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Core API Functions
// ============================================================================

export async function fetchRoomsMap(filters: MapFilters): Promise<MapResponse> {
  const params = new URLSearchParams();
  
  // Add all non-null parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(`${API_BASE_URL}/api/rooms/map?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch rooms: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchRoomBySlug(slug: string): Promise<Room> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${slug}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Room not found');
    }
    throw new Error(`Failed to fetch room: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchRoomById(id: number): Promise<RoomDetail> {
  const url = `${API_BASE_URL}/api/rooms/${id}`;
  console.log('Fetching room from:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    if (response.status === 404) {
      throw new Error('Room not found');
    }
    throw new Error(`Failed to fetch room: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Room data received:', data);
  return data;
}

export async function fetchThemes(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/themes`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch themes: ${response.statusText}`);
  }
  
  const data: ThemesResponse = await response.json();
  return data.themes;
}

export async function trackRoomView(roomId: number, sessionId?: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/rooms/${roomId}/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to fetch rooms for map view with filters
 */
export function useRoomsMap(filters: MapFilters) {
  const [data, setData] = useState<MapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchRoomsMap(filters);
        
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load rooms');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [filters.lat, filters.lng, filters.radius, filters.theme, filters.min_difficulty, filters.max_difficulty, filters.group_size, filters.max_price, filters.sort_by]); // Re-fetch when filters change
  
  return { data, loading, error };
}

/**
 * Hook to fetch a single room by slug
 */
export function useRoom(slug: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!slug) {
      setRoom(null);
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    
    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRoomBySlug(slug as string);
        
        if (isMounted) {
          setRoom(data);
          
          // Track view
          if (data.id) {
            trackRoomView(data.id).catch(console.error);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load room');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadRoom();
    
    return () => {
      isMounted = false;
    };
  }, [slug]);
  
  return { room, loading, error };
}

/**
 * Hook to fetch a single room by ID
 */
export function useRoomById(id: number | null) {
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) {
      setRoom(null);
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    
    async function loadRoom() {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading room with ID:', id);
        const data = await fetchRoomById(id as number);
        
        if (isMounted) {
          setRoom(data);
          
          // Track view
          trackRoomView(data.id).catch(console.error);
        }
      } catch (err) {
        console.error('Error loading room:', err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load room';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadRoom();
    
    return () => {
      isMounted = false;
    };
  }, [id]);
  
  return { room, loading, error };
}

/**
 * Hook to fetch available themes
 */
export function useThemes() {
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    async function loadThemes() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchThemes();
        
        if (isMounted) {
          setThemes(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load themes');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    loadThemes();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  return { themes, loading, error };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(price: number | null | undefined, perPerson: boolean | null | undefined = true): string {
  if (price === null || price === undefined) return 'Price not available';

  const formattedPrice = `$${price.toFixed(2)}`;
  return perPerson ? `${formattedPrice}/person` : formattedPrice;
}

/**
 * Format difficulty for display
 */
export function formatDifficulty(difficulty: number | null): string {
  if (difficulty === null) return 'Unknown';
  
  const levels = ['Easy', 'Moderate', 'Challenging', 'Hard', 'Expert'];
  return levels[difficulty - 1] || `${difficulty}/5`;
}

/**
 * Format player range
 */
export function formatPlayerRange(
  min: number | null,
  max: number | null,
  optimal: number | null
): string {
  if (!min && !max) return 'Any group size';
  if (min && max && min === max) return `${min} players`;
  if (min && max) return `${min}-${max} players`;
  if (min) return `${min}+ players`;
  if (max) return `Up to ${max} players`;
  return 'Any group size';
}

/**
 * Format distance
 */
export function formatDistance(km: number | null): string {
  if (km === null) return '';
  
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  }
  
  return `${km.toFixed(1)}km away`;
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: number | null): string {
  if (!difficulty) return 'gray';
  
  if (difficulty <= 2) return 'green';
  if (difficulty === 3) return 'yellow';
  if (difficulty === 4) return 'orange';
  return 'red';
}

/**
 * Generate session ID for analytics
 */
export function getSessionId(): string {

  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('escape_room_session');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('escape_room_session', sessionId);
  }
  
  return sessionId;
}