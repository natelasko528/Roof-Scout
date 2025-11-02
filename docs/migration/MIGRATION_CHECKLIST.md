# Angular 20+ Migration Checklist

## Pre-Migration Setup

### Environment Preparation
- [ ] Backup current codebase to git branch `refactor/feature-architecture`
- [ ] Ensure Node.js is compatible (Node 18+ recommended)
- [ ] Verify Angular CLI version (`ng version`)
- [ ] Create new feature branch: `git checkout -b migration/feature-architecture`
- [ ] Document current dependencies: `npm list > current-dependencies.txt`

### Understanding Current State
- [ ] Run bundle analyzer on current build
- [ ] Document current component count
- [ ] Document current service count
- [ ] Test current app functionality (create test leads, test AI, test maps)
- [ ] Take screenshots of current UI for comparison later

---

## Phase 1: Foundation Setup ⏱️ Week 1-2

### Directory Structure Creation
- [ ] Create core directory structure
  ```bash
  mkdir -p src/app/core/{services,guards,interceptors}
  ```
- [ ] Create shared directory structure
  ```bash
  mkdir -p src/app/shared/{components/{ui,lead-card,map-marker},directives,pipes,utils,models}
  ```
- [ ] Create features directory structure
  ```bash
  mkdir -p src/app/features/{leads,maps,sessions,chatbot}
  ```
- [ ] Create layouts directory
  ```bash
  mkdir -p src/app/layouts/{main-layout,auth-layout}
  ```
- [ ] Create environments directory
  ```bash
  mkdir -p src/environments
  ```
- [ ] Create assets structure
  ```bash
  mkdir -p src/assets/{images/{logos,icons,placeholders},styles,fonts}
  ```

### Environment Configuration
- [ ] Create `src/environments/environment.ts`
- [ ] Create `src/environments/environment.development.ts`
- [ ] Create `src/environments/environment.staging.ts`
- [ ] Create `src/environments/environment.production.ts`
- [ ] Update `tsconfig.json` with path aliases
- [ ] Test environment files compile

### App Configuration
- [ ] Create `src/app/app.config.ts`
  - [ ] Add zone change detection configuration
  - [ ] Add router configuration with `withComponentInputBinding()`
  - [ ] Add HTTP client configuration
  - [ ] Add animations provider
- [ ] Create `src/app/app.routes.ts`
  - [ ] Define root routes
  - [ ] Set up lazy loading structure
  - [ ] Add guard placeholders

### Model Refactoring
- [ ] Create `src/app/shared/models/lead.model.ts`
  - [ ] Extract Lead interface
  - [ ] Extract LeadStatus type
  - [ ] Extract PRIORITIES constant
  - [ ] Export DTO interfaces (CreateLeadDto, UpdateLeadDto)
- [ ] Create `src/app/shared/models/session.model.ts`
  - [ ] Extract Session interface
  - [ ] Create CreateSessionDto interface
- [ ] Create `src/app/shared/models/common.model.ts`
  - [ ] Create ApiResponse interface
  - [ ] Create PaginatedResponse interface
  - [ ] Create GeoLocation interface
  - [ ] Create SelectOption interface
- [ ] Update `src/app/models.ts` to re-export from new locations
- [ ] Run TypeScript compiler to check for errors
- [ ] Fix any import errors from model changes

### Core Services Migration
- [ ] Move `src/services/data.service.ts` → `src/app/core/services/data.service.ts`
  - [ ] Update import paths for models
  - [ ] Update import paths for utilities
  - [ ] Verify DI configuration
- [ ] Move `src/services/gemini.service.ts` → `src/app/core/services/gemini.service.ts`
  - [ ] Update import paths for models
  - [ ] Update service dependencies
  - [ ] Update environment variable access
- [ ] Move `src/services/theme.service.ts` → `src/app/core/services/theme.service.ts`
- [ ] Move `src/services/maps-loader.service.ts` → `src/app/core/services/maps-loader.service.ts`
- [ ] Update all component imports for moved services
- [ ] Test compilation after service moves

### Utility Migration
- [ ] Move `src/utils/security.util.ts` → `src/app/shared/utils/security.util.ts`
- [ ] Update all imports for security.util
- [ ] Test compilation after utility move

### Testing Phase 1
- [ ] Run `ng build` to ensure compilation succeeds
- [ ] Run `ng serve` to test basic functionality
- [ ] Test that leads can still be created
- [ ] Test that AI scoring works
- [ ] Test that maps display correctly
- [ ] Check browser console for errors
- [ ] Run TypeScript compiler: `tsc --noEmit`

