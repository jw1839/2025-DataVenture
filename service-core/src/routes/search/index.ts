import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/search
 * 통합 검색 (구직자/채용담당자)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20, offset = 0 } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    
    const userRole = req.user.role;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }

    const searchQuery = q.trim();
    const results: any = {
      query: searchQuery,
      candidates: [],
      recruiters: [],
      totalCount: 0,
    };

    // 구직자 검색 (채용담당자만 가능)
    if ((type === 'all' || type === 'candidate') && userRole === 'RECRUITER') {
      const candidates = await prisma.candidateProfile.findMany({
        where: {
          OR: [
            { bio: { contains: searchQuery, mode: 'insensitive' } },
            { desiredPosition: { contains: searchQuery, mode: 'insensitive' } },
            { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { updatedAt: 'desc' },
      });

      results.candidates = candidates.map(c => ({
        id: c.id,
        userId: c.userId,
        name: c.user.name,
        photoUrl: c.profileImageUrl,
        bio: c.bio,
        skills: c.skills || [],
        desiredPosition: c.desiredPosition,
        experience: c.experience,
        education: c.education,
        uniqueUrl: c.uniqueUrl,
      }));
    }

    // 채용담당자/회사 검색 (구직자만 가능)
    if ((type === 'all' || type === 'recruiter') && userRole === 'CANDIDATE') {
      const recruiters = await prisma.recruiterProfile.findMany({
        where: {
          OR: [
            { companyName: { contains: searchQuery, mode: 'insensitive' } },
            { companyDescription: { contains: searchQuery, mode: 'insensitive' } },
            { position: { contains: searchQuery, mode: 'insensitive' } },
            { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { updatedAt: 'desc' },
      });

      results.recruiters = recruiters.map(r => ({
        id: r.id,
        userId: r.userId,
        name: r.user.name,
        companyName: r.companyName,
        companyLogoUrl: r.companyLogo,
        companyDescription: r.companyDescription,
        position: r.position,
        uniqueUrl: r.uniqueUrl,
      }));
    }

    results.totalCount = results.candidates.length + results.recruiters.length;

    res.json(results);
  } catch (error) {
    console.error('검색 오류:', error);
    res.status(500).json({ 
      error: '검색에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * GET /api/v1/search/suggestions
 * 검색 자동완성 제안
 */
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    
    const userRole = req.user.role;

    if (!q || typeof q !== 'string') {
      return res.json({ suggestions: [] });
    }

    const searchQuery = q.trim();
    const suggestions: string[] = [];

    if (userRole === 'RECRUITER') {
      // 구직자의 스킬, 포지션 제안
      const profiles = await prisma.candidateProfile.findMany({
        where: {
          desiredPosition: { contains: searchQuery, mode: 'insensitive' },
        },
        select: { skills: true, desiredPosition: true },
        take: Number(limit),
      });

      profiles.forEach(p => {
        if (p.skills && Array.isArray(p.skills)) {
          p.skills.forEach((skill: string) => {
            if (skill.toLowerCase().includes(searchQuery.toLowerCase()) && !suggestions.includes(skill)) {
              suggestions.push(skill);
            }
          });
        }
      });
    } else {
      // 회사명, 모집 포지션 제안
      const companies = await prisma.recruiterProfile.findMany({
        where: {
          companyName: { contains: searchQuery, mode: 'insensitive' },
        },
        select: { companyName: true },
        take: Number(limit),
      });

      companies.forEach(c => {
        if (c.companyName && !suggestions.includes(c.companyName)) {
          suggestions.push(c.companyName);
        }
      });
    }

    res.json({ suggestions: suggestions.slice(0, Number(limit)) });
  } catch (error) {
    console.error('자동완성 제안 오류:', error);
    res.status(500).json({ error: '자동완성 제안에 실패했습니다.' });
  }
});

export default router;

