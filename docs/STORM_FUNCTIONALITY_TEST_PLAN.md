# Storm Functionality Testing Plan

## Overview
This document provides a comprehensive testing plan for the storm/weather functionality in Roof Scout.

## Prerequisites
- ✅ Weather API key configured in `.env.local`
- ✅ Application running on `http://localhost:3000`
- ✅ Browser with developer tools open

## Phase 1: Manual Testing Checklist

### Test 1: Address Search → Storm History
**Objective**: Verify that searching for an address displays storm history

**Steps**:
1. Navigate to Map view
2. Click on the address search bar at the top of the map
3. Enter: `123 Main St, Moore, OK 73160`
4. Wait for search results to appear
5. Click on the first search result

**Expected Results**:
- ✅ Storm dates panel appears on the right side
- ✅ Panel shows "Storm History for [address]"
- ✅ List of storm events with dates, types, and severity
- ✅ Events are sorted by date (most recent first)
- ✅ Each event shows: date, storm type icon, severity badge, description

**Verification Points**:
- Check browser console for successful weather API calls
- Verify no JavaScript errors
- Confirm storm events have realistic data (dates within 5 years)

---

### Test 2: Storm Date Search
**Objective**: Test the storm date picker functionality

**Steps**:
1. In Map view, locate the "Storm Date Search" section
2. Click on the date input field
3. Select a date from 2024 (e.g., May 20, 2024)
4. Wait for the affected homes table to load

**Expected Results**:
- ✅ Date picker allows selection from 5 years ago to today
- ✅ "Affected Homes" table appears below the date picker
- ✅ Table shows homes from current session affected on that date
- ✅ Table includes columns: Address, Storm Date, Storm Type, Severity, Details
- ✅ "Clear" button appears to reset the search

**Verification Points**:
- Date constraints are properly set (min/max dates)
- Loading indicator appears while searching
- Empty state message if no affected homes found

---

### Test 3: Affected Homes Table Functionality
**Objective**: Test table sorting, filtering, and interaction

**Steps**:
1. Complete Test 2 to display the affected homes table
2. Click on column headers to test sorting
3. Look for filter dropdowns (storm type, severity)
4. Click on a home row to test selection
5. Look for "View on Map" buttons

**Expected Results**:
- ✅ Column headers are clickable and show sort indicators
- ✅ Sorting works for Address, Date, Storm Type, Severity
- ✅ Filter dropdowns (if present) filter results correctly
- ✅ Row selection highlights the selected home
- ✅ "View on Map" centers map on the selected home

**Verification Points**:
- Sort direction indicators (arrows) appear
- Filtered results update immediately
- Map interaction works properly

---

### Test 4: API Error Handling
**Objective**: Verify graceful handling of API failures

**Steps**:
1. Open browser developer tools → Network tab
2. Block requests to `weather.visualcrossing.com`
3. Try to search for an address
4. Try to select a storm date

**Expected Results**:
- ✅ No application crashes or white screens
- ✅ Error messages are user-friendly
- ✅ Storm panel shows "Unable to load weather data" or similar
- ✅ Date search shows "No data available" or similar
- ✅ Console shows appropriate error logging

---

### Test 5: Performance and Caching
**Objective**: Test API caching and performance

**Steps**:
1. Search for the same address multiple times
2. Check Network tab for API calls
3. Switch between different addresses
4. Return to previously searched address

**Expected Results**:
- ✅ Second search for same address uses cached data (no new API call)
- ✅ Cache persists across page refreshes
- ✅ Different addresses trigger new API calls
- ✅ Loading times are reasonable (< 3 seconds)

---

## Phase 2: E2E Testing

### Run Automated Tests
```bash
# Install dependencies (if not already done)
npm install

# Run storm functionality tests
npx playwright test storm-functionality.spec.ts

# Run all E2E tests
npx playwright test

# Generate test report
npx playwright show-report
```

### Test Coverage Verification
- ✅ Address search and storm panel display
- ✅ Storm date selection and affected homes table
- ✅ Table sorting and filtering
- ✅ Error handling for API failures
- ✅ Cache functionality
- ✅ Cross-browser compatibility

---

## Phase 3: API Testing

### Run Weather API Test Script
```bash
# Make script executable
chmod +x scripts/test-weather-api.js

# Run API tests
node scripts/test-weather-api.js
```

### API Test Coverage
- ✅ API connectivity and authentication
- ✅ Historical weather data retrieval
- ✅ Storm event detection accuracy
- ✅ Error handling for invalid requests
- ✅ Rate limiting compliance

---

## Test Data Recommendations

### Addresses for Testing (Known Severe Weather Areas)
1. **Moore, OK** - Tornado Alley, frequent severe weather
2. **Joplin, MO** - Historic tornado damage
3. **Tuscaloosa, AL** - Dixie Alley tornadoes
4. **Denver, CO** - Hail Alley, frequent hail storms
5. **Miami, FL** - Hurricane activity

### Storm Dates for Testing
- **May 20, 2024** - Peak tornado season
- **April 27, 2024** - Historic severe weather date
- **June 15, 2023** - Summer storm season
- **March 31, 2023** - Spring severe weather

---

## Success Criteria

### Must Pass (Critical)
- ✅ Address search displays storm history
- ✅ Storm date search shows affected homes
- ✅ No JavaScript errors or crashes
- ✅ API calls succeed with valid data
- ✅ Weather data is accurate and recent

### Should Pass (Important)
- ✅ Table sorting and filtering work
- ✅ Caching improves performance
- ✅ Error handling is user-friendly
- ✅ Loading states provide feedback

### Nice to Have (Enhancement)
- ✅ Map visualization of affected homes
- ✅ Export functionality for affected homes
- ✅ Advanced filtering options

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue**: Storm panel doesn't appear after address search
- Check browser console for API errors
- Verify VITE_WEATHER_API_KEY in .env.local
- Test with known severe weather addresses

**Issue**: "No storm events found" for all addresses
- Verify API key is valid and active
- Check API usage limits (1000 calls/day)
- Test with different date ranges

**Issue**: Affected homes table is empty
- Ensure you have leads created in the current session
- Try different storm dates (within last 5 years)
- Check that leads have valid addresses with coordinates

**Issue**: Performance is slow
- Check network connection
- Verify API response times in Network tab
- Clear browser cache and localStorage

---

## Reporting Issues

When reporting issues, please include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Network tab screenshots
6. Test data used (addresses, dates)

---

## Next Steps After Testing

1. **If all tests pass**: Ready for production deployment
2. **If tests fail**: Address issues based on priority
3. **Performance issues**: Implement additional caching
4. **UI/UX issues**: Enhance user interface
5. **API issues**: Review API configuration and limits
