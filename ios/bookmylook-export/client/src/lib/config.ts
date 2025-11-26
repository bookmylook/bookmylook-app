// Environment Detection for API URL
export const PRODUCTION_API_URL = 'https://bookmylook-listenrayees.replit.app';

// Detect if running in Capacitor (native mobile app)
const isCapacitor = !!(window as any).Capacitor;

// Detect environment:
// - Capacitor (APK): uses production URL
// - Localhost: hostname is 'localhost' or '127.0.0.1' AND not Capacitor
// - Replit Dev: hostname contains '.replit.dev' or is a Replit internal domain
// - Production Web: uses production URL
const hostname = window.location.hostname;
const isLocalhost = (hostname === 'localhost' || hostname === '127.0.0.1') && !isCapacitor;
const isReplitDev = hostname.includes('.replit.dev') || hostname.includes('replit.app');

// Use production URL for Capacitor, same-origin for web development
export const API_BASE_URL = isCapacitor
  ? PRODUCTION_API_URL // APK always uses production server
  : (isLocalhost || isReplitDev) 
    ? '' // Empty string = same origin (works for localhost and Replit preview)
    : PRODUCTION_API_URL;

// Helper function to get full URL for any endpoint
export function getFullUrl(url: string): string {
  // If already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return API_BASE_URL + url;
}

const envType = isCapacitor ? 'CAPACITOR_APK' : (isLocalhost ? 'LOCALHOST' : (isReplitDev ? 'REPLIT_DEV' : 'PRODUCTION'));
console.log('[BOOKMYLOOK] Environment:', envType);
console.log('[BOOKMYLOOK] Hostname:', hostname);
console.log('[BOOKMYLOOK] Is Capacitor:', isCapacitor);
console.log('[BOOKMYLOOK] API Base URL:', API_BASE_URL || 'SAME_ORIGIN');
