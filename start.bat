@echo off
setlocal enabledelayedexpansion

echo =========================================================================
echo                   AQUANEX: PREDICT. PROTECT. ACT.
echo             AI Water ^& Climate Early Warning System
echo =========================================================================
echo.

:: 1. Verify Python Installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.11+ is not installed or not in your PATH.
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python detected.

:: 2. Verify Node.js and NPM
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js detected.

:: 3. Setup Backend Virtual Environment
if not exist "venv" (
    echo [INFO] Creating Python virtual environment in .\venv...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)
echo [OK] Virtual environment ready.

:: 4. Install Backend Dependencies
echo [INFO] Checking backend Python dependencies...
call .\venv\Scripts\python -m pip install -r backend\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    echo Please ensure active internet connectivity during first setup.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed.

:: 5. Install Frontend Dependencies
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies in .\frontend...
    pushd frontend
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend npm packages.
        popd
        pause
        exit /b 1
    )
    popd
)
echo [OK] Frontend dependencies ready.

:: 6. Initialize Database and Seed Baseline Data
echo [INFO] Initializing database and idempotently verifying baseline data...
set PYTHONPATH=.
call .\venv\Scripts\python -c "from backend.database import init_db, SessionLocal; from backend.seed_data import seed_database_if_empty; init_db(); db = SessionLocal(); seed_database_if_empty(db); db.close(); print('[OK] Database ready.')"

echo.
echo =========================================================================
echo Launching AquaNex Command Center:
echo  - Backend API:    http://localhost:8000
echo  - Interactive API Docs: http://localhost:8000/docs
echo  - Frontend Web UI: http://localhost:5173
echo =========================================================================
echo.

:: 7. Launch Backend Server in background window
start "AquaNex FastAPI Backend [Port 8000]" cmd /k "title AquaNex Backend && set PYTHONPATH=. && .\venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

:: 8. Launch Frontend Vite Dev Server in background window
start "AquaNex React Frontend [Port 5173]" cmd /k "title AquaNex Frontend && cd frontend && npm run dev"

:: Wait 3 seconds then open default browser to application
timeout /t 3 >nul
start http://localhost:5173

echo.
echo AquaNex is now running.
echo To stop the servers, close the respective terminal windows.
echo.
