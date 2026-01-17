/**
 * 인증 관련 컨트롤러
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/error.middleware';

/**
 * 회원가입 요청 검증 규칙
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('이름은 2자 이상 50자 이하여야 합니다.'),
  body('role')
    .optional()
    .isIn(['CANDIDATE', 'RECRUITER', 'ADMIN'])
    .withMessage('역할은 CANDIDATE, RECRUITER, ADMIN 중 하나여야 합니다.'),
];

/**
 * 로그인 요청 검증 규칙
 */
export const loginValidation = [
  body('email').isEmail().withMessage('유효한 이메일 주소를 입력해주세요.'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
];

/**
 * 회원가입
 * POST /api/v1/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const { email, password, name, role = 'CANDIDATE' } = req.body;

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        error: 'Conflict',
        message: '이미 사용 중인 이메일입니다.',
      });
      return;
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 생성 및 프로필 자동 생성
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // 역할에 따라 프로필 자동 생성
    if (role === 'CANDIDATE') {
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
        },
      });
    } else if (role === 'RECRUITER') {
      await prisma.recruiterProfile.create({
        data: {
          userId: user.id,
          companyName: '', // 기본값 설정 (프로필 페이지에서 입력)
          position: '채용담당자', // 기본값 설정 (프로필 페이지에서 수정 가능)
        },
      });
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 로그인
 * POST /api/v1/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const { email, password } = req.body;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: '로그인에 성공했습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 현재 사용자 정보 조회
 * GET /api/v1/auth/me
 * @requires JWT 인증
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증 정보가 없습니다.', 401);
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
            skills: true,
            experience: true,
            desiredPosition: true,
          },
        },
        recruiterProfile: {
          select: {
            id: true,
            companyName: true,
            position: true,
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
 * 로그아웃
 * POST /api/v1/auth/logout
 * 
 * JWT는 stateless이므로 서버에서 할 작업은 없다.
 * 클라이언트에서 토큰을 삭제하면 된다.
 */
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({
    message: '로그아웃되었습니다. 클라이언트에서 토큰을 삭제해주세요.',
  });
};

