/**
 * 사용자 프로필 관련 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { body, validationResult } from 'express-validator';
import { AppError } from '../middlewares/error.middleware';

/**
 * 구직자 프로필 업데이트 검증 규칙
 */
export const candidateProfileValidation = [
  body('resumeText').optional().isString(),
  body('resumeUrl').optional().isURL().withMessage('유효한 URL을 입력해주세요.'),
  body('skills').optional().isArray().withMessage('기술 스택은 배열이어야 합니다.'),
  body('experience').optional().isInt({ min: 0 }).withMessage('경력은 0 이상의 정수여야 합니다.'),
  body('education').optional().isString(),
  body('desiredPosition').optional().isString(),
  body('desiredSalary').optional().isInt({ min: 0 }),
];

/**
 * 채용담당자 프로필 업데이트 검증 규칙
 */
export const recruiterProfileValidation = [
  body('companyName').notEmpty().withMessage('회사명을 입력해주세요.'),
  body('companyUrl').optional().isURL().withMessage('유효한 URL을 입력해주세요.'),
  body('position').notEmpty().withMessage('직책을 입력해주세요.'),
];

/**
 * 사용자 프로필 조회
 * GET /api/v1/users/:userId/profile
 */
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        candidateProfile: {
          select: {
            id: true,
            resumeText: true,
            resumeUrl: true,
            skills: true,
            experience: true,
            education: true,
            desiredPosition: true,
            desiredSalary: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        recruiterProfile: {
          select: {
            id: true,
            companyName: true,
            companyUrl: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 구직자 프로필 생성/업데이트
 * PUT /api/v1/candidates/:candidateId/profile
 */
export const updateCandidateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { candidateId } = req.params;

    // 권한 확인: 본인만 수정 가능
    if (req.user?.userId !== candidateId) {
      throw new AppError('본인의 프로필만 수정할 수 있습니다.', 403);
    }

    // 유효성 검증
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation Error',
        message: '입력값이 올바르지 않습니다.',
        details: errors.array(),
      });
      return;
    }

    const {
      resumeText,
      resumeUrl,
      skills,
      experience,
      education,
      desiredPosition,
      desiredSalary,
    } = req.body;

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: candidateId },
      include: { candidateProfile: true },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    if (user.role !== 'CANDIDATE') {
      throw new AppError('구직자만 이 프로필을 수정할 수 있습니다.', 403);
    }

    // 프로필 생성 또는 업데이트
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: candidateId },
      create: {
        userId: candidateId,
        resumeText,
        resumeUrl,
        skills: skills || [],
        experience,
        education,
        desiredPosition,
        desiredSalary,
      },
      update: {
        ...(resumeText !== undefined && { resumeText }),
        ...(resumeUrl !== undefined && { resumeUrl }),
        ...(skills !== undefined && { skills }),
        ...(experience !== undefined && { experience }),
        ...(education !== undefined && { education }),
        ...(desiredPosition !== undefined && { desiredPosition }),
        ...(desiredSalary !== undefined && { desiredSalary }),
      },
    });

    res.status(200).json({
      message: '프로필이 업데이트되었습니다.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 채용담당자 프로필 생성/업데이트
 * PUT /api/v1/recruiters/:recruiterId/profile
 */
export const updateRecruiterProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recruiterId } = req.params;

    // 권한 확인: 본인만 수정 가능
    if (req.user?.userId !== recruiterId) {
      throw new AppError('본인의 프로필만 수정할 수 있습니다.', 403);
    }

    // 유효성 검증
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation Error',
        message: '입력값이 올바르지 않습니다.',
        details: errors.array(),
      });
      return;
    }

    const { companyName, companyUrl, position } = req.body;

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: recruiterId },
      include: { recruiterProfile: true },
    });

    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404);
    }

    if (user.role !== 'RECRUITER') {
      throw new AppError('채용담당자만 이 프로필을 수정할 수 있습니다.', 403);
    }

    // 프로필 생성 또는 업데이트
    const profile = await prisma.recruiterProfile.upsert({
      where: { userId: recruiterId },
      create: {
        userId: recruiterId,
        companyName,
        companyUrl,
        position,
      },
      update: {
        companyName,
        ...(companyUrl !== undefined && { companyUrl }),
        position,
      },
    });

    res.status(200).json({
      message: '프로필이 업데이트되었습니다.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 기본 정보 업데이트
 * PUT /api/v1/users/:userId
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    // 권한 확인: 본인만 수정 가능
    if (req.user?.userId !== userId) {
      throw new AppError('본인의 정보만 수정할 수 있습니다.', 403);
    }

    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      res.status(400).json({
        error: 'Validation Error',
        message: '이름은 2자 이상이어야 합니다.',
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: '사용자 정보가 업데이트되었습니다.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

