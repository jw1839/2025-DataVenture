@echo off
chcp 65001 >nul
REM =====================================
REM  flex-AI-Recruiter 전체 서비스 실행
REM =====================================
echo.
echo =====================================
echo  flex-AI-Recruiter 전체 서비스 실행
echo =====================================
echo.

REM 환경 변수 파일 체크
if not exist "service-ai\.env" (
    echo [경고] service-ai/.env 파일이 없습니다!
    echo OPENAI_API_KEY를 설정한 .env 파일을 먼저 생성하세요.
    echo.
    pause
    exit /b 1
)

echo [1/2] Docker Desktop 실행 여부 확인 중...
docker info >nul 2>&1
if errorlevel 1 (
    echo [오류] Docker Desktop이 실행되지 않았습니다!
    echo Docker Desktop을 실행한 후 다시 시도하세요.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker Desktop 실행 중
echo.

echo [2/2] 모든 서비스 실행 중...
echo - PostgreSQL (port 5432)
echo - service-core (port 8080)
echo - service-ai (port 8000, uv 사용으로 초고속 빌드)
echo - app-web (port 3000)
echo.
echo [참고] 첫 실행 시 Docker 이미지 빌드가 진행됩니다.
echo         AI 서비스는 uv를 사용하여 pip 대비 10-100배 빠릅니다.
echo         예상 시간: 5-10분 (이후 재실행은 몇 초만 소요)
echo.

docker-compose up -d

if errorlevel 1 (
    echo.
    echo [오류] 서비스 실행에 실패했습니다.
    echo 로그를 확인하세요: docker-compose logs
    pause
    exit /b 1
)

echo.
echo =====================================
echo  모든 서비스가 시작되었습니다!
echo =====================================
echo.
echo 접속 정보:
echo - 프론트엔드:    http://localhost:3000
echo - 백엔드 API:    http://localhost:8080
echo - AI API 문서:   http://localhost:8000/docs
echo - PostgreSQL:    localhost:5432
echo.
echo 로그 확인: docker-compose logs -f
echo 서비스 중지: stop-all.bat 실행 또는 docker-compose down
echo.
echo 컨테이너 상태를 확인하려면 아무 키나 누르세요...
pause >nul

docker ps

echo.
echo 프로그램을 종료하려면 아무 키나 누르세요...
pause >nul

