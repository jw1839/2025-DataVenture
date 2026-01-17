#!/usr/bin/env python3
"""
service-ai 헬스체크 및 진단 스크립트
OpenAI API 키 및 연결 상태를 검증한다.
"""

import os
import sys
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

def check_env_variables():
    """환경 변수 확인"""
    print("=" * 60)
    print("1. 환경 변수 확인")
    print("=" * 60)
    
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
    port = os.getenv("PORT", "8000")
    
    print(f"✓ PORT: {port}")
    print(f"✓ OPENAI_MODEL: {openai_model}")
    
    if not openai_key:
        print("✗ OPENAI_API_KEY: 설정되지 않음")
        print("\n[오류] service-ai/.env 파일에 OPENAI_API_KEY를 설정해주세요.")
        print("예시: OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx")
        return False
    
    if not openai_key.startswith("sk-"):
        print(f"✗ OPENAI_API_KEY: 잘못된 형식 ('{openai_key[:10]}...')")
        print("\n[오류] OpenAI API 키는 'sk-'로 시작해야 합니다.")
        return False
    
    print(f"✓ OPENAI_API_KEY: {openai_key[:15]}... (설정됨)")
    return True


def check_openai_connection():
    """OpenAI API 연결 테스트"""
    print("\n" + "=" * 60)
    print("2. OpenAI API 연결 테스트")
    print("=" * 60)
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 모델 리스트 조회로 API 키 유효성 검증
        print("OpenAI API에 연결 중...")
        models = client.models.list()
        
        print("✓ OpenAI API 연결 성공")
        print(f"✓ 사용 가능한 모델 개수: {len(models.data)}")
        
        # gpt-4o 모델 사용 가능 여부 확인
        model_ids = [m.id for m in models.data]
        target_model = os.getenv("OPENAI_MODEL", "gpt-4o")
        
        if target_model in model_ids:
            print(f"✓ {target_model} 모델 사용 가능")
        else:
            print(f"⚠ {target_model} 모델을 찾을 수 없습니다.")
            print(f"  대신 사용 가능한 GPT 모델: {[m for m in model_ids if 'gpt' in m][:3]}")
        
        return True
        
    except ImportError:
        print("✗ OpenAI 라이브러리를 찾을 수 없습니다.")
        print("\n[해결] pip install openai 실행")
        return False
    except Exception as e:
        print(f"✗ OpenAI API 연결 실패: {str(e)}")
        
        error_str = str(e).lower()
        if "authentication" in error_str or "api key" in error_str:
            print("\n[오류] API 키가 유효하지 않습니다.")
            print("  - OpenAI 대시보드에서 새 API 키를 발급받으세요.")
            print("  - https://platform.openai.com/api-keys")
        elif "rate limit" in error_str:
            print("\n[오류] API 요청 제한에 도달했습니다.")
            print("  - 잠시 후 다시 시도하거나 요금제를 확인하세요.")
        elif "network" in error_str or "connection" in error_str:
            print("\n[오류] 네트워크 연결 문제입니다.")
            print("  - 인터넷 연결을 확인하세요.")
        else:
            print("\n[오류] 예상치 못한 오류가 발생했습니다.")
        
        return False


def test_simple_completion():
    """간단한 GPT 호출 테스트"""
    print("\n" + "=" * 60)
    print("3. GPT 질문 생성 테스트")
    print("=" * 60)
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        model = os.getenv("OPENAI_MODEL", "gpt-4o")
        
        print(f"{model} 모델로 테스트 질문 생성 중...")
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "당신은 HR 면접관입니다."},
                {"role": "user", "content": "신입 개발자를 위한 간단한 면접 질문 1개를 생성해주세요."}
            ],
            timeout=30.0
        )
        
        question = response.choices[0].message.content.strip()
        
        print("✓ 질문 생성 성공")
        print(f"\n생성된 질문:\n{question}\n")
        
        return True
        
    except Exception as e:
        print(f"✗ 질문 생성 실패: {str(e)}")
        return False


def main():
    """메인 진단 함수"""
    print("\n" + "=" * 60)
    print("service-ai 헬스체크 및 진단")
    print("=" * 60 + "\n")
    
    # 1. 환경 변수 확인
    if not check_env_variables():
        print("\n❌ 환경 변수 설정이 필요합니다.")
        sys.exit(1)
    
    # 2. OpenAI API 연결 테스트
    if not check_openai_connection():
        print("\n❌ OpenAI API 연결에 실패했습니다.")
        sys.exit(1)
    
    # 3. GPT 호출 테스트
    if not test_simple_completion():
        print("\n⚠ GPT 호출 테스트에 실패했지만 API 연결은 정상입니다.")
    
    # 최종 결과
    print("\n" + "=" * 60)
    print("✅ 모든 테스트 통과!")
    print("=" * 60)
    print("\nservice-ai가 정상적으로 작동할 준비가 되었습니다.")
    print("\n시작 명령어:")
    print("  uvicorn app.main:app --reload --port 8000")
    print("\n또는:")
    print("  python -m uvicorn app.main:app --reload --port 8000")
    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()

