Name and School: Fayozbek Erkinjonov - The Specialized School of Pop District in Uzbekistan
Date: 02/07/26
Project Name: FarmMind Lite
Description: FarmMind Lite is a comprehensive farm management and marketplace platform designed to empower smallholder farmers with AI-driven insights, real-time market data, and a robust trading ecosystem.







# FarmMind Lite - Advanced Agricultural Intelligence 👨‍🌾🚀

## ✨ Key Features

### 🩺 AI Crop Doctor
- **Diagnosis**: Upload photos of your crops for instant disease and pest identification.
- **Computer Vision**: Powered by Google Gemini AI to detect pathogens and nutrient deficiencies.
- **Treatments**: Detailed, step-by-step recommendations for organic and chemical treatments.
- **Healthy Status**: Intelligent detection of healthy plants with supportive care guidance.

### 💰 Profit Estimator
- **Dynamic Projections**: Real-time yield and profit estimates based on live market data.
- **Scale-Aware**: Toggle between **Hectares** and **100 m²** (Small Plot) units for relatable figures.
- **Risk Analysis**: Adjust "Yield-at-Risk" to account for drought, pests, or poor weather.
- **Water-to-Wallet**: Calculates the water requirement for each crop and its economic efficiency.

### 📈 Market Trends
- **Live Prices**: Aggregated retail and wholesale prices from local regions.
- **Historical Analysis**: 30-day historical charts to track price fluctuations.
- **Farmer-Verified**: Crowdsourced price reports with verification badges for trusted sources.

### 🛒 Marketplace & Demand
- **Direct Trade**: List produce for sale or browse listings from other farmers.
- **Buyer Requests**: Post demand requests for specific seeds, fertilizers, or crops you need.
- **Interactive Listings**: Integrated messaging and contact tracking.

### 💧 Smart Irrigation
- **Daily Schedules**: Automated 7-day irrigation planners tailored to specific crop stages.
- **Self-Healing**: Automated recovery systems to ensure schedule consistency.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Lucide icons.
- **Backend**: Go (Golang), Gin Web Framework, pgx (PostgreSQL driver).
- **Database**: PostgreSQL with complex analytical queries.
- **AI**: Gemini 1.5/2.5 Flash API via Vertex AI.

## 🚀 Getting Started

### Prerequisites
- Go 1.21+
- Node.js 20+
- PostgreSQL 15+

### Backend Setup
1. Navigate to `backend/`
2. Set environment variables:
   ```bash
   DATABASE_URL=postgres://user:pass@localhost:5432/farmmind_lite
   GEMINI_API_KEY=your_key_here
   ```
3. Run the server:
   ```bash
   go run cmd/api/main.go
   ```

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

---
*Built with ❤️ for the future of farming.*
