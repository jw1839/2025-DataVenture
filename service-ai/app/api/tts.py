"""
TTS (Text-to-Speech) API
OpenAI TTS API를 사용하여 텍스트를 음성으로 변환
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import os
import io

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer
    model: str = "tts-1"  # tts-1 (빠름) 또는 tts-1-hd (고품질)
    speed: float = 1.0  # 0.25 ~ 4.0


@router.post("/speak")
async def text_to_speech(request: TTSRequest):
    """
    텍스트를 음성으로 변환
    
    Args:
        request: TTS 요청 (text, voice, model, speed)
        
    Returns:
        StreamingResponse: MP3 오디오 스트림
    """
    try:
        # 입력 검증
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")
        
        if len(request.text) > 4096:
            raise HTTPException(
                status_code=400,
                detail="텍스트가 너무 깁니다 (최대 4096자)"
            )
        
        # OpenAI TTS API 호출
        response = client.audio.speech.create(
            model=request.model,
            voice=request.voice,
            input=request.text,
            speed=request.speed
        )
        
        # 오디오 데이터를 바이너리로 변환
        audio_data = response.content
        
        # MP3 스트림 반환
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=speech.mp3"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"음성 생성 실패: {str(e)}"
        )


@router.post("/speak-korean")
async def text_to_speech_korean(request: TTSRequest):
    """
    한국어 텍스트를 음성으로 변환 (최적화)
    
    Args:
        request: TTS 요청
        
    Returns:
        StreamingResponse: MP3 오디오 스트림
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")
        
        # 한국어에 적합한 음성으로 자동 설정
        # alloy: 중성적, nova: 여성, onyx: 남성
        voice = request.voice if request.voice else "onyx"
        
        # TTS 생성
        response = client.audio.speech.create(
            model=request.model,
            voice=voice,
            input=request.text,
            speed=request.speed
        )
        
        audio_data = response.content
        
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=speech_kr.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"한국어 음성 생성 실패: {str(e)}"
        )


@router.get("/voices")
async def list_voices():
    """
    사용 가능한 음성 목록 반환
    
    Returns:
        Dict: 음성 목록 및 설명
    """
    return {
        "voices": [
            {
                "id": "alloy",
                "name": "Alloy",
                "description": "중성적이고 균형잡힌 음성",
                "recommended_for": "일반적인 용도"
            },
            {
                "id": "echo",
                "name": "Echo",
                "description": "남성적이고 부드러운 음성",
                "recommended_for": "내레이션"
            },
            {
                "id": "fable",
                "name": "Fable",
                "description": "따뜻하고 친근한 음성",
                "recommended_for": "이야기, 설명"
            },
            {
                "id": "onyx",
                "name": "Onyx",
                "description": "깊고 권위있는 남성 음성",
                "recommended_for": "공식적인 콘텐츠"
            },
            {
                "id": "nova",
                "name": "Nova",
                "description": "밝고 활기찬 여성 음성",
                "recommended_for": "AI 인터뷰, 친근한 대화"
            },
            {
                "id": "shimmer",
                "name": "Shimmer",
                "description": "부드럽고 우아한 여성 음성",
                "recommended_for": "감성적인 콘텐츠"
            }
        ],
        "models": [
            {
                "id": "tts-1",
                "name": "TTS-1",
                "description": "빠른 응답 속도",
                "latency": "낮음"
            },
            {
                "id": "tts-1-hd",
                "name": "TTS-1-HD",
                "description": "고품질 음성",
                "latency": "보통"
            }
        ],
        "speed_range": {
            "min": 0.25,
            "max": 4.0,
            "default": 1.0
        }
    }

