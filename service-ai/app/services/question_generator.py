"""
AI 질문 생성 서비스
OpenAI GPT-4를 사용하여 맞춤형 인터뷰 질문 생성
"""

from typing import List, Dict, Optional
from openai import OpenAI
import os

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_first_question(
    candidate_profile: Optional[Dict] = None,
    job_posting: Optional[Dict] = None
) -> str:
    """
    첫 번째 인터뷰 질문 생성
    
    Args:
        candidate_profile: 구직자 프로필 (skills, experience, desiredPosition)
        job_posting: 채용 공고 정보 (title, position, requirements)
    
    Returns:
        생성된 질문 문자열
    """
    
    # 시스템 프롬프트 (면접관 역할 정의)
    system_prompt = """당신은 전문적이고 친근한 HR 면접관입니다.
구직자의 역량을 객관적으로 평가하고, 자연스러운 대화를 통해 후보자의 강점과 약점을 파악하는 것이 목표입니다.

질문 생성 원칙:
1. 자연스럽고 친근한 톤 사용
2. 개방형 질문으로 깊이 있는 답변 유도
3. 구직자의 프로필과 관련된 맥락 있는 질문
4. 한 번에 하나의 질문만 제시
5. 한국어로 응답"""

    # 사용자 프롬프트 구성
    user_prompt_parts = ["첫 번째 인터뷰 질문을 생성해주세요."]
    
    if candidate_profile:
        skills = candidate_profile.get("skills", [])
        experience = candidate_profile.get("experience")
        desired_position = candidate_profile.get("desiredPosition")
        
        profile_info = []
        if skills:
            profile_info.append(f"보유 기술: {', '.join(skills)}")
        if experience is not None:
            profile_info.append(f"경력: {experience}년")
        if desired_position:
            profile_info.append(f"희망 직무: {desired_position}")
        
        if profile_info:
            user_prompt_parts.append(f"\n구직자 정보:\n" + "\n".join(profile_info))
    
    if job_posting:
        title = job_posting.get("title")
        position = job_posting.get("position")
        requirements = job_posting.get("requirements", [])
        
        job_info = []
        if title:
            job_info.append(f"공고명: {title}")
        if position:
            job_info.append(f"직무: {position}")
        if requirements:
            job_info.append(f"요구 사항: {', '.join(requirements[:3])}")  # 처음 3개만
        
        if job_info:
            user_prompt_parts.append(f"\n채용 공고 정보:\n" + "\n".join(job_info))
    
    user_prompt_parts.append("\n간단한 자기소개나 지원 동기를 물어보는 질문으로 시작해주세요.")
    
    user_prompt = "\n".join(user_prompt_parts)
    
    # OpenAI API 호출
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        question = response.choices[0].message.content.strip()
        return question
        
    except Exception as e:
        print(f"[Question Generator] OpenAI API 오류: {e}")
        # 기본 질문 반환
        return "안녕하세요! 오늘 인터뷰에 참여해주셔서 감사합니다. 먼저 간단하게 자기소개를 부탁드립니다."


