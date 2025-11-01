# Roof Scout Documentation

This directory contains automatically generated reference documentation for the Roof Scout Canvassing App.

## Contents

- [API Reference](./api/) - Service interfaces and method documentation
- [Components](./components/) - Angular component documentation
- [Services](./services/) - Service layer documentation
- [Models](./models/) - Data model and interface definitions
- [Architecture](./architecture/) - System architecture overview

## Generating Documentation

To regenerate documentation after code changes:

```bash
npm run docs:generate
```

This will parse TypeScript files and generate markdown documentation in this directory.

## File Structure

```
docs/reference/
├── api/              # API endpoints and interfaces
├── components/       # Angular components
├── services/         # Business logic services
├── models/           # Data models and types
└── architecture/     # System design documentation
```

## Maintenance

This documentation is auto-generated from TypeScript source files using the documentation agent. Run generation after:
- Adding new components or services
- Modifying interfaces or models
- Before releases or pull requests
