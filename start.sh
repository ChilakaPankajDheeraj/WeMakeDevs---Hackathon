#!/usr/bin/env bash
set -e

echo "========================================================================="
echo "                  AQUANEX: PREDICT. PROTECT. ACT."
echo "            AI Water & Climate Early Warning System"
echo "========================================================================="
echo ""

# 1. Verify Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.11+."
    exit 1
fi

# 2. Verify Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js 18+."
    exit 1
fi

# 3. Virtual Environment
if [ ! -d "venv" ]; then
    echo "[INFO] Creating Python virtual environment..."
    python3 -m venv venv
fi

# 4. Backend Dependencies
echo "[INFO] Checking Python dependencies..."
./venv/bin/python3 -m pip install -r backend/requirements.txt --quiet

# 5. Frontend Dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Installing frontend npm packages..."
    (cd frontend && npm install --legacy-peer-deps)
fi

# 6. Database Initialization
echo "[INFO] Initializing database and idempotently verifying seed data..."
export PYTHONPATH=.
./venv/bin/python3 -c "from backend.database import init_db, SessionLocal; from backend.seed_data import seed_database_if_empty; init_db(); db = SessionLocal(); seed_database_if_empty(db); db.close(); print('[OK] Database ready.')"

echo ""
echo "========================================================================="
echo "AquaNex Services Launching:"
echo " - Backend API:        http://localhost:8000"
echo " - Swagger API Docs:   http://localhost:8000/docs"
echo " - Frontend Web UI:    http://localhost:5173"
echo "========================================================================="
echo ""

# Start backend
export PYTHONPATH=.
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
