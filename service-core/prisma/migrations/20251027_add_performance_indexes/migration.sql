-- =====================================================
-- 성능 최적화를 위한 인덱스 추가
-- Sprint 6: 테스트 & 최적화
-- =====================================================

-- 인터뷰 관련 인덱스
CREATE INDEX IF NOT EXISTS "idx_interviews_candidate_id" ON "interviews"("candidateId");
CREATE INDEX IF NOT EXISTS "idx_interviews_status" ON "interviews"("status");
CREATE INDEX IF NOT EXISTS "idx_interviews_started_at" ON "interviews"("startedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_interviews_candidate_status" ON "interviews"("candidateId", "status");

-- 인터뷰 메시지 인덱스
CREATE INDEX IF NOT EXISTS "idx_interview_messages_interview_id" ON "interview_messages"("interviewId");
CREATE INDEX IF NOT EXISTS "idx_interview_messages_created_at" ON "interview_messages"("createdAt" ASC);

-- 채용 공고 인덱스
CREATE INDEX IF NOT EXISTS "idx_job_postings_status" ON "job_postings"("status");
CREATE INDEX IF NOT EXISTS "idx_job_postings_recruiter_id" ON "job_postings"("recruiterId");
CREATE INDEX IF NOT EXISTS "idx_job_postings_position" ON "job_postings"("position");
CREATE INDEX IF NOT EXISTS "idx_job_postings_created_at" ON "job_postings"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_job_postings_status_position" ON "job_postings"("status", "position");

-- 평가 인덱스
CREATE INDEX IF NOT EXISTS "idx_evaluations_interview_id" ON "evaluations"("interviewId");
CREATE INDEX IF NOT EXISTS "idx_evaluations_overall_score" ON "evaluations"("overallScore" DESC);
CREATE INDEX IF NOT EXISTS "idx_evaluations_created_at" ON "evaluations"("createdAt" DESC);

-- 프로필 인덱스
CREATE INDEX IF NOT EXISTS "idx_candidate_profiles_user_id" ON "candidate_profiles"("userId");
CREATE INDEX IF NOT EXISTS "idx_recruiter_profiles_user_id" ON "recruiter_profiles"("userId");
CREATE INDEX IF NOT EXISTS "idx_recruiter_profiles_company_name" ON "recruiter_profiles"("companyName");

-- 복합 인덱스 (자주 함께 조회되는 컬럼)
CREATE INDEX IF NOT EXISTS "idx_interviews_candidate_completed" ON "interviews"("candidateId", "completedAt") WHERE "status" = 'COMPLETED';

-- 부분 인덱스 (조건부 인덱스)
CREATE INDEX IF NOT EXISTS "idx_job_postings_active" ON "job_postings"("createdAt" DESC) WHERE "status" = 'ACTIVE';

