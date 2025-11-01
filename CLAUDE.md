# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Roof Scout Canvassing App** - A mobile-first door-knocking canvassing application for roofing sales professionals. The app helps track leads, manage territories, and leverage AI to close more deals. Built with Angular 20 and integrated with Google's Gemini AI for intelligent lead scoring and property analysis.

## Quick Start

### Prerequisites
- Node.js

### Setup
1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app: `npm run dev` (runs on http://localhost:3000)

### Common Commands
- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Production preview**: `npm run preview`

## Architecture

### Data Layer
- **DataService** (`src/services/data.service.ts`): Manages session and lead data persistence using localStorage
  - Handles CRUD operations for leads and sessions
  - Computed signals for `activeSession` and `leads`
  - Export functionality to CSV

### AI Integration
- **GeminiService** (`src/services/gemini.service.ts`): Core AI service using Google Gemini 2.5 Flash
  - Chat functionality with function calling tools
  - Live voice conversation support
  - Roof scoring algorithm with image analysis
  - Property research and pitch generation
  - Text-to-Speech capabilities
  - **Tool Handlers**: `create_lead`, `search_address_on_map`, `update_lead_status`, `list_leads`, `delete_lead`, `switch_view`

### Core Components

**AppComponent** (`src/app.component.ts`): Main orchestrator component
- Manages view state (map, list, sessions)
- Handles lead form operations
- Integrates AI scoring with image uploads
- Fetches satellite images using Esri/OpenStreetMap APIs

**MapViewComponent** (`src/components/map-view/map-view.component.ts`): Map visualization
- Displays lead statistics
- Integrates with InteractiveMapComponent for mapping

**ChatbotComponent** (`src/components/chatbot/chatbot.component.ts`): AI assistant interface
- Text-based chat with Gemini
- Live voice conversation with real-time audio
- Transcription and TTS playback
- Audio chunk queue management

### Supporting Services
- **ViewActionService**: Handles view switching between map/list/sessions
- **MapActionService**: Manages map interactions (fly-to address)
- **MapsLoaderService**: Google Maps API integration
- **ThemeService**: UI theming (likely dark/light mode)

### Models
```typescript
// src/models.ts
Lead {
  id, address, homeownerName, phone, email,
  roofAge, roofMaterial, visibleDamage, notes,
  priority, status, createdAt,
  lat, lng, imageUrl, userImageUrls,
  roofScore, roofScoreReasoning
}

Session {
  id, name, createdAt, leads: Lead[]
}
```

## Key Features

### Lead Management
- Create, update, delete leads
- Track lead status: 'Not Visited', 'Knocked', 'Interested', 'Not Interested', 'Not Home', 'Appointment', 'Callback', 'Completed'
- Priority levels: High, Medium, Low
- Geocoding and map visualization

### AI-Powered Features
- **Roof Scoring**: Analyzes satellite imagery, user photos, and property data to score 0-100
- **Property Research**: Uses Google Search to gather weather data and property insights
- **Sales Pitch Generation**: Creates personalized pitches for homeowners
- **Note Summarization**: Converts interaction notes to structured summaries

### Session Management
- Create/manage multiple canvassing sessions
- Switch between sessions
- Data persists in localStorage

### Map Integration
- Interactive map with lead markers
- Click to create new leads
- Fly-to-address functionality

### Image Handling
- Upload multiple user images per lead
- Automatic image resizing (max 1024px)
- Satellite imagery fetch via Esri World Imagery
- AI analysis of both satellite and user-uploaded images

## Development Notes

- **Angular Version**: 20 (using standalone components and signals)
- **Change Detection**: OnPush strategy for performance
- **State Management**: Angular signals throughout
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Data Persistence**: Browser localStorage (no backend)

## API Dependencies

- **Google Gemini AI**: Primary AI service (`process.env.API_KEY`)
- **OpenStreetMap Nominatim**: Geocoding addresses
- **Esri ArcGIS**: Satellite imagery service
- **CORS Proxy**: Used for image fetching (cors-anywhere.herokuapp.com)

## Requested Permissions (metadata.json)
- Geolocation
- Microphone (for voice chat)

## Important Considerations

1. **API Key**: Required in `.env.local` as `GEMINI_API_KEY`
2. **No Test Suite**: No test files (.spec.ts or .test.ts) found
3. **LocalStorage Only**: All data is client-side, no backend persistence
4. **CORS Limitations**: Image fetching may be limited by CORS policies
5. **Audio Processing**: Complex audio handling for live voice chat with interruption support

## View Navigation
- **Map View**: Main view with statistics and interactive map
- **List View**: Tabular lead list (via ViewActionService)
- **Sessions View**: Session management (via ViewActionService)
