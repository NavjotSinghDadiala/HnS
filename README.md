# 🏠 HouseNSeek — AI-Powered Real Estate Intelligence Platform

HouseNSeek is a **full-stack AI-driven real estate platform** that transforms traditional property search into an **intelligent, personalized, and data-driven experience**.

Unlike basic listing platforms, HouseNSeek integrates:
- **Graph Neural Networks (GNN)**
- **Recommendation Systems**
- **User Behavior Modeling**
- **Retrieval-Augmented Generation (RAG)**
- **Automated Data Pipelines (Selenium Scraping)**

This project is designed as a **Major AI/ML + Full Stack System**, combining scalable backend architecture with advanced machine learning concepts.

---

## 🚀 Core AI Functionalities

### 🧠 Recommendation System
- Personalized property suggestions based on:
  - Budget
  - Location
  - Property type
- Learns from:
  - User clicks
  - Favorites
  - Search history
- Continuously improves using **interaction-based feedback loop**

### 🔗 Graph Neural Network (GNN)
- Models relationships between:
  - Users
  - Properties
  - Locations
  - Builders
- Enables:
  - Smart locality recommendations
  - Similar property detection
  - Network-based insights
- Captures **hidden relationships not possible with traditional filtering**

---

### 🧾ed listings
  - Favorite properties
  - Search queries
- Builds **dynamic user profiles**
- Enables:
  - Session-aware recommendations
  - Long-term personalization
  - Context-based UI adaptation

---

## 🤖 4. RAG-Based AI Chat Assistant
- Uses **Retrieval-Augmented Generation**
### 🤖lities:
  - Answer property-related queries
  - Provide locality insights
  - Assist decision-making
- Combines:
  - Stored knowledge + real-time retrieval

---

## 🌐 5. Data Pipeline (Selenium Web Scraping)
- Automated scraping of:
### 🌐ing data
- Keeps system:
  - Updated
  - Scalable
  - Data-rich
- Supports CSV ingestion pipelines

---

## 📊 6. AI-Driven Insights
- Property price trends
- Location intelligence
- User behavior analytics
### 📊

# 🏗️ System Architecture

Frontend (React + Vite + Clerk)
↓
Backend (Flask REST API)
↓
AI Layer:

R# 🏗️ System Architecture

```
Frontend (React + Vite + Clerk)
         ↓
Backend (Flask REST API)
         ↓
AI Layer:
  - Recommendation Engine
  - GNN Models
  - User Behavior Tracking
  - RAG Chat System
         ↓
Data Layer:
  - SQLite / PostgreSQL
  - ChromaDB (Vector Store)
         ↓
Data Pipeline:
  - Selenium Scraping
```

---

### 💻 Frontend
- React (Vite)
- Clerk Authentication
- Responsive UI
- Dashboard & Admin Panels

### ⚙️ Backend
- Flask (REST API)
- SQLAlchemy ORM
- Flask-Migrate
- CORS-enabled APIs

### 🤖 AI / ML
- Graph Neural Networks (GNN)
- Recommendation Systems
- User Behavior Modeling
- RAG (Retrieval-Augmented Generation)
- Vector Database (ChromaDB)

### 📡 Data Engineering
- Selenium Web Scraping
- CSV Data Pipelines
- Data Processing Scripts

---

## 📂 Project Structure

```
/frontend
├── src/
├── public/

/backend
├── app.py                          # Main API
├── models.py                       # Database models
├── auth.py                         # Auth & admin logic
├── extensions.py
├── requirements.txt
├── instance/                       # SQLite DB
├── uploads/                        # File storage
├── aiml_folder/                    # ML models (GNN, recommender)
├── chatbot/                        # RAG system
├── chroma_db/                      # Vector DB

/uploads                            # Shared uploads
```

---

## ⚡ Key Features

#- Nearest-node/location mapping
- Smart locality recommendations

### 📍 Location Intelligence
- Nearest-node/location mapping
- Smart locality recommendations

### 🧑‍💼 Builder Module
- Builder profiles
- Builder project listings

### ❤️ Favorites System
- Guest + user session merging
- Personalized favorite tracking

### 📝 Blog System
- Blog creation & management
- Slug-based routing
- AI-generated summaries

### 🔐 Authentication & Security
- Clerk Authentication
- Admin authorization
- Audit & security endpoints

### 📊 Admin Dashboard
- System analytics
- Graph data
- User activity tracking

### 📁 File Uploads
- Image/document uploads
- Stored in `backend/uploads`

---

## 🛠️ Setup Guide

### Prerequisites
- Node.js (recommended latest LTS)
- npm
- Python 3.11+
- Git Bash / WSL / PowerShell (for Windows)

### 1. Install Dependencies

```bash
npm install
npm install --prefix frontend
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # PowerShell
# or .\.venv\Scripts\activate.bat  # CMD
pip install -r requirements.txt
```

### 3. Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=sqlite:///instance/hns.db
VECTOR_STORE_TYPE=chroma
CLERK_SECRET_KEY=your_key
GOOGLE_API_KEY=your_key
ADMIN_SETUP_KEY=your_key
```

---

## ▶️ Running the Project

### Full Project

```bash
npm run start
```

### Frontend Only

```bash
npm --prefix frontend run dev
```

### Backend Only

```bash
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

---

## 🗄️ Database

- **Default**: SQLite (`backend/instance/hns.db`)
- **Optional**: PostgreSQL via `DATABASE_URL`

---

## 🔐 Authentication

- Clerk-based authentication
- **Default admin credentials:**
  - Email: `admin@gmail.com`
  - Password: `admin`

---

## 🔥 Unique Selling Points

- ✅ Combines AI + Full Stack + Data Engineering
- ✅ Implements real-world recommendation system
- ✅ Uses Graph Neural Networks for relationship modeling
- ✅ Integrates RAG-based AI assistant
- ✅ Learns from user behavior dynamically
- ✅ Uses live scraped data for scalability

---

## 🎯 Future Improvements

- Deep learning-based price prediction
- Real-time map integration
- Advanced GNN optimization
- Deployment on cloud (AWS/GCP)
- Mobile app version

---

## 📬 Contact & Resources

Explore the codebase:

- **Backend**: `backend/app.py`
- **Frontend**: `frontend/src/`
- **Models**: `backend/models.py`
- **AI Components**: `backend/aiml_folder/`, `backend/chatbot/`
