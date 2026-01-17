/**
 * 대시보드 통계 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';

/**
 * 채용담당자 프로필 조회 (없으면 자동 생성)
 * @param userId 사용자 ID
 * @returns RecruiterProfile
 */
async function getOrCreateRecruiterProfile(userId: string) {
  let profile = await prisma.recruiterProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    // 회원가입 시 프로필이 생성되지 않은 경우 자동 생성
    profile = await prisma.recruiterProfile.create({
      data: {
        userId,
        companyName: '',
        position: '채용담당자',
      },
    });
  }

  return profile;
}

/**
 * 채용담당자 대시보드 통계
 * GET /api/v1/dashboard/recruiter/stats
 * @requires JWT 인증 + RECRUITER 권한
 */
export const getRecruiterStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 접근 가능합니다.', 403);
    }

    const recruiterId = req.user.userId;

    // 채용담당자 프로필 조회 (없으면 자동 생성)
    const recruiterProfile = await getOrCreateRecruiterProfile(recruiterId);

    // 1. 활성 공고 수
    const activeJobCount = await prisma.jobPosting.count({
      where: {
        recruiterId: recruiterProfile.id,
        status: 'ACTIVE',
      },
    });

    // 2. 전체 지원자 수
    const totalApplicants = await prisma.application.count({
      where: {
        jobPosting: {
          recruiterId: recruiterProfile.id,
        },
      },
    });

    // 3. 평균 매칭 점수 계산 (평가가 있는 지원자만)
    const applicationsWithEvaluation = await prisma.application.findMany({
      where: {
        jobPosting: {
          recruiterId: recruiterProfile.id,
        },
        candidate: {
          interviews: {
            some: {
              mode: 'ACTUAL',
              status: 'COMPLETED',
              evaluation: {
                isNot: null,
              },
            },
          },
        },
      },
      include: {
        candidate: {
          include: {
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

    const avgMatchingScore =
      applicationsWithEvaluation.length > 0
        ? applicationsWithEvaluation.reduce(
            (sum, app) =>
              sum + (app.candidate.interviews[0]?.evaluation?.overallScore || 0),
            0
          ) / applicationsWithEvaluation.length
        : 0;

    // 4. 프로필 조회 수 (현재는 지원자 수로 대체, 추후 조회 로그 추가 가능)
    const profileViews = totalApplicants;

    res.status(200).json({
      activeJobCount,
      totalApplicants,
      avgMatchingScore: Math.round(avgMatchingScore),
      profileViews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용담당자 지원자 목록
 * GET /api/v1/dashboard/recruiter/applicants
 * @requires JWT 인증 + RECRUITER 권한
 */
export const getRecruiterApplicants = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 접근 가능합니다.', 403);
    }

    const recruiterId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    // 채용담당자 프로필 조회 (없으면 자동 생성)
    const recruiterProfile = await getOrCreateRecruiterProfile(recruiterId);

    // 지원자 목록 조회
    const applications = await prisma.application.findMany({
      where: {
        jobPosting: {
          recruiterId: recruiterProfile.id,
        },
      },
      include: {
        candidate: {
          include: {
            candidateProfile: true,
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
        jobPosting: {
          select: {
            id: true,
            title: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const applicants = applications.map((app) => {
      const latestEvaluation = app.candidate.interviews[0]?.evaluation;
      return {
        id: app.id,
        candidateId: app.candidate.id,
        name: app.candidate.name,
        email: app.candidate.email,
        position: app.candidate.candidateProfile?.desiredPosition || '미정',
        experience: app.candidate.candidateProfile?.experience || 0,
        matchScore: latestEvaluation?.matchingScore || 0,
        overallScore: latestEvaluation?.overallScore || 0,
        appliedDate: app.createdAt.toISOString().split('T')[0],
        status: app.status,
        jobPosting: app.jobPosting,
      };
    });

    const total = await prisma.application.count({
      where: {
        jobPosting: {
          recruiterId: recruiterProfile.id,
        },
      },
    });

    res.status(200).json({
      applicants,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용담당자 역량 분포 통계
 * GET /api/v1/dashboard/recruiter/skill-distribution
 * @requires JWT 인증 + RECRUITER 권한
 */
export const getSkillDistribution = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 접근 가능합니다.', 403);
    }

    const recruiterId = req.user.userId;

    // 채용담당자 프로필 조회 (없으면 자동 생성)
    const recruiterProfile = await getOrCreateRecruiterProfile(recruiterId);

    // 지원자들의 평가 결과 조회
    const evaluations = await prisma.evaluation.findMany({
      where: {
        interview: {
          candidate: {
            applications: {
              some: {
                jobPosting: {
                  recruiterId: recruiterProfile.id,
                },
              },
            },
          },
          mode: 'ACTUAL',
          status: 'COMPLETED',
        },
      },
    });

    if (evaluations.length === 0) {
      res.status(200).json({
        distribution: [
          { name: '정보분석', value: 0 },
          { name: '문제해결', value: 0 },
          { name: '유연사고', value: 0 },
          { name: '협상설득', value: 0 },
          { name: 'IT능력', value: 0 },
        ],
      });
      return;
    }

    // 5가지 역량 평균 계산
    const avgInformationAnalysis =
      evaluations.reduce((sum, e) => sum + e.informationAnalysis, 0) /
      evaluations.length;
    const avgProblemSolving =
      evaluations.reduce((sum, e) => sum + e.problemSolving, 0) /
      evaluations.length;
    const avgFlexibleThinking =
      evaluations.reduce((sum, e) => sum + e.flexibleThinking, 0) /
      evaluations.length;
    const avgNegotiation =
      evaluations.reduce((sum, e) => sum + e.negotiation, 0) / evaluations.length;
    const avgItSkills =
      evaluations.reduce((sum, e) => sum + e.itSkills, 0) / evaluations.length;

    res.status(200).json({
      distribution: [
        { name: '정보분석', value: Math.round(avgInformationAnalysis) },
        { name: '문제해결', value: Math.round(avgProblemSolving) },
        { name: '유연사고', value: Math.round(avgFlexibleThinking) },
        { name: '협상설득', value: Math.round(avgNegotiation) },
        { name: 'IT능력', value: Math.round(avgItSkills) },
      ],
    });
  } catch (error) {
    next(error);
  }
};

