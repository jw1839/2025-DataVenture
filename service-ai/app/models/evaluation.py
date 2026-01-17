"""
평가 관련 Pydantic 모델
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class EvaluationRequest(BaseModel):
    """평가 생성 요청"""
    interviewId: str = Field(..., description="인터뷰 ID")
    conversationHistory: List[Dict] = Field(..., description="전체 대화 기록")
    candidateProfile: Optional[Dict] = Field(default=None, description="구직자 프로필")
    jobPosting: Optional[Dict] = Field(default=None, description="채용 공고")


class ScoresModel(BaseModel):
    """점수 모델 (0-100 스케일)"""
    technicalScore: float = Field(..., description="기술 역량 점수")
    communicationScore: float = Field(..., description="커뮤니케이션 점수")
    problemSolvingScore: float = Field(..., description="문제 해결 능력 점수")
    overallScore: float = Field(..., description="종합 점수")


class FeedbackModel(BaseModel):
    """피드백 모델"""
    strengths: List[str] = Field(..., description="강점 목록")
    weaknesses: List[str] = Field(..., description="약점 목록")
    recommendations: List[str] = Field(..., description="개선 방안 목록")
    summary: str = Field(..., description="전체 평가 요약")
    technical_feedback: Optional[str] = Field(default=None, description="기술 역량 상세 피드백")
    communication_feedback: Optional[str] = Field(default=None, description="커뮤니케이션 상세 피드백")
    problem_solving_feedback: Optional[str] = Field(default=None, description="문제 해결 능력 상세 피드백")


class StatisticsModel(BaseModel):
    """통계 모델"""
    technical_avg: float = Field(..., description="기술 역량 평균")
    communication_avg: float = Field(..., description="커뮤니케이션 평균")
    problem_solving_avg: float = Field(..., description="문제 해결 능력 평균")
    overall_avg: float = Field(..., description="종합 평균")
    consistency: float = Field(..., description="일관성 점수")
    answer_count: int = Field(..., description="분석된 답변 수")


class EvaluationResponse(BaseModel):
    """평가 생성 응답"""
    scores: ScoresModel = Field(..., description="최종 점수 (0-100)")
    statistics: StatisticsModel = Field(..., description="통계 정보")
    feedback: FeedbackModel = Field(..., description="피드백")
    message: str = Field(default="평가가 성공적으로 생성되었습니다.", description="메시지")

