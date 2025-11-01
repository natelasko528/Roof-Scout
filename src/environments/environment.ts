/// <reference types="vite/client" />

// Environment configuration for Roof Scout App

export const environment = {
  production: false,
  geminiApiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || 'your_api_key_here',
  weatherApiKey: (import.meta as any).env?.VITE_WEATHER_API_KEY || 'your_weather_api_key_here',
};
