"""
flex-AI-Recruiter - AI Engine (FastAPI)
Service 2: AI 질문 생성, 답변 분석, 평가, 매칭 알고리즘
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# 환경 변수 로딩
load_dotenv()

# FastAPI 앱 생성
app = FastAPI(
    title="flex-AI-Recruiter AI Engine",
    description="AI 기반 인터뷰 질문 생성, 답변 분석, 평가 및 매칭 서비스",
    version="0.1.0",
)

# CORS 설정 (service-core와 프론트엔드 접근)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # service-core
        "http://localhost:3000",  # app-web (프론트엔드)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Health Check =====
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "flex-AI-Recruiter AI Engine",
        "status": "healthy",
        "version": "0.1.0",
    }


@app.get("/health")
async def health_check():
    """상세 Health check with OpenAI API 연결 테스트"""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    # OpenAI API 연결 테스트
    openai_connection = False
    openai_error = None
    
    if openai_api_key and openai_api_key.startswith("sk-"):
        try:
            from openai import OpenAI
            test_client = OpenAI(api_key=openai_api_key)
            
            # 모델 리스트 조회로 API 키 유효성 검증 (timeout 5초)
            models = test_client.models.list()
            openai_connection = True
            
        except Exception as e:
            openai_error = str(e)
            print(f"[Health Check] OpenAI API 연결 실패: {e}")
    
    return {
        "status": "healthy",
        "openai_configured": bool(openai_api_key and openai_api_key.startswith("sk-")),
        "openai_connection": openai_connection,
        "openai_error": openai_error if openai_error else None,
        "embedding_model": os.getenv("EMBEDDING_MODEL", "jhgan/ko-sbert-nli"),
        "openai_model": os.getenv("OPENAI_MODEL", "gpt-4o"),
    }


# ===== AI API 라우터 =====
from app.api import question, evaluation, matching, health, stt, tts, streaming_interview

# 헬스 체크
app.include_router(health.router, tags=["헬스 체크"])

# AI API 라우터
# Question API: 내부용(/internal/ai)과 외부용(/api/v1/ai) 모두 지원
app.include_router(question.router, prefix="/internal/ai", tags=["Question Generation (Internal)"])
app.include_router(question.router, prefix="/api/v1/ai", tags=["Question Generation (External)"])
app.include_router(evaluation.router, prefix="/internal/ai", tags=["Evaluation (Internal)"])
app.include_router(evaluation.router, prefix="/api/v1/ai", tags=["Evaluation (External)"])
app.include_router(matching.router, prefix="/internal/ai", tags=["Matching"])
app.include_router(stt.router, prefix="/api/v1/ai/stt", tags=["STT (Speech-to-Text)"])
app.include_router(tts.router, prefix="/api/v1/ai/tts", tags=["TTS (Text-to-Speech)"])
app.include_router(streaming_interview.router, prefix="/api/v1/ai", tags=["Streaming Interview"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )

