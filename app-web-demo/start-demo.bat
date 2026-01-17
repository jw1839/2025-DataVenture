@echo off
echo ========================================
echo flex-AI-Recruiter 데모 시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 종속성 설치 중...
if not exist "node_modules" (
    echo 처음 실행이므로 패키지를 설치합니다 (2-5분 소요)...
    call npm install
    if errorlevel 1 (
        echo 오류: 패키지 설치 실패
        pause
        exit /b 1
    )
) else (
    echo 이미 설치되어 있습니다.
)

echo.
echo [2/2] 개발 서버 시작 중...
echo.
echo ========================================
echo 데모가 실행됩니다!
echo.
echo 브라우저에서 다음 주소를 여세요:
echo http://localhost:3001
echo.
echo 종료하려면 Ctrl+C를 누르세요.
echo ========================================
echo.

call npm run dev

pause

