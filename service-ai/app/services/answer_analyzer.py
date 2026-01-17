"""
답변 분석 서비스
각 답변의 품질을 분석하고 점수를 매김
"""

from typing import Dict, List
from openai import OpenAI
import os
import json

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_single_answer(
    question: str,
    answer: str,
    candidate_profile: Dict = None
) -> Dict:
    """
    단일 답변 분석
    
    Args:
        question: 질문
        answer: 답변
        candidate_profile: 구직자 프로필
    
    Returns:
        분석 결과 딕셔너리 (scores, keywords, depth_level)
    """
    
    system_prompt = """당신은 HR 면접 평가 전문가입니다.
주어진 질문과 답변을 분석하여 다음 기준으로 평가하세요:

1. 기술 역량 (Technical): 기술적 지식의 정확성과 깊이
2. 커뮤니케이션 (Communication): 명확성, 논리성, 표현력
3. 문제 해결 능력 (Problem Solving): 사고의 체계성, 해결 접근법

각 항목을 0-10점으로 평가하고, JSON 형식으로 응답하세요.

응답 형식:
{
  "technical_score": 8.5,
  "communication_score": 7.0,
  "problem_solving_score": 9.0,
  "keywords": ["Python", "Django", "문제 해결"],
  "depth_level": "상세",
  "reasoning": "답변의 평가 근거"
}"""

    user_prompt = f"""질문: {question}

답변: {answer}

위 답변을 분석하고 평가해주세요."""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}  # JSON 응답 강제
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # 점수 검증 (0-10 범위)
        result["technical_score"] = max(0, min(10, result.get("technical_score", 5)))
        result["communication_score"] = max(0, min(10, result.get("communication_score", 5)))
        result["problem_solving_score"] = max(0, min(10, result.get("problem_solving_score", 5)))
        
        return result
        
    except Exception as e:
        print(f"[Answer Analyzer] 답변 분석 오류: {e}")
        # 기본 점수 반환
        return {
            "technical_score": 5.0,
            "communication_score": 5.0,
            "problem_solving_score": 5.0,
            "keywords": [],
            "depth_level": "보통",
            "reasoning": "분석 중 오류가 발생했습니다."
        }


def analyze_all_answers(conversation_history: List[Dict]) -> List[Dict]:
    """
    모든 답변 분석
    
    Args:
        conversation_history: 전체 대화 기록
    
    Returns:
        각 답변의 분석 결과 리스트
    """
    
    analyzed_answers = []
    
    # ✅ 디버깅: 대화 기록 출력
    print(f"[Answer Analyzer] 전체 대화 기록 개수: {len(conversation_history)}")
    for i, msg in enumerate(conversation_history):
        print(f"  [{i}] role={msg.get('role', 'UNKNOWN')}, content={msg.get('content', '')[:50]}...")
    
    # ✅ 대소문자 무관 매칭 + 순차 검색 (2씩 건너뛰지 않음)
    for i in range(0, len(conversation_history) - 1):
        current_role = conversation_history[i].get("role", "").upper()
        next_role = conversation_history[i + 1].get("role", "").upper()
        
        # AI 질문 다음에 CANDIDATE 답변이 오는 경우
        if current_role in ["AI", "ASSISTANT"] and next_role in ["CANDIDATE", "USER"]:
            question = conversation_history[i]["content"]
            answer = conversation_history[i + 1]["content"]
            
            print(f"[Answer Analyzer] Q&A 쌍 발견: Q={question[:30]}... A={answer[:30]}...")
            
            analysis = analyze_single_answer(question, answer)
            analysis["question"] = question
            analysis["answer"] = answer
            
            analyzed_answers.append(analysis)
    
    print(f"[Answer Analyzer] 분석된 답변 개수: {len(analyzed_answers)}")
    return analyzed_answers


