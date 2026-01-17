# API 상세 문서

> **업데이트**: 2025-10-28 (Sprint 8-9)  
> 본 문서는 핵심 엔드포인트, 권한 정책, 요청/응답 예시를 제공합니다.

## 📋 목차
- [권한 정책](#권한-정책)
- [인증 API](#인증-api)
- [사용자/프로필 API](#사용자프로필-api)
- [채용 공고 API](#채용-공고-api)
- [인터뷰 API](#인터뷰-api)
- [평가 API](#평가-api)
- [알림 API](#알림-api)
- [검색 API](#검색-api)
- [추천/매칭 API](#추천매칭-api)
- [파일 업로드 API](#파일-업로드-api)
- [Socket.IO 이벤트](#socketio-이벤트)

---

## 권한 정책
- RECRUITER 전용: `POST/PUT/DELETE /api/v1/jobs/*`, `GET /api/v1/recommendations/candidates/:jobId`
- CANDIDATE 전용: `GET /api/v1/recommendations/jobs`
- 공용 읽기: `GET /api/v1/jobs`, `GET /api/v1/jobs/:id`

## 인증
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/me` (JWT)

## 사용자/프로필 API

### 구직자 프로필 조회
```
GET /api/v1/candidates/:candidateId/profile
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "profileImageUrl": "https://storage.googleapis.com/...",
  "skills": ["Python", "React"],
  "experience": 5,
  "education": "서울대학교 컴퓨터공학과 (학사)",
  "desiredPosition": "IT개발",
  "desiredSalary": 6000,
  "bio": "5년간 풀스택 개발...",
  "careerHistory": "[{company: '...', position: '...', ...}]",
  "projects": "[{title: '...', description: '...', ...}]",
  "githubUrl": "https://github.com/...",
  "blogUrl": "https://blog.example.com",
  "linkedinUrl": "https://linkedin.com/in/...",
  "portfolioWebUrl": "https://portfolio.example.com",
  "portfolioUrl": "https://storage.googleapis.com/...",
  "resumeUrl": "https://storage.googleapis.com/...",
  "uniqueUrl": "profile/abc123",
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}
```

### 구직자 프로필 수정
```
PUT /api/v1/candidates/:candidateId/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "skills": ["Python", "React", "Node.js"],
  "experience": 5,
  "education": "서울대학교 컴퓨터공학과 (학사)",
  "desiredPosition": "IT개발",
  "desiredSalary": 6000,
  "bio": "자기소개...",
  "careerHistory": "[...]",
  "projects": "[...]",
  "githubUrl": "https://github.com/username",
  "blogUrl": "https://blog.example.com"
}
```

### 채용담당자 프로필 조회
```
GET /api/v1/recruiters/:recruiterId/profile
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "companyName": "플렉스 AI",
  "companyUrl": "https://flexai.com",
  "companyLogo": "https://storage.googleapis.com/...",
  "position": "인사팀 팀장",
  "companyDescription": "AI 기반 채용 솔루션...",
  "companyVision": "우리는 혁신적인 인재를...",
  "uniqueUrl": "company/xyz789",
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}
```

### 채용담당자 프로필 수정
```
PUT /api/v1/recruiters/:recruiterId/profile
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "companyName": "플렉스 AI",
  "companyUrl": "https://flexai.com",
  "position": "인사팀 팀장",
  "companyDescription": "회사 소개...",
  "companyVision": "인재상 및 비전..."
}
```

## 채용 공고
- POST `/api/v1/jobs` (RECRUITER)
- GET `/api/v1/jobs`
- GET `/api/v1/jobs/:id`
- PUT `/api/v1/jobs/:id` (RECRUITER - 본인)
- DELETE `/api/v1/jobs/:id` (RECRUITER - 본인)

## 인터뷰(실시간)
- Socket.IO 이벤트
  - client→server: `interview:start`, `interview:message`, `interview:end`
  - server→client: `interview:started`, `interview:processing`, `interview:question`, `interview:ended`, `interview:error`
- REST 조회
  - GET `/api/v1/interviews` (JWT)
  - GET `/api/v1/interviews/:interviewId` (JWT)

## 평가 API

### 평가 결과 조회 (향상된 버전)
```
GET /api/v1/evaluations/:interviewId
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "id": "uuid",
  "interviewId": "uuid",
  
  "의사소통능력": {
    "deliveryScore": 80,
    "vocabularyScore": 76,
    "comprehensionScore": 84,
    "communicationAvg": 80
  },
  
  "직무역량": {
    "informationAnalysis": 78,
    "problemSolving": 82,
    "flexibleThinking": 75,
    "negotiation": 68,
    "itSkills": 85
  },
  
  "overallScore": 78.5,
  
  "recommendedPositions": [
    {
      "position": "IT개발",
      "score": 85,
      "reason": "IT능력과 문제해결능력이 뛰어납니다",
      "primarySkills": ["IT능력", "문제해결능력", "정보분석능력"]
    },
    {
      "position": "개발기획",
      "score": 81,
      "reason": "IT능력과 정보분석능력이 우수합니다"
    }
  ],
  
  "feedback": {
    "strengths": [
      "IT 기술에 대한 깊은 이해도를 보여주셨습니다",
      "문제를 체계적으로 분석하고 해결하는 능력이 뛰어납니다"
    ],
    "weaknesses": [
      "협상 및 설득 과정에서 좀 더 구체적인 사례가 필요합니다"
    ],
    "recommendations": [
      "다양한 이해관계자와의 커뮤니케이션 경험을 쌓으시길 권장합니다"
    ],
    "summary": "전반적으로 우수한 역량을 보여주셨습니다...",
    "communication_feedback": "의사소통 상세 피드백...",
    "position_advice": "추천 직무에 대한 조언..."
  },
  
  "createdAt": "2025-10-28T...",
  "updatedAt": "2025-10-28T..."
}
```

## 알림 API

### 알림 목록 조회
```
GET /api/v1/notifications
Authorization: Bearer {token}
Query: ?limit=20&offset=0&unreadOnly=false
```

**Response (200)**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "EVALUATION_COMPLETED",
      "title": "AI 인터뷰 평가 완료",
      "message": "10월 28일에 진행한 인터뷰의 평가가 완료되었습니다...",
      "link": "/evaluation/123",
      "isRead": false,
      "createdAt": "2025-10-28T..."
    }
  ],
  "total": 10,
  "unreadCount": 3
}
```

### 알림 읽음 처리
```
PATCH /api/v1/notifications/:notificationId/read
Authorization: Bearer {token}
```

### 알림 모두 읽음 처리
```
PATCH /api/v1/notifications/mark-all-read
Authorization: Bearer {token}
```

### 알림 삭제
```
DELETE /api/v1/notifications/:notificationId
Authorization: Bearer {token}
```

---

## 검색 API

### 통합 검색
```
GET /api/v1/search
Authorization: Bearer {token}
Query: ?q=검색어&type=all&limit=20&offset=0
```

**Query Parameters**:
- `q`: 검색어 (required)
- `type`: all | candidate | job | company (default: all)
- `limit`: 결과 개수 (default: 20)
- `offset`: 시작 위치 (default: 0)

**Response (200)**:
```json
{
  "results": [
    {
      "type": "candidate",
      "id": "uuid",
      "title": "김철수",
      "subtitle": "IT개발 · 5년 경력",
      "description": "풀스택 개발자로 React, Node.js, Python 전문",
      "tags": ["React", "Node.js", "Python", "AWS"],
      "score": 85
    },
    {
      "type": "job",
      "id": "uuid",
      "title": "시니어 백엔드 개발자",
      "subtitle": "플렉스 AI",
      "description": "빠르게 성장하는 AI 스타트업...",
      "tags": ["Python", "FastAPI", "PostgreSQL"]
    }
  ],
  "total": 48,
  "counts": {
    "candidate": 15,
    "job": 28,
    "company": 5
  }
}
```

---

## 추천/매칭 API

### 구직자용 추천 채용 공고
```
GET /api/v1/recommendations/jobs
Authorization: Bearer {token} (CANDIDATE)
Query: ?limit=10
```

**Response (200)**:
```json
{
  "recommendations": [
    {
      "jobPosting": {
        "id": "uuid",
        "title": "시니어 백엔드 개발자",
        "companyName": "플렉스 AI",
        "position": "IT개발",
        "salaryMin": 6000,
        "salaryMax": 8000,
        "requirements": ["Python", "FastAPI"],
        "preferredSkills": ["PostgreSQL", "Docker"]
      },
      "matchScore": 85,
      "reason": "귀하의 IT능력과 문제해결능력이 이 직무에 매우 적합합니다",
      "matchingDetails": {
        "skillMatch": 0.9,
        "experienceMatch": 0.85,
        "salaryMatch": 1.0
      }
    }
  ]
}
```

### 채용담당자용 추천 후보자
```
GET /api/v1/recommendations/candidates/:jobId
Authorization: Bearer {token} (RECRUITER)
Query: ?limit=10
```

**Response (200)**:
```json
{
  "recommendations": [
    {
      "candidate": {
        "id": "uuid",
        "name": "김철수",
        "profileImageUrl": "https://...",
        "skills": ["Python", "React"],
        "experience": 5,
        "desiredPosition": "IT개발",
        "overallScore": 82
      },
      "matchScore": 88,
      "reason": "귀사가 요구하는 Python과 FastAPI 경험이 풍부하며...",
      "matchingDetails": {
        "skillMatch": 0.92,
        "experienceMatch": 0.88,
        "evaluationScore": 82
      }
    }
  ]
}
```

---

## 파일 업로드 API

### 파일 업로드 (이미지, 문서)
```
POST /api/v1/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (form-data)**:
```
file: (binary file)
type: profile_image | resume | portfolio | company_logo
```

**Response (200)**:
```json
{
  "url": "https://storage.googleapis.com/flex-recruiter-files/uploads/1234567890_filename.pdf",
  "filename": "filename.pdf",
  "size": 1024000,
  "mimeType": "application/pdf"
}
```

**지원 파일 형식**:
- 이미지: jpg, jpeg, png, gif, webp (최대 5MB)
- 문서: pdf, docx, doc (최대 10MB)

## Socket.IO 이벤트

### 연결
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

### 클라이언트 → 서버

#### 인터뷰 시작
```javascript
socket.emit('interview:start', {
  mode: 'PRACTICE' | 'ACTUAL',
  timeLimitSeconds: 900,
  isVoiceMode: false,
  jobPostingId: 'uuid' // optional
});
```

#### 메시지 전송
```javascript
socket.emit('interview:message', {
  interviewId: 'uuid',
  content: '답변 내용...',
  contentType: 'TEXT' | 'AUDIO',
  audioUrl: 'https://...' // if contentType is AUDIO
});
```

#### 인터뷰 종료
```javascript
socket.emit('interview:end', {
  interviewId: 'uuid'
});
```

### 서버 → 클라이언트

#### 인터뷰 시작 완료
```javascript
socket.on('interview:started', (data) => {
  // data: { interviewId, question }
});
```

#### AI 처리 중
```javascript
socket.on('interview:processing', () => {
  // AI가 응답 생성 중
});
```

#### AI 질문 수신
```javascript
socket.on('interview:question', (data) => {
  // data: { question, questionType, criteria }
});
```

#### 인터뷰 종료
```javascript
socket.on('interview:ended', (data) => {
  // data: { interviewId, message }
});
```

#### 에러 발생
```javascript
socket.on('interview:error', (error) => {
  // error: { message, code }
});
```

---

## 개발용 테스트 콘솔
- 프론트 경로: `/test`
- 기능: 인터뷰 시작/메시지/종료, 공고 목록, 추천 공고

---

## 에러 코드

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

### 커스텀 에러 응답
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "필수 필드가 누락되었습니다",
    "details": {
      "field": "email",
      "reason": "이메일 형식이 올바르지 않습니다"
    }
  }
}
```

---

## AI 모델 주의사항
- `OPENAI_MODEL=gpt-5` 기본값
- 일부 gpt-5 계열 모델은 `temperature`, `max_tokens` 미지원
- 현재 서버는 해당 옵션을 사용하지 않음
- RAG 기반 질문 생성: ExampleQuestion.csv 활용 (46개 예시)

---

## 변경 이력
- **2025-10-28 (Sprint 8-9)**
  - 프로필 API 확장 (12개 필드 추가)
  - 평가 API 재설계 (8가지 평가 항목)
  - 알림 API 추가
  - 검색 API 추가
  - 파일 업로드 API 추가
  - 추천 API 응답 구조 개선

