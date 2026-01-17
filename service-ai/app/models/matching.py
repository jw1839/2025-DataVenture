"""
매칭 관련 Pydantic 모델
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class CandidateProfileForMatching(BaseModel):
    """매칭용 구직자 프로필"""
    userId: str = Field(..., description="사용자 ID")
    resumeText: Optional[str] = Field(default=None, description="이력서 텍스트")
    skills: List[str] = Field(default=[], description="기술 스택")
    experience: Optional[int] = Field(default=None, description="경력 (년)")
    desiredPosition: Optional[str] = Field(default=None, description="희망 직무")


class JobPostingForMatching(BaseModel):
    """매칭용 채용 공고"""
    id: str = Field(..., description="공고 ID")
    title: str = Field(..., description="공고 제목")
    description: str = Field(..., description="공고 설명")
    position: str = Field(..., description="직무")
    requirements: List[str] = Field(default=[], description="필수 요건")
    preferredSkills: List[str] = Field(default=[], description="우대 사항")
    experienceMin: Optional[int] = Field(default=None, description="최소 경력")
    experienceMax: Optional[int] = Field(default=None, description="최대 경력")


class MatchingRequest(BaseModel):
    """매칭 요청"""
    candidateProfile: CandidateProfileForMatching = Field(..., description="구직자 프로필")
    jobPosting: JobPostingForMatching = Field(..., description="채용 공고")


class MatchingResult(BaseModel):
    """매칭 결과"""
    matchingScore: float = Field(..., description="매칭 점수 (0-100)")
    matchingReason: str = Field(..., description="매칭 근거")


class RecommendJobsRequest(BaseModel):
    """구직자 추천 공고 요청"""
    candidateProfile: CandidateProfileForMatching = Field(..., description="구직자 프로필")
    jobPostings: List[JobPostingForMatching] = Field(..., description="공고 리스트")
    topK: int = Field(default=5, description="상위 몇 개 반환")


class RecommendCandidatesRequest(BaseModel):
    """공고 추천 후보자 요청"""
    jobPosting: JobPostingForMatching = Field(..., description="채용 공고")
    candidateProfiles: List[CandidateProfileForMatching] = Field(..., description="후보자 리스트")
    topK: int = Field(default=5, description="상위 몇 명 반환")


class JobRecommendation(BaseModel):
    """공고 추천 결과"""
    jobPosting: Dict[str, Any] = Field(..., description="공고 정보")
    matchingScore: float = Field(..., description="매칭 점수")
    matchingReason: str = Field(..., description="매칭 근거")


class CandidateRecommendation(BaseModel):
    """후보자 추천 결과"""
    candidate: Dict[str, Any] = Field(..., description="후보자 정보")
    matchingScore: float = Field(..., description="매칭 점수")
    matchingReason: str = Field(..., description="매칭 근거")


class RecommendJobsResponse(BaseModel):
    """공고 추천 응답"""
    recommendations: List[JobRecommendation] = Field(..., description="추천 공고 리스트")
    total: int = Field(..., description="추천 공고 수")


class RecommendCandidatesResponse(BaseModel):
    """후보자 추천 응답"""
    recommendations: List[CandidateRecommendation] = Field(..., description="추천 후보자 리스트")
    total: int = Field(..., description="추천 후보자 수")

