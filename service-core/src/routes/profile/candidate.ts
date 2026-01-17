import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { generateSlug, generateUniqueUsername } from '../../utils/slug';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/profile/candidate/@:username
 * 공개 프로필 조회 (uniqueUrl 기반)
 */
router.get('/@:username', async (req, res) => {
  try {
    const { username } = req.params;

    const profile = await prisma.candidateProfile.findUnique({
      where: { uniqueUrl: username },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: '프로필을 찾을 수 없습니다.' });
    }

    // 민감한 정보 제외하고 반환
    const { user, ...profileData } = profile;
    
    // 프론트엔드 호환을 위한 필드명 변환
    const responseProfile = {
      ...profileData,
      photoUrl: profileData.profileImageUrl,
      educationJson: profileData.education,
      experienceJson: profileData.careerHistory,
      projectsJson: profileData.projects,
      skillsJson: profileData.skills,
      portfolioFileUrl: profileData.portfolioUrl,
      name: user.name,
    };
    
    res.json(responseProfile);
  } catch (error) {
    console.error('공개 프로필 조회 오류:', error);
    res.status(500).json({ error: '프로필 조회에 실패했습니다.' });
  }
});

/**
 * GET /api/v1/profile/candidate/me
 * 현재 로그인한 사용자의 프로필 조회
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    let profile = await prisma.candidateProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // 프로필이 없으면 자동 생성
    if (!profile) {
      const newProfile = await prisma.candidateProfile.create({
        data: {
          userId: req.user.id,
        },
      });
      
      profile = await prisma.candidateProfile.findUnique({
        where: { id: newProfile.id },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    }

    // 프론트엔드 호환을 위한 필드명 변환
    const responseProfile = {
      ...profile,
      photoUrl: profile?.profileImageUrl, // 필드명 매핑
      educationJson: profile?.education, // 필드명 매핑
      experienceJson: profile?.careerHistory, // 필드명 매핑
      projectsJson: profile?.projects,
      skillsJson: profile?.skills,
      portfolioFileUrl: profile?.portfolioUrl,
    };

    res.json(responseProfile);
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: '프로필 조회에 실패했습니다.' });
  }
});

/**
 * GET /api/v1/profile/candidate/:id
 * 구직자 프로필 조회 (ID 기반, 인증 필요)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: '프로필을 찾을 수 없습니다.' });
    }

    // 프론트엔드 호환을 위한 필드명 변환
    const responseProfile = {
      ...profile,
      photoUrl: profile.profileImageUrl,
      educationJson: profile.education,
      experienceJson: profile.careerHistory,
      projectsJson: profile.projects,
      skillsJson: profile.skills,
      portfolioFileUrl: profile.portfolioUrl,
    };

    res.json(responseProfile);
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ error: '프로필 조회에 실패했습니다.' });
  }
});

/**
 * PUT /api/v1/profile/candidate/:id
 * 구직자 프로필 업데이트
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const {
      photoUrl, // → profileImageUrl로 매핑
      bio,
      educationJson, // → education으로 매핑
      experienceJson, // → careerHistory로 매핑
      projectsJson, // → projects로 매핑
      skillsJson, // → skills로 매핑
      portfolioUrl,
      blogUrl,
      githubUrl,
      linkedinUrl,
      resumeUrl,
      portfolioFileUrl, // → portfolioUrl로 매핑
      desiredPosition,
      desiredSalary,
      experience, // 총 경력 (년)
      education, // 최종 학력
      portfolioWebUrl,
    } = req.body;

    // 권한 확인 (본인만 수정 가능)
    const profile = await prisma.candidateProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      return res.status(404).json({ error: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.userId !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // uniqueUrl 자동 생성 (없는 경우만)
    let uniqueUrl = profile.uniqueUrl;
    if (!uniqueUrl) {
      const user = await prisma.user.findUnique({ where: { id: profile.userId } });
      if (user) {
        const baseName = user.name || `user-${profile.userId.slice(0, 8)}`;
        const existingUrls = await prisma.candidateProfile.findMany({
          select: { uniqueUrl: true },
        });
        const urls = existingUrls.map(p => p.uniqueUrl).filter(Boolean) as string[];
        uniqueUrl = generateUniqueUsername(baseName, urls);
      }
    }

    // JSON 데이터 처리 헬퍼
    const toJsonString = (data: any) => {
      if (!data) return null;
      if (typeof data === 'string') return data;
      if (Array.isArray(data)) return JSON.stringify(data);
      return JSON.stringify(data);
    };

    // skills 배열 처리
    const processSkills = (data: any): string[] | undefined => {
      if (!data) return undefined;
      if (Array.isArray(data)) return data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const updatedProfile = await prisma.candidateProfile.update({
      where: { id },
      data: {
        ...(photoUrl !== undefined && { profileImageUrl: photoUrl }), // 필드명 매핑
        ...(bio !== undefined && { bio }),
        ...(educationJson !== undefined && { education: toJsonString(educationJson) }),
        ...(experienceJson !== undefined && { careerHistory: toJsonString(experienceJson) }),
        ...(projectsJson !== undefined && { projects: toJsonString(projectsJson) }),
        ...(skillsJson !== undefined && { skills: processSkills(skillsJson) || [] }),
        ...(portfolioFileUrl !== undefined && { portfolioUrl: portfolioFileUrl }),
        ...(portfolioWebUrl !== undefined && { portfolioWebUrl }),
        ...(blogUrl !== undefined && { blogUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(resumeUrl !== undefined && { resumeUrl }),
        ...(desiredPosition !== undefined && { desiredPosition }),
        ...(desiredSalary !== undefined && { desiredSalary }),
        ...(experience !== undefined && { experience }),
        ...(education !== undefined && { education }),
        uniqueUrl, // 자동 생성된 uniqueUrl 저장
      },
    });

    // 프론트엔드 호환을 위한 필드명 변환
    const responseProfile = {
      ...updatedProfile,
      photoUrl: updatedProfile.profileImageUrl,
      educationJson: updatedProfile.education,
      experienceJson: updatedProfile.careerHistory,
      projectsJson: updatedProfile.projects,
      skillsJson: updatedProfile.skills,
      portfolioFileUrl: updatedProfile.portfolioUrl,
    };

    res.json(responseProfile);
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    res.status(500).json({ 
      error: '프로필 업데이트에 실패했습니다.',
      details: errorMessage 
    });
  }
});

export default router;
