# 🎯 구현 Task List

**프로젝트**: flex-AI-Recruiter  
**현재 진행률**: 75%  
**최종 업데이트**: 2025-10-28 23:30  
**최종 목표**: 100% 기능 완성

---

## 🔥 **최신 작업 완료** (2025-10-28 오후/저녁)

### ✅ 즉시 수정 완료 (Critical Fixes)
1. **STT API 수정** - `ResponseValidationError` 해결
   - 파일: `service-ai/app/api/stt.py`
   - 수정: 응답 스키마 FastAPI 표준 준수
   
2. **음성 중복 재생 수정** - 메아리 현상 제거
   - 파일: `app-web/src/app/interview/start/page.tsx`
   - 추가: `currentAudioRef`로 이전 오디오 추적 및 중지
   
3. **UI 가림 문제 해결** - 헤더/타이머/버튼 가시성 확보
   - z-index 재조정: 헤더(50) > 웹캠(30) > 자막(20) > 3D(10)
   - `pointer-events-none/auto` 최적화
   
4. **TTS 음질 개선** - 더 자연스러운 목소리
   - 변경: `voice: 'alloy'` → `voice: 'nova'`
   
5. **채팅/음성 모드 통합** - 모든 모드에서 AI 음성 인사
   - 수정: `speakText` 함수 조건문 제거
   
6. **로딩 UX 개선** - 장비 테스트 후 인터뷰 시작 시 로딩 화면
   - 파일: `app-web/src/app/interview/setup/page.tsx`
   - 추가: `isLoading` state + Sparkles 애니메이션
   
7. **3D 아바타 대폭 업그레이드** - 전문가급 자연스러운 외모
   - 파일: `app-web/src/components/interview/AIAvatar3D.tsx`
   - 개선: 자연스러운 피부톤, 머리카락, 눈/눈썹, 입술, 턱선
   - 조명: 3점 조명 + 추가 포인트 라이트 (6개 광원)
   - 애니메이션: 호흡, 깜빡임, 립싱크, 마우스 추적 눈동자

### 기술 스택 업데이트
- Three.js r169
- React Three Fiber 8.17.10
- @react-three/drei 9.117.3
- FastAPI response_model 최적화

---

## ✅ Phase 5-1 완료! (2025-10-28)

**음성/비디오 인터뷰 기능 100% 완료**
- ✅ 웹캠 연동 (MediaDevices API)
- ✅ 음성 녹음 (MediaRecorder API)
- ✅ STT (Whisper API) - 음성→텍스트 ✓ **에러 수정 완료**
- ✅ TTS (OpenAI TTS) - AI 응답→음성 ✓ **품질 개선 완료**
- ✅ AI 아바타 (립싱크, 감정 표현) ✓ **3D 업그레이드 완료**
- ✅ 권한 테스트 모달 (카메라/마이크)
- ✅ 타이머 및 헤더 UI 최적화

---

## ⚠️ **알려진 이슈 및 남은 작업**

### 🔴 Critical (즉시 수정 필요)

#### 1. Evaluation API 404 에러
- **현상**: 인터뷰 종료 후 평가 결과 조회 시 404
- **원인**: Backend GET 엔드포인트 미구현
- **파일**: `service-core/src/routes/evaluation.routes.ts`
- **필요 작업**: 
  ```typescript
  router.get('/:evaluationId', evaluationController.getEvaluationById);
  ```

#### 2. 질문 생성 무한 반복
- **현상**: AI가 "Could you tell me more?" 반복
- **원인**: Socket.IO 이벤트 핸들러 중복 등록 또는 질문 상태 관리 오류
- **파일**: 
  - `service-core/src/socket/interview.handler.ts`
  - `app-web/src/app/interview/start/page.tsx`
- **필요 작업**: 
  - 질문 큐 상태 디버깅
  - 이벤트 리스너 중복 제거
  - 질문 생성 로직 재검토

### 🟠 High Priority (성능 개선)

#### 3. 응답 지연 개선 (4~10초)
- **현상**: AI 응답 생성 시간이 길어 실시간 대화 어려움
- **해결 방법**: Streaming API 구현
- **파일**: 
  - `service-ai/app/api/chat.py` (OpenAI Streaming)
  - `app-web/src/app/interview/start/page.tsx` (SSE 수신)
- **예상 효과**: 첫 토큰까지 0.5초, 전체 응답 3초 이내

### 🟢 Nice to Have (추가 개선)

#### 4. 3D 캐릭터 에셋 교체
- **현재**: 커스텀 Three.js 지오메트리 (기본 도형)
- **개선안**: 
  - Mixamo 무료 캐릭터 + 애니메이션
  - Ready Player Me SDK
  - VRoid Studio 모델
- **파일**: `app-web/src/components/interview/AIAvatar3D.tsx`

#### 5. 장비 확인 UI 개선
- **추가**: 마이크 테스트 버튼 (5초 녹음 → 재생)
- **파일**: `app-web/src/components/interview/PermissionTestModal.tsx`

---

## 🔥 Phase 5-1: 음성/비디오 인터뷰 (최우선 - Critical)

### 필수 구현 사항

#### 1. 웹캠 연동
- [x] MediaDevices API 사용하여 사용자 카메라 접근
- [x] 화면 우측 상단에 사용자 얼굴 표시
- [x] 카메라 권한 요청 및 에러 처리
- [x] 카메라 On/Off 토글 기능

**기술 스택**:
```javascript
// app-web/src/app/interview/start/page.tsx
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: true, 
  audio: true 
});
```

#### 2. 음성 녹음 (Web Audio API)
- [x] MediaRecorder API로 실시간 음성 녹음
- [x] 녹음 시작/중지 기능
- [x] 음성 데이터를 Blob으로 저장
- [x] 연습 모드: 채팅/음성 선택 가능 ✓ **URL 파라미터 전달**
- [x] 실전 모드: 음성만 가능 ✓ **UI 분기 완료**

**기술 스택**:
```javascript
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (e) => {
  audioChunks.push(e.data);
};
```

#### 3. STT (Speech-to-Text)
- [x] Whisper API 연동
- [x] 녹음된 음성을 텍스트로 변환
- [x] 실시간 또는 구간별 변환 선택
- [x] 한국어 인식 정확도 확인

**API 연동**:
```python
# service-ai/app/api/stt.py
import openai
transcription = openai.Audio.transcribe("whisper-1", audio_file)
```

#### 4. TTS (Text-to-Speech)
- [x] OpenAI TTS API 연동
- [x] AI 응답을 음성으로 출력
- [x] 음성 속도, 톤 조절 가능
- [x] 한국어 음성 품질 확인

**API 연동**:
```python
# service-ai/app/api/tts.py
response = openai.audio.speech.create(
  model="tts-1",
  voice="alloy",
  input="안녕하세요"
)
```

#### 5. 3D 아바타 (표정 반응형 AI 캐릭터)
- [x] 라이브러리 선택 및 통합
  - **선택**: 커스텀 SVG 애니메이션 (빠른 구현)
  - **추후 업그레이드**: Ready Player Me 또는 3D 모델
- [x] 실시간 립싱크 (음성에 맞춰 입 움직임)
- [x] 감정 표현 (기쁨, 놀람, 중립, 생각중)
- [x] 화면 좌측에 배치

**라이브러리 탐색**:
```bash
# Ready Player Me
npm install @readyplayerme/rpm-web-sdk

# 또는 Three.js + Custom Avatar
npm install three @react-three/fiber @react-three/drei
```

---

## 🟠 Phase 5-2: 채용 공고 시스템 (High Priority)

### [채용담당자 기능]

#### 1. 채용 공고 CRUD
- [ ] 백엔드 API 구현
  - [ ] `POST /api/v1/job-posting` - 공고 생성
  - [ ] `GET /api/v1/job-posting` - 공고 목록
  - [ ] `GET /api/v1/job-posting/:id` - 공고 상세
  - [ ] `PUT /api/v1/job-posting/:id` - 공고 수정
  - [ ] `DELETE /api/v1/job-posting/:id` - 공고 삭제 (비활성화)
- [ ] Prisma 스키마 확인 (JobPosting 모델 이미 존재)

**파일**: `service-core/src/routes/jobPosting.routes.ts`

#### 2. 공고 작성 페이지
- [ ] 공고 작성 폼 UI
  - [ ] 제목, 설명
  - [ ] 직무 (경영관리/영업/전산)
  - [ ] 요구 스킬
  - [ ] 경력 요구사항
  - [ ] 급여 범위
  - [ ] 근무 지역
  - [ ] 마감일
- [ ] 파일 업로드 (상세 JD)
- [ ] 임시 저장 기능
- [ ] 미리보기

**파일**: `app-web/src/app/jobs/create/page.tsx` (신규)

#### 3. 공고 목록/상세 페이지
- [ ] 공고 목록 카드 형식
- [ ] 필터링 (직무, 지역, 경력)
- [ ] 정렬 (최신순, 마감임박순)
- [ ] 공고 상세 페이지
- [ ] 지원하기 버튼

**파일**: 
- `app-web/src/app/jobs/page.tsx` (이미 존재)
- `app-web/src/app/jobs/[id]/page.tsx` (이미 존재)

#### 4. 지원 기능
- [ ] 백엔드: Application 모델 (이미 존재)
- [ ] API: `POST /api/v1/application`
- [ ] 지원서 제출 UI
- [ ] 지원 내역 확인 (구직자)
- [ ] 지원자 목록 (채용담당자)

---

## 🟠 Phase 5-3: AI 추천 시스템 (High Priority)

### [공통 기능]

#### 1. 피드 추천 시스템
- [ ] 구직자 피드: 회사 프로필 추천
  - [ ] 평가 결과 기반 매칭
  - [ ] 추천 이유 표시
  - [ ] 관심 표시 기능
- [ ] 채용담당자 피드: 구직자 프로필 추천
  - [ ] 공고별 추천 후보
  - [ ] 매칭 점수 표시

**파일**: `app-web/src/app/recommendations/page.tsx` (이미 존재, 구현 필요)

#### 2. AI 매칭 알고리즘
- [ ] 벡터 유사도 계산 (pgvector 활용)
- [ ] 구직자-공고 매칭 점수
- [ ] 5가지 역량 가중치 적용
- [ ] 추천 이유 생성 (AI)

**파일**: `service-ai/app/services/matching_service.py` (이미 존재)

#### 3. 지원자 대시보드 API 연동
- [ ] 실제 지원자 목록 API
- [ ] 실제 통계 데이터 API
- [ ] 하드코딩된 임시 데이터 제거

**파일**: `app-web/src/app/dashboard/recruiter/page.tsx`

---

## 🟡 Phase 5-4: 추가 기능 (Medium Priority)

### [구직자 기능]

#### 1. 프로필 고유 URL
- [ ] uniqueUrl 자동 생성 (slug)
- [ ] `/profile/@username` 형식
- [ ] 공개 프로필 페이지
- [ ] 공유 버튼

**예시**: `https://flex-recruiter.com/profile/@hong-gildong`

#### 2. 이력서 파일 업로드 UI
- [ ] resumeUrl 필드 활용 (이미 존재)
- [ ] 파일 선택 UI
- [ ] PDF/DOCX 업로드
- [ ] 미리보기 링크

#### 3. 인터뷰 질문 선택 UI
- [ ] 프로필 기반 10개 질문 생성
- [ ] 5개 선택 또는 직접 만들기
- [ ] 질문 유형 표시 (공통/직무특화)

**파일**: `app-web/src/app/interview/setup/page.tsx` (기능 추가)

#### 4. 난이도 자동 설정 개선
- [ ] 프로필 분석 체크리스트
- [ ] 각 역량별 상/중/하 난이도 선정
- [ ] 선정 근거 로그

**파일**: `service-ai/app/services/enhanced_question_generator.py`

### [채용담당자 기능]

#### 1. 회사 프로필 고유 URL
- [ ] uniqueUrl 자동 생성
- [ ] `/company/@company-name` 형식
- [ ] 공개 회사 페이지
- [ ] 공유 버튼

### [공통 기능]

#### 1. 검색 필터링
- [ ] 직무 필터
- [ ] 지역 필터
- [ ] 경력 필터
- [ ] 급여 범위 필터

**파일**: `app-web/src/app/search/page.tsx` (기능 추가)

#### 2. 알림 개선
- [ ] WebSocket 실시간 알림 (현재 폴링)
- [ ] 알림 카테고리 (평가완료, 지원, 매칭)
- [ ] 알림 설정 페이지

---

## 🟢 Phase 5-5: 고급 기능 (Nice to Have)

### 1. 인터뷰 분석 강화
- [ ] 감정 분석 (음성 톤, 표정)
- [ ] 시선 추적 (집중도)
- [ ] 응답 속도 분석
- [ ] 자신감 지수

### 2. 채용 프로세스 관리
- [ ] 지원자 상태 관리 (서류, 1차, 2차, 최종)
- [ ] 면접 일정 관리
- [ ] 이메일 알림
- [ ] 채용 파이프라인 시각화

