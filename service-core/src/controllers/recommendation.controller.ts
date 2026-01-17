/**
 * 추천 시스템 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import axios from 'axios';
import { AppError } from '../middlewares/error.middleware';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * 구직자에게 적합한 공고 추천
 * GET /api/v1/recommendations/jobs
 * @requires JWT 인증 + CANDIDATE 권한
 */
export const recommendJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 5 } = req.query;

    // 사용자 프로필 조회 (최신 평가 결과 포함)
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!candidateProfile) {
      throw new AppError('프로필을 먼저 작성해주세요.', 400);
    }

    // 최신 평가 결과 조회 (실전 모드만)
    const latestEvaluation = await prisma.evaluation.findFirst({
      where: {
        interview: {
          candidateId: req.user.userId,
          mode: 'ACTUAL', // 실전 모드만
          status: 'COMPLETED',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 활성 공고 조회
    const jobPostings = await prisma.jobPosting.findMany({
      where: { status: 'ACTIVE' },
      take: 100, // 최대 100개까지 (너무 많으면 응답 시간 증가)
      orderBy: { createdAt: 'desc' },
    });

    if (jobPostings.length === 0) {
      res.status(200).json({
        recommendations: [],
        total: 0,
      });
      return;
    }

    // AI 서비스 호출 (추천)
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/ai/matching/recommend-jobs`,
      {
        candidateProfile: {
          userId: req.user.userId,
          resumeText: candidateProfile.resumeText,
          skills: candidateProfile.skills,
          experience: candidateProfile.experience,
          desiredPosition: candidateProfile.desiredPosition,
          // 5가지 역량 점수 포함 (있는 경우만)
          ...(latestEvaluation && {
            evaluation: {
              informationAnalysis: latestEvaluation.informationAnalysis,
              problemSolving: latestEvaluation.problemSolving,
              flexibleThinking: latestEvaluation.flexibleThinking,
              negotiation: latestEvaluation.negotiation,
              itSkills: latestEvaluation.itSkills,
            },
          }),
        },
        jobPostings: jobPostings.map((job) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          position: job.position,
          requirements: job.requirements,
          preferredSkills: job.preferredSkills,
          experienceMin: job.experienceMin,
          experienceMax: job.experienceMax,
        })),
        topK: Number(limit),
      },
      { timeout: 30000 }
    );

    const { recommendations } = response.data;

    res.status(200).json({
      recommendations,
      total: recommendations.length,
    });
  } catch (error: any) {
    console.error('[Recommendation] 공고 추천 오류:', error);
    if (error.response) {
      throw new AppError(
        error.response.data?.detail || '추천 서비스 오류',
        error.response.status
      );
    }
    next(error);
  }
};

/**
 * 채용담당자에게 적합한 후보자 추천
 * GET /api/v1/recommendations/candidates/:jobId
 * @requires JWT 인증 + RECRUITER 권한
 */
export const recommendCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 후보자 추천을 받을 수 있습니다.', 403);
    }

    const { jobId } = req.params;
    const { limit = 5 } = req.query;

    // 공고 조회 (권한 확인)
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!jobPosting) {
      throw new AppError('채용 공고를 찾을 수 없습니다.', 404);
    }

    if (jobPosting.recruiterId !== req.user.userId) {
      throw new AppError('접근 권한이 없습니다.', 403);
    }

    // 구직자 프로필 조회 (실전 인터뷰 완료자만)
    const candidateProfiles = await prisma.candidateProfile.findMany({
      take: 100, // 최대 100명
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            interviews: {
              where: {
                mode: 'ACTUAL',
                status: 'COMPLETED',
              },
              orderBy: { completedAt: 'desc' },
              take: 1,
              include: {
                evaluation: true,
              },
            },
          },
        },
      },
    });

    if (candidateProfiles.length === 0) {
      res.status(200).json({
        recommendations: [],
        total: 0,
      });
      return;
    }

    // AI 서비스 호출 (추천)
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/v1/ai/matching/recommend-candidates`,
      {
        jobPosting: {
          id: jobPosting.id,
          title: jobPosting.title,
          description: jobPosting.description,
          position: jobPosting.position,
          requirements: jobPosting.requirements,
          preferredSkills: jobPosting.preferredSkills,
          experienceMin: jobPosting.experienceMin,
          experienceMax: jobPosting.experienceMax,
        },
        candidateProfiles: candidateProfiles.map((profile) => {
          const latestEvaluation = profile.user.interviews[0]?.evaluation;
          return {
            userId: profile.userId,
            resumeText: profile.resumeText,
            skills: profile.skills,
            experience: profile.experience,
            desiredPosition: profile.desiredPosition,
            // 5가지 역량 점수 포함 (있는 경우만)
            ...(latestEvaluation && {
              evaluation: {
                informationAnalysis: latestEvaluation.informationAnalysis,
                problemSolving: latestEvaluation.problemSolving,
                flexibleThinking: latestEvaluation.flexibleThinking,
                negotiation: latestEvaluation.negotiation,
                itSkills: latestEvaluation.itSkills,
              },
            }),
          };
        }),
        topK: Number(limit),
      },
      { timeout: 30000 }
    );

    const { recommendations } = response.data;

    // 사용자 정보 추가
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const profile = candidateProfiles.find(
        (p) => p.userId === rec.candidate.userId
      );
      return {
        ...rec,
        candidate: {
          ...rec.candidate,
          user: profile?.user,
        },
      };
    });

    res.status(200).json({
      recommendations: enrichedRecommendations,
      total: enrichedRecommendations.length,
    });
  } catch (error: any) {
    console.error('[Recommendation] 후보자 추천 오류:', error);
    if (error.response) {
      throw new AppError(
        error.response.data?.detail || '추천 서비스 오류',
        error.response.status
      );
    }
    next(error);
  }
};