def generate_next_question(
    conversation_history: List[Dict[str, str]],
    last_answer: str,
    candidate_profile: Optional[Dict] = None,
    job_posting: Optional[Dict] = None
) -> str:
    """
    다음 인터뷰 질문 생성 (대화 히스토리 기반)
    
    Args:
        conversation_history: 이전 대화 기록 [{"role": "AI"|"CANDIDATE", "content": "..."}]
        last_answer: 마지막 답변
        candidate_profile: 구직자 프로필
        job_posting: 채용 공고 정보
    
    Returns:
        생성된 질문 문자열
    """
    
    # 시스템 프롬프트
    system_prompt = """당신은 전문적이고 친근한 HR 면접관입니다.
이전 대화의 맥락을 고려하여 자연스러운 꼬리 질문을 생성해주세요.

질문 생성 원칙:
1. 이전 답변의 내용을 바탕으로 깊이 있는 후속 질문
2. STAR 기법 활용 (Situation, Task, Action, Result)
3. 구체적인 경험과 사례를 물어보기
4. 기술적 역량과 소프트 스킬 균형있게 평가
5. 한 번에 하나의 질문만 제시
6. 한국어로 응답"""

    # 대화 히스토리를 OpenAI 메시지 형식으로 변환
    messages = [{"role": "system", "content": system_prompt}]
    
    # 컨텍스트 정보 추가
    context_parts = ["이전 대화를 바탕으로 다음 질문을 생성해주세요."]
    
    if candidate_profile:
        skills = candidate_profile.get("skills", [])
        if skills:
            context_parts.append(f"\n구직자 기술 스택: {', '.join(skills)}")
    
    if job_posting:
        position = job_posting.get("position")
        if position:
            context_parts.append(f"\n지원 직무: {position}")
    
    messages.append({"role": "user", "content": "\n".join(context_parts)})
    
    # 대화 히스토리 추가 (최근 5개만)
    for msg in conversation_history[-5:]:
        role = "assistant" if msg["role"] == "AI" else "user"
        messages.append({"role": role, "content": msg["content"]})
    
    # 마지막 답변 추가 (아직 히스토리에 없는 경우)
    if conversation_history[-1]["role"] == "AI":
        messages.append({"role": "user", "content": last_answer})
    
    # 질문 생성 요청
    messages.append({
        "role": "user",
        "content": "위 답변을 바탕으로 자연스러운 꼬리 질문을 생성해주세요. 답변의 구체적인 내용이나 경험에 대해 더 깊이 파고드는 질문이 좋습니다."
    })
    
    # OpenAI API 호출
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=messages
        )
        
        question = response.choices[0].message.content.strip()
        return question
        
    except Exception as e:
        print(f"[Question Generator] OpenAI API 오류: {e}")
        # 기본 질문 반환
        return "말씀해주신 내용에 대해 더 자세히 설명해주시겠어요?"


def generate_next_question_stream(
    conversation_history: List[Dict[str, str]],
    last_answer: str,
    candidate_profile: Optional[Dict] = None,
    job_posting: Optional[Dict] = None
):
    """
    다음 인터뷰 질문 생성 (Streaming 버전)
    
    Args:
        conversation_history: 이전 대화 기록
        last_answer: 마지막 답변
        candidate_profile: 구직자 프로필
        job_posting: 채용 공고 정보
    
    Yields:
        질문 텍스트 조각 (streaming)
    """
    
    # 시스템 프롬프트
    system_prompt = """당신은 전문적이고 친근한 HR 면접관입니다.
이전 대화의 맥락을 고려하여 자연스러운 꼬리 질문을 생성해주세요.

질문 생성 원칙:
1. 이전 답변의 내용을 바탕으로 깊이 있는 후속 질문
2. STAR 기법 활용 (Situation, Task, Action, Result)
3. 구체적인 경험과 사례를 물어보기
4. 기술적 역량과 소프트 스킬 균형있게 평가
5. 한 번에 하나의 질문만 제시
6. 한국어로 응답"""

    # 대화 히스토리를 OpenAI 메시지 형식으로 변환
    messages = [{"role": "system", "content": system_prompt}]
    
    # 컨텍스트 정보 추가
    context_parts = ["이전 대화를 바탕으로 다음 질문을 생성해주세요."]
    
    if candidate_profile:
        skills = candidate_profile.get("skills", [])
        if skills:
            context_parts.append(f"\n구직자 기술 스택: {', '.join(skills)}")
    
    if job_posting:
        position = job_posting.get("position")
        if position:
            context_parts.append(f"\n지원 직무: {position}")
    
    messages.append({"role": "user", "content": "\n".join(context_parts)})
    
    # 대화 히스토리 추가 (최근 5개만)
    for msg in conversation_history[-5:]:
        role = "assistant" if msg["role"] == "AI" else "user"
        messages.append({"role": role, "content": msg["content"]})
    
    # 마지막 답변 추가
    if conversation_history and conversation_history[-1]["role"] == "AI":
        messages.append({"role": "user", "content": last_answer})
    
    # 질문 생성 요청
    messages.append({
        "role": "user",
        "content": "위 답변을 바탕으로 자연스러운 꼬리 질문을 생성해주세요. 답변의 구체적인 내용이나 경험에 대해 더 깊이 파고드는 질문이 좋습니다."
    })
    
    # OpenAI Streaming API 호출
    try:
        stream = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=messages,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        print(f"[Question Generator] OpenAI Streaming API 오류: {e}")
        # 기본 질문 반환
        yield "말씀해주신 내용에 대해 더 자세히 설명해주시겠어요?"


