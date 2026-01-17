/**
 * 추천 시스템 라우터
 */

import express from 'express';
import {
  recommendJobs,
  recommendCandidates,
} from '../controllers/recommendation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /api/v1/recommendations/jobs
 * 구직자에게 적합한 공고 추천
 * @requires JWT 인증 + CANDIDATE 권한
 */
router.get('/jobs', authenticate, authorize('CANDIDATE', 'ADMIN'), recommendJobs);

/**
 * GET /api/v1/recommendations/candidates/:jobId
 * 채용담당자에게 적합한 후보자 추천
 * @requires JWT 인증 + RECRUITER 권한
 */
router.get('/candidates/:jobId', authenticate, authorize('RECRUITER', 'ADMIN'), recommendCandidates);

export default router;

