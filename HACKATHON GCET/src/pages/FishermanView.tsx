import { AlertTriangle, Navigation, Phone, Waves, MapPin, Globe, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { speak, speakWithLanguage, getTTSLocale } from '@/hooks/useTTS';
import { useGeofencing, type DangerZone } from '@/hooks/useGeofencing';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import SeaMap from '@/components/SeaMap';
import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/weather';
import { fetchMarine } from '@/lib/marine';
import { computeRiskScore, toHeatColor } from '@/lib/risk';
import { addSOS, getNearbySOS, getBoats, mockTick, type Boat, flushOfflineSOS, getSOS, getNotifications, clearNotifications, updateFishermanPosition, type Notification } from '@/lib/tracker';
import { generateAdvisory } from '@/lib/gemini';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { bearingDegrees, cardinalFromBearing, estimateDurationMinutes, formatDistance, haversineMeters } from '@/lib/utils';

const FishermanView = () => {
  const { language, t } = useLanguage();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [apiAlert, setApiAlert] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [offlinePrediction, setOfflinePrediction] = useState<null | { weather: any; marine: any; time: number }>(null);

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>({ lat: 16.5062, lng: 80.648 });

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const zones: DangerZone[] = useMemo(() => [
    // Coastal Water Danger Zones - Positioned in the ocean near shore
    { id: 'vetapalem-waters', center: { lat: 15.75, lng: 80.35 }, radiusMeters: 3000, color: '#ef4444', name: 'Vetapalem Coastal Waters' },
    { id: 'chirala-waters', center: { lat: 15.80, lng: 80.40 }, radiusMeters: 2500, color: '#f59e0b', name: 'Chirala Fishing Waters' },
    { id: 'bapatla-waters', center: { lat: 15.88, lng: 80.52 }, radiusMeters: 4000, color: '#dc2626', name: 'Bapatla High Risk Waters' },
    { id: 'nizampatnam-waters', center: { lat: 15.92, lng: 80.70 }, radiusMeters: 3000, color: '#ef4444', name: 'Nizampatnam Coastal Waters' },
    
    // Delta Region Water Zones
    { id: 'repalle-waters', center: { lat: 16.08, lng: 80.90 }, radiusMeters: 3500, color: '#b91c1c', name: 'Repalle Delta Waters' },
    { id: 'avanigadda-waters', center: { lat: 16.15, lng: 81.00 }, radiusMeters: 3000, color: '#f59e0b', name: 'Avanigadda River Waters' },
    { id: 'nagayalanka-waters', center: { lat: 16.18, lng: 81.10 }, radiusMeters: 4000, color: '#dc2626', name: 'Nagayalanka Estuary Waters' },
    
    // Krishna Wildlife Sanctuary Waters - High Risk Zone
    { id: 'krishna-wls-waters', center: { lat: 16.20, lng: 81.20 }, radiusMeters: 5000, color: '#dc2626', name: 'Krishna Wildlife Waters' },
    
    // Additional Coastal Water Zones
    { id: 'southern-waters', center: { lat: 15.65, lng: 80.30 }, radiusMeters: 2000, color: '#ef4444', name: 'Southern Coastal Waters' },
    { id: 'northern-waters', center: { lat: 16.25, lng: 81.30 }, radiusMeters: 3000, color: '#b91c1c', name: 'Northern Coastal Waters' },
  ], []);

  // Safe zones near the sea - positioned in coastal waters for safe fishing
  const safeZones = useMemo(() => [
    { id: 'safe-vetapalem', center: { lat: 15.72, lng: 80.38 }, radiusMeters: 2000, color: '#10b981', name: 'Vetapalem Safe Waters' },
    { id: 'safe-chirala', center: { lat: 15.77, lng: 80.43 }, radiusMeters: 2500, color: '#10b981', name: 'Chirala Safe Waters' },
    { id: 'safe-bapatla', center: { lat: 15.85, lng: 80.55 }, radiusMeters: 3000, color: '#10b981', name: 'Bapatla Safe Waters' },
    { id: 'safe-nizampatnam', center: { lat: 15.89, lng: 80.73 }, radiusMeters: 2000, color: '#10b981', name: 'Nizampatnam Safe Waters' },
    { id: 'safe-repalle', center: { lat: 16.05, lng: 80.93 }, radiusMeters: 2500, color: '#10b981', name: 'Repalle Safe Waters' },
    { id: 'safe-avanigadda', center: { lat: 16.12, lng: 81.03 }, radiusMeters: 2000, color: '#10b981', name: 'Avanigadda Safe Waters' },
    { id: 'safe-nagayalanka', center: { lat: 16.15, lng: 81.13 }, radiusMeters: 3000, color: '#10b981', name: 'Nagayalanka Safe Waters' },
  ], []);

  useGeofencing(position, zones, () => {
    speakWithLanguage('Entering danger zone! Please navigate to safety immediately.', language);
    toast({ title: 'Danger Alert', description: 'Entering danger zone! Please navigate to safety immediately.' });
  });

  const { data: weather } = useQuery({
    queryKey: ['weather', position?.lat, position?.lng],
    queryFn: async () => {
      const w = await fetchWeather(position!.lat, position!.lng);
      try { localStorage.setItem('tw:lastWeather', JSON.stringify({ w, time: Date.now() })); } catch {}
      return w;
    },
    enabled: !!position,
    refetchInterval: 60_000,
  });

  const { data: marine } = useQuery({
    queryKey: ['marine', position?.lat, position?.lng],
    queryFn: async () => {
      const m = await fetchMarine(position!.lat, position!.lng);
      try { localStorage.setItem('tw:lastMarine', JSON.stringify({ m, time: Date.now() })); } catch {}
      return m;
    },
    enabled: !!position,
    refetchInterval: 120_000,
  });

  // Detect offline and load cached prediction
  useEffect(() => {
    function computeOffline() {
      if (navigator.onLine) { setOfflinePrediction(null); return; }
      try {
        const wStr = localStorage.getItem('tw:lastWeather');
        const mStr = localStorage.getItem('tw:lastMarine');
        if (wStr || mStr) {
          const wObj = wStr ? JSON.parse(wStr) : null;
          const mObj = mStr ? JSON.parse(mStr) : null;
          setOfflinePrediction({ weather: wObj?.w ?? null, marine: mObj?.m ?? null, time: Math.max(wObj?.time ?? 0, mObj?.time ?? 0) });
        }
      } catch {}
    }
    computeOffline();
    window.addEventListener('online', computeOffline);
    window.addEventListener('offline', computeOffline);
    return () => {
      window.removeEventListener('online', computeOffline);
      window.removeEventListener('offline', computeOffline);
    };
  }, []);

  const heat = useMemo(() => {
    if (!position) return [] as { id: string; polygon: [number, number][]; color: string }[];
    const baseLat = position.lat;
    const baseLng = position.lng;
    const cells = [] as { id: string; polygon: [number, number][]; color: string }[];
    const grid = [
      [0.0, 0.0], [0.0, 0.05], [0.0, -0.05],
      [0.05, 0.0], [-0.05, 0.0],
    ];
    // Use live data when online, else fallback to cached offline prediction
    const effectiveWind = weather?.windSpeedKt ?? offlinePrediction?.weather?.windSpeedKt;
    const effectiveWave = marine?.waveHeightM ?? offlinePrediction?.marine?.waveHeightM;
    const effectiveTide = marine?.tideState ?? offlinePrediction?.marine?.tideState;
    const score = computeRiskScore({ windSpeedKt: effectiveWind, waveHeightM: effectiveWave, tideState: effectiveTide });
    const color = toHeatColor(score);
    for (let i = 0; i < grid.length; i++) {
      const [dLat, dLng] = grid[i];
      const lat = baseLat + dLat;
      const lng = baseLng + dLng;
      const delta = 0.02;
      const polygon: [number, number][] = [
        [lat - delta, lng - delta],
        [lat - delta, lng + delta],
        [lat + delta, lng + delta],
        [lat + delta, lng - delta],
      ];
      cells.push({ id: `cell-${i}`, polygon, color });
    }
    return cells;
  }, [position, weather?.windSpeedKt, marine?.waveHeightM, marine?.tideState]);

  // Mock backend real-time boat movement with ultra frequent updates
  useEffect(() => {
    const id = setInterval(() => mockTick(), 500); // Ultra frequent updates for real-time feel
    return () => clearInterval(id);
  }, []);

  // Query boats regularly with ultra real-time updates
  const { data: boats = [] } = useQuery<Boat[]>({
    queryKey: ['boats', Math.floor(Date.now() / 500)], // Change key every 500ms
    queryFn: async () => getBoats(),
    refetchInterval: 500, // 500ms refresh for ultra real-time
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  // Query SOS signals regularly with ultra real-time updates
  const { data: sosSignals = [] } = useQuery({
    queryKey: ['sos-signals', Math.floor(Date.now() / 500)], // Change key every 500ms
    queryFn: async () => getSOS(),
    refetchInterval: 500, // 500ms refresh for ultra real-time
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  // Query notifications regularly with ultra real-time updates
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', Math.floor(Date.now() / 500)], // Change key every 500ms
    queryFn: async () => getNotifications(),
    refetchInterval: 500, // 500ms refresh for ultra real-time
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  // Realtime nearby SOS monitoring
  const lastSOSCountRef = useRef<number>(0);
  useEffect(() => {
    if (!position) return;
    const intervalId = setInterval(() => {
      const near = getNearbySOS(position.lat, position.lng, 5000);
      if (near.length !== lastSOSCountRef.current) {
        lastSOSCountRef.current = near.length;
        if (near.length > 0) {
          speakWithLanguage('SOS signal nearby! Please check your map for emergency location.', language);
          toast({ title: 'SOS Alert', description: `${near.length} SOS signals nearby` });
        }
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [position, language, toast]);

  // Monitor notifications for SOS alerts with enhanced feedback
  const lastNotificationCountRef = useRef<number>(0);
  useEffect(() => {
    const sosAlerts = notifications.filter(n => n.type === 'sos_alert');
    if (sosAlerts.length !== lastNotificationCountRef.current && sosAlerts.length > 0) {
      lastNotificationCountRef.current = sosAlerts.length;
      const latestAlert = sosAlerts[0];
      speakWithLanguage('Emergency SOS alert received! Check notifications for details.', language);
      toast({ 
        title: '🚨 SOS Alert Received', 
        description: latestAlert.message,
        duration: 15000
      });
    }
  }, [notifications, language, speak, toast]);

  // Flush offline SOS when back online
  useEffect(() => {
    const handler = () => flushOfflineSOS();
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, []);

  // Update fisherman position in boats array
  useEffect(() => {
    if (position) {
      updateFishermanPosition(position.lat, position.lng);
    }
  }, [position]);

  // Debounced Gemini advisory on significant changes
  const lastAdvisoryKeyRef = useRef<string>("");
  useEffect(() => {
    if (!position) return;
    const wind = weather?.windSpeedKt ?? 0;
    const waves = (marine as any)?.waveHeightM ?? 0;
    const tide = (marine as any)?.tide ?? 'unknown';
    const key = `${Math.round(wind)}|${Math.round(waves * 10)}|${tide}|${lastSOSCountRef.current}`;
    if (key === lastAdvisoryKeyRef.current) return;
    lastAdvisoryKeyRef.current = key;
    const id = setTimeout(async () => {
      try {
        const brief = await generateAdvisory(
          `Create a concise safety brief for small fishing boats.
           Wind: ${wind} kt, Waves: ${waves} m, Tide: ${tide}.
           Nearby SOS: ${lastSOSCountRef.current}.
           Output 2-3 short bullet points, simple language, locale ${language}.`
        );
        if (brief?.trim()) {
          toast({ title: 'Weather Advisory', description: brief });
          setApiAlert(brief);
        }
      } catch (_) {
        // Ignore advisory errors silently in UI
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [position, weather?.windSpeedKt, (marine as any)?.waveHeightM, (marine as any)?.tide, language, toast]);

  // Allow choosing a starting point when inland/city
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [startLabel, setStartLabel] = useState<string>("");
  const [route, setRoute] = useState<{ lat: number; lng: number }[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<{ distanceM: number; durationMin: number; heading: string } | null>(null);
  const [destPoint, setDestPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [recenterToken, setRecenterToken] = useState<number>(0);
  // Demo safe harbors (would come from admin dashboard / Firestore in prod)
  const safeHarbors = useMemo(() => [
    { id: 'harbor-krishna', name: 'Krishna River Mouth', lat: 16.356, lng: 81.294 },
    { id: 'harbor-kakinada', name: 'Kakinada Harbor', lat: 16.989, lng: 82.247 },
    { id: 'harbor-machilipatnam', name: 'Machilipatnam Harbor', lat: 16.176, lng: 81.138 },
  ], []);

  const handleRoute = useCallback(() => {
    if (!startPoint || !destPoint) {
      toast({ title: 'Route Planning', description: 'Please select start and destination by tapping the map.' });
      return;
    }
    const origin = startPoint;
    const dest = destPoint;
    const active = zones.find(z => {
      const dLat = (origin.lat - z.center.lat) * Math.PI/180;
      const dLng = (origin.lng - z.center.lng) * Math.PI/180;
      const a = Math.sin(dLat/2)**2 + Math.cos(z.center.lat*Math.PI/180)*Math.cos(origin.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const meters = 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
      return meters <= z.radiusMeters;
    });
    if (active) {
      const dx = origin.lng - active.center.lng;
      const dy = origin.lat - active.center.lat;
      const len = Math.sqrt(dx*dx + dy*dy) || 1e-6;
      const ux = dx/len, uy = dy/len;
      const degPerM = 1 / 111320;
      const exit = { lat: active.center.lat + uy * (active.radiusMeters * degPerM), lng: active.center.lng + ux * (active.radiusMeters * degPerM) };
      const wind = weather?.windSpeedKt ?? 0;
      const detour = wind > 20 ? { lat: exit.lat + 0.03, lng: exit.lng + 0.03 } : exit;
      const newRoute = [origin, detour, dest];
      setRoute(newRoute);
      const dist = haversineMeters(origin, detour) + haversineMeters(detour, dest);
      const dur = estimateDurationMinutes(dist, Math.max(6, 12 - Math.min(6, Math.abs((weather?.windSpeedKt ?? 0) - 12))));
      const head = cardinalFromBearing(bearingDegrees(origin, detour));
      setRouteSummary({ distanceM: dist, durationMin: dur, heading: head });
    } else {
      const newRoute = [origin, dest];
      setRoute(newRoute);
      const dist = haversineMeters(origin, dest);
      const dur = estimateDurationMinutes(dist, 10);
      const head = cardinalFromBearing(bearingDegrees(origin, dest));
      setRouteSummary({ distanceM: dist, durationMin: dur, heading: head });
    }
  }, [startPoint, destPoint, zones, weather?.windSpeedKt, t, toast]);
  const isNearCoast = useMemo(() => {
    if (!position) return false;
    // very rough heuristic: treat lat within ~0.5 deg of current demo coast
    return Math.abs(position.lat - 16.5) < 0.6 && Math.abs(position.lng - 80.65) < 0.8;
  }, [position]);

  

  // Example: hide banner until advisory exists; set via Gemini advisory callback
  useEffect(() => {
    // If a Gemini toast was shown, also keep a short banner message
    // This can be set by intercepting the advisory generation flow:
    // Here we simply mirror the last shown brief via a custom toast hook or state update.
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">TideWise 2.0</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-safe text-safe">
              Online
            </div>
            <Button variant="ghost" size="icon" aria-label="Change language">
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      {apiAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-danger text-danger-foreground px-4 py-3 shadow-danger z-20 relative"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{apiAlert}</p>
              <p className="text-xs opacity-90">Live</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row bg-background">
        {/* Map Section */}
        <div className="flex-1 relative">
          <div className={`h-full ${alertsOpen ? 'pointer-events-none opacity-90' : ''}`}>
            <SeaMap
              center={position}
              zones={zones}
              safeZones={safeZones}
              heat={heat}
              boats={boats}
              height={600}
              onMapClick={(lat, lng) => {
                // Allow fisherman to choose any point freely
                if (!startPoint) {
                  setStartPoint({ lat, lng });
                  setStartLabel(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
                } else if (!destPoint) {
                  setDestPoint({ lat, lng });
                } else {
                  // If both points exist, clicking resets and starts over
                  setStartPoint({ lat, lng });
                  setDestPoint(null);
                  setStartLabel(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
                  setRoute(null);
                  setRouteSummary(null);
                }
              }}
              startPoint={startPoint}
              route={route}
              recenterSignal={recenterToken}
              sosSignals={sosSignals}
            />
        </div>

          {/* Weather Info Card - Overlay on map */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 right-4 md:w-64 z-10 hidden md:block"
        >
          <Card className="p-4 shadow-card bg-card/95 backdrop-blur-sm">
              <h3 className="font-semibold text-sm mb-3">Current Conditions</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                  <span className="text-muted-foreground">Wind Speed</span>
                <span className="font-medium">{weather?.windSpeedKt ?? '--'} knots</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-muted-foreground">Wave Height</span>
                <span className="font-medium">{weather?.waveHeightM ?? '—'} m</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-muted-foreground">Tide</span>
                  <span className="font-medium">{weather?.tide ?? 'Rising'}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Danger Zone Alert - Map Overlay */}
          {position && zones.some(zone => {
            const dLat = (position.lat - zone.center.lat) * Math.PI/180;
            const dLng = (position.lng - zone.center.lng) * Math.PI/180;
            const a = Math.sin(dLat/2)**2 + Math.cos(zone.center.lat*Math.PI/180)*Math.cos(position.lat*Math.PI/180)*Math.sin(dLng/2)**2;
            const meters = 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
            return meters <= zone.radiusMeters;
          }) && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20"
            >
              <Card className="p-4 shadow-card bg-red-500/95 backdrop-blur-sm border-red-500">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-white flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white">Entering Danger Zone</p>
                    <p className="text-xs text-red-100 mt-1">Please change course immediately</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Zone Legend */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute bottom-4 left-4 md:bottom-4 md:left-4 z-10 hidden md:block"
          >
            <Card className="p-3 shadow-card bg-card/95 backdrop-blur-sm">
              <h4 className="font-semibold text-xs mb-2">Map Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">👤</div>
                  <span>Your Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">S</div>
                  <span>Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">D</div>
                  <span>Destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">🚤</div>
                  <span>Safe Boats</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">🚤</div>
                  <span>Warning Boats</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">🚨</div>
                  <span>SOS Emergency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-30"></div>
                  <span>Danger Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 opacity-30"></div>
                  <span>Safe Zones</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-80 bg-card border-l border-border p-4 space-y-4">
          {/* Safe Route Card */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-safe/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="h-5 w-5 text-safe" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-card-foreground">Safe Route Available</h3>
                  <div className="mt-2 space-y-2">
                    <Input 
                      placeholder="Choose starting point, or click on the map" 
                      value={startLabel} 
                      onChange={(e) => {
                        setStartLabel(e.target.value);
                        // Allow manual input for start coordinates
                        const value = e.target.value;
                        if (value.includes(',')) {
                          const [lat, lng] = value.split(',').map(s => parseFloat(s.trim()));
                          if (!isNaN(lat) && !isNaN(lng)) {
                            setStartPoint({ lat, lng });
                          }
                        }
                      }} 
                    />
                    <Input 
                      placeholder="Choose destination, or click on the map" 
                      value={destPoint ? `${destPoint.lat.toFixed(3)}, ${destPoint.lng.toFixed(3)}` : ''} 
                      onChange={(e) => {
                        // Allow manual input for destination coordinates
                        const value = e.target.value;
                        if (value.includes(',')) {
                          const [lat, lng] = value.split(',').map(s => parseFloat(s.trim()));
                          if (!isNaN(lat) && !isNaN(lng)) {
                            setDestPoint({ lat, lng });
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="w-1/2" onClick={() => setRecenterToken((n) => n + 1)}>Recenter to me</Button>
                    <Button size="sm" variant="safe" className="w-1/2" onClick={handleRoute}>Route</Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Route Summary */}
          {routeSummary && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Card className="p-4 shadow-card">
                <div className="text-sm font-semibold mb-2">Route summary</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Total distance: <span className="font-medium text-foreground">{formatDistance(routeSummary.distanceM)}</span></div>
                  <div>Est. time: <span className="font-medium text-foreground">{Number.isFinite(routeSummary.durationMin) ? `${routeSummary.durationMin} min` : '—'}</span></div>
                  <div>Initial heading: <span className="font-medium text-foreground">{routeSummary.heading}</span></div>
                  {apiAlert && /cyclone|storm|danger|high tide/i.test(apiAlert) && (
                    <div className="text-red-500">Snapped to nearest safe harbor</div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Mobile Route Controls Section */}
        <div className="md:hidden bg-card border-t border-border p-4 space-y-4">
          <Card className="p-4 shadow-card">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-safe" />
                <h3 className="font-semibold text-sm text-card-foreground">Safe Route Available</h3>
              </div>
              <div className="space-y-2">
                <Input 
                  placeholder="Choose starting point, or click on the map" 
                  value={startLabel} 
                  onChange={(e) => {
                    setStartLabel(e.target.value);
                    // Allow manual input for start coordinates
                    const value = e.target.value;
                    if (value.includes(',')) {
                      const [lat, lng] = value.split(',').map(s => parseFloat(s.trim()));
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setStartPoint({ lat, lng });
                      }
                    }
                  }} 
                />
                <Input 
                  placeholder="Choose destination, or click on the map" 
                  value={destPoint ? `${destPoint.lat.toFixed(3)}, ${destPoint.lng.toFixed(3)}` : ''} 
                  onChange={(e) => {
                    // Allow manual input for destination coordinates
                    const value = e.target.value;
                    if (value.includes(',')) {
                      const [lat, lng] = value.split(',').map(s => parseFloat(s.trim()));
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setDestPoint({ lat, lng });
                      }
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-1/2" onClick={() => setRecenterToken((n) => n + 1)}>Recenter</Button>
                  <Button size="sm" variant="safe" className="w-1/2" onClick={handleRoute}>Route</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Mobile Route Summary */}
          {routeSummary && (
            <Card className="p-4 shadow-card">
              <div className="text-sm font-semibold mb-2">Route summary</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total distance: <span className="font-medium text-foreground">{formatDistance(routeSummary.distanceM)}</span></div>
                <div>Est. time: <span className="font-medium text-foreground">{Number.isFinite(routeSummary.durationMin) ? `${routeSummary.durationMin} min` : '—'}</span></div>
                <div>Initial heading: <span className="font-medium text-foreground">{routeSummary.heading}</span></div>
                {apiAlert && /cyclone|storm|danger|high tide/i.test(apiAlert) && (
                  <div className="text-red-500">Snapped to nearest safe harbor</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* SOS Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute bottom-24 right-6 z-20"
      >
        <Button
          size="lg"
          variant="sos"
          className="h-16 w-16 rounded-full"
          onClick={() => {
            speakWithLanguage('SOS activated! Emergency signal sent to authorities and nearby boats.', language);
            toast({ title: 'SOS Activated', description: 'Emergency signal sent to authorities and nearby boats.' });
            if (position) {
              addSOS('YOU', position.lat, position.lng);
              
              // Debug logging
              console.log('Fisherman SOS triggered:', { boatId: 'YOU', lat: position.lat, lng: position.lng });
              
              // Show detailed coordination feedback
              setTimeout(() => {
                const nearbyBoats = boats.filter(boat => {
                  if (boat.id === 'YOU') return false;
                  const distance = haversineMeters(position, { lat: boat.lat, lng: boat.lng });
                  return distance <= 10000; // 10km radius
                });
                
                console.log('Nearby boats notified:', nearbyBoats.length);
                
                toast({ 
                  title: 'SOS Coordination Complete', 
                  description: `Signal sent to authorities and ${nearbyBoats.length} nearby boats within 10km radius.`,
                  duration: 10000
                });
              }, 1500);
            }
          }}
        >
          <Phone className="h-8 w-8" />
        </Button>
      </motion.div>

      {/* Coordination Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-20 right-4 z-30"
      >
        <Card className="p-3 bg-green-50 border-green-200 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-800">LIVE REAL-TIME</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            500ms ultra-fast sync
          </div>
          <div className="text-xs text-green-500 mt-1">
            {new Date().toLocaleTimeString()}
          </div>
          {offlinePrediction && (
            <div className="mt-2">
              <Badge className="bg-amber-100 text-amber-800 border-amber-300">Offline prediction</Badge>
              <div className="text-[10px] text-amber-700 mt-1">Last synced: {offlinePrediction.time ? new Date(offlinePrediction.time).toLocaleTimeString() : 'N/A'}</div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute top-20 left-4 right-4 z-30 md:top-24 md:left-auto md:right-4 md:w-80"
        >
          <Card className="p-4 bg-red-50 border-red-200 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-red-800">🚨 Emergency Notifications</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearNotifications()}
                className="text-red-600 hover:text-red-800"
              >
                Clear All
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="text-sm text-red-700 bg-white p-2 rounded border">
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-xs text-red-500 mt-1">
                    {new Date(notification.time).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {notifications.length > 3 && (
                <div className="text-xs text-red-600 text-center">
                  +{notifications.length - 3} more notifications
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border px-4 py-3 shadow-sm">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto gap-1"
            onClick={() => {
              const weatherInfo = `Wind: ${weather?.windSpeedKt ?? '--'} knots, Waves: ${weather?.waveHeightM ?? '--'}m, Tide: ${weather?.tide ?? 'unknown'}`;
              const voiceLang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
              speakWithLanguage(weatherInfo, language);
              toast({ title: 'Current Conditions', description: weatherInfo });
            }}
          >
            <Waves className="h-5 w-5" />
            <span className="text-xs">Weather</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto gap-1"
            onClick={() => {
              if (routeSummary) {
                const routeInfo = `Route: ${formatDistance(routeSummary.distanceM)}, ${routeSummary.durationMin} min, heading ${routeSummary.heading}`;
                const voiceLang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
                speakWithLanguage(routeInfo, language);
                toast({ title: 'Route Information', description: routeInfo });
              } else {
                toast({ title: 'Route Information', description: 'No route set. Tap map to set start and destination.' });
              }
            }}
          >
            <Navigation className="h-5 w-5" />
            <span className="text-xs">Route</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col h-auto gap-1 relative" onClick={() => setAlertsOpen(true)}>
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs">Alerts</span>
            {apiAlert && (
              <div className="absolute -top-1 -right-1 z-10 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px]">
                1
              </div>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-auto gap-1 relative"
            onClick={() => {
              if (!position) return;
              const near = getNearbySOS(position.lat, position.lng, 5000);
              if (near.length > 0) {
                const voiceLang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
                speakWithLanguage('SOS signals nearby! Check map for emergency locations.', language);
                toast({ title: 'SOS Signals', description: `${near.length} SOS signals nearby` });
              } else {
                toast({ title: 'SOS Signals', description: 'No SOS signals nearby' });
              }
            }}
          >
            <Radio className="h-5 w-5" />
            <span className="text-xs">Beacon</span>
          </Button>
        </div>
      </nav>

      {/* Alerts Sheet */}
      <Sheet open={alertsOpen} onOpenChange={setAlertsOpen}>
        <SheetContent side="bottom" className="max-h-[65vh] overflow-y-auto z-[2000]">
          <SheetHeader>
            <SheetTitle>Alerts</SheetTitle>
            <SheetDescription>Latest safety alerts near your location</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {apiAlert ? (
              <div className="p-3 rounded-lg border flex items-start gap-3 bg-danger/10 border-danger/20">
                <AlertTriangle className="h-5 w-5 mt-0.5 text-danger" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{apiAlert}</p>
                  <p className="text-xs text-muted-foreground mt-1">Live</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No alerts</div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FishermanView;
