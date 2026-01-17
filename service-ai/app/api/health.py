"""
헬스 체크 API

Docker 헬스 체크, 로드 밸런서, 모니터링 시스템 사용
"""

from fastapi import APIRouter
from datetime import datetime
import psutil
import os

router = APIRouter()


@router.get("/health")
async def health_check():
    """기본 헬스 체크"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "service-ai",
        "version": "1.0.0",
    }


@router.get("/health/detailed")
async def detailed_health_check():
    """상세 헬스 체크 (시스템 리소스 포함)"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "service-ai",
        "version": "1.0.0",
        "checks": {
            "memory": {
                "used_mb": round(memory_info.rss / 1024 / 1024, 2),
                "percent": psutil.virtual_memory().percent,
            },
            "cpu": {
                "percent": psutil.cpu_percent(interval=0.1),
                "count": psutil.cpu_count(),
            },
            "uptime_seconds": round(process.create_time()),
        },
    }


@router.get("/health/ready")
async def readiness_check():
    """Readiness 체크 (서비스가 트래픽을 받을 준비가 되었는지)"""
    # AI 모델 로드 여부 등 확인 가능
    try:
        # 간단한 준비 상태 확인
        return {
            "status": "ready",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception:
        return {
            "status": "not_ready",
            "timestamp": datetime.now().isoformat(),
        }


@router.get("/health/live")
async def liveness_check():
    """Liveness 체크 (프로세스가 살아있는지)"""
    return {
        "status": "alive",
        "timestamp": datetime.now().isoformat(),
    }

