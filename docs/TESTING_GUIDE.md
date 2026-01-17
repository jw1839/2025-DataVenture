# 테스트 가이드 (Testing Guide)
> **작성일**: 2025-10-27  
> **Sprint 6**: 테스트 & 최적화

---

## 목차
1. [테스트 전략](#1-테스트-전략)
2. [단위 테스트 (Unit Tests)](#2-단위-테스트-unit-tests)
3. [E2E 테스트 (End-to-End Tests)](#3-e2e-테스트-end-to-end-tests)
4. [테스트 커버리지](#4-테스트-커버리지)
5. [테스트 실행 방법](#5-테스트-실행-방법)
6. [CI/CD 통합](#6-cicd-통합)

---

## 1. 테스트 전략

### 1.1 테스트 피라미드

```
           /\
          /  \
         / E2E\      ← 소수의 핵심 플로우 (10-20%)
        /______\
       /        \
      /Integration\   ← 서비스 간 통합 (20-30%)
     /____________\
    /              \
   /  Unit Tests    \  ← 다수의 단위 테스트 (50-70%)
  /__________________\
```

### 1.2 테스트 범위

| 계층 | 도구 | 목표 커버리지 | 현재 상태 |
|-----|------|------------|---------|
| Frontend (Unit) | Jest + RTL | 70% | 🟡 진행 중 |
| Backend Core (Unit) | Jest | 70% | 🟡 진행 중 |
| Backend AI (Unit) | Pytest | 70% | 🟡 진행 중 |
| E2E | Playwright | 핵심 플로우 | ✅ 완료 |

---

## 2. 단위 테스트 (Unit Tests)

### 2.1 Frontend Tests (Jest + React Testing Library)

#### 📁 위치
```
app-web/
├── src/
│   ├── stores/
│   │   └── __tests__/
│   │       └── auth-store.test.ts
│   ├── components/
│   │   └── __tests__/
│   │       └── *.test.tsx
│   └── lib/
│       └── __tests__/
│           └── *.test.ts
├── jest.config.js
└── jest.setup.js
```

#### 실행 방법
```bash
cd app-web

# 모든 테스트 실행
npm test

# Watch 모드 (개발 중)
npm run test:watch

# 커버리지 리포트 생성
npm run test:coverage
```

#### 커버리지 리포트 위치
- HTML: `app-web/coverage/lcov-report/index.html`
- JSON: `app-web/coverage/coverage-final.json`

---

### 2.2 Backend Core Tests (Jest + TypeScript)

#### 📁 위치
```
service-core/
├── tests/
│   ├── helpers/
│   │   └── test-utils.ts          # 테스트 헬퍼
│   ├── middlewares/
│   │   └── auth.middleware.test.ts
│   ├── utils/
│   │   └── jwt.test.ts
│   ├── controllers/
│   │   ├── user.controller.test.ts
│   │   └── jobPosting.controller.test.ts
│   └── auth.test.ts (레거시)
└── jest.config.js
```

#### 실행 방법
```bash
cd service-core

# 모든 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 리포트 생성
npm test -- --coverage
```

#### 커버리지 리포트 위치
- HTML: `service-core/coverage/lcov-report/index.html`

---

### 2.3 Backend AI Tests (Pytest)

#### 📁 위치
```
service-ai/
├── tests/
│   ├── conftest.py                     # Pytest 설정 및 픽스처
│   ├── test_matching_service.py        # 매칭 알고리즘 테스트
│   └── test_evaluation_generator.py    # 평가 생성 테스트
└── pytest.ini
```

#### 실행 방법
```bash
cd service-ai

# 모든 테스트 실행
pytest

# Verbose 모드
pytest -v

# 커버리지 리포트 생성
pytest --cov=app --cov-report=html --cov-report=term

# 특정 테스트만 실행
pytest tests/test_matching_service.py
```

#### 커버리지 리포트 위치
- HTML: `service-ai/htmlcov/index.html`
- Terminal: 자동 출력

---

## 3. E2E 테스트 (End-to-End Tests)

### 3.1 Playwright 설정

#### 📁 위치
```
app-web/
├── tests/
│   └── e2e/
│       ├── auth-flow.spec.ts           # 인증 플로우
│       └── interview-flow.spec.ts      # 인터뷰 플로우
├── playwright.config.ts
└── package.json
```

### 3.2 실행 방법

#### 사전 요구사항
```bash
# Playwright 설치 (최초 1회)
cd app-web
npx playwright install
```

#### 테스트 실행
```bash
cd app-web

# UI 모드 (권장, 개발 중)
npx playwright test --ui

# 헤드리스 모드 (CI/CD)
npx playwright test

# 특정 브라우저만
npx playwright test --project=chromium

# 디버그 모드
npx playwright test --debug

# 특정 테스트만
npx playwright test auth-flow
```

### 3.3 테스트 결과 확인

```bash
# HTML 리포트 보기
npx playwright show-report
```

리포트 위치: `app-web/playwright-report/index.html`

---

## 4. 테스트 커버리지

### 4.1 목표 커버리지

| 서비스 | 목표 | 현재 |
|-------|------|------|
| **Frontend** | 70% | 20% (진행 중) |
| **Backend Core** | 70% | 30% (진행 중) |
| **Backend AI** | 70% | 25% (진행 중) |

### 4.2 커버리지 확인 방법

#### Frontend
```bash
cd app-web
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
```

#### Backend Core
```bash
cd service-core
npm test -- --coverage
open coverage/lcov-report/index.html  # macOS
start coverage\\lcov-report\\index.html # Windows
```

#### Backend AI
```bash
cd service-ai
pytest --cov=app --cov-report=html
open htmlcov/index.html  # macOS
start htmlcov\\index.html # Windows
```

### 4.3 전체 커버리지 통합 리포트

```bash
# 모든 서비스의 커버리지를 한 번에 확인 (향후 구현)
npm run test:coverage:all
```

---

## 5. 테스트 실행 방법

### 5.1 로컬 개발 환경

#### 전체 테스트 실행
```bash
# 프로젝트 루트에서
npm run test:all  # (package.json에 스크립트 추가 필요)
```

또는 각 서비스별로 실행:
```bash
# Terminal 1: Frontend
cd app-web && npm test

# Terminal 2: Backend Core
cd service-core && npm test

# Terminal 3: Backend AI
cd service-ai && pytest

# Terminal 4: E2E
cd app-web && npx playwright test --ui
```

### 5.2 Watch 모드 (개발 중 권장)

```bash
# Frontend (Jest Watch)
cd app-web
npm run test:watch

# Backend Core (Jest Watch)
cd service-core
npm run test:watch

# Backend AI (Pytest Watch) - pytest-watch 설치 필요
cd service-ai
pip install pytest-watch
ptw
```

---

## 6. CI/CD 통합

### 6.1 GitHub Actions 워크플로우 (계획)

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd app-web && npm install
      - name: Run tests
        run: cd app-web && npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  backend-core-test:
    runs-on: ubuntu-latest
    steps:
      # ... 유사한 설정

  backend-ai-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: cd service-ai && pip install -r requirements.txt
      - name: Run tests
        run: cd service-ai && pytest --cov=app

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      # ... Playwright 설정 및 실행
```

---

## 7. 테스트 작성 가이드

### 7.1 좋은 테스트의 특징

1. **독립성**: 각 테스트는 독립적으로 실행 가능해야 한다
2. **반복 가능성**: 동일한 입력에 대해 항상 동일한 결과
3. **명확성**: 테스트 이름만으로 무엇을 테스트하는지 알 수 있어야 한다
4. **빠름**: 단위 테스트는 1초 이내에 실행되어야 한다
5. **단순성**: 테스트 코드는 프로덕션 코드보다 단순해야 한다

### 7.2 테스트 네이밍 규칙

```typescript
// Good ✅
test('로그인 시 사용자 정보와 토큰을 저장해야 한다', () => {
  // ...
});

// Bad ❌
test('login test', () => {
  // ...
});
```

### 7.3 AAA 패턴 (Arrange-Act-Assert)

```typescript
test('calculateSum은 두 수의 합을 반환해야 한다', () => {
  // Arrange (준비)
  const a = 5;
  const b = 3;

  // Act (실행)
  const result = calculateSum(a, b);

  // Assert (검증)
  expect(result).toBe(8);
});
```

---

## 8. 트러블슈팅

### 8.1 Jest 메모리 부족

```bash
# package.json scripts에 추가
"test": "NODE_OPTIONS=--max-old-space-size=4096 jest"
```

### 8.2 Playwright 브라우저 설치 오류

```bash
# 브라우저 재설치
npx playwright install --with-deps
```

### 8.3 Pytest ImportError

```bash
# PYTHONPATH 설정
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest
```

---

## 9. 다음 단계

### 9.1 단기 목표 (1-2주)
- [ ] Frontend 컴포넌트 테스트 추가 (30% → 70%)
- [ ] Backend Core 컨트롤러 테스트 완성 (30% → 70%)
- [ ] Backend AI 서비스 테스트 완성 (25% → 70%)

### 9.2 중기 목표 (3-4주)
- [ ] 통합 테스트 작성
- [ ] 성능 테스트 (k6, Artillery)
- [ ] GitHub Actions CI/CD 파이프라인 구축

---

## 10. 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright 공식 문서](https://playwright.dev/)
- [Pytest 공식 문서](https://docs.pytest.org/)

---

**작성자**: AI Principal Architect  
**검토 필요**: Project Owner  
**다음 업데이트**: 테스트 커버리지 70% 달성 후

