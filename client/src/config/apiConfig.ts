/**
 * Global API configuration
 * In development (Vite), requests use relative paths ('') via Vite dev proxy to http://localhost:5000
 * In production (served from Express or IIS reverse proxy), relative paths ('') ensure same-origin requests
 * work seamlessly over LAN, localhost, or domain name.
 * If VITE_API_URL is explicitly set, it overrides the default.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
