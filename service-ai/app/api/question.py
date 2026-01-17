"""
질문 생성 API 라우터
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.question import (
    QuestionGenerationRequest,
    QuestionGenerationResponse,
    QuestionSetRequest,
    QuestionSetResponse,
    QuestionItem
)
from app.services.question_generator import (
    generate_first_question,
    generate_next_question,
    generate_next_question_stream,
    analyze_interview_depth
)
import json
import os
from openai import OpenAI

router = APIRouter()

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.post("/generate-question", response_model=QuestionGenerationResponse)
async def generate_question(request: QuestionGenerationRequest):
    """
    AI 인터뷰 질문 생성
    
    첫 번째 질문 또는 대화 히스토리 기반 꼬리 질문 생성
    """
    try:
        # 첫 번째 질문 생성
        if request.isFirstQuestion:
            candidate_profile = request.candidateProfile.model_dump() if request.candidateProfile else None
            job_posting = request.jobPosting.model_dump() if request.jobPosting else None
            
            question = generate_first_question(
                candidate_profile=candidate_profile,
                job_posting=job_posting
            )
            
            return QuestionGenerationResponse(
                question=question,
                questionType="open"
            )
        
        # 다음 질문 생성 (대화 히스토리 기반)
        else:
            if not request.conversationHistory or not request.lastAnswer:
                raise HTTPException(
                    status_code=400,
                    detail="대화 히스토리와 마지막 답변이 필요합니다."
                )
            
            # 대화 깊이 분석
            conversation_list = [msg.model_dump() for msg in request.conversationHistory]
            depth_analysis = analyze_interview_depth(conversation_list)
            
            if not depth_analysis["should_continue"]:
                # 인터뷰 종료 권장
                return QuestionGenerationResponse(
                    question="충분한 대화를 나눴습니다. 마지막으로 하고 싶은 말씀이나 질문이 있으신가요?",
                    questionType="closing"
                )
            
            candidate_profile = request.candidateProfile.model_dump() if request.candidateProfile else None
            job_posting = request.jobPosting.model_dump() if request.jobPosting else None
            
            question = generate_next_question(
                conversation_history=conversation_list,
                last_answer=request.lastAnswer,
                candidate_profile=candidate_profile,
                job_posting=job_posting
            )
            
            return QuestionGenerationResponse(
                question=question,
                questionType="follow-up"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Question API] 질문 생성 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"질문 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/generate-question-stream")
async def generate_question_stream(request: QuestionGenerationRequest):
    """
    AI 인터뷰 질문 생성 (Streaming)
    
    Server-Sent Events (SSE)를 통해 실시간으로 질문을 스트리밍합니다.
    응답 지연을 줄이고 사용자 경험을 개선합니다.
    """
    try:
        # 대화 히스토리와 마지막 답변 검증
        if not request.conversationHistory or not request.lastAnswer:
            raise HTTPException(
                status_code=400,
                detail="대화 히스토리와 마지막 답변이 필요합니다."
            )
        
        # 대화 깊이 분석
        conversation_list = [msg.model_dump() for msg in request.conversationHistory]
        depth_analysis = analyze_interview_depth(conversation_list)
        
        if not depth_analysis["should_continue"]:
            # 인터뷰 종료 메시지를 스트리밍으로 전송
            async def closing_stream():
                closing_message = "충분한 대화를 나눴습니다. 마지막으로 하고 싶은 말씀이나 질문이 있으신가요?"
                yield f"data: {json.dumps({'content': closing_message, 'type': 'closing'})}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                closing_stream(),
                media_type="text/event-stream"
            )
        
        # 프로필 정보 추출
        candidate_profile = request.candidateProfile.model_dump() if request.candidateProfile else None
        job_posting = request.jobPosting.model_dump() if request.jobPosting else None
        
        # Streaming 응답 생성
        async def event_generator():
            try:
                # OpenAI Streaming 호출
                for content_chunk in generate_next_question_stream(
                    conversation_history=conversation_list,
                    last_answer=request.lastAnswer,
                    candidate_profile=candidate_profile,
                    job_posting=job_posting
                ):
                    # SSE 형식으로 전송
                    yield f"data: {json.dumps({'content': content_chunk})}\n\n"
                
                # 스트리밍 종료 신호
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                print(f"[Question API] Streaming 오류: {e}")
                # 에러 메시지 전송
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Nginx 버퍼링 비활성화
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Question API] Streaming 엔드포인트 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Streaming 질문 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/generate-question-set", response_model=QuestionSetResponse)
async def generate_question_set(request: QuestionSetRequest):
    """
    인터뷰 시작 전 10개 질문 세트 생성
    
    구성:
    - Q1: 아이스브레이킹 (자기소개) - 꼬리질문 0개
    - Q2: 지원 동기 (공통 질문) - 꼬리질문 0-1개
    - Q3-10: 역량 평가 질문 (8개) - 각 1-2개 꼬리질문
      * 기술 역량 (2개)
      * 커뮤니케이션 (2개)
      * 문제 해결 (2개)
      * 협업/성실성 (1개)
      * 유연성/사고력 (1개)
    """
    try:
        questions = []
        
        # Q1: 아이스브레이킹 (고정)
        questions.append(QuestionItem(
            id="q1",
            text="간단하게 자기소개 부탁드립니다. 본인의 강점과 경험을 중심으로 말씀해주세요.",
            type="ice_breaking",
            category="아이스브레이킹",
            max_follow_ups=0
        ))
        
        # Q2: 지원 동기 (고정)
        job_title = request.jobPosting.position if request.jobPosting and request.jobPosting.position else "이 직무"
        questions.append(QuestionItem(
            id="q2",
            text=f"{job_title}에 지원하신 이유는 무엇인가요?",
            type="common",
            category="지원 동기",
            max_follow_ups=1
        ))
        
        # Q3-10: 역량 평가 질문 (GPT-4o로 생성)
        # 프로필 정보 준비
        candidate_info = ""
        if request.candidateProfile:
            if request.candidateProfile.skills:
                candidate_info += f"기술 스택: {', '.join(request.candidateProfile.skills)}\n"
            if request.candidateProfile.experience:
                candidate_info += f"경력: {request.candidateProfile.experience}년\n"
            if request.candidateProfile.desiredPosition:
                candidate_info += f"희망 직무: {request.candidateProfile.desiredPosition}\n"
        
        job_info = ""
        if request.jobPosting:
            if request.jobPosting.position:
                job_info += f"직무: {request.jobPosting.position}\n"
            if request.jobPosting.requirements:
                job_info += f"요구 사항: {', '.join(request.jobPosting.requirements)}\n"
        
        # GPT-4o를 통한 역량 평가 질문 생성
        system_prompt = """당신은 전문 HR 면접관입니다. 구직자의 역량을 종합적으로 평가할 수 있는 질문 8개를 생성해주세요.

