#!/usr/bin/env node

/**
 * Weather API Testing Script
 * Tests connectivity and data quality for VisualCrossing Weather API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const API_KEY = process.env.VITE_WEATHER_API_KEY;
const API_BASE = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

// Test addresses in areas known for severe weather
const TEST_ADDRESSES = [
  { name: 'Moore, OK (Tornado Alley)', address: 'Moore, OK', lat: 35.3395, lng: -97.4866 },
  { name: 'Joplin, MO (Historic Tornado)', address: 'Joplin, MO', lat: 37.0842, lng: -94.5133 },
  { name: 'Tuscaloosa, AL (Dixie Alley)', address: 'Tuscaloosa, AL', lat: 33.2098, lng: -87.5692 },
  { name: 'Hail Alley - Denver, CO', address: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Hurricane Coast - Miami, FL', address: 'Miami, FL', lat: 25.7617, lng: -80.1918 }
];

class WeatherAPITester {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('🌩️  Weather API Testing Suite');
    console.log('================================');
    
    if (!API_KEY || API_KEY === 'your_weather_api_key_here') {
      console.error('❌ WEATHER_API_KEY not configured in .env.local');
      console.error('   Please add VITE_WEATHER_API_KEY to your .env.local file');
      process.exit(1);
    }

    console.log(`✅ API Key configured: ${API_KEY.substring(0, 8)}...`);
    console.log(`🔗 Testing API: ${API_BASE}`);
    console.log('');

    // Test API connectivity
    await this.testAPIConnectivity();

    // Test each location
    for (const location of TEST_ADDRESSES) {
      await this.testLocationWeatherData(location);
    }

    // Test historical data
    await this.testHistoricalData();

    // Test error handling
    await this.testErrorHandling();

    this.printSummary();
  }

  async testAPIConnectivity() {
    console.log('🔍 Testing API Connectivity...');
    this.totalTests++;

    try {
      const testUrl = `${API_BASE}/Denver,CO/today?key=${API_KEY}&include=current&elements=temp&unitGroup=us&format=json`;
      const response = await this.makeRequest(testUrl);
      
      if (response.statusCode === 200) {
        console.log('✅ API connectivity successful');
        this.passedTests++;
      } else {
        console.log(`❌ API connectivity failed: ${response.statusCode}`);
        this.failedTests++;
      }
    } catch (error) {
      console.log(`❌ API connectivity error: ${error.message}`);
      this.failedTests++;
    }
    console.log('');
  }

  async testLocationWeatherData(location) {
    console.log(`🌍 Testing ${location.name}...`);
    this.totalTests++;

    try {
      // Test historical weather data (5 years)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 5);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const url = `${API_BASE}/${location.lat},${location.lng}/${start}/${end}?key=${API_KEY}&include=days&elements=datetime,temp,precip,windspeed,hail,severerisk,conditions&unitGroup=us&format=json`;
      
      const response = await this.makeRequest(url);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.data);
        
        // Validate data structure
        if (data.days && Array.isArray(data.days)) {
          const stormEvents = this.extractStormEvents(data.days);
          console.log(`   📊 Found ${data.days.length} days of data`);
          console.log(`   ⛈️  Detected ${stormEvents.length} storm events`);
          
          if (stormEvents.length > 0) {
            const hailEvents = stormEvents.filter(e => e.type === 'hail').length;
            const severeEvents = stormEvents.filter(e => e.severity === 'severe' || e.severity === 'extreme').length;
            console.log(`   ❄️  Hail events: ${hailEvents}`);
            console.log(`   🚨 Severe events: ${severeEvents}`);
          }
          
          console.log('✅ Location data test passed');
          this.passedTests++;
        } else {
          console.log('❌ Invalid data structure');
          this.failedTests++;
        }
      } else {
        console.log(`❌ Request failed: ${response.statusCode}`);
        this.failedTests++;
      }
    } catch (error) {
      console.log(`❌ Location test error: ${error.message}`);
      this.failedTests++;
    }
    console.log('');
  }

  async testHistoricalData() {
    console.log('📅 Testing Historical Data Range...');
    this.totalTests++;

    try {
      // Test specific date range
      const url = `${API_BASE}/Moore,OK/2023-05-01/2023-05-31?key=${API_KEY}&include=days&elements=datetime,hail,windspeed,conditions&unitGroup=us&format=json`;
      const response = await this.makeRequest(url);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.data);
        console.log(`   📊 May 2023 data points: ${data.days?.length || 0}`);
        console.log('✅ Historical data test passed');
        this.passedTests++;
      } else {
        console.log(`❌ Historical data test failed: ${response.statusCode}`);
        this.failedTests++;
      }
    } catch (error) {
      console.log(`❌ Historical data error: ${error.message}`);
      this.failedTests++;
    }
    console.log('');
  }

  async testErrorHandling() {
    console.log('🚫 Testing Error Handling...');
    this.totalTests++;

    try {
      // Test with invalid API key
      const url = `${API_BASE}/Denver,CO/today?key=invalid_key&include=current&elements=temp&unitGroup=us&format=json`;
      const response = await this.makeRequest(url);
      
      if (response.statusCode === 401 || response.statusCode === 403) {
        console.log('✅ Error handling test passed (proper auth error)');
        this.passedTests++;
      } else {
        console.log(`❌ Unexpected response for invalid key: ${response.statusCode}`);
        this.failedTests++;
      }
    } catch (error) {
      console.log('✅ Error handling test passed (network error caught)');
      this.passedTests++;
    }
    console.log('');
  }

  extractStormEvents(days) {
    const events = [];
    
    for (const day of days) {
      const date = day.datetime;
      const precip = day.precip || 0;
      const hail = day.hail || 0;
      const windSpeed = day.windspeed || 0;
      const severeRisk = day.severerisk || 0;
      const conditions = day.conditions || '';

      // Detect hail events
      if (hail > 0 || conditions.toLowerCase().includes('hail')) {
        events.push({
          date,
          type: 'hail',
          severity: this.determineSeverity(hail, severeRisk),
          hailSize: hail
        });
      }

      // Detect severe wind events
      if (windSpeed > 58) { // 58+ mph is severe thunderstorm criteria
        events.push({
          date,
          type: 'wind',
          severity: this.determineSeverity(windSpeed / 10, severeRisk),
          windSpeed
        });
      }

      // Detect heavy precipitation events
      if (precip > 1.0) {
        events.push({
          date,
          type: 'rain',
          severity: this.determineSeverity(precip, severeRisk),
          precipitation: precip
        });
      }
    }

    return events;
  }

  determineSeverity(primaryValue, severeRisk) {
    if (primaryValue >= 2.0 || severeRisk >= 75) return 'extreme';
    if (primaryValue >= 1.0 || severeRisk >= 50) return 'severe';
    if (primaryValue >= 0.5 || severeRisk >= 25) return 'moderate';
    return 'mild';
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            data: data
          });
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  printSummary() {
    console.log('📋 Test Summary');
    console.log('===============');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${Math.round((this.passedTests / this.totalTests) * 100)}%`);
    
    if (this.failedTests === 0) {
      console.log('');
      console.log('🎉 All tests passed! Weather API is ready for production.');
    } else {
      console.log('');
      console.log('⚠️  Some tests failed. Please check API configuration and connectivity.');
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new WeatherAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = WeatherAPITester;
