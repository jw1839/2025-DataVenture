@echo off
REM flex-AI-Recruiter AI Service Startup Script
REM Windows용 실행 스크립트

echo =====================================
echo  flex-AI-Recruiter AI Service
echo  Starting FastAPI with uvicorn...
echo =====================================
echo.

cd /d "%~dp0"

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause

