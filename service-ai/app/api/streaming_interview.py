"""
스트리밍 면접 API
Whisper (STT) → GPT-4o (LLM) → ElevenLabs (TTS) 파이프라인
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import os
import base64
import io
from typing import List, Dict
from openai import AsyncOpenAI
from elevenlabs.client import AsyncElevenLabs

router = APIRouter()

# API 클라이언트 초기화
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
elevenlabs_client = AsyncElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


class StreamingInterviewPipeline:
    """스트리밍 면접 파이프라인"""
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.conversation_history: List[Dict] = []
        self.is_processing = False
        self.is_first_question = True
        
    async def process_audio_stream(self, audio_data: bytes):
        """
        음성 → 텍스트 → AI 응답 → 음성 파이프라인
        
        Args:
            audio_data: WebM 형식 오디오 데이터
        """
        try:
            self.is_processing = True
            
            # 1단계: STT (Whisper)
            transcript = await self.transcribe_audio(audio_data)
            
            if not transcript:
                return
            
            # 프론트엔드에 텍스트 전송 (자막용)
            await self.websocket.send_json({
                "type": "user_transcript",
                "text": transcript
            })
            
            # 2단계: LLM (GPT-4o Streaming)
            question = await self.generate_next_question(transcript)
            
            # 3단계: TTS (ElevenLabs Streaming)
            await self.speak_question(question)
            
        except Exception as e:
            print(f"[Pipeline] 에러: {e}")
            import traceback
            traceback.print_exc()
            
            await self.websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        finally:
            self.is_processing = False
    
    async def transcribe_audio(self, audio_data: bytes) -> str:
        """
        Whisper API로 음성 → 텍스트 변환
        
        Args:
            audio_data: WebM 형식 오디오 데이터
            
        Returns:
            변환된 텍스트
        """
        try:
            # pydub로 WebM → WAV 변환
            try:
                from pydub import AudioSegment
                
                audio = AudioSegment.from_file(io.BytesIO(audio_data), format="webm")
                wav_io = io.BytesIO()
                audio.export(wav_io, format="wav")
                wav_io.seek(0)
                
                # Whisper API 호출
                response = await openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("audio.wav", wav_io, "audio/wav"),
                    language="ko"
                )
                
                return response.text
                
            except ImportError:
                print("[STT] Warning: pydub 없음, WebM 직접 전송 시도")
                # pydub 없으면 WebM 직접 전송
                response = await openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=("audio.webm", io.BytesIO(audio_data), "audio/webm"),
                    language="ko"
                )
                return response.text
            
        except Exception as e:
            print(f"[STT] 에러: {e}")
            import traceback
            traceback.print_exc()
            return ""
    
    async def generate_next_question(self, user_answer: str) -> str:
        """
        GPT-4o로 다음 질문 생성 (Streaming)
        
        Args:
            user_answer: 사용자 답변
            
        Returns:
            생성된 질문
        """
        # 대화 히스토리 업데이트
        self.conversation_history.append({
            "role": "user",
            "content": user_answer
        })
        
        # 시스템 프롬프트
        system_prompt = """당신은 전문적인 HR 면접관입니다.
구직자의 답변을 듣고 자연스러운 꼬리 질문을 생성하세요.
한국어로 대화하며, 친근하지만 전문적인 톤을 유지하세요.
질문은 간결하게 1-2문장으로 작성하세요.
답변의 구체적인 내용이나 경험에 대해 더 깊이 파고드는 질문이 좋습니다.

