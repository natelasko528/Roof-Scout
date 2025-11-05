#!/bin/bash

# Comprehensive Testing Script for Roof Scout Storm Functionality
# This script runs all tests and validations for the storm/weather features

set -e  # Exit on any error

echo "🌩️  Roof Scout Storm Functionality Test Suite"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    echo "================================"
    echo "$1"
    echo "================================"
}

# Check prerequisites
print_header "📋 Checking Prerequisites"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status $RED "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

print_status $GREEN "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_status $RED "❌ npm is not installed"
    exit 1
fi

print_status $GREEN "✅ npm $(npm --version) found"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "⚠️  Dependencies not installed. Installing..."
    npm install
fi

print_status $GREEN "✅ Dependencies installed"

# Check environment variables
print_header "🔧 Checking Environment Configuration"

if [ ! -f ".env.local" ]; then
    print_status $RED "❌ .env.local file not found"
    echo "Please create .env.local with required API keys:"
    echo "VITE_GEMINI_API_KEY=your_gemini_key"
    echo "VITE_WEATHER_API_KEY=your_weather_key"
    exit 1
fi

print_status $GREEN "✅ .env.local file found"

# Check API keys
if ! grep -q "VITE_WEATHER_API_KEY=" .env.local || grep -q "your_weather_api_key_here" .env.local; then
    print_status $YELLOW "⚠️  Weather API key may not be configured properly"
else
    print_status $GREEN "✅ Weather API key configured"
fi

if ! grep -q "VITE_GEMINI_API_KEY=" .env.local || grep -q "your_api_key_here" .env.local; then
    print_status $YELLOW "⚠️  Gemini API key may not be configured properly"
else
    print_status $GREEN "✅ Gemini API key configured"
fi

# Test Weather API connectivity
print_header "🌦️  Testing Weather API Connectivity"

if [ -f "scripts/test-weather-api.js" ]; then
    print_status $BLUE "Running weather API tests..."
    if node scripts/test-weather-api.js; then
        print_status $GREEN "✅ Weather API tests passed"
    else
        print_status $RED "❌ Weather API tests failed"
        echo "Check your VITE_WEATHER_API_KEY in .env.local"
    fi
else
    print_status $YELLOW "⚠️  Weather API test script not found"
fi

# Build the application
print_header "🔨 Building Application"

print_status $BLUE "Building application..."
if npm run build; then
    print_status $GREEN "✅ Application built successfully"
else
    print_status $RED "❌ Build failed"
    exit 1
fi

# Start development server in background
print_header "🚀 Starting Development Server"

print_status $BLUE "Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

# Wait for server to start
sleep 10

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    print_status $GREEN "✅ Development server running on http://localhost:3000"
else
    print_status $RED "❌ Development server failed to start"
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
fi

# Run E2E tests
print_header "🧪 Running E2E Tests"

if command -v npx &> /dev/null; then
    print_status $BLUE "Installing Playwright browsers..."
    npx playwright install --with-deps chromium
    
    print_status $BLUE "Running storm functionality tests..."
    if npx playwright test storm-functionality.spec.ts; then
        print_status $GREEN "✅ Storm functionality E2E tests passed"
    else
        print_status $YELLOW "⚠️  Some storm functionality tests may have failed"
        echo "Check the test report for details"
    fi
    
    print_status $BLUE "Running all E2E tests..."
    if npx playwright test; then
        print_status $GREEN "✅ All E2E tests passed"
    else
        print_status $YELLOW "⚠️  Some E2E tests may have failed"
        echo "Check the test report for details"
    fi
    
    # Generate test report
    print_status $BLUE "Generating test report..."
    npx playwright show-report --host=0.0.0.0 &
    REPORT_PID=$!
    
    print_status $GREEN "✅ Test report available at http://localhost:9323"
else
    print_status $YELLOW "⚠️  Playwright not available, skipping E2E tests"
fi

# Manual testing checklist
print_header "📝 Manual Testing Checklist"

echo "Please manually verify the following functionality:"
echo ""
echo "1. Address Search → Storm History:"
echo "   - Navigate to http://localhost:3000"
echo "   - Go to Map view"
echo "   - Search for: 'Moore, OK'"
echo "   - Verify storm history panel appears"
echo "   - Check storm events are displayed"
echo ""
echo "2. Storm Date Search:"
echo "   - Use the date picker to select a storm date"
echo "   - Verify affected homes table appears"
echo "   - Check table shows relevant data"
echo ""
echo "3. Map Visualization:"
echo "   - Verify storm markers appear on map"
echo "   - Click on storm markers to see popups"
echo "   - Check marker colors match severity"
echo ""
echo "4. Error Handling:"
echo "   - Test with invalid addresses"
echo "   - Test with network disconnected"
echo "   - Verify graceful error messages"

# Cleanup function
cleanup() {
    print_header "🧹 Cleaning Up"
    
    if [ ! -z "$DEV_SERVER_PID" ]; then
        print_status $BLUE "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$REPORT_PID" ]; then
        print_status $BLUE "Stopping test report server..."
        kill $REPORT_PID 2>/dev/null || true
    fi
    
    print_status $GREEN "✅ Cleanup complete"
}

# Set up cleanup on script exit
trap cleanup EXIT

# Wait for user input to keep servers running
print_header "⏳ Test Environment Ready"
echo "Development server: http://localhost:3000"
echo "Test report: http://localhost:9323"
echo ""
echo "Press Ctrl+C to stop all servers and exit"

# Keep script running
while true; do
    sleep 1
done