### 3. 분석 대시보드
- [ ] 채용담당자: 지원 트렌드, 역량 분석
- [ ] 구직자: 인터뷰 성장 곡선, 강점/약점

### 4. 소셜 기능
- [ ] 프로필 공유 (LinkedIn, Twitter)
- [ ] 추천인 기능
- [ ] 리뷰 시스템

---

## 📋 원본 요구사항 체크리스트

### [공통 기능]
- [x] 1. 로그인, 회원가입 (100%)
- [ ] 2. 피드 추천 (0%) → **Phase 5-3**
- [x] 3. 검색 (80%) → 필터 추가 필요
- [x] 4. 스켈레톤 로딩 (100%)
- [x] 5. 네비게이션/레이아웃 (100%)
- [x] 6. 포인트 컬러 (100%)
- [x] 7. 백엔드 연결 (95%)
- [x] 8. UI/UX 라이브러리 (100%)

### [구직자 기능]
- [x] 1. 프로필 등록/업데이트 (90%) → 고유 URL, 파일 UI
- [ ] 2. AI 인터뷰 (60%) → **Phase 5-1 (음성/비디오/3D)**
  - [x] 연습/실전 모드
  - [ ] 채팅/음성 선택 (연습)
  - [ ] 음성만 (실전)
  - [ ] 웹캠
  - [ ] 3D 아바타
- [x] 3. 인터뷰 과정 (70%)
  - [x] 프로필 기반 질문 생성
  - [x] 실시간 대화
  - [x] 타이머
  - [ ] 아이스브레이킹 → 공통 → 직무특화 순서 명시
  - [x] 꼬리 질문 (AI 자율)
- [x] 4. 질문 생성 (80%)
  - [x] RAG 기반
  - [x] 직무별 평가 항목
  - [ ] 난이도 자동 설정 개선
- [ ] 5. 질문 유형 (50%) → 10개 중 5개 선택 UI
- [x] 6. 평가 방법 (95%)
  - [x] 의사소통 (전달력, 어휘, 문제이해력)
  - [x] 5가지 역량
  - [x] 직무 추천 랭킹
  - [x] 비동기 평가 + 알림
  - [x] 바 차트 + 레이더 차트
  - [x] 스크립트 확인
- [ ] 7. 지원서 넣기 (0%) → **Phase 5-2**

### [채용담당자 기능]
- [x] 1. 회사 소개 (90%) → 고유 URL
- [ ] 2. 구직 공고 (0%) → **Phase 5-2**
- [ ] 3. 사용자 추천 (0%) → **Phase 5-3**
- [ ] 4. 지원자 대시보드 (30%) → API 연동

---

## 🎯 우선순위 요약

### 🔥 Critical (필수)
1. **Phase 5-1**: 음성/비디오 인터뷰 (2-3일)
   - 웹캠, 음성 녹음, STT, TTS, 3D 아바타

### 🟠 High (중요)
2. **Phase 5-2**: 채용 공고 시스템 (1-2일)
   - 공고 CRUD, 지원 기능
3. **Phase 5-3**: AI 추천 시스템 (2-3일)
   - 매칭 알고리즘, 피드

### 🟡 Medium (개선)
4. **Phase 5-4**: 추가 기능 (1-2일)
   - 고유 URL, 검색 필터, 질문 선택 UI

### 🟢 Nice to Have (선택)
5. **Phase 5-5**: 고급 기능 (추후)
   - 감정 분석, 채용 프로세스, 대시보드

---

## 📊 예상 일정

```
Week 1:
  Mon-Wed: Phase 5-1 (음성/비디오)
  Thu-Fri: Phase 5-2 (채용 공고)

Week 2:
  Mon-Wed: Phase 5-3 (AI 추천)
  Thu-Fri: Phase 5-4 (추가 기능)

Week 3:
  Mon-Tue: 테스트 & 버그 수정
  Wed-Thu: 문서화 & 배포 준비
  Fri: Phase 5-5 시작 (선택)
```

**총 예상 기간**: 2-3주

---

## 🔗 관련 문서

- **진행 상황**: `docs/PROGRESS_CHECK.md`
- **최종 보고서**: `docs/FINAL_STATUS_REPORT.md`
- **프로젝트 설계**: `docs/PROJECT_BLUEPRINT.md`
- **API 문서**: `docs/API.md`

---

**작성일**: 2025-10-28  
**다음 업데이트**: Phase 5-1 완료 시

