# 배포 가이드 (Deployment Guide)

> flex-AI-Recruiter 프로덕션 배포 및 운영 가이드

## 목차
1. [환경 구성](#1-환경-구성)
2. [GCP 설정](#2-gcp-설정)
3. [GitHub Secrets 설정](#3-github-secrets-설정)
4. [데이터베이스 마이그레이션](#4-데이터베이스-마이그레이션)
5. [CI/CD 파이프라인](#5-cicd-파이프라인)
6. [모니터링 및 로깅](#6-모니터링-및-로깅)
7. [롤백 절차](#7-롤백-절차)

---

## 1. 환경 구성

### 1.1 환경 종류

| 환경 | 브랜치 | 자동 배포 | URL 예시 |
|------|--------|----------|---------|
| **개발 (Local)** | feature/* | ❌ | localhost:3000 |
| **스테이징 (Staging)** | develop | ✅ | https://service-core-staging-xxx.run.app |
| **프로덕션 (Production)** | main | ✅ (승인 필요) | https://service-core-prod-xxx.run.app |

### 1.2 필수 환경 변수

#### Backend Core (service-core)
```bash
# 서버 설정
PORT=8080
NODE_ENV=production  # development, staging, production

# 데이터베이스 (GCP Cloud SQL)
DATABASE_URL="postgresql://user:password@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE"

# JWT 인증
JWT_SECRET=<32자 이상 랜덤 문자열>
JWT_EXPIRES_IN=7d

# AI 서비스 URL (내부 통신)
AI_SERVICE_URL=https://service-ai-prod-xxx.run.app

# Frontend URL (CORS)
FRONTEND_URL=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_MAX=1000  # 15분당 최대 요청 수
```

#### Backend AI (service-ai)
```bash
# 서버 설정
PORT=8000

# OpenAI API
OPENAI_API_KEY=sk-xxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o  # 또는 gpt-5

# Embedding 모델
EMBEDDING_MODEL=jhgan/ko-sbert-nli

# 데이터베이스 (선택적, 벡터 저장 시)
DATABASE_URL="postgresql://user:password@/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

#### Frontend (app-web)
```bash
# API 엔드포인트
NEXT_PUBLIC_API_URL=https://service-core-prod-xxx.run.app
NEXT_PUBLIC_SOCKET_URL=https://service-core-prod-xxx.run.app

# 환경
NEXT_PUBLIC_ENV=production
```

---

## 2. GCP 설정

### 2.1 GCP 프로젝트 생성

```bash
# 프로젝트 생성
gcloud projects create flex-recruiter-prod --name="flex-AI-Recruiter"

# 프로젝트 설정
gcloud config set project flex-recruiter-prod

# 필요한 API 활성화
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com
```

### 2.2 Artifact Registry 설정

```bash
# Docker 저장소 생성
gcloud artifacts repositories create flex-recruiter \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="flex-AI-Recruiter Docker images"
```

### 2.3 Cloud SQL 설정

```bash
# PostgreSQL 15 인스턴스 생성 (pgvector 지원)
gcloud sql instances create flex-recruiter-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \  # 시작용, 프로덕션: db-n1-standard-2
  --region=asia-northeast3 \
  --root-password=<안전한 비밀번호>

# 데이터베이스 생성
gcloud sql databases create flex_recruiter \
  --instance=flex-recruiter-db

# Cloud Run에서 접근 허용
gcloud sql instances patch flex-recruiter-db \
  --database-flags=cloudsql.iam_authentication=on
```

### 2.4 Secret Manager 설정

```bash
# JWT Secret 생성
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create JWT_SECRET --data-file=-

# OpenAI API Key 저장
echo -n "sk-xxxxxx" | \
  gcloud secrets create OPENAI_API_KEY --data-file=-

# Database URL 저장 (Staging)
echo -n "postgresql://..." | \
  gcloud secrets create DATABASE_URL_STAGING --data-file=-

# Database URL 저장 (Production)
echo -n "postgresql://..." | \
  gcloud secrets create DATABASE_URL_PROD --data-file=-
```

### 2.5 Workload Identity 설정

```bash
# 서비스 계정 생성
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# Cloud Run 배포 권한 부여
gcloud projects add-iam-policy-binding flex-recruiter-prod \
  --member="serviceAccount:github-actions-deployer@flex-recruiter-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Artifact Registry 권한
gcloud projects add-iam-policy-binding flex-recruiter-prod \
  --member="serviceAccount:github-actions-deployer@flex-recruiter-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Secret Manager 권한
gcloud projects add-iam-policy-binding flex-recruiter-prod \
  --member="serviceAccount:github-actions-deployer@flex-recruiter-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Workload Identity Pool 생성
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Workload Identity Provider 생성
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Service Account에 Workload Identity 바인딩
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deployer@flex-recruiter-prod.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/flex-AI-Recruiter"
```

---

## 3. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음 설정:

### Repository Secrets

| Secret 이름 | 값 | 설명 |
|-------------|-----|------|
| `GCP_PROJECT_ID` | `flex-recruiter-prod` | GCP 프로젝트 ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/...` | Workload Identity Provider 전체 경로 |
| `GCP_SERVICE_ACCOUNT` | `github-actions-deployer@flex-recruiter-prod.iam.gserviceaccount.com` | 서비스 계정 이메일 |

**Workload Identity Provider 경로 가져오기:**
```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```

---

## 4. 데이터베이스 마이그레이션

### 4.1 로컬에서 스테이징 DB로 마이그레이션

```bash
# Cloud SQL Proxy 설치
curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Proxy 실행 (백그라운드)
./cloud-sql-proxy \
  --credentials-file=path/to/service-account-key.json \
  flex-recruiter-prod:asia-northeast3:flex-recruiter-db &

# Prisma 마이그레이션
cd service-core
DATABASE_URL="postgresql://user:password@localhost:5432/flex_recruiter" \
  npx prisma migrate deploy
```

### 4.2 프로덕션 DB 마이그레이션

**주의:** 프로덕션 DB 마이그레이션은 반드시 점검 시간에 진행하고 백업 후 실행.

```bash
# 백업 생성
gcloud sql backups create \
  --instance=flex-recruiter-db \
  --description="Before migration $(date +%Y%m%d)"

# 마이그레이션 실행
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 5. CI/CD 파이프라인

### 5.1 CI 파이프라인 (`.github/workflows/ci.yml`)

**트리거:**
- Pull Request → `main`, `develop`
- Push → `develop`

**작업:**
1. Backend Core 테스트 (Jest + PostgreSQL)
2. Backend AI 테스트 (Pytest)
3. Frontend 테스트 (Jest) + Lint

### 5.2 CD 파이프라인 - Staging (`.github/workflows/cd-staging.yml`)

**트리거:**
- Push → `develop`

**배포 순서:**
1. Docker 이미지 빌드
2. Artifact Registry 푸시
3. Cloud Run 배포 (staging)

### 5.3 CD 파이프라인 - Production (`.github/workflows/cd-production.yml`)

**트리거:**
- Push → `main`
- 수동 트리거 (workflow_dispatch)

**배포 순서:**
1. 프로덕션 환경 승인 필요 (GitHub Environment Protection)
2. Docker 이미지 빌드
3. Artifact Registry 푸시
4. Cloud Run 배포 (production)

---

## 6. 모니터링 및 로깅

### 6.1 Cloud Run 로그 확인

```bash
# 최근 로그 확인
gcloud run services logs read service-core-prod \
  --region=asia-northeast3 \
  --limit=50

# 실시간 로그
gcloud run services logs tail service-core-prod \
  --region=asia-northeast3
```

### 6.2 에러 모니터링

- **Cloud Logging:** 모든 서비스 로그 중앙 집중
- **Error Reporting:** 자동 에러 감지 및 그룹화
- **Cloud Monitoring:** 메트릭 및 알림 설정

### 6.3 알림 설정

```bash
# CPU 사용률 80% 이상 시 알림
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High CPU Usage" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s
```

---

## 7. 롤백 절차

### 7.1 Cloud Run 이전 버전으로 롤백

```bash
# 모든 리비전 확인
gcloud run revisions list \
  --service=service-core-prod \
  --region=asia-northeast3

# 특정 리비전으로 롤백
gcloud run services update-traffic service-core-prod \
  --region=asia-northeast3 \
  --to-revisions=service-core-prod-00005-abc=100
```

### 7.2 데이터베이스 롤백

```bash
# 백업 목록 확인
gcloud sql backups list --instance=flex-recruiter-db

# 백업 복원 (새 인스턴스 생성)
gcloud sql backups restore BACKUP_ID \
  --backup-instance=flex-recruiter-db \
  --backup-id=BACKUP_ID \
  --target-instance=flex-recruiter-db-restore
```

---

## 8. 체크리스트

### 프로덕션 배포 전 확인사항

- [ ] 모든 테스트 통과
- [ ] 데이터베이스 백업 완료
- [ ] 환경 변수 및 시크릿 확인
- [ ] 스테이징에서 충분히 테스트
- [ ] 롤백 계획 수립
- [ ] 모니터링 및 알림 설정
- [ ] 점검 공지 (필요 시)

### 배포 후 확인사항

- [ ] 헬스 체크 엔드포인트 정상 (`/health`)
- [ ] 주요 API 엔드포인트 동작 확인
- [ ] 로그에 에러 없음
- [ ] 응답 시간 정상
- [ ] 데이터베이스 연결 정상

---

## 참고 자료

- [GCP Cloud Run 문서](https://cloud.google.com/run/docs)
- [GitHub Actions 문서](https://docs.github.com/actions)
- [Prisma 마이그레이션 가이드](https://www.prisma.io/docs/guides/migrate)
