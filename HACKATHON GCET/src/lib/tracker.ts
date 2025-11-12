export type Boat = { id: string; lat: number; lng: number; status: "safe" | "warning" | "sos"; zone?: string };
export type SOS = { id: string; boatId: string; time: number; lat: number; lng: number };
export type Notification = { id: string; type: 'sos_alert' | 'authority_alert'; boatId: string; lat: number; lng: number; time: number; message: string };

// Simple in-memory mock tracker. Replace with Firebase later.
let boats: Boat[] = [
  { id: "127", lat: 16.50, lng: 80.60, status: "safe", zone: "A" },
  { id: "089", lat: 16.40, lng: 80.70, status: "safe", zone: "B" },
  { id: "203", lat: 16.60, lng: 80.50, status: "warning", zone: "C" },
];
let sosEvents: SOS[] = [];
let notifications: Notification[] = [];

export function getBoats(): Boat[] {
  return boats.slice();
}

export function getSOS(): SOS[] {
  return sosEvents.slice().sort((a, b) => b.time - a.time);
}

export function getNotifications(): Notification[] {
  return notifications.slice().sort((a, b) => b.time - a.time);
}

export function clearNotifications(): void {
  notifications = [];
}

export function updateFishermanPosition(lat: number, lng: number): void {
  const idx = boats.findIndex((b) => b.id === 'YOU');
  if (idx >= 0) {
    boats[idx] = { ...boats[idx], lat, lng };
  } else {
    // Add fisherman boat if it doesn't exist
    boats.push({ id: 'YOU', lat, lng, status: "safe", zone: "FISHERMAN" });
  }
}

export function mockTick(): void {
  boats = boats.map((b) => {
    const jitter = 0.005;
    const lat = b.lat + (Math.random() - 0.5) * jitter;
    const lng = b.lng + (Math.random() - 0.5) * jitter;
    const status = Math.random() < 0.03 ? "warning" : b.status === "warning" && Math.random() < 0.5 ? "safe" : b.status;
    return { ...b, lat, lng, status };
  });
  if (Math.random() < 0.02) {
    const idx = Math.floor(Math.random() * boats.length);
    const b = boats[idx];
    boats[idx] = { ...b, status: "sos" };
    sosEvents.unshift({ id: `${Date.now()}`, boatId: b.id, time: Date.now(), lat: b.lat, lng: b.lng });
  }
}

const offlineQueueKey = 'tidewise_sos_queue_v1';
function readQueue(): SOS[] {
  try { return JSON.parse(localStorage.getItem(offlineQueueKey) || '[]'); } catch { return []; }
}
function writeQueue(items: SOS[]) {
  try { localStorage.setItem(offlineQueueKey, JSON.stringify(items)); } catch {}
}

export function addSOS(boatId: string, lat: number, lng: number) {
  const event: SOS = { id: `${Date.now()}`, boatId, time: Date.now(), lat, lng };
  
  // Add SOS event immediately
  if (navigator.onLine) {
    sosEvents.unshift(event);
  } else {
    const q = readQueue();
    q.unshift(event);
    writeQueue(q);
  }
  
  // Update boat status to SOS - Ensure boat exists in the array
  const idx = boats.findIndex((b) => b.id === boatId);
  if (idx >= 0) {
    boats[idx] = { ...boats[idx], lat, lng, status: "sos" };
  } else {
    // If boat doesn't exist (like fisherman with ID 'YOU'), add it
    boats.push({ id: boatId, lat, lng, status: "sos", zone: "FISHERMAN" });
  }

  // Notify nearby boats (within 10km radius) - Enhanced coordination
  const nearbyBoats = boats.filter(boat => {
    if (boat.id === boatId) return false; // Don't notify self
    const distance = haversineMeters({ lat, lng }, { lat: boat.lat, lng: boat.lng });
    return distance <= 10000; // 10km radius
  });

  // Create notifications for nearby boats with enhanced details
  nearbyBoats.forEach(boat => {
    const distance = haversineMeters({ lat, lng }, { lat: boat.lat, lng: boat.lng });
    const notification: Notification = {
      id: `sos_${Date.now()}_${boat.id}`,
      type: 'sos_alert',
      boatId: boat.id,
      lat: boat.lat,
      lng: boat.lng,
      time: Date.now(),
      message: `🚨 EMERGENCY SOS: Boat ${boatId} needs immediate assistance! Distance: ${(distance/1000).toFixed(1)}km away at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E. Please respond immediately!`
    };
    notifications.unshift(notification);
  });

  // Create notification for authorities with priority
  const authorityNotification: Notification = {
    id: `authority_${Date.now()}`,
    type: 'authority_alert',
    boatId: boatId,
    lat: lat,
    lng: lng,
    time: Date.now(),
    message: `🚨 EMERGENCY SOS: Boat ${boatId} activated emergency signal at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E. ${nearbyBoats.length} boats notified within 10km radius. Immediate response required!`
  };
  notifications.unshift(authorityNotification);

  // Log for debugging
  console.log(`SOS Alert: Boat ${boatId} at ${lat}, ${lng}. Notified ${nearbyBoats.length} nearby boats and authorities.`);
  console.log('SOS Events after add:', sosEvents);
  console.log('Boats after add:', boats);
  console.log('Notifications after add:', notifications);
}

export function flushOfflineSOS() {
  const q = readQueue();
  if (q.length === 0) return;
  // In a real backend, send to server then clear
  sosEvents = [...q, ...sosEvents];
  writeQueue([]);
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function getNearbySOS(lat: number, lng: number, radiusMeters: number): SOS[] {
  const here = { lat, lng };
  return sosEvents.filter((e) => haversineMeters(here, { lat: e.lat, lng: e.lng }) <= radiusMeters);
}


