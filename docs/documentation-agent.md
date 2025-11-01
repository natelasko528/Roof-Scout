# Documentation Agent

This document defines the documentation agent that automatically maintains the project's documentation.

## Purpose

The documentation agent is responsible for:
- Keeping README.md up-to-date with current project features
- Generating and maintaining reference documentation in `docs/reference/`
- Documenting all components, services, and models
- Creating API documentation from TypeScript interfaces
- Tracking changes and updating documentation accordingly

## Documentation Structure

```
docs/
├── reference/
│   ├── api/                 # API reference documentation
│   ├── components/          # Component documentation
│   ├── services/            # Service documentation
│   ├── models/              # Model/interface documentation
│   └── architecture/        # Architecture overview
├── README.md               # Main project README (auto-generated)
└── CHANGELOG.md           # Change tracking
```

## Generation Rules

### README.md
- Project title and description
- Quick start guide (prerequisites, setup, run)
- Key features list
- Architecture overview
- Technology stack
- API dependencies

### Component Documentation
For each component (.component.ts):
- Component name and purpose
- Inputs and Outputs
- Template selectors
- Lifecycle hooks
- Dependencies
- Example usage

### Service Documentation
For each service (.service.ts):
- Service purpose and responsibilities
- Public methods with descriptions
- Dependencies injected
- Key functionality
- Usage examples

### Model Documentation
For each model/interface (.models.ts):
- Interface name
- Properties with types
- Description of purpose
- Example object structure

### API Documentation
Auto-generated from:
- Service method signatures
- Component inputs/outputs
- Interface definitions
- Type definitions

## Update Triggers

Documentation should be regenerated when:
1. New components/services/models are added
2. Existing code is modified
3. Before releases
4. On demand via documentation command

## Commands

Run documentation generation:
```bash
npm run docs:generate
```

Build and preview documentation:
```bash
npm run docs:build
```

## Maintenance

The documentation agent should be run:
- During development to keep docs current
- Before creating pull requests
- As part of CI/CD pipeline (optional)
