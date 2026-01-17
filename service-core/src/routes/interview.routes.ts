/**
 * 인터뷰 관련 라우터
 */

import express from 'express';
import { listInterviews, getInterviewDetail } from '../controllers/interview.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /api/v1/interviews
 * 사용자의 인터뷰 목록 조회
 * @requires JWT 인증
 */
router.get('/', authenticate, listInterviews);

/**
 * GET /api/v1/interviews/:interviewId
 * 특정 인터뷰 상세 조회
 * @requires JWT 인증
 */
router.get('/:interviewId', authenticate, getInterviewDetail);

export default router;

