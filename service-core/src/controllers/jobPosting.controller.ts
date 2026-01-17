/**
 * 채용 공고 관련 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middlewares/error.middleware';

/**
 * 채용 공고 생성
 * POST /api/v1/jobs
 * @requires JWT 인증 + RECRUITER 권한
 */
export const createJobPosting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[JobPosting Controller] 요청 받음');
    console.log('[JobPosting Controller] req.user:', req.user);
    console.log('[JobPosting Controller] req.body:', req.body);

    const {
      title,
      description,
      position,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      requirements,
      preferredSkills,
    } = req.body;

    // 필수 필드 검증
    if (!title || !description || !position) {
      console.error('[JobPosting Controller] 필수 필드 누락:', { title, description, position });
      throw new AppError('필수 필드가 누락되었습니다.', 400);
    }

    if (!req.user || !req.user.userId) {
      console.error('[JobPosting Controller] 사용자 정보 없음:', req.user);
      throw new AppError('인증된 사용자 정보가 없습니다.', 401);
    }

    console.log('[JobPosting Controller] userId:', req.user.userId);

    // RecruiterProfile 조회 (userId로 찾기)
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!recruiterProfile) {
      console.error('[JobPosting Controller] RecruiterProfile 없음. userId:', req.user.userId);
      throw new AppError('채용담당자 프로필을 찾을 수 없습니다.', 404);
    }

    console.log('[JobPosting Controller] recruiterProfile.id:', recruiterProfile.id);

    const jobPosting = await prisma.jobPosting.create({
      data: {
        title,
        description,
        position,
        experienceMin: experienceMin || 0,
        experienceMax: experienceMax || null,
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
        requirements: requirements || [],
        preferredSkills: preferredSkills || [],
        recruiterId: recruiterProfile.id, // RecruiterProfile.id 사용
        status: 'ACTIVE',
      },
    });

    res.status(201).json({
      message: '채용 공고가 생성되었습니다.',
      jobPosting,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용 공고 목록 조회
 * GET /api/v1/jobs
 * @public (인증 불필요)
 */
export const listJobPostings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status = 'ACTIVE', position, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // 필터 구성
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (position) {
      where.position = { contains: position as string, mode: 'insensitive' };
    }

    // 회사 필드는 스키마에 존재하지 않음 (회사 정보는 RecruiterProfile 참조)

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          salaryMin: true,
          salaryMax: true,
          experienceMin: true,
          experienceMax: true,
          requirements: true,
          preferredSkills: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    res.status(200).json({
      jobs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용 공고 상세 조회
 * GET /api/v1/jobs/:id
 * @public
 */
export const getJobPosting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        recruiter: {
          select: {
            id: true,
            companyName: true,
            position: true,
          },
        },
      },
    });

    if (!jobPosting) {
      throw new AppError('채용 공고를 찾을 수 없습니다.', 404);
    }

    res.status(200).json({ jobPosting });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용 공고 수정
 * PUT /api/v1/jobs/:id
 * @requires JWT 인증 + 작성자 본인
 */
export const updateJobPosting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const { id } = req.params;

    // 권한 확인
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existingJob) {
      throw new AppError('채용 공고를 찾을 수 없습니다.', 404);
    }

    if (existingJob.recruiterId !== req.user.userId) {
      throw new AppError('수정 권한이 없습니다.', 403);
    }

    const {
      title,
      description,
      position,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      requirements,
      preferredSkills,
      status,
    } = req.body;

    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: {
        title,
        description,
        position,
        salaryMin,
        salaryMax,
        experienceMin,
        experienceMax,
        requirements,
        preferredSkills,
        status,
      },
    });

    res.status(200).json({
      message: '채용 공고가 수정되었습니다.',
      jobPosting: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용 공고 삭제
 * DELETE /api/v1/jobs/:id
 * @requires JWT 인증 + 작성자 본인
 */
export const deleteJobPosting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401);
    }

    const { id } = req.params;

    // 권한 확인
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existingJob) {
      throw new AppError('채용 공고를 찾을 수 없습니다.', 404);
    }

    if (existingJob.recruiterId !== req.user.userId) {
      throw new AppError('삭제 권한이 없습니다.', 403);
    }

    await prisma.jobPosting.delete({
      where: { id },
    });

    res.status(200).json({
      message: '채용 공고가 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

