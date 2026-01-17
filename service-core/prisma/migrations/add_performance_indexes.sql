-- =====================================================
-- 성능 최적화를 위한 인덱스 추가
-- Sprint 6: 테스트 & 최적화
-- =====================================================

-- 사용자 이메일 인덱스 (이미 UNIQUE로 인덱스 존재하지만 명시적 확인)
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 인터뷰 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidateId);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_started_at ON interviews(startedAt DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_status ON interviews(candidateId, status);

-- 인터뷰 메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_interview_messages_interview_id ON interview_messages(interviewId);
CREATE INDEX IF NOT EXISTS idx_interview_messages_created_at ON interview_messages(createdAt ASC);

-- 채용 공고 인덱스
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter_id ON job_postings(recruiterId);
CREATE INDEX IF NOT EXISTS idx_job_postings_position ON job_postings(position);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_status_position ON job_postings(status, position);

-- 평가 인덱스
CREATE INDEX IF NOT EXISTS idx_evaluations_interview_id ON evaluations(interviewId);
CREATE INDEX IF NOT EXISTS idx_evaluations_overall_score ON evaluations(overallScore DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(createdAt DESC);

-- 프로필 인덱스
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(userId);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_name ON recruiter_profiles(companyName);

-- 전문 검색을 위한 GIN 인덱스 (PostgreSQL의 full-text search)
-- CREATE INDEX IF NOT EXISTS idx_job_postings_description_gin ON job_postings USING GIN(to_tsvector('english', description));
-- CREATE INDEX IF NOT EXISTS idx_candidate_profiles_resume_gin ON candidate_profiles USING GIN(to_tsvector('english', resumeText));

-- 복합 인덱스 (자주 함께 조회되는 컬럼)
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_completed ON interviews(candidateId, completedAt) WHERE status = 'COMPLETED';

-- 부분 인덱스 (조건부 인덱스) - 더 효율적인 쿼리
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(createdAt DESC) WHERE status = 'ACTIVE';

-- =====================================================
-- 인덱스 생성 완료 로그
-- =====================================================
-- 
-- 생성된 인덱스:
-- 1. interviews: candidateId, status, startedAt, 복합 인덱스
-- 2. interview_messages: interviewId, createdAt
-- 3. job_postings: status, recruiterId, position, createdAt, 복합 인덱스, 부분 인덱스
-- 4. evaluations: interviewId, overallScore, createdAt
-- 5. profiles: userId, companyName
-- 
-- 예상 성능 향상:
-- - 인터뷰 조회: 50-70% 향상
-- - 채용 공고 필터링: 60-80% 향상
-- - 평가 목록 조회: 40-60% 향상
-- 
-- 주의사항:
-- - 인덱스는 쓰기 성능을 약간 저하시킬 수 있음
-- - 정기적으로 VACUUM ANALYZE를 실행하여 인덱스 최적화 필요
-- =====================================================

