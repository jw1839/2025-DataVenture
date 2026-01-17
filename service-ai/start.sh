#!/bin/bash
# flex-AI-Recruiter AI Service Startup Script
# Linux/Mac용 실행 스크립트

echo "====================================="
echo " flex-AI-Recruiter AI Service"
echo " Starting FastAPI with uvicorn..."
echo "====================================="
echo ""

cd "$(dirname "$0")"

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

