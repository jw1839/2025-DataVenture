/**
 * 지원서 관련 라우터
 */

import express from 'express';
import {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  deleteApplication,
} from '../controllers/application.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * POST /api/v1/applications
 * 지원서 제출
 * @requires JWT 인증 + CANDIDATE 권한
 */
router.post('/', authenticate, authorize('CANDIDATE'), createApplication);

/**
 * GET /api/v1/applications/my
 * 내 지원서 목록 조회
 * @requires JWT 인증 + CANDIDATE 권한
 */
router.get('/my', authenticate, authorize('CANDIDATE'), getMyApplications);

/**
 * GET /api/v1/applications/job/:jobId
 * 특정 공고의 지원자 목록 조회
 * @requires JWT 인증 + RECRUITER 권한
 */
router.get('/job/:jobId', authenticate, authorize('RECRUITER'), getJobApplications);

/**
 * PUT /api/v1/applications/:id/status
 * 지원서 상태 업데이트
 * @requires JWT 인증 + RECRUITER 권한
 */
router.put('/:id/status', authenticate, authorize('RECRUITER'), updateApplicationStatus);

/**
 * DELETE /api/v1/applications/:id
 * 지원서 취소
 * @requires JWT 인증 + 본인 확인
 */
router.delete('/:id', authenticate, deleteApplication);

export default router;

