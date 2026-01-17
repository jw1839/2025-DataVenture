/**
 * 인터뷰 관련 REST API 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import { getUserInterviews, getInterview } from '../services/interview.service';
import { AppError } from '../middlewares/error.middleware';

/**
 * 사용자의 인터뷰 목록 조회
 * GET /api/v1/interviews
 * @requires JWT 인증
 */
export const listInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const interviews = await getUserInterviews(req.user.userId);

    res.status(200).json({
      interviews,
      total: interviews.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 인터뷰 상세 조회
 * GET /api/v1/interviews/:interviewId
 * @requires JWT 인증
 */
export const getInterviewDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const { interviewId } = req.params;

    const interview = await getInterview(interviewId);

    // 권한 확인: 본인의 인터뷰만 조회 가능
    if (interview.candidateId !== req.user.userId) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    res.status(200).json({
      interview,
    });
  } catch (error) {
    next(error);
  }
};