def analyze_interview_depth(conversation_history: List[Dict[str, str]]) -> Dict[str, any]:
    """
    인터뷰 깊이 분석 (얼마나 깊이 있게 진행되었는지)
    
    Args:
        conversation_history: 대화 기록
    
    Returns:
        분석 결과 딕셔너리 (message_count, should_continue, recommendation)
    """
    message_count = len(conversation_history)
    
    # 기본적으로 5-10개 질문이 적절
    should_continue = message_count < 20  # AI 질문 10개 + 사용자 답변 10개
    
    if message_count < 10:
        recommendation = "인터뷰를 계속 진행하세요."
    elif message_count < 20:
        recommendation = "충분한 정보를 수집했습니다. 1-2개 질문 후 종료를 고려하세요."
    else:
        recommendation = "인터뷰를 종료하고 평가를 시작하세요."
    
    return {
        "message_count": message_count,
        "should_continue": should_continue,
        "recommendation": recommendation
    }


def should_ask_follow_up(
    question_type: str,
    follow_up_count: int,
    answer_length: int = 0
) -> bool:
    """
    꼬리질문 필요 여부 판단
    
    Args:
        question_type: 질문 타입 (ice_breaking|common|competency)
        follow_up_count: 현재까지 꼬리질문 개수
        answer_length: 답변 길이 (문자 수)
    
    Returns:
        True: 꼬리질문 필요, False: 다음 메인 질문으로 이동
    
    규칙:
    - ice_breaking: 꼬리질문 없음 (자기소개는 한 번만)
    - common: 최대 1개 (답변이 짧으면 1개)
    - competency: 최대 2개 (답변이 충분하면 1개, 짧으면 2개)
    """
    # 아이스브레이킹은 꼬리질문 없음
    if question_type == "ice_breaking":
        return False
    
    # 공통 질문: 최대 1개
    if question_type == "common":
        return follow_up_count < 1 and answer_length < 100
    
    # 역량 평가 질문: 최대 2개
    if question_type == "competency":
        # 답변이 충분히 길면 (150자 이상) 1개만
        if answer_length >= 150:
            return follow_up_count < 1
        # 답변이 짧으면 최대 2개
        return follow_up_count < 2
    
    # 기본값: 꼬리질문 허용 안 함
    return False


def count_follow_ups_for_question(
    conversation_history: List[Dict[str, str]],
    main_question_index: int
) -> int:
    """
    특정 메인 질문에 대한 꼬리질문 개수 계산
    
    Args:
        conversation_history: 대화 기록
        main_question_index: 메인 질문의 인덱스
    
    Returns:
        해당 메인 질문에 대한 꼬리질문 개수
    """
    count = 0
    # 메인 질문 이후의 AI 메시지 중 답변에 대한 추가 질문 카운트
    for i in range(main_question_index + 2, len(conversation_history), 2):
        if i < len(conversation_history) and conversation_history[i].get("role") == "AI":
            count += 1
        else:
            break
    
    return count

