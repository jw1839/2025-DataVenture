"""
매칭 서비스
구직자와 채용 공고 매칭 및 근거 생성
"""

from typing import Dict, List
from openai import OpenAI
import os
import json

from app.services.embedding_service import (
    calculate_matching_score,
    generate_candidate_embedding,
    generate_job_posting_embedding
)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def match_candidate_with_job(
    candidate_profile: Dict,
    job_posting: Dict
) -> Dict:
    """
    구직자와 채용 공고 매칭
    
    Args:
        candidate_profile: 구직자 프로필
        job_posting: 채용 공고
    
    Returns:
        매칭 결과 (score, reason)
    """
    # 1. 임베딩 생성
    candidate_embedding = generate_candidate_embedding(
        resume_text=candidate_profile.get("resumeText"),
        skills=candidate_profile.get("skills", []),
        experience=candidate_profile.get("experience"),
        desired_position=candidate_profile.get("desiredPosition")
    )
    
    job_embedding = generate_job_posting_embedding(
        title=job_posting.get("title"),
        description=job_posting.get("description"),
        position=job_posting.get("position"),
        requirements=job_posting.get("requirements", []),
        preferred_skills=job_posting.get("preferredSkills", [])
    )
    
    # 2. 매칭 점수 계산
    matching_score = calculate_matching_score(
        candidate_embedding,
        job_embedding,
        candidate_profile,
        job_posting
    )
    
    # 3. 매칭 근거 생성 (GPT-5)
    matching_reason = generate_matching_reason(
        candidate_profile,
        job_posting,
        matching_score
    )
    
    return {
        "matchingScore": matching_score,
        "matchingReason": matching_reason
    }


def generate_matching_reason(
    candidate_profile: Dict,
    job_posting: Dict,
    matching_score: float
) -> str:
    """
    매칭 근거 생성 (GPT-4)
    
    Args:
        candidate_profile: 구직자 프로필
        job_posting: 채용 공고
        matching_score: 매칭 점수
    
    Returns:
        매칭 근거 텍스트
    """
    
    system_prompt = """당신은 HR 매칭 전문가입니다.
구직자 프로필과 채용 공고를 분석하여 왜 이들이 매칭되는지 또는 매칭되지 않는지를 명확하고 객관적으로 설명하세요.

설명 원칙:
1. 구체적인 근거 제시 (기술 스택, 경력, 직무 등)
2. 긍정적 요소와 고려사항 모두 언급
3. 100-200자 내외로 간결하게
4. 한국어로 작성"""

    # 프로필 정보 구성
    candidate_text = []
    if candidate_profile.get("skills"):
        candidate_text.append(f"기술: {', '.join(candidate_profile['skills'])}")
    if candidate_profile.get("experience") is not None:
        candidate_text.append(f"경력: {candidate_profile['experience']}년")
    if candidate_profile.get("desiredPosition"):
        candidate_text.append(f"희망 직무: {candidate_profile['desiredPosition']}")
    
    # 공고 정보 구성
    job_text = []
    if job_posting.get("title"):
        job_text.append(f"공고: {job_posting['title']}")
    if job_posting.get("position"):
        job_text.append(f"직무: {job_posting['position']}")
    if job_posting.get("requirements"):
        job_text.append(f"요구사항: {', '.join(job_posting['requirements'][:3])}")
    if job_posting.get("experienceMin") is not None:
        exp_range = f"{job_posting.get('experienceMin', 0)}-{job_posting.get('experienceMax', '제한없음')}년"
        job_text.append(f"경력: {exp_range}")
    
    user_prompt = f"""구직자 프로필:
{chr(10).join(candidate_text)}

채용 공고:
{chr(10).join(job_text)}

매칭 점수: {matching_score}/100

위 정보를 바탕으로 이 구직자가 이 공고에 적합한 이유 또는 고려사항을 설명해주세요."""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        reason = response.choices[0].message.content.strip()
        return reason
        
    except Exception as e:
        print(f"[Matching Service] 매칭 근거 생성 오류: {e}")
        # 기본 근거 반환
        if matching_score >= 80:
            return "높은 매칭도를 보이며, 주요 요구사항을 충족합니다."
        elif matching_score >= 60:
            return "양호한 매칭도를 보이나, 일부 요구사항 검토가 필요합니다."
        else:
            return "매칭도가 낮으며, 다른 공고를 고려해보시기 바랍니다."


