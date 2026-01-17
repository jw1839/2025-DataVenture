"""
질문 생성 관련 Pydantic 모델
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class CandidateProfile(BaseModel):
    """구직자 프로필 정보"""
    skills: Optional[List[str]] = Field(default=None, description="기술 스택")
    experience: Optional[int] = Field(default=None, description="경력 (년)")
    desiredPosition: Optional[str] = Field(default=None, description="희망 직무")


class JobPosting(BaseModel):
    """채용 공고 정보"""
    title: Optional[str] = Field(default=None, description="공고명")
    position: Optional[str] = Field(default=None, description="직무")
    requirements: Optional[List[str]] = Field(default=None, description="요구 사항")


class ConversationMessage(BaseModel):
    """대화 메시지"""
    role: str = Field(..., description="메시지 역할 (AI|CANDIDATE)")
    content: str = Field(..., description="메시지 내용")


class QuestionGenerationRequest(BaseModel):
    """질문 생성 요청"""
    interviewId: Optional[str] = Field(default=None, description="인터뷰 ID")
    candidateProfile: Optional[CandidateProfile] = Field(default=None, description="구직자 프로필")
    jobPosting: Optional[JobPosting] = Field(default=None, description="채용 공고")
    conversationHistory: Optional[List[ConversationMessage]] = Field(
        default=None, 
        description="대화 히스토리"
    )
    lastAnswer: Optional[str] = Field(default=None, description="마지막 답변")
    isFirstQuestion: bool = Field(default=True, description="첫 번째 질문 여부")


class QuestionGenerationResponse(BaseModel):
    """질문 생성 응답"""
    question: str = Field(..., description="생성된 질문")
    questionType: str = Field(default="open", description="질문 유형 (open|technical|behavioral)")


class QuestionItem(BaseModel):
    """개별 질문 아이템"""
    id: str = Field(..., description="질문 고유 ID")
    text: str = Field(..., description="질문 내용")
    type: str = Field(..., description="질문 타입 (ice_breaking|common|competency)")
    category: str = Field(..., description="질문 카테고리")
    max_follow_ups: int = Field(default=0, description="최대 꼬리질문 개수")


class QuestionSetRequest(BaseModel):
    """질문 세트 생성 요청"""
    candidateProfile: Optional[CandidateProfile] = Field(default=None, description="구직자 프로필")
    jobPosting: Optional[JobPosting] = Field(default=None, description="채용 공고")
    mode: str = Field(default="PRACTICE", description="인터뷰 모드 (PRACTICE|REAL)")


class QuestionSetResponse(BaseModel):
    """질문 세트 생성 응답"""
    questions: List[QuestionItem] = Field(..., description="생성된 질문 목록")
