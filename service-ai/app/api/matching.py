"""
매칭 API 라우터
"""

from fastapi import APIRouter, HTTPException
from app.models.matching import (
    MatchingRequest,
    MatchingResult,
    RecommendJobsRequest,
    RecommendJobsResponse,
    RecommendCandidatesRequest,
    RecommendCandidatesResponse,
    JobRecommendation,
    CandidateRecommendation
)
from app.services.matching_service import (
    match_candidate_with_job,
    find_best_matches_for_candidate,
    find_best_candidates_for_job
)

router = APIRouter()


@router.post("/calculate-match", response_model=MatchingResult)
async def calculate_match(request: MatchingRequest):
    """
    구직자와 채용 공고 간의 매칭 점수 및 근거 계산
    """
    try:
        candidate_dict = request.candidateProfile.model_dump()
        job_dict = request.jobPosting.model_dump()
        
        result = match_candidate_with_job(candidate_dict, job_dict)
        
        return MatchingResult(
            matchingScore=result["matchingScore"],
            matchingReason=result["matchingReason"]
        )
    
    except Exception as e:
        print(f"[Matching API] 매칭 계산 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"매칭 계산 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/recommend-jobs", response_model=RecommendJobsResponse)
async def recommend_jobs(request: RecommendJobsRequest):
    """
    구직자에게 적합한 채용 공고 추천
    """
    try:
        candidate_dict = request.candidateProfile.model_dump()
        jobs_list = [job.model_dump() for job in request.jobPostings]
        
        matches = find_best_matches_for_candidate(
            candidate_dict,
            jobs_list,
            request.topK
        )
        
        recommendations = [
            JobRecommendation(
                jobPosting=match["jobPosting"],
                matchingScore=match["matchingScore"],
                matchingReason=match["matchingReason"]
            )
            for match in matches
        ]
        
        return RecommendJobsResponse(
            recommendations=recommendations,
            total=len(recommendations)
        )
    
    except Exception as e:
        print(f"[Matching API] 공고 추천 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"공고 추천 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/recommend-candidates", response_model=RecommendCandidatesResponse)
async def recommend_candidates(request: RecommendCandidatesRequest):
    """
    채용 공고에 적합한 후보자 추천
    """
    try:
        job_dict = request.jobPosting.model_dump()
        candidates_list = [candidate.model_dump() for candidate in request.candidateProfiles]
        
        matches = find_best_candidates_for_job(
            job_dict,
            candidates_list,
            request.topK
        )
        
        recommendations = [
            CandidateRecommendation(
                candidate=match["candidate"],
                matchingScore=match["matchingScore"],
                matchingReason=match["matchingReason"]
            )
            for match in matches
        ]
        
        return RecommendCandidatesResponse(
            recommendations=recommendations,
            total=len(recommendations)
        )
    
    except Exception as e:
        print(f"[Matching API] 후보자 추천 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"후보자 추천 중 오류가 발생했습니다: {str(e)}"
        )

