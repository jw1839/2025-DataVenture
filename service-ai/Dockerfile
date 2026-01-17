# Python 기반 AI Engine Dockerfile (uv 공식 모범 사례)
# Build stage
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

# uv 최적화 환경 변수
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# 시스템 의존성 설치 (빌드 시에만 필요)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 의존성 파일 복사 및 설치 (Docker 캐시 활용)
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache -r requirements.txt

# 애플리케이션 코드 복사
COPY ./app ./app

# Production runtime stage
FROM python:3.11-slim-bookworm

# 프로덕션 환경 설정
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# 런타임 의존성 설치
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 보안을 위한 non-root 사용자 생성
RUN groupadd --system --gid 1001 python && \
    useradd --system --uid 1001 --gid 1001 --home /app fastapi

WORKDIR /app

# 빌더 스테이지에서 Python 패키지 복사
COPY --from=builder --chown=fastapi:python /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder --chown=fastapi:python /usr/local/bin /usr/local/bin

# 애플리케이션 코드 복사
COPY --from=builder --chown=fastapi:python /app ./

USER fastapi

EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

# Uvicorn 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

