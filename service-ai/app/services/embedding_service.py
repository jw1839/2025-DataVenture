"""
임베딩 생성 서비스
Sentence-Transformers를 사용한 텍스트 임베딩
"""

from typing import List
from sentence_transformers import SentenceTransformer
import numpy as np

# 한국어 특화 모델 로드 (전역 변수로 한 번만 로드)
# jhgan/ko-sbert-nli: 한국어 NLI 데이터로 학습된 SBERT 모델
_model = None


def get_embedding_model():
    """임베딩 모델 싱글톤 패턴으로 로드"""
    global _model
    if _model is None:
        print("[Embedding Service] 임베딩 모델 로딩 중...")
        _model = SentenceTransformer('jhgan/ko-sbert-nli')
        print("[Embedding Service] 임베딩 모델 로딩 완료")
    return _model


def generate_embedding(text: str) -> List[float]:
    """
    텍스트를 벡터로 변환
    
    Args:
        text: 임베딩할 텍스트
    
    Returns:
        768차원 벡터 (리스트)
    """
    if not text or not text.strip():
        # 빈 텍스트는 영벡터 반환
        return [0.0] * 768
    
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    
    # NumPy 배열을 Python 리스트로 변환
    return embedding.tolist()


def generate_candidate_embedding(
    resume_text: str = None,
    skills: List[str] = None,
    experience: int = None,
    desired_position: str = None
) -> List[float]:
    """
    구직자 프로필을 임베딩으로 변환
    
    Args:
        resume_text: 이력서 텍스트
        skills: 기술 스택 리스트
        experience: 경력 (년)
        desired_position: 희망 직무
    
    Returns:
        768차원 벡터
    """
    # 텍스트 조합
    text_parts = []
    
    if resume_text:
        text_parts.append(resume_text)
    
    if skills:
        text_parts.append(f"기술 스택: {', '.join(skills)}")
    
    if experience is not None:
        text_parts.append(f"경력: {experience}년")
    
    if desired_position:
        text_parts.append(f"희망 직무: {desired_position}")
    
    combined_text = " ".join(text_parts)
    
    return generate_embedding(combined_text)


def generate_job_posting_embedding(
    title: str = None,
    description: str = None,
    position: str = None,
    requirements: List[str] = None,
    preferred_skills: List[str] = None
) -> List[float]:
    """
    채용 공고를 임베딩으로 변환
    
    Args:
        title: 공고 제목
        description: 공고 설명
        position: 직무
        requirements: 필수 요건
        preferred_skills: 우대 사항
    
    Returns:
        768차원 벡터
    """
    # 텍스트 조합
    text_parts = []
    
    if title:
        text_parts.append(f"제목: {title}")
    
    if position:
        text_parts.append(f"직무: {position}")
    
    if description:
        text_parts.append(description)
    
    if requirements:
        text_parts.append(f"필수 요건: {', '.join(requirements)}")
    
    if preferred_skills:
        text_parts.append(f"우대 사항: {', '.join(preferred_skills)}")
    
    combined_text = " ".join(text_parts)
    
    return generate_embedding(combined_text)