---

## Phase 2: Core Module Creation ⏱️ Week 3

### Guards Implementation
- [ ] Create `src/app/core/guards/auth.guard.ts`
  - [ ] Implement basic auth guard structure
  - [ ] Add placeholder authentication service reference
- [ ] Create `src/app/core/guards/lead.guard.ts` (if needed)
- [ ] Update route configuration to use guards
- [ ] Test guard compilation

### HTTP Interceptors
- [ ] Create `src/app/core/interceptors/logging.interceptor.ts`
  - [ ] Add request/response logging
  - [ ] Add timing information
- [ ] Create `src/app/core/interceptors/error-handler.interceptor.ts`
  - [ ] Handle HTTP errors globally
  - [ ] Add user-friendly error messages
- [ ] Add interceptors to app.config.ts
- [ ] Test interceptors in dev environment

### Authentication Service
- [ ] Create `src/app/core/services/auth.service.ts`
  - [ ] Implement authentication logic
  - [ ] Add session management
  - [ ] Add login/logout methods
- [ ] Test authentication flow

### Error Handling
- [ ] Create `src/app/core/services/error-handler.service.ts`
  - [ ] Global error handler
  - [ ] Logging service integration
  - [ ] User notification system
- [ ] Register error handler in app.config.ts
- [ ] Test error handling scenarios

### Testing Phase 2
- [ ] Run full build: `ng build --configuration development`
- [ ] Run dev server: `ng serve`
- [ ] Test all core services work correctly
- [ ] Verify interceptors are logging
- [ ] Check for runtime errors
- [ ] Run Lighthouse audit to check performance

---

## Phase 3: Shared Module Creation ⏱️ Week 3-4

### UI Components
- [ ] Create `src/app/shared/components/ui/button/button.component.ts`
  - [ ] Implement variant props (primary, secondary, danger)
  - [ ] Implement size props (sm, md, lg)
  - [ ] Add proper styling
  - [ ] Add accessibility attributes
- [ ] Create `src/app/shared/components/ui/modal/modal.component.ts`
  - [ ] Modal backdrop
  - [ ] Close on escape/backdrop
  - [ ] Focus management
- [ ] Create `src/app/shared/components/ui/loader/loader.component.ts`
  - [ ] Spinner animation
  - [ ] Loading states
- [ ] Test all UI components independently

### Utility Functions
- [ ] Create `src/app/shared/utils/validation.util.ts`
  - [ ] email validation
  - [ ] phone validation
  - [ ] address validation
- [ ] Create `src/app/shared/utils/date.util.ts`
  - [ ] date formatting
  - [ ] relative time
- [ ] Create `src/app/shared/utils/storage.util.ts`
  - [ ] localStorage wrapper
  - [ ] quota management
- [ ] Create `src/app/shared/utils/form.util.ts`
  - [ ] form validation helpers
  - [ ] error message formatting

### Shared Directives
- [ ] Create `src/app/shared/directives/click-outside.directive.ts`
- [ ] Create `src/app/shared/directives/autoscroll.directive.ts`
- [ ] Create `src/app/shared/directives/loading.directive.ts`

### Shared Pipes
- [ ] Create `src/app/shared/pipes/address-format.pipe.ts`
- [ ] Create `src/app/shared/pipes/phone-format.pipe.ts`
- [ ] Create `src/app/shared/pipes/date-format.pipe.ts`

### Testing Phase 3
- [ ] Build shared components
- [ ] Test UI components in isolation
- [ ] Test utility functions
- [ ] Verify no circular dependencies
- [ ] Run linting: `ng lint`

---

## Phase 4: Feature Modules Migration ⏱️ Week 5-8

### Feature: Leads
**Week 5**

#### Routing Setup
- [ ] Create `src/app/features/leads/leads.routes.ts`
  - [ ] Define /leads route
  - [ ] Define /leads/new route
  - [ ] Define /leads/:id route

#### Component Migration
- [ ] Create `src/app/features/leads/components/lead-list/`
  - [ ] Move lead-list.component.ts
  - [ ] Move lead-list.component.html
  - [ ] Update imports for new structure
  - [ ] Break down into smaller components if >100 lines
- [ ] Create `src/app/features/leads/components/lead-form/`
  - [ ] Extract lead form logic
  - [ ] Create standalone component
  - [ ] Use shared UI components
- [ ] Create `src/app/features/leads/components/lead-detail/`
  - [ ] Extract detail view logic
  - [ ] Create standalone component
