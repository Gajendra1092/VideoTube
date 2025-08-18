#!/bin/bash

# VideoTube Setup Script
# This script helps set up the VideoTube platform for development

echo "🎬 VideoTube Platform Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if MongoDB is running
check_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "MongoDB is installed"
        
        # Try to connect to MongoDB
        if mongo --eval "db.runCommand('ping').ok" localhost:27017/test --quiet &> /dev/null; then
            print_status "MongoDB is running"
        else
            print_warning "MongoDB is installed but not running. Please start MongoDB service."
        fi
    else
        print_warning "MongoDB is not installed locally. You can:"
        echo "  1. Install MongoDB locally"
        echo "  2. Use MongoDB Atlas (cloud database)"
        echo "  3. Use Docker: docker run -d -p 27017:27017 mongo"
    fi
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    if [ ! -d "Backend_yt" ]; then
        print_error "Backend_yt directory not found!"
        return 1
    fi
    
    cd Backend_yt
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed successfully"
    else
        print_error "Failed to install backend dependencies"
        return 1
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_info "Creating backend .env file..."
        cat > .env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/videotube
CORS_ORIGIN=http://localhost:3000

# Generate these secrets with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here_replace_with_random_string
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here_replace_with_random_string
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Configuration (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
EOL
        print_warning "Created .env file. Please update it with your actual values:"
        print_warning "  - Generate JWT secrets"
        print_warning "  - Add Cloudinary credentials"
        print_warning "  - Add Google OAuth credentials (optional)"
    else
        print_status "Backend .env file already exists"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    if [ ! -d "frontend" ]; then
        print_error "frontend directory not found!"
        return 1
    fi
    
    cd frontend
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        return 1
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_info "Creating frontend .env file..."
        cp .env.example .env
        print_status "Created frontend .env file from example"
    else
        print_status "Frontend .env file already exists"
    fi
    
    cd ..
}

# Generate JWT secrets
generate_secrets() {
    print_info "Generating JWT secrets..."
    
    if command -v node &> /dev/null; then
        ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        
        echo ""
        print_info "Generated JWT secrets (add these to Backend_yt/.env):"
        echo "ACCESS_TOKEN_SECRET=$ACCESS_SECRET"
        echo "REFRESH_TOKEN_SECRET=$REFRESH_SECRET"
        echo ""
    else
        print_warning "Node.js not available for secret generation"
    fi
}

# Main setup process
main() {
    echo ""
    print_info "Starting VideoTube setup process..."
    echo ""
    
    # Check prerequisites
    print_info "Checking prerequisites..."
    check_node
    check_mongodb
    echo ""
    
    # Setup backend
    setup_backend
    if [ $? -ne 0 ]; then
        print_error "Backend setup failed"
        exit 1
    fi
    echo ""
    
    # Setup frontend
    setup_frontend
    if [ $? -ne 0 ]; then
        print_error "Frontend setup failed"
        exit 1
    fi
    echo ""
    
    # Generate secrets
    generate_secrets
    
    # Final instructions
    echo ""
    print_status "Setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Update Backend_yt/.env with your actual values"
    echo "2. Start MongoDB (if not already running)"
    echo "3. Start the backend: cd Backend_yt && npm run dev"
    echo "4. Start the frontend: cd frontend && npm run dev"
    echo ""
    print_info "The application will be available at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:5000"
    echo ""
    print_info "For deployment instructions, see DEPLOYMENT.md"
    print_info "For project overview, see PROJECT_OVERVIEW.md"
    echo ""
}

# Run main function
main
