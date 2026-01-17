"""
향상된 평가 시스템
5가지 직무역량 + 의사소통능력 평가
"""

from typing import Dict, List
from openai import OpenAI
import os
import json
import numpy as np

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 직무별 평가 항목 우선순위
POSITION_PRIORITIES = {
    "경영관리": {
        "primary": ["정보분석능력", "문제해결능력", "유연한사고능력"],
        "weights": {"정보분석능력": 0.35, "문제해결능력": 0.30, "유연한사고능력": 0.20, 
                   "협상및설득능력": 0.10, "IT능력": 0.05}
    },
    "전략기획": {
        "primary": ["정보분석능력", "문제해결능력", "유연한사고능력"],
        "weights": {"정보분석능력": 0.35, "문제해결능력": 0.30, "유연한사고능력": 0.20, 
                   "협상및설득능력": 0.10, "IT능력": 0.05}
    },
    "회계/경리": {
        "primary": ["정보분석능력", "문제해결능력", "유연한사고능력"],
        "weights": {"정보분석능력": 0.40, "문제해결능력": 0.25, "유연한사고능력": 0.15, 
                   "협상및설득능력": 0.10, "IT능력": 0.10}
    },
    "인사": {
        "primary": ["협상및설득능력", "유연한사고능력", "정보분석능력"],
        "weights": {"협상및설득능력": 0.35, "유연한사고능력": 0.25, "정보분석능력": 0.20, 
                   "문제해결능력": 0.15, "IT능력": 0.05}
    },
    "총무": {
        "primary": ["문제해결능력", "협상및설득능력", "정보분석능력"],
        "weights": {"문제해결능력": 0.30, "협상및설득능력": 0.30, "정보분석능력": 0.20, 
                   "유연한사고능력": 0.15, "IT능력": 0.05}
    },
    "영업": {
        "primary": ["협상및설득능력", "유연한사고능력", "정보분석능력"],
        "weights": {"협상및설득능력": 0.40, "유연한사고능력": 0.25, "정보분석능력": 0.20, 
                   "문제해결능력": 0.10, "IT능력": 0.05}
    },
    "마케팅": {
        "primary": ["유연한사고능력", "정보분석능력", "협상및설득능력"],
        "weights": {"유연한사고능력": 0.30, "정보분석능력": 0.30, "협상및설득능력": 0.25, 
                   "문제해결능력": 0.10, "IT능력": 0.05}
    },
    "IT개발": {
        "primary": ["IT능력", "문제해결능력", "정보분석능력"],
        "weights": {"IT능력": 0.40, "문제해결능력": 0.30, "정보분석능력": 0.20, 
                   "유연한사고능력": 0.05, "협상및설득능력": 0.05}
    },
    "개발기획": {
        "primary": ["IT능력", "정보분석능력", "문제해결능력"],
        "weights": {"IT능력": 0.30, "정보분석능력": 0.30, "문제해결능력": 0.25, 
                   "유연한사고능력": 0.10, "협상및설득능력": 0.05}
    }
}


