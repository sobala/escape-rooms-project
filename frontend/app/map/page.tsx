import MapView from '@/components/MapView';

export default function MapPage() {
  return (
    <div className="h-screen w-full">
      <MapView 
        initialLat={51.5074}
        initialLng={-0.1278}
        initialZoom={11}
      />
    </div>
  );
}
