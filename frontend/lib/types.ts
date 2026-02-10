/**
 * TypeScript Types for Escape Room Finder API
 */

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  city: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_review_count: number | null;
}

export interface Room {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  theme: string | null;
  sub_themes: string[] | null;
  difficulty: number | null;
  min_players: number | null;
  max_players: number | null;
  optimal_players: number | null;
  duration_minutes: number | null;
  // Pricing
  min_price_per_person: number | null;
  max_price_per_person: number | null;
  price_per_person: boolean | null;
  success_rate: number | null;
  primary_image_url: string | null;
  view_count: number;
  is_featured: boolean;
  distance_km: number | null;
  venue: Venue;
}

export interface MapResponse {
  total: number;
  page: number;
  page_size: number;
  rooms: Room[];
}

export interface MapFilters {
  lat: number;
  lng: number;
  radius?: number;
  theme?: string;
  min_difficulty?: number;
  max_difficulty?: number;
  min_players?: number;
  max_players?: number;
  group_size?: number;
  max_price?: number;
  min_rating?: number;
  sort_by?: 'distance' | 'rating' | 'price' | 'difficulty' | 'popularity';
  page?: number;
  page_size?: number;
}

export interface ThemesResponse {
  themes: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  error?: string;
}

export interface RoomDetail {
  id: number;
  name: string;
  description: string | null;
  theme: string | null;
  difficulty: number | null;
  min_players: number | null;
  max_players: number | null;
  duration_minutes: number | null;
  // Pricing for detail view – min/max plus a convenient "from" price
  price_min: number | null;
  price_max: number | null;
  price: number | null;
  currency: string | null;
  success_rate: number | null;
  primary_image_url: string | null;
  image_urls: string[];
  venue: {
    name: string;
    city: string;
    address: string | null;
    phone: string | null;
    website: string | null;
  } | null;
}