def analyze_answer_with_criteria(
    question: str,
    answer: str,
    question_criteria: str  # 질문이 평가하는 항목 (예: "정보분석능력")
) -> Dict:
    """
    답변을 평가 기준에 따라 분석
    
    Returns:
        {
            "information_analysis": 0-10,
            "problem_solving": 0-10,
            "flexible_thinking": 0-10,
            "negotiation": 0-10,
            "it_skills": 0-10,
            "delivery": 0-10,  # 전달력
            "vocabulary": 0-10,  # 어휘 사용
            "comprehension": 0-10,  # 문제 이해력
            "keywords": [...],
            "feedback": "..."
        }
    """
    
    system_prompt = """당신은 HR 평가 전문가입니다.
구직자의 답변을 다음 8가지 기준으로 평가하세요:

**직무 특별 평가 (5가지):**
1. 정보분석능력: 데이터 해석, 인사이트 도출, 분석 능력
2. 문제해결능력: 실무 상황 대처, 자원 배분, 의사결정
3. 유연한사고능력: 창의적 사고, 다양한 관점, 균형점 찾기
4. 협상및설득능력: 설득력, 논리성, 커뮤니케이션
5. IT능력: 기술 이해도, 알고리즘, 시스템 설계

**의사소통능력 (3가지):**
6. 전달력: 논리적 구조, 명확성, 설득력
7. 어휘사용: 적절한 용어, 전문성, 표현력
8. 문제이해력: 질문 의도 파악, 관련성, 핵심 이해

각 항목을 0-10점으로 평가하고, JSON 형식으로 응답하세요."""

    user_prompt = f"""
질문: {question}
답변: {answer}
주요 평가 항목: {question_criteria}

위 답변을 8가지 기준으로 평가하고, 주요 평가 항목에 가중치를 두세요.

JSON 형식:
{{
  "information_analysis": 8,
  "problem_solving": 7,
  "flexible_thinking": 6,
  "negotiation": 5,
  "it_skills": 4,
  "delivery": 8,
  "vocabulary": 7,
  "comprehension": 9,
  "keywords": ["키워드1", "키워드2"],
  "feedback": "간단한 피드백"
}}
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
        return result
        
    except Exception as e:
        print(f"[Enhanced Evaluation] 답변 분석 오류: {e}")
        # 기본값 반환
        return {
            "information_analysis": 5,
            "problem_solving": 5,
            "flexible_thinking": 5,
            "negotiation": 5,
            "it_skills": 5,
            "delivery": 5,
            "vocabulary": 5,
            "comprehension": 5,
            "keywords": [],
            "feedback": "평가 오류"
        }


def calculate_aggregate_scores(analyzed_answers: List[Dict]) -> Dict:
    """
    모든 답변의 집계 점수 계산
    
    Returns:
        {
            "information_analysis_avg": 0-10,
            "problem_solving_avg": 0-10,
            ...
            "delivery_avg": 0-10,
            "vocabulary_avg": 0-10,
            "comprehension_avg": 0-10,
            "communication_avg": 0-10,
            "overall_avg": 0-10,
            "answer_count": N
        }
    """
    
    if not analyzed_answers:
        return {
            "information_analysis_avg": 0,
            "problem_solving_avg": 0,
            "flexible_thinking_avg": 0,
            "negotiation_avg": 0,
            "it_skills_avg": 0,
            "delivery_avg": 0,
            "vocabulary_avg": 0,
            "comprehension_avg": 0,
            "communication_avg": 0,
            "overall_avg": 0,
            "answer_count": 0
        }
    
    # 각 항목별 점수 수집
    scores = {
        "information_analysis": [],
        "problem_solving": [],
        "flexible_thinking": [],
        "negotiation": [],
        "it_skills": [],
        "delivery": [],
        "vocabulary": [],
        "comprehension": []
    }
    
    for ans in analyzed_answers:
        for key in scores.keys():
            scores[key].append(ans.get(key, 5))
    
    # 평균 계산
    averages = {}
    for key, values in scores.items():
        averages[f"{key}_avg"] = round(np.mean(values), 2)
    
    # 의사소통능력 평균
    comm_avg = round(np.mean([
        averages["delivery_avg"],
        averages["vocabulary_avg"],
        averages["comprehension_avg"]
    ]), 2)
    
    # 종합 평균 (직무 특별 5가지 + 의사소통)
    overall_avg = round(np.mean([
        averages["information_analysis_avg"],
        averages["problem_solving_avg"],
        averages["flexible_thinking_avg"],
        averages["negotiation_avg"],
        averages["it_skills_avg"],
        comm_avg
    ]), 2)
    
    averages["communication_avg"] = comm_avg
    averages["overall_avg"] = overall_avg
    averages["answer_count"] = len(analyzed_answers)
    
    return averages


def recommend_positions(aggregate_scores: Dict) -> List[Dict]:
    """
    직무 추천 랭킹 생성
    
    Returns:
        [
            {"position": "IT개발", "score": 85, "reason": "..."},
            {"position": "영업", "score": 72, "reason": "..."},
            ...
        ]
    """
    
    position_scores = []
    
    for position, config in POSITION_PRIORITIES.items():
        weights = config["weights"]
        
        # 가중 평균 계산
        weighted_score = 0
        for skill, weight in weights.items():
            # 스킬명을 매핑
            skill_key_map = {
                "정보분석능력": "information_analysis_avg",
                "문제해결능력": "problem_solving_avg",
                "유연한사고능력": "flexible_thinking_avg",
                "협상및설득능력": "negotiation_avg",
                "IT능력": "it_skills_avg"
            }
            
            skill_key = skill_key_map.get(skill, "information_analysis_avg")
            skill_score = aggregate_scores.get(skill_key, 5)
            weighted_score += skill_score * weight
        
        # 0-100 스케일로 변환
        final_score = round(weighted_score * 10, 2)
        
        position_scores.append({
            "position": position,
            "score": final_score,
            "primary_skills": config["primary"]
        })
    
    # 점수순 정렬
    position_scores.sort(key=lambda x: x["score"], reverse=True)
    
    # 상위 3개에 이유 추가
    for i, pos in enumerate(position_scores[:3]):
        pos["reason"] = f"{pos['position']}에 필요한 {', '.join(pos['primary_skills'][:2])} 역량이 우수합니다."
    
    return position_scores


def generate_comprehensive_feedback_enhanced(
    analyzed_answers: List[Dict],
    aggregate_scores: Dict,
    recommended_positions: List[Dict],
    candidate_profile: Dict = None
) -> Dict:
    """
    향상된 종합 피드백 생성
    """
    
    system_prompt = """당신은 HR 평가 전문가이자 커리어 코치입니다.
