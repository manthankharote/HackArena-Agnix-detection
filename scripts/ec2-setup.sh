#!/bin/bash
# =============================================================
# CleanCity Backend — EC2 First-Time Setup Script
# Run this ONCE after SSH-ing into your new EC2 instance
# Usage: bash scripts/ec2-setup.sh
# =============================================================

set -e

echo "========================================="
echo "🚀 CleanCity EC2 Setup Starting..."
echo "========================================="

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y docker.io docker-compose-v2
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# 3. Install Git (usually pre-installed)
sudo apt install -y git

# 4. Install Nginx for reverse proxy
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# 5. Clone the repository
echo "📂 Cloning repository..."
cd ~
if [ -d "Illegal-Dumping-Detection" ]; then
    echo "Repository already exists, pulling latest..."
    cd Illegal-Dumping-Detection && git pull origin main && cd ~
else
    git clone https://github.com/manthankharote/Illegal-Dumping-Detection.git
fi

# 6. Create backend .env file (user must edit this)
echo "📝 Creating backend .env template..."
cat > ~/Illegal-Dumping-Detection/backend/.env << 'ENVFILE'
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://123mankh_db_user:mankh123password@cluster0.lzlcget.mongodb.net/cleancity?retryWrites=true&w=majority
JWT_SECRET=CleanCityAI_SuperSecret_JWT_Key_2024_ChangeMe
JWT_EXPIRE=7d
AI_SERVICE_URL=https://manthankharote-illegal-garbage-dumping-detection.hf.space
CLIENT_URL=https://cleancity.agnix.site
DETECTION_API_KEY=cleancity-detection-key
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENVFILE

# 7. Build and run Docker container
echo "🐳 Building Docker image (this takes 3-5 minutes)..."
cd ~/Illegal-Dumping-Detection/backend
sudo docker build -t cleancity-backend .

echo "🚀 Starting container..."
sudo docker run -d \
    --name cleancity-backend \
    --restart unless-stopped \
    -p 5000:5000 \
    --env-file .env \
    cleancity-backend

# 8. Verify
echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo ""
echo "Container status:"
sudo docker ps --filter name=cleancity-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "View logs with: docker logs -f cleancity-backend"
echo ""
echo "⚠️  IMPORTANT: Log out and log back in (type 'exit' then SSH again)"
echo "   This is needed so you can run docker without 'sudo'"
echo ""
echo "🌐 Test your backend at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000"
echo ""
