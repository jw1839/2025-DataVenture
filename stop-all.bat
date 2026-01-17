@echo off
chcp 65001 >nul
REM =====================================
REM  flex-AI-Recruiter 전체 서비스 중지
REM =====================================
echo.
echo =====================================
echo  flex-AI-Recruiter 전체 서비스 중지
echo =====================================
echo.

echo 모든 Docker 컨테이너를 중지하고 제거합니다...
echo.

docker-compose down

if errorlevel 1 (
    echo.
    echo [오류] 서비스 중지에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo =====================================
echo  모든 서비스가 중지되었습니다.
echo =====================================
echo.
echo 다시 시작하려면: start-all.bat 실행 또는 docker-compose up -d
echo.
pause