인터뷰 분석 결과를 바탕으로 종합적이고 건설적인 피드백을 제공하세요.

JSON 형식으로 응답:
{
  "strengths": ["강점 1", "강점 2", "강점 3"],
  "weaknesses": ["약점 1", "약점 2"],
  "recommendations": ["개선 방안 1", "개선 방안 2"],
  "summary": "전체 평가 요약",
  "communication_feedback": "의사소통능력 상세 피드백",
  "position_advice": "추천 직무에 대한 조언"
}"""

    context = f"""
## 평가 결과 요약
- 정보분석능력: {aggregate_scores['information_analysis_avg']}/10
- 문제해결능력: {aggregate_scores['problem_solving_avg']}/10
- 유연한사고능력: {aggregate_scores['flexible_thinking_avg']}/10
- 협상및설득능력: {aggregate_scores['negotiation_avg']}/10
- IT능력: {aggregate_scores['it_skills_avg']}/10

## 의사소통능력
- 전달력: {aggregate_scores['delivery_avg']}/10
- 어휘사용: {aggregate_scores['vocabulary_avg']}/10
- 문제이해력: {aggregate_scores['comprehension_avg']}/10
- 평균: {aggregate_scores['communication_avg']}/10

## 추천 직무 (상위 3개)
1. {recommended_positions[0]['position']} ({recommended_positions[0]['score']}점)
2. {recommended_positions[1]['position']} ({recommended_positions[1]['score']}점)
3. {recommended_positions[2]['position']} ({recommended_positions[2]['score']}점)

위 정보를 바탕으로 종합 피드백을 작성해주세요.
"""

    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        print(f"[Enhanced Evaluation] 피드백 생성 오류: {e}")
        return {
            "strengths": ["성실하게 인터뷰에 참여하셨습니다."],
            "weaknesses": ["평가 중 오류가 발생했습니다."],
            "recommendations": ["다시 시도해주세요."],
            "summary": "평가 생성 중 오류가 발생했습니다.",
            "communication_feedback": "분석 오류",
            "position_advice": "분석 오류"
        }


def generate_complete_evaluation_enhanced(
    conversation_history: List[Dict],
    candidate_profile: Dict = None
) -> Dict:
    """
    완전한 평가 생성 (향상된 버전)
    
    Returns:
        {
            "scores": {
                "informationAnalysis": 75,
                "problemSolving": 80,
                ...
                "deliveryScore": 82,
                "vocabularyScore": 78,
                "comprehensionScore": 85,
                "communicationAvg": 81.67,
                "overallScore": 78.5
            },
            "recommendedPositions": [...],
            "feedback": {...}
        }
    """
    
    # TODO: 실제로는 conversation_history에서 질문의 평가 항목을 추출해야 함
    # 현재는 간단히 모든 답변을 분석
    analyzed_answers = []
    
    for i, msg in enumerate(conversation_history):
        if msg["role"] == "CANDIDATE":
            # 이전 메시지에서 질문 찾기
            question = ""
            if i > 0 and conversation_history[i-1]["role"] == "AI":
                question = conversation_history[i-1]["content"]
            
            # 답변 분석
            analysis = analyze_answer_with_criteria(
                question=question,
                answer=msg["content"],
                question_criteria="정보분석능력"  # TODO: 실제 질문의 항목 사용
            )
            analyzed_answers.append(analysis)
    
    # 집계 점수 계산
    aggregate_scores = calculate_aggregate_scores(analyzed_answers)
    
    # 직무 추천
    recommended_positions = recommend_positions(aggregate_scores)
    
    # 종합 피드백
    feedback = generate_comprehensive_feedback_enhanced(
        analyzed_answers,
        aggregate_scores,
        recommended_positions,
        candidate_profile
    )
    
    # 최종 결과 (0-100 스케일)
    return {
        "scores": {
            "informationAnalysis": round(aggregate_scores["information_analysis_avg"] * 10, 2),
            "problemSolving": round(aggregate_scores["problem_solving_avg"] * 10, 2),
            "flexibleThinking": round(aggregate_scores["flexible_thinking_avg"] * 10, 2),
            "negotiation": round(aggregate_scores["negotiation_avg"] * 10, 2),
            "itSkills": round(aggregate_scores["it_skills_avg"] * 10, 2),
            "deliveryScore": round(aggregate_scores["delivery_avg"] * 10, 2),
            "vocabularyScore": round(aggregate_scores["vocabulary_avg"] * 10, 2),
            "comprehensionScore": round(aggregate_scores["comprehension_avg"] * 10, 2),
            "communicationAvg": round(aggregate_scores["communication_avg"] * 10, 2),
            "overallScore": round(aggregate_scores["overall_avg"] * 10, 2)
        },
        "recommendedPositions": recommended_positions,
        "feedback": feedback,
        "statistics": aggregate_scores
    }

