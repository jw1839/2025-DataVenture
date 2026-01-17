/**
 * 지원서 관련 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';

/**
 * 지원서 제출
 * POST /api/v1/applications
 * @requires JWT 인증 + CANDIDATE 권한
 */
export const createApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobPostingId, coverLetter } = req.body;

    // 필수 필드 검증
    if (!jobPostingId) {
      throw new AppError('채용 공고 ID가 필요합니다.', 400);
    }

    // 채용 공고 존재 확인
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting) {
      throw new AppError('채용 공고를 찾을 수 없습니다.', 404);
    }

    if (jobPosting.status !== 'ACTIVE') {
      throw new AppError('마감된 채용 공고입니다.', 400);
    }

    // 중복 지원 확인
    const existingApplication = await prisma.application.findFirst({
      where: {
        candidateId: req.user.userId,
        jobPostingId,
      },
    });

    if (existingApplication) {
      throw new AppError('이미 지원한 공고입니다.', 400);
    }

    // 지원서 생성
    const application = await prisma.application.create({
      data: {
        candidateId: req.user.userId,
        jobPostingId,
        coverLetter: coverLetter || null,
        status: 'PENDING',
      },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            position: true,
          },
        },
      },
    });

    res.status(201).json({
      message: '지원서가 제출되었습니다.',
      application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 내 지원서 목록 조회 (구직자용)
 * GET /api/v1/applications/my
 * @requires JWT 인증 + CANDIDATE 권한
 */
export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'CANDIDATE') {
      throw new AppError('구직자만 조회할 수 있습니다.', 403);
    }

    const { status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      candidateId: req.user.userId,
    };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          jobPosting: {
            select: {
              id: true,
              title: true,
              position: true,
              recruiter: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    res.status(200).json({
      applications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 공고의 지원자 목록 조회 (채용담당자용)
 * GET /api/v1/applications/job/:jobId
 * @requires JWT 인증 + RECRUITER 권한
 */
export const getJobApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 조회할 수 있습니다.', 403);
    }

    const { jobId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // 채용 공고 소유권 확인
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!jobPosting) {
      throw new AppError('채용 공고를 찾을 수 없습니다.', 404);
    }

    if (jobPosting.recruiterId !== req.user.userId) {
      throw new AppError('권한이 없습니다.', 403);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      jobPostingId: jobId,
    };

    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              candidateProfile: {
                select: {
                  profileImageUrl: true,
                  resumeUrl: true,
                  skills: true,
                  experience: true,
                  desiredPosition: true,
                },
              },
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    res.status(200).json({
      applications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 지원서 상태 업데이트 (채용담당자용)
 * PUT /api/v1/applications/:id/status
 * @requires JWT 인증 + RECRUITER 권한
 */
export const updateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 수정할 수 있습니다.', 403);
    }

    const { id } = req.params;
    const { status } = req.body;

    // 유효성 검사
    if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      throw new AppError('유효하지 않은 상태입니다.', 400);
    }

    // 지원서 조회 및 권한 확인
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        jobPosting: true,
      },
    });

    if (!application) {
      throw new AppError('지원서를 찾을 수 없습니다.', 404);
    }

    if (application.jobPosting.recruiterId !== req.user.userId) {
      throw new AppError('권한이 없습니다.', 403);
    }

    // 상태 업데이트
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      message: '지원서 상태가 업데이트되었습니다.',
      application: updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 지원서 취소 (구직자용)
 * DELETE /api/v1/applications/:id
 * @requires JWT 인증 + 본인 확인
 */
export const deleteApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const { id } = req.params;

    // 지원서 조회
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new AppError('지원서를 찾을 수 없습니다.', 404);
    }

    // 본인 확인
    if (application.candidateId !== req.user.userId) {
      throw new AppError('삭제 권한이 없습니다.', 403);
    }

    // 이미 처리된 지원서는 삭제 불가
    if (application.status !== 'PENDING') {
      throw new AppError('이미 처리된 지원서는 취소할 수 없습니다.', 400);
    }

    // 삭제
    await prisma.application.delete({
      where: { id },
    });

    res.status(200).json({
      message: '지원서가 취소되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

