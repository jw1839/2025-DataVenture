"""
향상된 질문 생성 시스템
직무별, 난이도별, RAG 기반 질문 생성
"""

from typing import Dict, List, Optional
from openai import OpenAI
import os
import json
import csv
import random

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 질문 예시 데이터 로드 (메모리에 캐싱)
QUESTION_EXAMPLES = []

def load_question_examples():
    """ExampleQuestion.csv 로드"""
    global QUESTION_EXAMPLES
    
    if QUESTION_EXAMPLES:
        return QUESTION_EXAMPLES
    
    csv_path = "/workspace/ExampleQuestion.csv"
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                QUESTION_EXAMPLES.append({
                    "criteria": row["평가요소"],
                    "difficulty": row["난이도"],
                    "type": row["질문 유형 (핵심 평가)"],
                    "question": row["예시 질문"]
                })
        
        print(f"[Question Generator] {len(QUESTION_EXAMPLES)}개 질문 예시 로드 완료")
    except Exception as e:
        print(f"[Question Generator] CSV 로드 오류: {e}")
    
    return QUESTION_EXAMPLES


def determine_difficulty(candidate_profile: Dict, criteria: str) -> str:
    """
    구직자 프로필을 기반으로 난이도 결정
    
    기준:
    - 경력, 학력, 기술 스택 등을 종합적으로 고려
    - 상/중/하 난이도 결정
    """
    
    experience = candidate_profile.get("experience", 0)
    skills = candidate_profile.get("skills", [])
    education = candidate_profile.get("education", "")
    
    # 기본 점수
    score = 0
    
    # 경력 (0-40점)
    if experience >= 5:
        score += 40
    elif experience >= 3:
        score += 30
    elif experience >= 1:
        score += 20
    else:
        score += 10
    
    # 기술 스택 (0-30점)
    skill_count = len(skills)
    if skill_count >= 10:
        score += 30
    elif skill_count >= 5:
        score += 20
    else:
        score += 10
    
    # 학력 (0-30점)
    if "박사" in education or "Ph.D" in education:
        score += 30
    elif "석사" in education or "Master" in education:
        score += 25
    elif "학사" in education or "Bachelor" in education:
        score += 20
    else:
        score += 10
    
    # IT능력은 기술 스택에 가중치
    if criteria == "IT능력":
        if any(tech in str(skills) for tech in ["Python", "Java", "C++", "JavaScript", "React", "Django"]):
            score += 20
    
    # 점수에 따른 난이도 결정
    if score >= 70:
        return "상"
    elif score >= 40:
        return "중"
    else:
        return "하"


def get_example_questions(
    criteria: str,
    difficulty: str,
    count: int = 3
) -> List[Dict]:
    """
    평가 요소와 난이도에 맞는 예시 질문 가져오기
    """
    
    examples = load_question_examples()
    
    # 필터링
    filtered = [q for q in examples if q["criteria"] == criteria and q["difficulty"] == difficulty]
    
    # 랜덤 선택
    if len(filtered) >= count:
        return random.sample(filtered, count)
    else:
        return filtered


def generate_interview_plan(
    candidate_profile: Dict,
    position: str,
    mode: str = "ACTUAL"  # "PRACTICE" or "ACTUAL"
) -> Dict:
    """
    인터뷰 계획 생성
    
    Returns:
        {
            "phases": [
                {
                    "phase": "아이스브레이킹",
                    "questions": [...]
                },
                {
                    "phase": "공통 평가",
                    "questions": [...]
                },
                {
                    "phase": "직무 특별 평가",
                    "questions": [...]
                }
            ],
            "total_questions": 10,
            "time_limit": 900
        }
    """
    
    plan = {
        "phases": [],
        "total_questions": 0,
        "time_limit": 900 if mode == "ACTUAL" else 600
    }
    
    # Phase 1: 아이스브레이킹 (1-2개)
    plan["phases"].append({
        "phase": "아이스브레이킹",
        "questions": [
            {
                "type": "greeting",
                "criteria": "의사소통",
                "question_template": "간단한 인사 및 자기소개 요청"
            }
        ]
    })
    
    # Phase 2: 공통 평가 (2-3개)
    plan["phases"].append({
        "phase": "공통 평가",
        "questions": [
            {
                "type": "self_introduction",
                "criteria": "의사소통",
                "question_template": "자기소개 및 지원 동기"
            },
            {
                "type": "profile_based",
                "criteria": "의사소통",
                "question_template": "프로필 내용 기반 질문"
            }
        ]
    })
    
    # Phase 3: 직무 특별 평가 (5-7개)
    # 직무에 따른 평가 항목 결정
    position_criteria_map = {
        "경영관리": ["정보분석능력", "문제해결능력", "유연한사고능력"],
        "전략기획": ["정보분석능력", "문제해결능력", "유연한사고능력"],
        "회계/경리": ["정보분석능력", "문제해결능력", "유연한사고능력"],
        "인사": ["협상및설득능력", "유연한사고능력", "정보분석능력"],
        "총무": ["문제해결능력", "협상및설득능력", "정보분석능력"],
        "영업": ["협상및설득능력", "유연한사고능력", "정보분석능력"],
        "마케팅": ["유연한사고능력", "정보분석능력", "협상및설득능력"],
        "IT개발": ["IT능력", "문제해결능력", "정보분석능력"],
        "개발기획": ["IT능력", "정보분석능력", "문제해결능력"]
    }
    
    criteria_list = position_criteria_map.get(position, ["정보분석능력", "문제해결능력", "유연한사고능력"])
    
    # 각 평가 항목별로 난이도 결정하고 질문 생성
    job_questions = []
    for criteria in criteria_list:
        difficulty = determine_difficulty(candidate_profile, criteria)
        example_questions = get_example_questions(criteria, difficulty, 2)
        
        for example in example_questions:
            job_questions.append({
                "type": "job_specific",
                "criteria": criteria,
                "difficulty": difficulty,
                "example_type": example["type"],
                "example_question": example["question"]
            })
    
    plan["phases"].append({
        "phase": "직무 특별 평가",
        "questions": job_questions[:7]  # 최대 7개
    })
    
    plan["total_questions"] = sum(len(phase["questions"]) for phase in plan["phases"])
    
    return plan


