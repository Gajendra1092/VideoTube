#!/bin/bash

# VideoTube Deployment Setup Script
# This script helps prepare your application for production deployment

echo "🚀 VideoTube Deployment Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_status "Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "npm is installed: $(npm --version)"

# Generate JWT secrets
echo ""
print_info "Generating JWT secrets for production..."
echo ""
echo "Add these to your production environment variables:"
echo "=================================================="
echo "ACCESS_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "=================================================="
echo ""

# Check backend dependencies
echo ""
print_info "Checking backend dependencies..."
cd Backend_yt
if [ -f "package.json" ]; then
    npm install
    print_status "Backend dependencies installed"
else
    print_error "Backend package.json not found"
    exit 1
fi

# Check frontend dependencies
echo ""
print_info "Checking frontend dependencies..."
cd ../frontend
if [ -f "package.json" ]; then
    npm install
    print_status "Frontend dependencies installed"
else
    print_error "Frontend package.json not found"
    exit 1
fi

# Test frontend build
echo ""
print_info "Testing frontend build..."
if npm run build; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

# Go back to root directory
cd ..

echo ""
print_status "Deployment setup complete!"
echo ""
print_info "Next steps:"
echo "1. Copy .env.production.template to .env in Backend_yt"
echo "2. Copy .env.production.template to .env.production in frontend"
echo "3. Update environment variables with your production values"
echo "4. Follow the DEPLOYMENT_GUIDE.md for platform-specific deployment"
echo ""
print_warning "Remember to:"
echo "- Use the generated JWT secrets above"
echo "- Update CORS_ORIGIN with your frontend URL"
echo "- Use production MongoDB URI"
echo "- Test all functionality after deployment"