def calculate_aggregate_scores(analyzed_answers: List[Dict]) -> Dict:
    """
    집계 점수 계산 (평균, 표준편차 등)
    
    Args:
        analyzed_answers: 분석된 답변 리스트
    
    Returns:
        집계 점수 딕셔너리
    """
    
    if not analyzed_answers:
        return {
            "technical_avg": 0,
            "communication_avg": 0,
            "problem_solving_avg": 0,
            "overall_avg": 0,
            "consistency": 0,
            "answer_count": 0
        }
    
    import numpy as np
    
    technical_scores = [a["technical_score"] for a in analyzed_answers]
    communication_scores = [a["communication_score"] for a in analyzed_answers]
    problem_solving_scores = [a["problem_solving_score"] for a in analyzed_answers]
    
    # 평균 계산
    technical_avg = np.mean(technical_scores)
    communication_avg = np.mean(communication_scores)
    problem_solving_avg = np.mean(problem_solving_scores)
    overall_avg = (technical_avg + communication_avg + problem_solving_avg) / 3
    
    # 일관성 계산 (표준편차의 역수 개념)
    # 표준편차가 낮을수록 일관성이 높음
    all_scores = technical_scores + communication_scores + problem_solving_scores
    std_dev = np.std(all_scores)
    consistency = max(0, 10 - std_dev)  # 0-10 스케일
    
    return {
        "technical_avg": round(float(technical_avg), 2),
        "communication_avg": round(float(communication_avg), 2),
        "problem_solving_avg": round(float(problem_solving_avg), 2),
        "overall_avg": round(float(overall_avg), 2),
        "consistency": round(float(consistency), 2),
        "answer_count": len(analyzed_answers),
        "technical_std": round(float(np.std(technical_scores)), 2),
        "communication_std": round(float(np.std(communication_scores)), 2),
        "problem_solving_std": round(float(np.std(problem_solving_scores)), 2)
    }


def generate_instant_feedback(
    question: str,
    answer: str,
    question_type: str = "competency"
) -> Dict:
    """
    답변에 대한 즉시 피드백 생성 (채팅 모드용)
    
    Args:
        question: 질문
        answer: 답변
        question_type: 질문 타입 (ice_breaking|common|competency)
    
    Returns:
        피드백 딕셔너리 (feedback, strengths, improvements, score)
    """
    
    system_prompt = """당신은 친절하고 전문적인 HR 면접 코치입니다.
구직자의 답변에 대해 즉시 피드백을 제공합니다.

피드백 작성 원칙:
1. 긍정적이고 건설적인 톤
2. 구체적인 예시와 함께 설명
3. 간결하고 실행 가능한 조언
4. 3-4문장 내외로 간략하게

JSON 형식으로 응답하세요:
{
  "feedback": "전체 피드백 (3-4문장)",
  "strengths": ["강점 1", "강점 2"],
  "improvements": ["개선점 1", "개선점 2"],
  "score": 85
}"""
    
    user_prompt = f"""질문: {question}

답변: {answer}

질문 유형: {question_type}

위 답변에 대한 즉시 피드백을 제공해주세요."""
    
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # 점수 검증 (0-100 범위)
        result["score"] = max(0, min(100, result.get("score", 70)))
        
        # 강점/개선점 개수 제한 (각 최대 3개)
        result["strengths"] = result.get("strengths", [])[:3]
        result["improvements"] = result.get("improvements", [])[:3]
        
        return result
        
    except Exception as e:
        print(f"[Answer Analyzer] 즉시 피드백 생성 오류: {e}")
        # 기본 피드백 반환
        return {
            "feedback": "답변해주셔서 감사합니다. 더 구체적인 예시를 포함하면 더 좋은 답변이 될 수 있습니다.",
            "strengths": ["성실하게 답변해주셨습니다."],
            "improvements": ["구체적인 경험이나 예시를 추가해보세요.", "STAR 기법을 활용해보세요."],
            "score": 70
        }