def generate_question_from_plan(
    plan_item: Dict,
    candidate_profile: Dict,
    conversation_history: List[Dict]
) -> str:
    """
    인터뷰 계획의 항목에서 실제 질문 생성
    """
    
    question_type = plan_item.get("type")
    
    # 아이스브레이킹
    if question_type == "greeting":
        return "안녕하세요! 오늘 인터뷰에 참여해주셔서 감사합니다. 편안하게 시작하기 위해 간단히 자신을 소개해주시겠어요?"
    
    # 자기소개
    if question_type == "self_introduction":
        return "먼저 자기소개와 함께, 이 직무에 지원하게 된 동기를 말씀해주시겠습니까?"
    
    # 프로필 기반 질문
    if question_type == "profile_based":
        skills = candidate_profile.get("skills", [])
        if skills:
            skill = random.choice(skills)
            return f"프로필에 {skill} 기술을 보유하고 계시다고 하셨는데, 이 기술을 활용한 프로젝트 경험이나 구체적인 사례를 말씀해주시겠어요?"
        else:
            return "지금까지의 경력이나 학습 경험 중 가장 기억에 남는 것을 하나 공유해주시겠어요?"
    
    # 직무 특별 질문 (RAG 기반)
    if question_type == "job_specific":
        system_prompt = f"""당신은 전문 HR 면접관입니다.
다음 예시 질문을 참고하여, 유사하지만 새로운 질문을 생성하세요.

평가 항목: {plan_item['criteria']}
난이도: {plan_item['difficulty']}
질문 유형: {plan_item['example_type']}

예시 질문:
{plan_item['example_question']}

위 예시와 유사한 스타일과 난이도로, 구직자의 {plan_item['criteria']} 능력을 평가할 수 있는 새로운 질문을 생성하세요.
질문만 출력하고, 다른 설명은 필요 없습니다."""

        try:
            response = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-5"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "새로운 질문을 생성해주세요."}
                ]
            )
            
            return response.choices[0].message.content.strip()
        
        except Exception as e:
            print(f"[Question Generator] 질문 생성 오류: {e}")
            # 예시 질문 그대로 반환
            return plan_item["example_question"]
    
    # 기본 질문
    return "이전 답변에 대해 조금 더 자세히 설명해주시겠어요?"


def generate_follow_up_question(
    last_question: str,
    last_answer: str,
    criteria: str,
    conversation_history: List[Dict]
) -> Optional[str]:
    """
    꼬리 질문 생성 (필요한 경우)
    
    Returns:
        질문 문자열 또는 None (꼬리 질문 불필요)
    """
    
    system_prompt = f"""당신은 전문 HR 면접관입니다.
구직자의 답변을 듣고, 추가로 {criteria} 역량을 더 깊이 평가할 수 있는 꼬리 질문이 필요한지 판단하세요.

다음 경우에만 꼬리 질문을 생성하세요:
1. 답변이 모호하거나 구체성이 부족한 경우
2. STAR 기법(상황, 과제, 행동, 결과)에서 누락된 부분이 있는 경우
3. 답변에서 흥미로운 포인트가 있어 더 깊이 탐구할 가치가 있는 경우

JSON 형식으로 응답:
{{
  "need_follow_up": true/false,
  "question": "꼬리 질문" (need_follow_up이 true인 경우만)
}}"""

    user_prompt = f"""
이전 질문: {last_question}
구직자 답변: {last_answer}

꼬리 질문이 필요한지 판단하고, 필요하면 생성해주세요.
"""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        if result.get("need_follow_up"):
            return result.get("question")
        else:
            return None
    
    except Exception as e:
        print(f"[Question Generator] 꼬리 질문 생성 오류: {e}")
        return None

