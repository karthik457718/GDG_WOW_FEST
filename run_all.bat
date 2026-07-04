@echo off
echo ==========================================
echo    UrbanAssist AI - Local Runner
echo ==========================================

REM Check for backend .env
if not exist .env (
    echo [INFO] Creating backend .env file...
    copy .env.example .env
    echo [WARNING] Please open the .env file and configure your GEMINI_API_KEY and GOOGLE_APPLICATION_CREDENTIALS path.
)

REM Check for frontend .env
if not exist urbanassist-frontend\.env (
    echo [INFO] Creating frontend .env file...
    copy urbanassist-frontend\.env.example urbanassist-frontend\.env
)

echo.
echo [1/2] Launching Python FastAPI Backend...
start cmd /k "title UrbanAssist AI Backend && uvicorn app:app --reload --port 8000"

echo [2/2] Launching Vite React Frontend...
cd urbanassist-frontend
start cmd /k "title UrbanAssist AI Frontend && npm run dev"

echo.
echo ==========================================
echo [SUCCESS] Both services have been launched!
echo.
echo   - Citizen / Admin UI: http://localhost:5173
echo   - Backend API Docs:   http://localhost:8000/docs
echo.
echo Close the newly opened terminal windows to stop.
echo ==========================================
pause