- [ ] Create `src/app/features/leads/components/lead-card/`
  - [ ] Extract card display
  - [ ] Make reusable component

#### Services
- [ ] Create `src/app/features/leads/services/lead-state.service.ts`
  - [ ] Feature-specific state management
  - [ ] Orchestrate core services
- [ ] Create `src/app/features/leads/services/lead-api.service.ts`
  - [ ] API-specific logic if needed

#### Store Implementation
- [ ] Create `src/app/features/leads/stores/lead.store.ts`
  - [ ] Signal-based state
  - [ ] Computed selectors
  - [ ] Actions for state updates
- [ ] Test store independently

#### Testing Leads Feature
- [ ] Build leads feature: `ng build`
- [ ] Test lead list displays correctly
- [ ] Test lead form creates leads
- [ ] Test lead detail view
- [ ] Test lead deletion
- [ ] Verify lazy loading works
- [ ] Test store state management

### Feature: Maps
**Week 6**

#### Routing Setup
- [ ] Create `src/app/features/maps/maps.routes.ts`
- [ ] Define /maps route

#### Component Migration
- [ ] Create `src/app/features/maps/components/map-view/`
  - [ ] Move map-view.component.ts
  - [ ] Move map-view.component.html
  - [ ] Update imports
- [ ] Create `src/app/features/maps/components/interactive-map/`
  - [ ] Move interactive-map.component.ts
  - [ ] Move interactive-map.component.html
- [ ] Create `src/app/features/maps/components/google-map/`
  - [ ] Move google-map.component.ts
  - [ ] Move google-map.component.html
- [ ] Create `src/app/features/maps/components/map-controls/`
  - [ ] Extract map controls
  - [ ] Make standalone component

#### Services
- [ ] Create `src/app/features/maps/services/map-action.service.ts`
  - [ ] Move from core if feature-specific
- [ ] Create `src/app/features/maps/services/map-state.service.ts`
  - [ ] Map-specific state
  - [ ] Marker management
  - [ ] View state

#### Store Implementation
- [ ] Create `src/app/features/maps/stores/map.store.ts`
  - [ ] Current view state
  - [ ] Selected markers
  - [ ] Map bounds

#### Testing Maps Feature
- [ ] Test map displays correctly
- [ ] Test markers show leads
- [ ] Test click to create lead
- [ ] Test fly-to-address functionality
- [ ] Verify lazy loading works

### Feature: Sessions
**Week 7**

#### Routing Setup
- [ ] Create `src/app/features/sessions/sessions.routes.ts`
- [ ] Define /sessions route

#### Component Migration
- [ ] Create `src/app/features/sessions/components/sessions-view/`
  - [ ] Move sessions-view.component.ts
  - [ ] Move sessions-view.component.html
- [ ] Create `src/app/features/sessions/components/session-card/`
  - [ ] Extract session card display

#### Services
- [ ] Create `src/app/features/sessions/services/session-state.service.ts`
- [ ] Create `src/app/features/sessions/services/session-api.service.ts`

#### Store Implementation
- [ ] Create `src/app/features/sessions/stores/session.store.ts`

#### Testing Sessions Feature
- [ ] Test session list displays
- [ ] Test session creation
- [ ] Test session switching
- [ ] Test session deletion
- [ ] Verify lazy loading works

### Feature: Chatbot
**Week 8**

#### Routing Setup
- [ ] Create `src/app/features/chatbot/chatbot.routes.ts`
- [ ] Define /chatbot route

#### Component Migration
- [ ] Create `src/app/features/chatbot/components/chatbot/`
  - [ ] Move chatbot.component.ts
  - [ ] Move chatbot.component.html
  - [ ] Update imports
- [ ] Create `src/app/features/chatbot/components/chat-window/`
  - [ ] Extract chat window logic
- [ ] Create `src/app/features/chatbot/components/voice-controls/`
  - [ ] Extract voice controls

#### Services
- [ ] Create `src/app/features/chatbot/services/chat-state.service.ts`
- [ ] Create `src/app/features/chatbot/services/audio.service.ts`

#### Store Implementation
- [ ] Create `src/app/features/chatbot/stores/chat.store.ts`

#### Testing Chatbot Feature
- [ ] Test AI chat functionality
- [ ] Test voice conversation
- [ ] Test transcription
- [ ] Test TTS playback
- [ ] Verify lazy loading works

### Global Testing After All Features
- [ ] Run full build: `ng build --configuration production`
- [ ] Test all features work together
- [ ] Test navigation between features
- [ ] Test lazy loading on demand
- [ ] Verify no memory leaks
- [ ] Check bundle size: `npx webpack-bundle-analyzer dist/`
- [ ] Run Lighthouse performance audit