질문 생성 원칙:
1. 이전 답변의 내용을 바탕으로 꼬리 질문 생성
2. STAR 기법 활용 (Situation, Task, Action, Result)
3. 구체적인 사례를 물어보기
4. 한 번에 하나의 질문만"""

        messages = [
            {"role": "system", "content": system_prompt}
        ] + self.conversation_history[-10:] + [  # 최근 10개만
            {"role": "user", "content": "위 답변을 바탕으로 자연스러운 꼬리 질문을 생성해주세요."}
        ]
        
        try:
            # GPT-4o Streaming API 호출
            question_chunks = []
            
            stream = await openai_client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                messages=messages,
                stream=True,
                max_tokens=150,
                temperature=0.8
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    question_chunks.append(content)
                    
                    # 프론트엔드에 실시간 전송 (텍스트 스트리밍)
                    await self.websocket.send_json({
                        "type": "ai_transcript_chunk",
                        "text": content
                    })
            
            question = "".join(question_chunks)
            
            # 대화 히스토리 업데이트
            self.conversation_history.append({
                "role": "assistant",
                "content": question
            })
            
            return question
            
        except Exception as e:
            print(f"[LLM] 에러: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback 질문
            fallback = "말씀해주신 내용에 대해 더 자세히 설명해주시겠어요?"
            self.conversation_history.append({
                "role": "assistant",
                "content": fallback
            })
            return fallback
    
    async def speak_question(self, text: str):
        """
        ElevenLabs로 텍스트 → 음성 변환 (Streaming)
        
        Args:
            text: 변환할 텍스트
        """
        try:
            # ElevenLabs Streaming API
            voice_id = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")  # Adam (남성)
            
            audio_stream = await elevenlabs_client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128"
            )
            
            # 오디오 데이터를 프론트엔드로 스트리밍
            # ElevenLabs API는 Generator를 반환하므로 async iteration
            for chunk in audio_stream:
                if chunk:
                    # Base64 인코딩하여 전송
                    audio_base64 = base64.b64encode(chunk).decode()
                    
                    await self.websocket.send_json({
                        "type": "ai_audio_chunk",
                        "audio": audio_base64
                    })
            
            # TTS 완료 신호
            await self.websocket.send_json({
                "type": "ai_audio_end"
            })
            
        except Exception as e:
            print(f"[TTS] 에러: {e}")
            import traceback
            traceback.print_exc()


@router.websocket("/ws/streaming-interview")
async def streaming_interview_endpoint(websocket: WebSocket):
    """
    WebSocket 엔드포인트: 스트리밍 면접
    
    프로토콜:
        클라이언트 → 서버:
            - {"type": "audio_chunk", "audio": "base64_encoded_audio"}
            - {"type": "end_interview"}
        
        서버 → 클라이언트:
            - {"type": "user_transcript", "text": "..."}
            - {"type": "ai_transcript_chunk", "text": "..."}
            - {"type": "ai_audio_chunk", "audio": "base64_encoded_audio"}
            - {"type": "ai_audio_end"}
            - {"type": "interview_ended"}
            - {"type": "error", "message": "..."}
    """
    await websocket.accept()
    print("[Streaming Interview] 연결됨")
    
    pipeline = StreamingInterviewPipeline(websocket)
    
    # 초기 인사말 (중복 방지: 연결 직후 한 번만)
    initial_greeting = (
        "안녕하세요! AI 면접관입니다. 오늘 인터뷰를 시작하겠습니다. "
        "먼저 간단하게 자기소개를 부탁드립니다."
    )
    
    try:
        # 초기 인사말 전송 (텍스트)
        await websocket.send_json({
            "type": "ai_transcript_chunk",
            "text": initial_greeting
        })
        
        # 초기 인사말 음성 변환
        await pipeline.speak_question(initial_greeting)
        
        # 대화 히스토리에 추가
        pipeline.conversation_history.append({
            "role": "assistant",
            "content": initial_greeting
        })
        pipeline.is_first_question = False
        
        # 메시지 수신 루프
        while True:
            # 프론트엔드로부터 메시지 수신
            message = await websocket.receive_json()
            
            if message["type"] == "audio_chunk":
                # 오디오 청크 수신
                audio_data = base64.b64decode(message["audio"])
                
                # 파이프라인 실행 (비동기)
                if not pipeline.is_processing:
                    asyncio.create_task(pipeline.process_audio_stream(audio_data))
                    
            elif message["type"] == "end_interview":
                # 인터뷰 종료
                await websocket.send_json({
                    "type": "interview_ended",
                    "conversation_history": pipeline.conversation_history
                })
                break
                
    except WebSocketDisconnect:
        print("[Streaming Interview] 연결 종료")
    except Exception as e:
        print(f"[Streaming Interview] 예외: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("[Streaming Interview] 세션 종료")

