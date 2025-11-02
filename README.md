<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Roof Scout - Canvassing App

A modern Angular-based canvassing application for roof inspection and lead management.

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XAR2GYNzcld3RgWVgpXNOH6MYXNs8n-H

## Project Structure

The project follows Angular best practices with a clean, organized structure:

```
src/
├── app/
│   ├── core/                    # Singleton services and utilities
│   │   ├── services/            # Core services (Data, Gemini, Weather, etc.)
│   │   └── utils/               # Utility functions (Security, etc.)
│   ├── shared/                  # Shared components and models
│   │   ├── models/              # TypeScript models (Lead, Session)
│   │   └── environments/        # Environment configuration
│   ├── features/                # Feature modules
│   │   ├── leads/               # Lead management feature
│   │   ├── map/                 # Map visualization feature
│   │   ├── sessions/            # Session management feature
│   │   └── chatbot/             # AI chatbot feature
│   ├── app.component.ts         # Root component
│   └── app.config.ts            # Application configuration
├── assets/                      # Static assets (icons, images)
├── main.ts                      # Application entry point
└── index.html                   # HTML template
```

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in your environment variables
3. Run the app:
   `npm run dev`
4. Open your browser to: http://localhost:3000

## Features

- 🗺️ **Map-based Lead Tracking**: Interactive Leaflet maps with satellite imagery
- 🤖 **AI-Powered Features**: Gemini AI integration for roof scoring, property research, and pitch generation
- 🌤️ **Weather Integration**: Track severe weather events for leads
- 📱 **PWA Support**: Progressive Web App with offline capabilities
- 📄 **PDF Reports**: Generate comprehensive lead, session, and territory reports
- 🎨 **Dark Mode**: Beautiful dark/light theme support
- 💾 **Local Storage**: Client-side data persistence

## Project Organization

```
Roof-Scout/
├── src/                          # Source code (Angular app)
├── docs/                         # All project documentation
│   ├── reports/                  # Technical reports and analyses
│   ├── migration/                # Migration guides
│   ├── reference/                # API references
│   └── README.md                 # Documentation index
├── scripts/                      # Build and utility scripts
├── e2e/                          # End-to-end tests
├── screenshots/                  # App screenshots
├── angular.json                  # Angular CLI configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Technologies

- Angular 20+ (Standalone Components, Signals)
- Leaflet.js for mapping
- Google Gemini AI
- Tailwind CSS
- TypeScript
- PWA support

## Documentation

See [docs/README.md](./docs/README.md) for all documentation including:
- Architecture reports
- Migration guides
- Performance analyses
- Security audits
- Implementation roadmap
