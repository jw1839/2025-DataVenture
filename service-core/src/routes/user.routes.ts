/**
 * 사용자 관련 라우터
 */

import express from 'express';
import {
  getUserProfile,
  updateCandidateProfile,
  candidateProfileValidation,
  updateRecruiterProfile,
  recruiterProfileValidation,
  updateUser,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * GET /api/v1/users/:userId/profile
 * 사용자 프로필 조회
 */
router.get('/:userId/profile', getUserProfile);

/**
 * PUT /api/v1/users/:userId
 * 사용자 기본 정보 업데이트
 * @requires JWT 인증
 */
router.put('/:userId', authenticate, updateUser);

/**
 * PUT /api/v1/candidates/:candidateId/profile
 * 구직자 프로필 생성/업데이트
 * @requires JWT 인증
 */
router.put(
  '/candidates/:candidateId/profile',
  authenticate,
  candidateProfileValidation,
  updateCandidateProfile
);

/**
 * PUT /api/v1/recruiters/:recruiterId/profile
 * 채용담당자 프로필 생성/업데이트
 * @requires JWT 인증
 */
router.put(
  '/recruiters/:recruiterId/profile',
  authenticate,
  recruiterProfileValidation,
  updateRecruiterProfile
);

export default router;

