# Flex AI Recruiter

> AI 기반 인터뷰 및 채용 매칭 플랫폼  
> **Version**: 1.0.0 | **Last Updated**: 2025-10-30

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

[기능 소개](#주요-기능) • [시작하기](#빠른-시작) • [아키텍처](#시스템-아키텍처) • [문서](#상세-문서)

</div>

---

## 📌 프로젝트 개요

**Flex AI Recruiter**는 OpenAI GPT-4o와 Sentence-Transformers를 활용한 차세대 AI 채용 플랫폼입니다. 
전통적인 이력서 검토와 면접을 혁신하여, AI와의 자연스러운 대화를 통해 구직자의 역량을 객관적으로 평가하고 최적의 채용 공고와 매칭합니다.

### 🎯 핵심 가치

- **객관적 평가**: GPT-4o 기반 8개 항목 정량 평가 (의사소통 3개 + 직무역량 5개)
- **맞춤형 인터뷰**: RAG 기반 질문 생성 및 실시간 꼬리 질문
- **지능형 매칭**: 임베딩 기반 코사인 유사도 + 규칙 기반 매칭
- **실시간 상호작용**: Socket.IO 기반 즉각적인 피드백

---

## ✨ 주요 기능

### 1. AI 인터뷰 시스템

```mermaid
graph LR
    A[사용자] -->|연습/실전 모드 선택| B[인터뷰 설정]
    B -->|Socket.IO 연결| C[AI 인터뷰 시작]
    C -->|질문 생성| D[GPT-4o Engine]
    D -->|RAG 기반 질문| E[사용자 답변]
    E -->|답변 분석| F[평가 생성]
    F -->|8개 항목 점수| G[결과 시각화]
    
    style D fill:#4CAF50
    style F fill:#2196F3
    style G fill:#FF9800
```

**주요 특징**:
- 🎯 **연습 모드**: 무제한 연습, 결과 비공개
- 🚀 **실전 모드**: 15분 타이머, 평가 결과 공개
- 🎤 **음성/텍스트 지원**: STT/TTS 통합 (Whisper + Nova)
- 🎨 **3D 아바타**: Ready Player Me 기반 자연스러운 인터랙션
- 📊 **실시간 피드백**: Socket.IO 양방향 통신

### 2. 향상된 평가 시스템

**8가지 평가 항목** (0-100점):

| 카테고리 | 항목 | 설명 |
|---------|------|------|
| **의사소통능력** | 전달력 | 논리적 구조, 답변 길이 적절성 |
| | 어휘사용 | 전문 용어 활용, 어휘 다양성 |
| | 문제이해력 | 질문 의도 파악, 정보 정확성 |
| **직무역량** | 정보분석능력 | 데이터 해석, 인사이트 도출 |
| | 문제해결능력 | 복잡한 상황 대응, 우선순위 설정 |
| | 유연한사고능력 | 다각도 사고, 창의적 연결 |
| | 협상및설득능력 | 논리 구조, 설득력, 근거 제시 |
| | IT능력 | 기술 이해도, 시스템 설계 |

**직무별 가중치 적용** (9개 직무):
```mermaid
graph TD
    A[인터뷰 답변] --> B[GPT-4o 분석]
    B --> C[8개 항목 점수]
    C --> D{직무별 가중치 적용}
    D -->|경영관리| E1[정보분석 35% + 문제해결 30%]
    D -->|IT개발| E2[IT능력 40% + 문제해결 30%]
    D -->|영업| E3[협상설득 40% + 유연사고 25%]
    E1 --> F[TOP 3 직무 추천]
    E2 --> F
    E3 --> F
    
    style B fill:#4CAF50
    style D fill:#2196F3
    style F fill:#FF9800
```

### 3. AI 매칭 알고리즘

```mermaid
sequenceDiagram
    participant 구직자
    participant 매칭엔진
    participant 임베딩서비스
    participant GPT-4o
    participant 채용공고

    구직자->>매칭엔진: 추천 공고 요청
    매칭엔진->>임베딩서비스: 프로필 임베딩 생성
    임베딩서비스-->>매칭엔진: 768차원 벡터
    
    loop 모든 공고
        매칭엔진->>임베딩서비스: 공고 임베딩 생성
        임베딩서비스-->>매칭엔진: 768차원 벡터
        매칭엔진->>매칭엔진: 코사인 유사도 계산
        매칭엔진->>매칭엔진: 규칙 기반 보정 (+20점)
    end
    
    매칭엔진->>GPT-4o: 매칭 근거 생성 요청
    GPT-4o-->>매칭엔진: 자연어 설명
    매칭엔진-->>구직자: TOP-5 추천 공고
    
    Note over 매칭엔진: 최종 점수 = <br/>유사도(40점) + <br/>보정(40점) + <br/>기본(20점)
```

**매칭 점수 구성**:
- **벡터 유사도** (40점): Sentence-Transformers 기반 코사인 유사도
- **규칙 보정** (40점): 경력 매칭(10점) + 필수 기술(10점) + 우대 기술(10점) + 연봉 매칭(10점)
- **기본 점수** (20점): 모든 후보에게 기회 부여

---

## 🏗 시스템 아키텍처

### 전체 구조

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js 14<br/>Port 3000]
    end
    
    subgraph "Backend Services"
        B[Service Core<br/>Node.js + Express<br/>Port 8080]
        C[Service AI<br/>Python + FastAPI<br/>Port 8000]
    end
    
    subgraph "External Services"
        D[OpenAI API<br/>GPT-4o + Whisper + TTS]
        E[Sentence-Transformers<br/>ko-sbert-nli]
    end
    
    subgraph "Database"
        F[(PostgreSQL 15<br/>+ pgvector)]
    end
    
    A -->|HTTP/REST<br/>Socket.IO| B
    B -->|Internal API| C
    C -->|LLM API| D
    C -->|Embedding| E
    B <-->|Prisma ORM| F
    C -->|벡터 저장| F
    
    style A fill:#61DAFB
    style B fill:#68A063
    style C fill:#3776AB
    style D fill:#10A37F
    style E fill:#FFA500
    style F fill:#336791