def find_best_matches_for_candidate(
    candidate_profile: Dict,
    job_postings: List[Dict],
    top_k: int = 5
) -> List[Dict]:
    """
    구직자에게 가장 적합한 공고 찾기
    
    Args:
        candidate_profile: 구직자 프로필
        job_postings: 공고 리스트
        top_k: 상위 몇 개 반환
    
    Returns:
        매칭 결과 리스트 (점수 높은 순)
    """
    # 구직자 임베딩 생성 (한 번만)
    candidate_embedding = generate_candidate_embedding(
        resume_text=candidate_profile.get("resumeText"),
        skills=candidate_profile.get("skills", []),
        experience=candidate_profile.get("experience"),
        desired_position=candidate_profile.get("desiredPosition")
    )
    
    # 각 공고와 매칭 점수 계산
    matches = []
    for job in job_postings:
        job_embedding = generate_job_posting_embedding(
            title=job.get("title"),
            description=job.get("description"),
            position=job.get("position"),
            requirements=job.get("requirements", []),
            preferred_skills=job.get("preferredSkills", [])
        )
        
        score = calculate_matching_score(
            candidate_embedding,
            job_embedding,
            candidate_profile,
            job
        )
        
        matches.append({
            "jobPosting": job,
            "matchingScore": score
        })
    
    # 점수 순으로 정렬
    matches.sort(key=lambda x: x["matchingScore"], reverse=True)
    
    # 상위 K개만 반환하고 근거 생성
    top_matches = matches[:top_k]
    
    for match in top_matches:
        match["matchingReason"] = generate_matching_reason(
            candidate_profile,
            match["jobPosting"],
            match["matchingScore"]
        )
    
    return top_matches


def find_best_candidates_for_job(
    job_posting: Dict,
    candidate_profiles: List[Dict],
    top_k: int = 5
) -> List[Dict]:
    """
    채용 공고에 가장 적합한 후보자 찾기
    
    Args:
        job_posting: 채용 공고
        candidate_profiles: 후보자 리스트
        top_k: 상위 몇 명 반환
    
    Returns:
        매칭 결과 리스트 (점수 높은 순)
    """
    # 공고 임베딩 생성 (한 번만)
    job_embedding = generate_job_posting_embedding(
        title=job_posting.get("title"),
        description=job_posting.get("description"),
        position=job_posting.get("position"),
        requirements=job_posting.get("requirements", []),
        preferred_skills=job_posting.get("preferredSkills", [])
    )
    
    # 각 후보자와 매칭 점수 계산
    matches = []
    for candidate in candidate_profiles:
        candidate_embedding = generate_candidate_embedding(
            resume_text=candidate.get("resumeText"),
            skills=candidate.get("skills", []),
            experience=candidate.get("experience"),
            desired_position=candidate.get("desiredPosition")
        )
        
        score = calculate_matching_score(
            candidate_embedding,
            job_embedding,
            candidate,
            job_posting
        )
        
        matches.append({
            "candidate": candidate,
            "matchingScore": score
        })
    
    # 점수 순으로 정렬
    matches.sort(key=lambda x: x["matchingScore"], reverse=True)
    
    # 상위 K명만 반환하고 근거 생성
    top_matches = matches[:top_k]
    
    for match in top_matches:
        match["matchingReason"] = generate_matching_reason(
            match["candidate"],
            job_posting,
            match["matchingScore"]
        )
    
    return top_matches