def calculate_cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    두 임베딩 간의 코사인 유사도 계산
    
    Args:
        embedding1: 첫 번째 벡터
        embedding2: 두 번째 벡터
    
    Returns:
        코사인 유사도 (-1 ~ 1, 높을수록 유사)
    """
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    
    # 코사인 유사도 = (A · B) / (||A|| * ||B||)
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    similarity = dot_product / (norm1 * norm2)
    
    return float(similarity)


# 직무별 역량 가중치 매핑
# 각 직무에 대해 5가지 역량의 중요도를 가중치로 정의
POSITION_WEIGHTS = {
    "경영관리": {
        "informationAnalysis": 0.40,
        "problemSolving": 0.35,
        "flexibleThinking": 0.25,
        "negotiation": 0.0,
        "itSkills": 0.0
    },
    "전략기획": {
        "informationAnalysis": 0.40,
        "problemSolving": 0.35,
        "flexibleThinking": 0.25,
        "negotiation": 0.0,
        "itSkills": 0.0
    },
    "회계": {
        "informationAnalysis": 0.40,
        "problemSolving": 0.35,
        "flexibleThinking": 0.25,
        "negotiation": 0.0,
        "itSkills": 0.0
    },
    "경리": {
        "informationAnalysis": 0.40,
        "problemSolving": 0.35,
        "flexibleThinking": 0.25,
        "negotiation": 0.0,
        "itSkills": 0.0
    },
    "인사": {
        "informationAnalysis": 0.40,
        "problemSolving": 0.35,
        "flexibleThinking": 0.25,
        "negotiation": 0.0,
        "itSkills": 0.0
    },
    "총무": {
        "informationAnalysis": 0.40,
        "problemSolving": 0.35,
        "flexibleThinking": 0.25,
        "negotiation": 0.0,
        "itSkills": 0.0
    },
    "영업": {
        "negotiation": 0.40,
        "flexibleThinking": 0.35,
        "informationAnalysis": 0.25,
        "problemSolving": 0.0,
        "itSkills": 0.0
    },
    "마케팅": {
        "negotiation": 0.40,
        "flexibleThinking": 0.35,
        "informationAnalysis": 0.25,
        "problemSolving": 0.0,
        "itSkills": 0.0
    },
    "전산": {
        "itSkills": 0.40,
        "problemSolving": 0.35,
        "informationAnalysis": 0.25,
        "negotiation": 0.0,
        "flexibleThinking": 0.0
    },
    "IT": {
        "itSkills": 0.40,
        "problemSolving": 0.35,
        "informationAnalysis": 0.25,
        "negotiation": 0.0,
        "flexibleThinking": 0.0
    },
    "IT 개발": {
        "itSkills": 0.40,
        "problemSolving": 0.35,
        "informationAnalysis": 0.25,
        "negotiation": 0.0,
        "flexibleThinking": 0.0
    },
    "개발": {
        "itSkills": 0.40,
        "problemSolving": 0.35,
        "informationAnalysis": 0.25,
        "negotiation": 0.0,
        "flexibleThinking": 0.0
    },
    "개발 기획": {
        "itSkills": 0.40,
        "problemSolving": 0.35,
        "informationAnalysis": 0.25,
        "negotiation": 0.0,
        "flexibleThinking": 0.0
    },
}


def calculate_competency_score(
    candidate_evaluation: dict,
    job_position: str
) -> float:
    """
    5가지 역량 점수를 직무별 가중치로 계산
    
    Args:
        candidate_evaluation: 구직자 평가 결과 (5가지 역량 점수 포함)
        job_position: 채용 공고 직무
    
    Returns:
        가중 역량 점수 (0-100)
    """
    # 직무별 가중치 가져오기 (없으면 균등 가중치)
    weights = POSITION_WEIGHTS.get(job_position, {
        "informationAnalysis": 0.20,
        "problemSolving": 0.20,
        "flexibleThinking": 0.20,
        "negotiation": 0.20,
        "itSkills": 0.20
    })
    
    # 5가지 역량 점수 추출 (없으면 0)
    info_analysis = candidate_evaluation.get("informationAnalysis", 0)
    problem_solving = candidate_evaluation.get("problemSolving", 0)
    flexible_thinking = candidate_evaluation.get("flexibleThinking", 0)
    negotiation = candidate_evaluation.get("negotiation", 0)
    it_skills = candidate_evaluation.get("itSkills", 0)
    
    # 가중 합계 계산
    weighted_score = (
        info_analysis * weights["informationAnalysis"] +
        problem_solving * weights["problemSolving"] +
        flexible_thinking * weights["flexibleThinking"] +
        negotiation * weights["negotiation"] +
        it_skills * weights["itSkills"]
    )
    
    return round(weighted_score, 2)


def calculate_matching_score(
    candidate_embedding: List[float],
    job_posting_embedding: List[float],
    candidate_profile: dict = None,
    job_posting: dict = None
) -> float:
    """
    매칭 점수 계산 (벡터 유사도 + 5가지 역량 가중치 + 규칙 기반)
    
    Args:
        candidate_embedding: 구직자 임베딩
        job_posting_embedding: 공고 임베딩
        candidate_profile: 구직자 프로필 (선택, evaluation 포함 가능)
        job_posting: 공고 정보 (선택, position 포함)
    
    Returns:
        매칭 점수 (0-100)
    """
    # 1. 벡터 유사도 (0-1)
    cosine_sim = calculate_cosine_similarity(candidate_embedding, job_posting_embedding)
    
    # 2. 벡터 유사도를 0-100 스케일로 변환
    # -1~1 범위를 0~100으로 변환: (sim + 1) / 2 * 100
    base_score = ((cosine_sim + 1) / 2) * 100
    
    # 3. 5가지 역량 가중치 점수 계산 (있는 경우만)
    competency_score = 0
    competency_weight = 0
    
    if candidate_profile and job_posting:
        candidate_evaluation = candidate_profile.get("evaluation")
        job_position = job_posting.get("position")
        
        if candidate_evaluation and job_position:
            # 5가지 역량 점수가 있으면 가중치 적용
            competency_score = calculate_competency_score(candidate_evaluation, job_position)
            competency_weight = 0.4  # 역량 점수 가중치 40%
    
    # 4. 규칙 기반 보정
    bonus = 0
    
    if candidate_profile and job_posting:
        # 경력 매칭 보정
        candidate_exp = candidate_profile.get("experience", 0)
        min_exp = job_posting.get("experienceMin", 0)
        max_exp = job_posting.get("experienceMax", 100)
        
        if min_exp <= candidate_exp <= max_exp:
            bonus += 5  # 경력 범위 내면 +5점
        
        # 기술 스택 매칭 보정
        candidate_skills = set(candidate_profile.get("skills", []))
        required_skills = set(job_posting.get("requirements", []))
        preferred_skills = set(job_posting.get("preferredSkills", []))
        
        if candidate_skills & required_skills:  # 교집합
            # 필수 기술 매칭 개수에 비례
            match_ratio = len(candidate_skills & required_skills) / len(required_skills) if required_skills else 0
            bonus += match_ratio * 10  # 최대 +10점
        
        if candidate_skills & preferred_skills:
            # 우대 기술 매칭
            match_ratio = len(candidate_skills & preferred_skills) / len(preferred_skills) if preferred_skills else 0
            bonus += match_ratio * 5  # 최대 +5점
    
    # 5. 최종 점수 계산
    if competency_weight > 0:
        # 역량 점수가 있으면 벡터 유사도와 역량 점수를 조합
        # 벡터 유사도 60% + 역량 점수 40%
        final_score = (base_score * (1 - competency_weight)) + (competency_score * competency_weight) + bonus
    else:
        # 역량 점수가 없으면 기존 방식대로
        final_score = base_score + bonus
    
    # 6. 0-100 범위로 클램핑
    final_score = min(100, max(0, final_score))
    
    return round(final_score, 2)

