import InteractiveMap from '@/components/Map';

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 relative">
        <InteractiveMap />
      </div>
    </div>
  );
}
