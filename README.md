# Polished and Paid Business - E-Commerce Platform

Welcome to the official repository for the **Polished and Paid Business** e-commerce platform. This application features a decoupled architecture built with a high-performance **Django REST Framework** backend and a dynamic, responsive **Next.js** frontend.

---

## 🚀 Architecture Overview

The platform is split into two distinct layers:
* **Backend (`/backend`)**: Handles the core database models, business logic, user authentication, payment processing integrations, and order management.
* **Frontend (`/imis-frontend` or `/nwashc-public-website`)**: Delivers a lightning-fast user experience with Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR).

---

## 🛠️ Tech Stack

### Backend
* **Framework:** Django 5.x & Django REST Framework (DRF)
* **Database:** PostgreSQL (Production) / SQLite (Development)
* **Authentication:** Simple JWT (JSON Web Tokens)
* **Task Queue:** Celery & Redis (For asynchronous tasks like emails)

### Frontend
* **Framework:** Next.js 14+ (App Router)
* **Styling:** Tailwind CSS
* **State Management:** Zustand / React Context
* **Data Fetching:** Axios / SWR

---

## 💻 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
* Python 3.10+
* Node.js 18+ & npm/yarn
* Git

---

## 🔧 Backend Setup (`/backend`)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root backend directory:
   ```env
   DEBUG=True
   SECRET_KEY=your_django_secret_key
   ALLOWED_HOSTS=localhost,127.0.0.1
   # Add your DB details if using PostgreSQL
   ```

5. **Run migrations and start the server:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   The backend API will be live at `http://127.0.0`.

---

## 🎨 Frontend Setup (`/frontend`)

1. **Navigate to your frontend directory:**
   ```bash
   cd imis-frontend  # Or your specific frontend folder name
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0api/v1
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to view the application.

---

## 📂 Project Structure

```text
├── backend/                     # Django Project files
│   ├── core/                    # Main settings config
│   ├── products/                # Product models and API endpoints
│   └── users/                   # Authentication & profile models
├── imis-frontend/               # Next.js Application
│   ├── src/
│   │   ├── app/                 # Next.js App Router (pages)
│   │   ├── components/          # Reusable UI elements
│   │   └── context/             # Global application state
├── .gitignore                   # Main gitignore blocking node_modules & caches
└── README.md                    # Project documentation
```

---

## 🔒 Security & Optimization

* **JWT Tokens:** Stored securely in HTTP-only cookies to prevent XSS attacks.
* **CORS Headers:** Configured via `django-cors-headers` to ensure safe, cross-origin communication between Next.js and Django.
* **Git Cleanliness:** A robust `.gitignore` architecture protects the production build by completely blocking bulky `node_modules/` and `.next/` directories from remote synchronization.
