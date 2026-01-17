"""
STT (Speech-to-Text) API
Whisper API를 사용하여 음성을 텍스트로 변환
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from openai import OpenAI
import os
import tempfile
from typing import Dict
import traceback
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(..., description="오디오 파일 (webm, mp3, wav 등)")
) -> Dict[str, str]:
    """
    음성을 텍스트로 변환
    
    Args:
        audio: 업로드된 오디오 파일
        
    Returns:
        Dict: {"text": "변환된 텍스트"}
    """
    temp_audio_path = None
    try:
        logger.info(f"[STT] 음성 변환 요청 시작: {audio.filename}, content_type: {audio.content_type}")
        
        # 오디오 파일 읽기
        content = await audio.read()
        content_size = len(content)
        logger.info(f"[STT] 오디오 파일 크기: {content_size} bytes ({content_size / 1024:.2f} KB)")
        
        # 파일 크기 검증 (최대 25MB)
        if content_size == 0:
            logger.error("[STT] 빈 오디오 파일")
            raise HTTPException(
                status_code=400,
                detail="오디오 파일이 비어있습니다."
            )
        
        if content_size > 25 * 1024 * 1024:  # 25MB
            logger.error(f"[STT] 파일 크기 초과: {content_size} bytes")
            raise HTTPException(
                status_code=400,
                detail=f"파일 크기가 너무 큽니다 (최대 25MB). 현재: {content_size / 1024 / 1024:.2f}MB"
            )
        
        # 지원되는 형식 확인
        supported_formats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']
        file_ext = os.path.splitext(audio.filename or '')[1].lower()
        if file_ext and file_ext not in supported_formats:
            logger.warning(f"[STT] 지원되지 않는 형식일 수 있음: {file_ext}")
        
        # 임시 파일로 저장 (Whisper API는 파일 경로가 필요)
        suffix = file_ext if file_ext else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        logger.info(f"[STT] 임시 파일 저장 완료: {temp_audio_path}")
        
        # OpenAI API 키 확인
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("[STT] OPENAI_API_KEY 환경 변수가 설정되지 않음")
            raise HTTPException(
                status_code=500,
                detail="OpenAI API 키가 설정되지 않았습니다."
            )
        
        logger.info("[STT] Whisper API 호출 시작")
        
        # Whisper API 호출
        with open(temp_audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ko"  # 한국어 지정
            )
        
        logger.info(f"[STT] 변환 성공: {transcription.text[:100]}..." if len(transcription.text) > 100 else f"[STT] 변환 성공: {transcription.text}")
        
        # 임시 파일 삭제
        os.unlink(temp_audio_path)
        
        return {
            "text": transcription.text
        }
        
    except HTTPException:
        # HTTPException은 그대로 재발생
        raise
        
    except Exception as e:
        # 상세한 에러 로깅
        logger.error(f"[STT] 음성 변환 실패: {str(e)}")
        logger.error(f"[STT] 에러 타입: {type(e).__name__}")
        logger.error(f"[STT] 스택 트레이스:\n{traceback.format_exc()}")
        
        # 에러 시 임시 파일 정리
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.unlink(temp_audio_path)
                logger.info("[STT] 임시 파일 정리 완료")
            except Exception as cleanup_error:
                logger.error(f"[STT] 임시 파일 정리 실패: {cleanup_error}")
        
        # 사용자에게 더 구체적인 에러 메시지 제공
        error_detail = f"음성 변환 실패: {str(e)}"
        
        # OpenAI API 에러인 경우 추가 정보 제공
        if "openai" in str(e).lower() or "api" in str(e).lower():
            error_detail += " (OpenAI API 오류 - API 키나 네트워크 연결을 확인하세요)"
        
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )


@router.post("/transcribe-realtime")
async def transcribe_audio_realtime(
    audio: UploadFile = File(...),
    language: str = "ko"
) -> Dict[str, str]:
    """
    실시간 음성 변환 (짧은 음성 최적화)
    
    Args:
        audio: 업로드된 오디오 파일
        language: 언어 코드 (기본: ko)
        
    Returns:
        Dict: {"text": "변환된 텍스트", "language": "ko"}
    """
    try:
        # 파일 크기 확인 (10MB 제한)
        content = await audio.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=400,
                detail="파일 크기가 너무 큽니다 (최대 10MB)"
            )
        
        # 임시 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
        
        # Whisper API 호출
        with open(temp_audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="text"  # 텍스트만 반환
            )
        
        # 임시 파일 삭제
        os.unlink(temp_audio_path)
        
        # response_format="text"일 때는 문자열로 반환됨
        text = transcription if isinstance(transcription, str) else transcription.text
        
        return {
            "text": text,
            "language": language
        }
        
    except Exception as e:
        if 'temp_audio_path' in locals():
            try:
                os.unlink(temp_audio_path)
            except:
                pass
        
        raise HTTPException(
            status_code=500,
            detail=f"실시간 음성 변환 실패: {str(e)}"
        )

