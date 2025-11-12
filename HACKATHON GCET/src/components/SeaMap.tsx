import { MapContainer, TileLayer, Marker, Circle, useMap, Polygon, useMapEvents, Polyline, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useEffect, useRef } from "react";
import type { Boat } from "@/lib/tracker";
import L from "leaflet";

export type Zone = { id: string; center: { lat: number; lng: number }; radiusMeters: number; color?: string; name?: string };
export type HeatCell = { id: string; polygon: [number, number][], color: string };
export type SOSSignal = { id: string; lat: number; lng: number; time: number; boatId: string };

function Recenter({ center, shouldFollow }: { center: LatLngExpression; shouldFollow: React.MutableRefObject<boolean> }) {
  const map = useMap();
  useEffect(() => {
    if (shouldFollow.current) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map, shouldFollow]);
  return null;
}

export function SeaMap({
  center,
  zones = [],
  safeZones = [],
  heat = [],
  height = 500,
  boats = [],
  onMapClick,
  startPoint,
  route,
  recenterSignal,
  sosSignals = [],
}: {
  center: { lat: number; lng: number } | null;
  zones?: Zone[];
  safeZones?: Zone[];
  heat?: HeatCell[];
  height?: number;
  boats?: Boat[];
  onMapClick?: (lat: number, lng: number) => void;
  startPoint?: { lat: number; lng: number } | null;
  route?: { lat: number; lng: number }[];
  recenterSignal?: number;
  sosSignals?: SOSSignal[];
}) {
  const latlng: LatLngExpression = center ? [center.lat, center.lng] : [16.5062, 80.648];
  
  // Create custom icons for different markers
  const createCustomIcon = (color: string, iconHtml: string) => {
    return L.divIcon({
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconHtml}</div>`,
      className: 'custom-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const userIcon = createCustomIcon('#3b82f6', '👤'); // Blue for user
  const startIcon = createCustomIcon('#10b981', 'S'); // Green for start
  const destIcon = createCustomIcon('#f59e0b', 'D'); // Orange for destination
  const sosIcon = createCustomIcon('#ef4444', '🚨'); // Red for SOS
  const shouldFollowRef = useRef<boolean>(true);
  // Re-enable follow and recentre when recenterSignal changes
  const recenterCounterRef = useRef<number>(0);
  useEffect(() => {
    if (recenterSignal !== undefined && recenterSignal !== recenterCounterRef.current) {
      recenterCounterRef.current = recenterSignal;
      shouldFollowRef.current = true;
    }
  }, [recenterSignal]);
  function ClickCapture() {
    useMapEvents({
      click(e) {
        if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
        shouldFollowRef.current = false;
      },
      dragstart() {
        shouldFollowRef.current = false;
      },
      zoomstart() {
        shouldFollowRef.current = false;
      }
    });
    return null;
  }
  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-border">
      <MapContainer center={latlng} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={latlng} shouldFollow={shouldFollowRef} />
        {center && <Marker position={latlng} icon={userIcon} />}
        {startPoint && <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />}
        <ClickCapture />
        {zones.map((z) => (
          <Circle
            key={z.id}
            center={[z.center.lat, z.center.lng]}
            radius={z.radiusMeters}
            pathOptions={{ color: z.color ?? "#ef4444", fillOpacity: 0.15 }}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-sm text-red-600">{z.name || z.id}</div>
                <div className="text-xs text-gray-600">⚠️ Danger Zone</div>
                <div className="text-xs text-gray-500">Radius: {(z.radiusMeters / 1000).toFixed(1)} km</div>
              </div>
            </Popup>
          </Circle>
        ))}
        {safeZones.map((z) => (
          <Circle
            key={`safe-${z.id}`}
            center={[z.center.lat, z.center.lng]}
            radius={z.radiusMeters}
            pathOptions={{ color: z.color ?? "#10b981", fillOpacity: 0.2 }}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-sm text-green-600">{z.name || z.id}</div>
                <div className="text-xs text-gray-600">✅ Safe Zone</div>
                <div className="text-xs text-gray-500">Radius: {(z.radiusMeters / 1000).toFixed(1)} km</div>
              </div>
            </Popup>
          </Circle>
        ))}
        {heat.map((cell) => (
          <Polygon key={cell.id} positions={cell.polygon as any} pathOptions={{ color: cell.color, fillColor: cell.color, fillOpacity: 0.25, weight: 0 }} />
        ))}
        {boats.map((b) => {
          const color = b.status === "sos" ? "#ef4444" : b.status === "warning" ? "#f59e0b" : "#10b981";
          const boatIcon = createCustomIcon(color, '🚤');
          return (
            <Marker
              key={`boat-${b.id}`}
              position={[b.lat, b.lng]}
              icon={boatIcon}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-sm">Boat #{b.id}</div>
                  <div className="text-xs text-gray-600">Status: {b.status.toUpperCase()}</div>
                  <div className="text-xs text-gray-500">
                    {b.lat.toFixed(4)}°N, {b.lng.toFixed(4)}°E
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {route && route.length >= 2 && (
          <Polyline positions={route.map(p => [p.lat, p.lng]) as any} pathOptions={{ color: '#2563eb', weight: 4 }} />
        )}
        {sosSignals.map((sos) => (
          <Circle
            key={`sos-${sos.id}`}
            center={[sos.lat, sos.lng]}
            radius={100}
            pathOptions={{ 
              color: '#ff0000', 
              fillColor: '#ff0000', 
              fillOpacity: 0.3,
              weight: 3,
              dashArray: '5, 5'
            }}
          />
        ))}
        {sosSignals.map((sos) => (
          <Marker 
            key={`sos-marker-${sos.id}`}
            position={[sos.lat, sos.lng]}
            icon={sosIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-sm text-red-600">🚨 SOS EMERGENCY</div>
                <div className="text-xs text-gray-600">Boat #{sos.boatId}</div>
                <div className="text-xs text-gray-500">
                  {new Date(sos.time).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {sos.lat.toFixed(4)}°N, {sos.lng.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default SeaMap;