```

### 서비스 역할

| 서비스 | 기술 스택 | 역할 |
|--------|----------|------|
| **app-web** | Next.js 14, React 18, Tailwind CSS | UI 렌더링, SSR/SSG, 실시간 채팅 |
| **service-core** | Node.js 20, Express, Prisma | 인증, CRUD, Socket.IO, 비즈니스 로직 |
| **service-ai** | Python 3.11+, FastAPI | AI 질문 생성, 평가, 임베딩, 매칭 |
| **PostgreSQL** | 15+ with pgvector | 관계형 데이터 저장, 벡터 검색 |

---

## 📊 데이터 스키마

```mermaid
erDiagram
    USER ||--o{ CANDIDATE_PROFILE : has
    USER ||--o{ RECRUITER_PROFILE : has
    USER ||--o{ INTERVIEW : conducts
    CANDIDATE_PROFILE ||--o{ EVALUATION : receives
    RECRUITER_PROFILE ||--o{ JOB_POSTING : creates
    INTERVIEW ||--|| EVALUATION : generates
    INTERVIEW ||--o{ INTERVIEW_MESSAGE : contains
    JOB_POSTING ||--o{ APPLICATION : receives
    CANDIDATE_PROFILE ||--o{ APPLICATION : submits
    USER ||--o{ NOTIFICATION : receives

    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role
        datetime createdAt
    }

    CANDIDATE_PROFILE {
        string id PK
        string userId FK
        string profileImageUrl
        string_array skills
        int experience
        string desiredPosition
        int desiredSalary
        json careerHistory
        json projects
        string resumeUrl
    }

    RECRUITER_PROFILE {
        string id PK
        string userId FK
        string companyName
        string companyLogo
        string position
        string companyDescription
    }

    INTERVIEW {
        string id PK
        string candidateId FK
        string jobPostingId FK
        enum mode
        enum status
        datetime startedAt
        datetime completedAt
    }

    EVALUATION {
        string id PK
        string interviewId FK
        float deliveryScore
        float vocabularyScore
        float comprehensionScore
        float informationAnalysis
        float problemSolving
        float flexibleThinking
        float negotiation
        float itSkills
        float overallScore
        json feedback
    }

    JOB_POSTING {
        string id PK
        string recruiterId FK
        string title
        string description
        string_array requirements
        string_array preferredSkills
        enum status
    }
```

---

## 🚀 빠른 시작

### 1️⃣ 사전 요구사항

- **Node.js**: 20.x LTS 이상
- **Python**: 3.11+ (3.13 권장)
- **PostgreSQL**: 15+ (pgvector 확장 포함)
- **Docker** (선택): Docker Desktop
- **API Keys**: OpenAI API Key (필수)

### 2️⃣ 환경 변수 설정

#### service-core/.env
```env
DATABASE_URL="postgresql://user:password@localhost:5432/flex_recruiter"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
PORT=8080
```

#### service-ai/.env
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
EMBEDDING_MODEL=jhgan/ko-sbert-nli
PORT=8000
```

#### app-web/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080
```

### 3️⃣ Docker Compose로 실행 (권장)

```bash
# Windows
start-all.bat

# Mac/Linux
docker-compose up -d
```

**접속**:
- 프론트엔드: http://localhost:3000
- Backend API: http://localhost:8080
- AI API 문서: http://localhost:8000/docs

### 4️⃣ 수동 실행

```bash
# 1. 데이터베이스 마이그레이션
cd service-core
npx prisma migrate dev --name init
npx prisma generate

# 2. Backend Core 실행
npm install
npm run dev

# 3. Backend AI 실행 (새 터미널)
cd service-ai
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# 4. Frontend 실행 (새 터미널)
cd app-web
npm install
npm run dev
```

---

## 📚 상세 문서

### 필수 문서

- 📖 **[docs/API.md](./docs/API.md)**: API 엔드포인트 명세서
  - 인증, 프로필, 인터뷰, 평가, 매칭, 알림 API
  - Socket.IO 이벤트 명세
  - 요청/응답 예시
  
- 📖 **[docs/PROJECT_BLUEPRINT.md](./docs/PROJECT_BLUEPRINT.md)**: 프로젝트 설계도
  - 시스템 아키텍처 상세
  - 기술 스택 및 선택 이유
  - 데이터베이스 스키마
  - 배포 전략
  
- 📖 **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**: 배포 가이드
  - GCP Cloud Run 배포
  - CI/CD 파이프라인 (GitHub Actions)
  - 환경 변수 관리 (Secret Manager)
  
- 📖 **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)**: 테스트 가이드
  - Jest, Pytest, Playwright 설정
  - 단위 테스트 작성법
  - E2E 테스트 시나리오

### 개발 가이드

**브랜치 전략 (Git-flow)**:
```
main         (프로덕션)
  ↑
develop      (개발 통합)
  ↑
feature/*    (기능 개발)
```

**커밋 컨벤션**:
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
refactor: 코드 리팩토링
test: 테스트 코드 추가
```

---

## 🎨 기술적 하이라이트

### 1. RAG 기반 질문 생성

```python
# ExampleQuestion.csv 활용 (46개 예시)
# 난이도 자동 결정 (상/중/하)
# 직무별 평가 항목 매핑
# 3단계 인터뷰 플랜 (아이스브레이킹→공통→직무특별)
```

**프로세스**:
1. 사용자 프로필 분석 (경력, 기술, 프로젝트)
2. 난이도 자동 설정
3. CSV에서 적합한 질문 후보 검색
4. GPT-4o로 맥락에 맞게 재작성

### 2. 임베딩 기반 매칭

```python
# Sentence-Transformers: jhgan/ko-sbert-nli (한국어 특화)
# 768차원 벡터 생성
# 코사인 유사도 계산

similarity = dot(candidate_emb, job_emb) / (norm(candidate_emb) * norm(job_emb))
```

**장점**:
- 키워드가 아닌 의미 기반 매칭
- 유사 표현 인식 ("Python" ≈ "파이썬")
- 문맥 이해

### 3. Socket.IO 실시간 통신

```javascript
// 클라이언트 → 서버
socket.emit('interview:start', { mode: 'PRACTICE', timeLimitSeconds: 900 });
socket.emit('interview:message', { interviewId, content: '답변...' });

// 서버 → 클라이언트
socket.on('interview:question', (data) => {
  // AI 질문 수신
});
```

**특징**:
- Room 기반 세션 관리
- 자동 재연결 지원
- 실시간 상태 동기화

---

## 🛠 문제 해결

### PostgreSQL 인증 오류

```bash
# 비밀번호에 특수문자가 있는 경우 URL 인코딩
DATABASE_URL="postgresql://postgres:password%40@localhost:5432/flex_recruiter"
```

### Sentence-Transformers 모델 다운로드 실패

```bash
# 수동 다운로드
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('jhgan/ko-sbert-nli')"
```

### Docker 메모리 부족

Docker Desktop → Settings → Resources → Memory: 4GB 이상 설정

---

## 📄 라이선스

**Proprietary** - All Rights Reserved

이 소프트웨어와 관련 문서 파일의 사용, 복사, 수정, 병합, 게시, 배포, 재라이선스 또는 판매는 명시적 서면 허가 없이 금지됩니다.

---

## 👤 제작자

**Project Owner**: 박재석

**Built with**:
- OpenAI GPT-4o
- Sentence-Transformers
- Next.js 14, Node.js 20, FastAPI
- PostgreSQL 15, Socket.IO

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ using AI and modern web technologies

</div>
