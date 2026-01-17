/**
 * 인증 관련 라우터
 */

import express from 'express';
import {
  register,
  registerValidation,
  login,
  loginValidation,
  getCurrentUser,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * 회원가입
 */
router.post('/register', registerValidation, register);

/**
 * POST /api/v1/auth/login
 * 로그인
 */
router.post('/login', loginValidation, login);

/**
 * GET /api/v1/auth/me
 * 현재 사용자 정보 조회
 * @requires JWT 인증
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/v1/auth/logout
 * 로그아웃
 */
router.post('/logout', logout);

export default router;

