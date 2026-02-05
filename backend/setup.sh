#!/bin/bash

# Ayn Platform Backend Setup Script

echo "🚀 Setting up Ayn Platform Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "⚠️  Please edit .env file with your configuration!"
else
    echo "✅ .env file already exists"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. Please install Node.js to use Prisma."
    exit 1
fi

# Install Prisma CLI if not already installed
if ! command -v prisma &> /dev/null; then
    echo "📦 Installing Prisma CLI..."
    npm install -g prisma
else
    echo "✅ Prisma CLI is already installed"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
prisma generate

# Check if database is configured
if grep -q "postgresql://user:password@localhost" .env; then
    echo "⚠️  Please configure DATABASE_URL in .env before running migrations!"
else
    echo "🗄️  Running database migrations..."
    read -p "Do you want to run migrations now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        prisma migrate dev --name init
    else
        echo "⏭️  Skipping migrations. Run 'prisma migrate dev' when ready."
    fi
fi

echo "✅ Setup complete!"
echo ""
echo "To start the server, run:"
echo "  uvicorn main:app --reload"
echo ""
echo "Or:"
echo "  python main.py"

