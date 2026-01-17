/**
 * 채용 공고 관련 라우터
 */

import express from 'express';
import {
  createJobPosting,
  listJobPostings,
  getJobPosting,
  updateJobPosting,
  deleteJobPosting,
} from '../controllers/jobPosting.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * POST /api/v1/jobs
 * 채용 공고 생성
 * @requires JWT 인증 + RECRUITER 권한
 */
router.post('/', authenticate, authorize('RECRUITER', 'ADMIN'), createJobPosting);

/**
 * GET /api/v1/jobs
 * 채용 공고 목록 조회
 * @public
 */
router.get('/', listJobPostings);

/**
 * GET /api/v1/jobs/:id
 * 채용 공고 상세 조회
 * @public
 */
router.get('/:id', getJobPosting);

/**
 * PUT /api/v1/jobs/:id
 * 채용 공고 수정
 * @requires JWT 인증 + 작성자 본인
 */
router.put('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), updateJobPosting);

/**
 * DELETE /api/v1/jobs/:id
 * 채용 공고 삭제
 * @requires JWT 인증 + 작성자 본인
 */
router.delete('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), deleteJobPosting);

export default router;