---

## Phase 5: Testing & Polish ⏱️ Week 9-10

### Unit Testing
#### Core Services
- [ ] Write tests for `data.service.spec.ts`
  - [ ] Test addLead
  - [ ] Test updateLead
  - [ ] Test deleteLead
  - [ ] Test session management
- [ ] Write tests for `gemini.service.spec.ts`
  - [ ] Test AI scoring
  - [ ] Test property research
  - [ ] Test pitch generation

#### Shared Components
- [ ] Write tests for button.component.spec.ts
- [ ] Write tests for modal.component.spec.ts
- [ ] Write tests for loader.component.spec.ts

#### Features
- [ ] Write tests for lead-list.component.spec.ts
- [ ] Write tests for lead-store.spec.ts
- [ ] Write tests for map-view.component.spec.ts
- [ ] Write tests for sessions-view.component.spec.ts
- [ ] Write tests for chatbot.component.spec.ts

#### Utilities
- [ ] Write tests for validation.util.spec.ts
- [ ] Write tests for date.util.spec.ts
- [ ] Write tests for storage.util.spec.ts

#### Coverage Targets
- [ ] Core services: 90% coverage
- [ ] Feature components: 80% coverage
- [ ] Shared components: 90% coverage
- [ ] Utilities: 95% coverage
- [ ] Overall coverage: 85%+

### Integration Testing
- [ ] Test lead creation flow end-to-end
- [ ] Test AI scoring integration
- [ ] Test map integration with leads
- [ ] Test session switching
- [ ] Test chatbot integration with AI

### Performance Testing
- [ ] Measure bundle sizes
  - [ ] Initial bundle < 50KB
  - [ ] Maps feature < 130KB
  - [ ] Leads feature < 160KB
  - [ ] Sessions feature < 90KB
  - [ ] Chatbot feature < 210KB
- [ ] Measure load times
  - [ ] Initial load < 2s on 3G
  - [ ] Feature load < 1s on 3G
- [ ] Run Lighthouse audit
  - [ ] Performance score > 90
  - [ ] Best Practices score > 95
  - [ ] Accessibility score > 95
  - [ ] SEO score > 90

### Code Quality
- [ ] Run ESLint: `ng lint`
  - [ ] No errors
  - [ ] No warnings (or justified)
- [ ] Run Prettier: `npx prettier --check .`
- [ ] Check TypeScript strict mode: `tsc --noEmit`
- [ ] Verify no circular dependencies: `npm run circular-deps`

### Documentation
- [ ] Update README.md with new structure
- [ ] Add architecture diagram
- [ ] Document how to add new features
- [ ] Document testing approach
- [ ] Document coding standards

### Final Polish
- [ ] Remove all console.log statements
- [ ] Add proper error handling
- [ ] Add loading states everywhere
- [ ] Add accessibility attributes
- [ ] Add ARIA labels
- [ ] Optimize images and assets
- [ ] Minify CSS and JS
- [ ] Enable gzip compression

### Production Build
- [ ] Run production build: `ng build --configuration production`
- [ ] Verify build succeeds without errors
- [ ] Check bundle analyzer output
- [ ] Test production build locally: `ng serve --configuration production`
- [ ] Deploy to staging environment
- [ ] Run E2E tests on staging
- [ ] Get stakeholder approval

---

## Phase 6: Deployment & Monitoring ⏱️ Week 10

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Backup current production code

### Deployment Steps
- [ ] Tag release version: `git tag -a v2.0.0 -m "Feature-based architecture"`
- [ ] Push to remote: `git push origin main --tags`
- [ ] Deploy to staging
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Monitor performance metrics

### Post-Deployment Monitoring
- [ ] Monitor error rates (should be < 0.1%)
- [ ] Monitor page load times (should be < 2s)
- [ ] Monitor JavaScript errors
- [ ] Monitor bundle sizes
- [ ] Monitor user feedback
- [ ] Monitor conversion rates

### Success Criteria
- [ ] Error rate < 0.1%
- [ ] Page load time < 2s
- [ ] All tests passing
- [ ] No critical bugs reported
- [ ] User satisfaction > 4.5/5

---

## Rollback Plan (if needed)

### If Critical Issues Found
1. **Immediate Actions**
   - [ ] Identify issue severity
   - [ ] Document error details
   - [ ] Notify stakeholders

