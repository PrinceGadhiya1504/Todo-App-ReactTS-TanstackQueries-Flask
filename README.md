# Todo App (React + Flask)

Simple guide to set up and run the Backend and Frontend.

---

## Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18 or higher
- **npm**: (comes with Node.js)

---

## 1. Backend Setup & Run

Open a terminal and run:

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (first time only)
python3 -m venv .venv

# Activate the virtual environment
# On Linux / macOS:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install required packages
pip install -r requirements.txt

# Start the Flask server
python app.py
```

> **Backend URL:** `http://127.0.0.1:5000`

---

## 2. Frontend Setup & Run

Open a separate terminal and run:

```bash
# Navigate to the frontend directory
cd frontend

# Install node dependencies (first time only)
npm install

# Start the development server
npm run dev
```

> **Frontend URL:** `http://localhost:5173`

---

## Quick Summary

| Service  | Directory  | Run Command                                      | Default URL             |
|----------|------------|--------------------------------------------------|-------------------------|
| Backend  | `backend/` | `source .venv/bin/activate && python app.py`     | `http://127.0.0.1:5000` |
| Frontend | `frontend/`| `npm run dev`                                    | `http://localhost:5173` |
