import { Shield, Radio, Users, AlertTriangle, MapPin, Activity, Send, MessageSquare, Settings, Eye, Phone, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import SeaMap from '@/components/SeaMap';
import { useEffect, useMemo, useState, useRef } from 'react';
import { getBoats, getSOS, getNotifications, clearNotifications, type Notification, mockTick, type Boat, addSOS } from '@/lib/tracker';
import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/weather';
import { fetchMarine } from '@/lib/marine';
import { computeRiskScore, toHeatColor } from '@/lib/risk';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AuthorityDashboard = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [center] = useState<{ lat: number; lng: number }>({ lat: 16.5062, lng: 80.648 });
  const [tick, setTick] = useState(0);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [showZoneBoats, setShowZoneBoats] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Force refresh every second to ensure real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setForceRefresh(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Use React Query for real-time data with force refresh keys
  const { data: boats = [] } = useQuery({
    queryKey: ['authority-boats', forceRefresh],
    queryFn: async () => getBoats(),
    refetchInterval: 500, // 500ms refresh for ultra real-time
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  const { data: sos = [] } = useQuery({
    queryKey: ['authority-sos', forceRefresh],
    queryFn: async () => getSOS(),
    refetchInterval: 500, // 500ms refresh for ultra real-time
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['authority-notifications', forceRefresh],
    queryFn: async () => getNotifications(),
    refetchInterval: 500, // 500ms refresh for ultra real-time
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
  });

  // Debug logging for SOS signals
  useEffect(() => {
    console.log('Authority Dashboard - SOS Signals:', sos);
    console.log('Authority Dashboard - Boats:', boats);
    console.log('Authority Dashboard - Notifications:', notifications);
  }, [sos, boats, notifications]);

  // Keep mockTick for boat movement simulation with ultra frequent updates
  useEffect(() => {
    const i = setInterval(() => {
      mockTick();
    }, 500); // Ultra frequent updates for real-time feel
    return () => clearInterval(i);
  }, []);

  // Monitor authority alerts with improved logic
  const lastAuthorityAlertRef = useRef<string>('');
  useEffect(() => {
    const authorityAlerts = notifications.filter(n => n.type === 'authority_alert');
    if (authorityAlerts.length > 0) {
      const latestAlert = authorityAlerts[0];
      const alertKey = `${latestAlert.id}-${latestAlert.time}`;
      
      // Only show alert if it's new
      if (alertKey !== lastAuthorityAlertRef.current) {
        lastAuthorityAlertRef.current = alertKey;
        
        // Show immediate toast
        toast({
          title: '🚨 EMERGENCY SOS RECEIVED',
          description: latestAlert.message,
          duration: 25000,
          variant: 'destructive'
        });

        // Also show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Emergency SOS Alert', {
            body: latestAlert.message,
            icon: '/favicon.ico',
            tag: 'sos-emergency'
          });
        }

        // Play emergency sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.volume = 0.7;
          audio.play().catch(() => {
            // Fallback: create a simple beep sound
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            gainNode.gain.setValueAtTime(0.3, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.5);
          });
        } catch (error) {
          console.log('Audio not supported');
        }
      }
    }
  }, [notifications, toast]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Dynamic stats based on real data
  const stats = useMemo(() => [
    { label: 'Active Boats', value: boats.length.toString(), icon: Users, color: 'text-primary' },
    { label: 'Active Alerts', value: sos.length.toString(), icon: AlertTriangle, color: 'text-danger' },
    { label: 'SOS Calls', value: sos.filter(s => Date.now() - s.time < 300000).length.toString(), icon: Radio, color: 'text-danger' },
    { label: 'Zones Monitored', value: '10', icon: MapPin, color: 'text-accent' },
  ], [boats.length, sos.length]);

  // Danger zones for authority monitoring - Positioned in coastal waters
  const dangerZones = useMemo(() => [
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

  const handleBroadcast = () => {
    if (broadcastMessage.trim()) {
      toast({ title: 'Broadcast Sent', description: `Message sent to ${boats.length} boats: "${broadcastMessage}"` });
      setBroadcastMessage('');
    }
  };

  const handleEmergencyAlert = () => {
    if (alertMessage.trim()) {
      toast({ title: 'Emergency Alert Sent', description: `Emergency alert broadcasted: "${alertMessage}"` });
      setAlertMessage('');
    }
  };

  // Function to get boats in a specific zone
  const getBoatsInZone = (zoneId: string) => {
    if (zoneId === 'all') return boats;
    
    const zone = dangerZones.find(z => z.id === zoneId);
    if (!zone) return [];
    
    return boats.filter(boat => {
      const distance = Math.sqrt(
        Math.pow(boat.lat - zone.center.lat, 2) + 
        Math.pow(boat.lng - zone.center.lng, 2)
      ) * 111320; // rough conversion to meters
      return distance <= zone.radiusMeters;
    });
  };

  const handleZoneSelect = (zoneId: string) => {
    setShowZoneBoats(zoneId);
    const boatsInZone = getBoatsInZone(zoneId);
    toast({ 
      title: `Zone ${zoneId.toUpperCase()}`, 
      description: `Found ${boatsInZone.length} boats in this zone` 
    });
  };

  const { data: weather } = useQuery({
    queryKey: ['weather', center.lat, center.lng],
    queryFn: async () => fetchWeather(center.lat, center.lng),
    refetchInterval: 60000,
  });
  const { data: marine } = useQuery({
    queryKey: ['marine', center.lat, center.lng],
    queryFn: async () => fetchMarine(center.lat, center.lng),
    refetchInterval: 120000,
  });
  const heat = useMemo(() => {
    const score = computeRiskScore({ windSpeedKt: weather?.windSpeedKt, waveHeightM: marine?.waveHeightM, tideState: marine?.tideState });
    const color = toHeatColor(score);
    const delta = 0.08;
    return [
      { id: 'h1', polygon: [[center.lat - delta, center.lng - delta], [center.lat - delta, center.lng + delta], [center.lat + delta, center.lng + delta], [center.lat + delta, center.lng - delta]] as [number, number][], color },
    ];
  }, [center.lat, center.lng, weather?.windSpeedKt, marine?.waveHeightM, marine?.tideState]);

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Alert Banner */}
      {sos.length > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-red-600 text-white p-4 text-center font-semibold"
        >
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <span>🚨 EMERGENCY: {sos.length} Active SOS Signal{sos.length > 1 ? 's' : ''} - Immediate Response Required</span>
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TideWise Authority</h1>
              <p className="text-sm text-muted-foreground">Coastal Monitoring Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-safe text-safe">
            <Activity className="h-3 w-3 mr-1" />
            All Systems Active
          </Badge>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="sos">SOS Management</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="zones">Zone Control</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Map */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Monitoring Map
                  </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <SeaMap
                  center={center}
                      zones={dangerZones}
                  heat={heat}
                      boats={boats}
                      sosSignals={sos}
                  height={500}
                />
              </div>

                  {/* Zone Filter */}
                  <div className="mt-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium">Filter by Zone:</label>
                      <select 
                        value={showZoneBoats || 'all'} 
                        onChange={(e) => handleZoneSelect(e.target.value)}
                        className="px-2 py-1 text-xs border rounded bg-background"
                      >
                        <option value="all">All Boats</option>
                        {dangerZones.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            Zone {zone.id.toUpperCase()} ({getBoatsInZone(zone.id).length} boats)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Enhanced Boat List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <h4 className="font-semibold text-sm mb-2">
                      {showZoneBoats && showZoneBoats !== 'all' 
                        ? `Boats in Zone ${showZoneBoats.toUpperCase()} (${getBoatsInZone(showZoneBoats).length})`
                        : `All Active Boats (${boats.length})`
                      }
                    </h4>
                    {getBoatsInZone(showZoneBoats || 'all').map((boat) => (
                  <div
                    key={boat.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedBoat(boat)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${boat.status === 'safe' ? 'bg-safe' : boat.status === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
                      <span className="font-medium">Boat #{boat.id}</span>
                          <Badge variant={boat.status === 'safe' ? 'default' : boat.status === 'warning' ? 'secondary' : 'destructive'} className="text-xs">
                            {boat.status.toUpperCase()}
                          </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                          {boat.lat.toFixed(3)}°N, {boat.lng.toFixed(3)}°E
                    </div>
                  </div>
                ))}
                    {getBoatsInZone(showZoneBoats || 'all').length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        {showZoneBoats && showZoneBoats !== 'all' 
                          ? `No boats currently in Zone ${showZoneBoats.toUpperCase()}`
                          : 'No active boats found'
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weather & System Status */}
              <div className="space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-sm">Current Conditions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wind Speed</span>
                      <span className="font-medium">{weather?.windSpeedKt ?? '--'} knots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wave Height</span>
                      <span className="font-medium">{weather?.waveHeightM ?? '--'} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tide</span>
                      <span className="font-medium">{weather?.tide ?? 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
                    <CardTitle className="text-sm">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">GPS Tracking</span>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SOS Network</span>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weather API</span>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card border-red-200">
            <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Radio className="h-5 w-5 text-danger animate-pulse" />
                    🚨 Active SOS Signals ({sos.length})
                    {sos.length > 0 && (
                      <Badge variant="destructive" className="ml-auto animate-pulse">
                        EMERGENCY
                      </Badge>
                    )}
                  </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active SOS signals</p>
                    </div>
                  ) : (
                    sos.map((sosSignal) => (
                      <div key={sosSignal.id} className="p-4 rounded-lg bg-red-100 border-2 border-red-300 animate-pulse">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                    <Radio className="h-5 w-5 text-red-600 mt-0.5 animate-pulse" />
                            <div>
                              <p className="font-bold text-sm text-red-800">🚨 SOS from Boat #{sosSignal.boatId}</p>
                              <p className="text-xs text-red-600 mt-1 font-medium">
                                {new Date(sosSignal.time).toLocaleString()}
                              </p>
                              <p className="text-xs text-red-600 font-medium">
                                {sosSignal.lat.toFixed(4)}°N, {sosSignal.lng.toFixed(4)}°E
                              </p>
                              <p className="text-xs text-red-500 mt-1">
                                Time since alert: {Math.floor((Date.now() - sosSignal.time) / 1000)}s ago
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" className="animate-pulse">
                              <Phone className="h-3 w-3 mr-1" />
                              Call Now
                            </Button>
                            <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                              <Navigation className="h-3 w-3 mr-1" />
                              Navigate
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Emergency Notifications */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                    Emergency Notifications ({notifications.length})
                    {notifications.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => clearNotifications()}
                        className="ml-auto text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No emergency notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-lg border ${
                        notification.type === 'authority_alert' 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            notification.type === 'authority_alert' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                    <div className="flex-1">
                            <p className="text-sm font-medium">
                              {notification.type === 'authority_alert' ? '🚨 Authority Alert' : '⚠️ Boat Alert'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.time).toLocaleString()}
                            </p>
                          </div>
                    </div>
                  </div>
                ))
              )}
                  {notifications.length > 5 && (
                    <div className="text-center text-xs text-muted-foreground">
                      +{notifications.length - 5} more notifications
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Emergency Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Emergency Alert Message</label>
                    <Textarea
                      placeholder="Enter emergency alert message..."
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      className="min-h-20"
                    />
                  </div>
                  <Button onClick={handleEmergencyAlert} className="w-full" variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Send Emergency Alert
                  </Button>
                  
                  {/* Test SOS Button for Debugging */}
                  <Button 
                    onClick={() => {
                      addSOS('TEST_BOAT', 16.50, 80.60);
                      toast({ title: 'Test SOS Added', description: 'Test SOS signal added for debugging' });
                    }} 
                    className="w-full" 
                    variant="outline"
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Test SOS Signal
                  </Button>

                  {/* Test Fisherman SOS Button */}
                  <Button 
                    onClick={() => {
                      addSOS('YOU', 16.5062, 80.648);
                      toast({ title: 'Fisherman SOS Test', description: 'Test fisherman SOS signal added' });
                    }} 
                    className="w-full" 
                    variant="default"
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Test Fisherman SOS
                  </Button>

                  {/* Coordination Test Button */}
                  <Button 
                    onClick={() => {
                      // Test coordination by adding multiple SOS signals
                      addSOS('TEST_BOAT_1', 16.50, 80.60);
                      setTimeout(() => addSOS('TEST_BOAT_2', 16.52, 80.62), 1000);
                      setTimeout(() => addSOS('TEST_BOAT_3', 16.48, 80.58), 2000);
                      toast({ 
                        title: 'Coordination Test Started', 
                        description: 'Testing real-time coordination with multiple SOS signals',
                        duration: 10000
                      });
                    }} 
                    className="w-full" 
                    variant="default"
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Test Coordination
                  </Button>

                  {/* Debug Panel */}
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Debug Info</h4>
                    <div className="text-xs space-y-1">
                      <div>Total SOS Signals: {sos.length}</div>
                      <div>Total Notifications: {notifications.length}</div>
                      <div>Authority Alerts: {notifications.filter(n => n.type === 'authority_alert').length}</div>
                      <div>Boat Alerts: {notifications.filter(n => n.type === 'sos_alert').length}</div>
                      <div>Last Alert ID: {lastAuthorityAlertRef.current}</div>
                    </div>
                  </div>

                  {/* Coordination Status Panel */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold mb-2 text-blue-800">🔄 Real-Time Coordination Status</h4>
                    <div className="text-xs space-y-1 text-blue-700">
                      <div className="flex justify-between">
                        <span>Data Refresh Rate:</span>
                        <span className="font-medium text-green-600">500ms (Ultra Fast)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Boats:</span>
                        <span className="font-medium">{boats.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emergency Signals:</span>
                        <span className="font-medium text-red-600">{sos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Notifications Sent:</span>
                        <span className="font-medium">{notifications.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>System Status:</span>
                        <span className="font-medium text-green-600 animate-pulse">LIVE REAL-TIME</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Update:</span>
                        <span className="font-medium text-green-600">{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Broadcast Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message to All Boats</label>
                    <Textarea
                      placeholder="Enter broadcast message..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleBroadcast} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Broadcast to All
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Weather Warning
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Zone Closure
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Navigation className="h-4 w-4 mr-2" />
                    Safe Route Update
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    System Maintenance
              </Button>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Danger Zone Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dangerZones.map((zone) => (
                    <div key={zone.id} className="p-3 rounded-lg border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }}></div>
                        <div>
                          <p className="font-medium text-sm">{zone.id.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {zone.center.lat.toFixed(3)}°N, {zone.center.lng.toFixed(3)}°E
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Add New Zone
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Zone Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dangerZones.map((zone) => {
                    const boatsInZone = getBoatsInZone(zone.id).length;
                    
                    return (
                      <div 
                        key={zone.id} 
                        className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                          showZoneBoats === zone.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleZoneSelect(zone.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }}></div>
                          <span className="text-sm font-medium">{zone.id.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={boatsInZone > 0 ? 'destructive' : 'default'}>
                            {boatsInZone} boats
                          </Badge>
                          {showZoneBoats === zone.id && (
                            <Badge variant="outline" className="text-xs">
                              Viewing
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleZoneSelect('all')}
                    >
                      View All Boats ({boats.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
