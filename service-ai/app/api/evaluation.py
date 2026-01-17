"""
평가 생성 API 라우터
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from app.models.evaluation import (
    EvaluationRequest,
    EvaluationResponse
)
from app.services.evaluation_generator import generate_complete_evaluation
from app.services.answer_analyzer import generate_instant_feedback

router = APIRouter()

# 즉시 피드백 요청/응답 모델
class InstantFeedbackRequest(BaseModel):
    question: str = Field(..., description="질문")
    answer: str = Field(..., description="답변")
    questionType: str = Field(default="competency", description="질문 타입")

class InstantFeedbackResponse(BaseModel):
    feedback: str = Field(..., description="전체 피드백")
    strengths: List[str] = Field(..., description="강점 목록")
    improvements: List[str] = Field(..., description="개선점 목록")
    score: int = Field(..., description="점수 (0-100)")


@router.post("/generate-evaluation", response_model=EvaluationResponse)
async def generate_evaluation(request: EvaluationRequest):
    """
    인터뷰 평가 생성
    
    전체 대화 기록을 분석하여 종합 평가 및 피드백 생성
    """
    try:
        if not request.conversationHistory or len(request.conversationHistory) < 2:
            raise HTTPException(
                status_code=400,
                detail="최소 2개 이상의 대화 기록이 필요합니다."
            )
        
        # 대화 히스토리 변환
        conversation_list = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in request.conversationHistory
        ]
        
        # 프로필 및 공고 정보
        candidate_profile = request.candidateProfile if request.candidateProfile else None
        job_posting = request.jobPosting if request.jobPosting else None
        
        # 평가 생성
        evaluation_result = generate_complete_evaluation(
            conversation_history=conversation_list,
            candidate_profile=candidate_profile,
            job_posting=job_posting
        )
        
        return EvaluationResponse(
            scores=evaluation_result["scores"],
            statistics=evaluation_result["statistics"],
            feedback=evaluation_result["feedback"],
            message="평가가 성공적으로 생성되었습니다."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Evaluation API] 평가 생성 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"평가 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/instant-feedback", response_model=InstantFeedbackResponse)
async def get_instant_feedback(request: InstantFeedbackRequest):
    """
    답변에 대한 즉시 피드백 생성 (채팅 모드용)
    
    구직자가 답변을 제출하면 즉시 피드백을 제공합니다.
    """
    try:
        if not request.question or not request.answer:
            raise HTTPException(
                status_code=400,
                detail="질문과 답변이 모두 필요합니다."
            )
        
        # 답변이 너무 짧으면 경고
        if len(request.answer.strip()) < 10:
            return InstantFeedbackResponse(
                feedback="답변이 너무 짧습니다. 더 구체적으로 설명해주세요.",
                strengths=[],
                improvements=["최소 10자 이상 작성해주세요.", "구체적인 예시를 포함해보세요."],
                score=30
            )
        
        # 즉시 피드백 생성
        feedback_result = generate_instant_feedback(
            question=request.question,
            answer=request.answer,
            question_type=request.questionType
        )
        
        return InstantFeedbackResponse(
            feedback=feedback_result["feedback"],
            strengths=feedback_result["strengths"],
            improvements=feedback_result["improvements"],
            score=feedback_result["score"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Evaluation API] 즉시 피드백 생성 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"피드백 생성 중 오류가 발생했습니다: {str(e)}"
        )