다음 카테고리별로 질문을 생성하되, 각 질문은 구체적이고 답변을 통해 역량을 명확히 평가할 수 있어야 합니다:

1. 기술 역량 (2개): 전문 지식, 기술 적용 능력
2. 커뮤니케이션 (2개): 의사소통, 설득력, 협업 능력
3. 문제 해결 (2개): 분석력, 창의성, 대응력
4. 협업/성실성 (1개): 팀워크, 책임감
5. 유연성/사고력 (1개): 적응력, 학습 능력

각 질문은 JSON 배열 형식으로 반환하고, 각 항목은 다음 형식을 따르세요:
{
  "text": "질문 내용",
  "category": "카테고리명",
  "max_follow_ups": 1 또는 2 (중요도에 따라)
}
"""
        
        user_prompt = f"""다음 정보를 바탕으로 8개의 역량 평가 질문을 생성해주세요:

구직자 정보:
{candidate_info if candidate_info else "정보 없음"}

채용 공고 정보:
{job_info if job_info else "정보 없음"}

JSON 형식으로만 응답해주세요."""

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            timeout=30.0  # 30초 타임아웃 설정
        )
        
        # GPT 응답 파싱
        generated_questions_json = json.loads(response.choices[0].message.content)
        generated_questions = generated_questions_json.get("questions", [])
        
        # Q3-10 추가
        for idx, q in enumerate(generated_questions[:8], start=3):
            questions.append(QuestionItem(
                id=f"q{idx}",
                text=q["text"],
                type="competency",
                category=q.get("category", "역량 평가"),
                max_follow_ups=q.get("max_follow_ups", 1)
            ))
        
        # 8개가 안 되면 기본 질문으로 채우기
        default_questions = [
            {"text": "가장 어려웠던 프로젝트 경험과 그것을 어떻게 해결했는지 말씀해주세요.", "category": "문제 해결", "max_follow_ups": 2},
            {"text": "팀원과 의견 충돌이 있었던 경험이 있나요? 어떻게 해결하셨나요?", "category": "커뮤니케이션", "max_follow_ups": 2},
            {"text": "새로운 기술이나 도구를 빠르게 학습해야 했던 경험에 대해 말씀해주세요.", "category": "유연성/사고력", "max_follow_ups": 1},
            {"text": "업무 중 우선순위를 정하는 본인만의 기준이 있나요?", "category": "협업/성실성", "max_follow_ups": 1},
            {"text": "본인의 핵심 기술 역량은 무엇이며, 실제로 어떻게 활용해보셨나요?", "category": "기술 역량", "max_follow_ups": 2},
            {"text": "프로젝트 마감 기한을 맞추지 못할 상황이라면 어떻게 대처하시겠습니까?", "category": "문제 해결", "max_follow_ups": 1}
        ]
        
        while len(questions) < 10:
            idx = len(questions)
            default_q = default_questions[idx - 3] if idx - 3 < len(default_questions) else default_questions[0]
            questions.append(QuestionItem(
                id=f"q{idx + 1}",
                text=default_q["text"],
                type="competency",
                category=default_q["category"],
                max_follow_ups=default_q["max_follow_ups"]
            ))
        
        return QuestionSetResponse(questions=questions)
    
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        print(f"[Question API] 질문 세트 생성 오류 ({error_type}): {error_msg}")
        
        # 에러 타입별 로깅
        if "timeout" in error_msg.lower():
            print("[Question API] OpenAI API 타임아웃 발생")
        elif "api key" in error_msg.lower() or "authentication" in error_msg.lower():
            print("[Question API] OpenAI API 키 인증 실패 - .env 파일의 OPENAI_API_KEY를 확인하세요")
        elif "rate limit" in error_msg.lower():
            print("[Question API] OpenAI API 요청 제한 초과")
        
        # 에러 발생 시 기본 질문 세트 반환
        print("[Question API] Fallback 질문 세트 반환")
        fallback_questions = [
            QuestionItem(id="q1", text="간단하게 자기소개 부탁드립니다.", type="ice_breaking", category="아이스브레이킹", max_follow_ups=0),
            QuestionItem(id="q2", text="이 직무에 지원하신 이유는 무엇인가요?", type="common", category="지원 동기", max_follow_ups=1),
            QuestionItem(id="q3", text="본인의 가장 큰 강점은 무엇이라고 생각하시나요?", type="competency", category="자기 인식", max_follow_ups=1),
            QuestionItem(id="q4", text="가장 어려웠던 프로젝트 경험에 대해 말씀해주세요.", type="competency", category="문제 해결", max_follow_ups=2),
            QuestionItem(id="q5", text="팀원과 협업할 때 중요하게 생각하는 가치는 무엇인가요?", type="competency", category="협업", max_follow_ups=1),
            QuestionItem(id="q6", text="새로운 기술을 학습할 때 어떤 방식으로 접근하시나요?", type="competency", category="학습 능력", max_follow_ups=1),
            QuestionItem(id="q7", text="업무 우선순위를 어떻게 설정하시나요?", type="competency", category="시간 관리", max_follow_ups=1),
            QuestionItem(id="q8", text="의견 충돌 상황을 어떻게 해결하시나요?", type="competency", category="커뮤니케이션", max_follow_ups=2),
            QuestionItem(id="q9", text="실패한 경험과 그로부터 배운 점을 말씀해주세요.", type="competency", category="성장", max_follow_ups=2),
            QuestionItem(id="q10", text="5년 후 본인의 모습은 어떨 것 같나요?", type="competency", category="비전", max_follow_ups=1)
        ]
        return QuestionSetResponse(questions=fallback_questions)

