/**
 * 대시보드 라우트
 */

import express from 'express';
import {
  getRecruiterStats,
  getRecruiterApplicants,
  getSkillDistribution,
} from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

// 채용담당자 대시보드 API
router.get(
  '/recruiter/stats',
  authenticate,
  authorize('RECRUITER', 'ADMIN'),
  getRecruiterStats
);

router.get(
  '/recruiter/applicants',
  authenticate,
  authorize('RECRUITER', 'ADMIN'),
  getRecruiterApplicants
);

router.get(
  '/recruiter/skill-distribution',
  authenticate,
  authorize('RECRUITER', 'ADMIN'),
  getSkillDistribution
);

export default router;

