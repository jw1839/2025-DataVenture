/**
 * 평가 관련 라우터
 */

import express from 'express';
import { getEvaluation, listEvaluations } from '../controllers/evaluation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /api/v1/evaluations
 * 사용자의 모든 평가 조회
 * @requires JWT 인증
 */
router.get('/', authenticate, listEvaluations);

/**
 * GET /api/v1/evaluations/:interviewId
 * 특정 인터뷰의 평가 조회
 * @requires JWT 인증
 */
router.get('/:interviewId', authenticate, getEvaluation);

export default router;