2. **Rollback Decision**
   - [ ] If >10% users affected → Rollback immediately
   - [ ] If <10% users affected → Hotfix in progress
   - [ ] Decision within 30 minutes

3. **Rollback Execution**
   ```bash
   git checkout v1.0.0
   git checkout -b hotfix/rollback-v2.0.0
   ng build --configuration production
   # Deploy v1.0.0
   ```

4. **Post-Rollback**
   - [ ] Verify rollback successful
   - [ ] Document lessons learned
   - [ ] Plan next steps

---

## Completion Checklist

### Final Verification
- [ ] All phases completed
- [ ] All tests passing
- [ ] Performance improved
- [ ] Bundle size reduced
- [ ] Code quality improved
- [ ] Documentation complete
- [ ] Team trained on new structure
- [ ] Stakeholder approval received
- [ ] Production deployed successfully
- [ ] Monitoring in place

### Metrics Summary
- [ ] Initial bundle: ____ KB (target: < 50KB)
- [ ] Load time: ____ seconds (target: < 2s)
- [ ] Test coverage: ____ % (target: > 85%)
- [ ] Error rate: ____ % (target: < 0.1%)
- [ ] User satisfaction: ____ / 5 (target: > 4.5)

### Sign-off
- [ ] Technical Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______
- [ ] QA Lead: ______________________ Date: _______
- [ ] DevOps Lead: __________________ Date: _______

---

## Post-Migration Activities (Week 11+)

### Team Enablement
- [ ] Conduct architecture overview session
- [ ] Create coding standards guide
- [ ] Set up pair programming sessions
- [ ] Document common patterns

### Continuous Improvement
- [ ] Monitor performance metrics weekly
- [ ] Review code quality monthly
- [ ] Update documentation as needed
- [ ] Plan next optimization phase

### Lessons Learned
- [ ] Document what went well
- [ ] Document challenges faced
- [ ] Document solutions found
- [ ] Share with engineering team
- [ ] Update migration guide for future use

---

**Migration Checklist Version**: 1.0
**Created**: November 1, 2025
**Status**: Ready for Implementation

---

## Quick Reference Commands

```bash
# Create directory structure
mkdir -p src/app/core/{services,guards,interceptors}
mkdir -p src/app/shared/{components/{ui,lead-card,map-marker},directives,pipes,utils,models}
mkdir -p src/app/features/{leads,maps,sessions,chatbot}/{components,services,stores}
mkdir -p src/app/layouts/{main-layout,auth-layout}
mkdir -p src/environments
mkdir -p src/assets/{images/{logos,icons,placeholders},styles,fonts}

# Build and test
ng build                              # Development build
ng build --configuration production   # Production build
ng serve                              # Dev server
ng test                               # Unit tests
ng e2e                                # E2E tests
ng lint                               # Linting

# Bundle analysis
npx webpack-bundle-analyzer dist/roof-scout/browser/main.js

# Performance audit
npx lighthouse http://localhost:4200 --output html --output-path ./lighthouse-report.html

# TypeScript check
tsc --noEmit

# Circular dependency check
npm install -g madge
madge src/app --circular

# Prettier formatting
npx prettier --write .
```

---

## Common Issues & Solutions

### Issue: Circular Dependencies
**Symptom**: Build fails with circular dependency error
**Solution**:
1. Identify circular dependency using Madge
2. Move shared code to a lower layer
3. Use forward references if necessary
4. Restructure imports

### Issue: Lazy Loading Not Working
**Symptom**: All code loads initially despite lazy routes
**Solution**:
1. Verify loadComponent/loadChildren syntax
2. Ensure standalone components are properly imported
3. Check route configuration
4. Verify TypeScript paths

### Issue: Signals Not Updating UI
**Symptom**: Component doesn't reflect signal changes
**Solution**:
1. Verify OnPush change detection is set
2. Ensure computed signals are used correctly
3. Check effect dependencies
4. Use `toSignal` for observables

### Issue: Bundle Size Still Large
**Symptom**: Initial bundle > 100KB
**Solution**:
1. Run bundle analyzer
2. Identify large dependencies
3. Implement code splitting
4. Use dynamic imports for heavy libraries
5. Consider tree-shaking

---

## Resources

- [Angular Standalone Components Guide](https://angular.dev/guide/templates/standalone-components)
- [Angular Signals](https://angular.dev/guide/signals)
- [Angular Routing](https://angular.dev/guide/routing)
- [Angular Testing](https://angular.io/guide/testing)
- [Angular Performance](https://angular.io/guide/deployment)

---

**End of Checklist**