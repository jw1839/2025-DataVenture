/**
 * 평가 관련 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';

/**
 * 인터뷰 평가 조회
 * GET /api/v1/evaluations/:interviewId
 * @requires JWT 인증
 */
export const getEvaluation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const { interviewId } = req.params;

    // 인터뷰 확인 (권한 체크)
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new AppError('인터뷰를 찾을 수 없습니다.', 404);
    }

    // 권한 확인: 본인의 인터뷰만 조회 가능
    if (interview.candidateId !== req.user.userId) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    // 평가 조회
    const evaluation = await prisma.evaluation.findUnique({
      where: { interviewId },
      include: {
        interview: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            jobPosting: {
              select: {
                title: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      throw new AppError('평가 결과를 찾을 수 없습니다. 아직 생성되지 않았을 수 있습니다.', 404);
    }

    // JSON 필드 파싱
    const strengthsList = JSON.parse(evaluation.strengthsJson);
    const weaknessesList = JSON.parse(evaluation.weaknessesJson);

    res.status(200).json({
      evaluation: {
        id: evaluation.id,
        interviewId: evaluation.interviewId,
        scores: {
          delivery: evaluation.deliveryScore,
          vocabulary: evaluation.vocabularyScore,
          comprehension: evaluation.comprehensionScore,
          communicationAvg: evaluation.communicationAvg,
          informationAnalysis: evaluation.informationAnalysis,
          problemSolving: evaluation.problemSolving,
          flexibleThinking: evaluation.flexibleThinking,
          negotiation: evaluation.negotiation,
          itSkills: evaluation.itSkills,
          overall: evaluation.overallScore,
        },
        feedback: {
          strengths: strengthsList,
          weaknesses: weaknessesList,
          summary: evaluation.detailedFeedback,
        },
        recommendedPositions: JSON.parse(evaluation.recommendedPositions || '[]'),
        matchingScore: evaluation.matchingScore,
        matchingReason: evaluation.matchingReason,
        createdAt: evaluation.createdAt,
        interview: evaluation.interview,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자의 모든 평가 조회
 * GET /api/v1/evaluations
 * @requires JWT 인증
 */
export const listEvaluations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    // 사용자의 인터뷰 목록 조회
    const interviews = await prisma.interview.findMany({
      where: {
        candidateId: req.user.userId,
        status: 'COMPLETED',
      },
      include: {
        evaluation: true,
        jobPosting: {
          select: {
            title: true,
            position: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // 평가가 있는 인터뷰만 필터링
    const evaluations = interviews
      .filter((interview) => interview.evaluation)
      .map((interview) => {
        const strengthsList = JSON.parse(interview.evaluation!.strengthsJson);
        const weaknessesList = JSON.parse(interview.evaluation!.weaknessesJson);

        return {
          id: interview.evaluation!.id,
          interviewId: interview.id,
          scores: {
            overall: interview.evaluation!.overallScore,
          },
          jobPosting: interview.jobPosting
            ? {
                title: interview.jobPosting.title,
                position: interview.jobPosting.position,
              }
            : null,
          completedAt: interview.completedAt,
          createdAt: interview.evaluation!.createdAt,
        };
      });

    res.status(200).json({
      evaluations,
      total: evaluations.length,
    });
  } catch (error) {
    next(error);
  }
};

