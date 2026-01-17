import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../../middlewares/auth.middleware';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 업로드 디렉토리 설정
const UPLOAD_DIR = path.join(__dirname, '../../../uploads');

// 업로드 디렉토리 생성 (없으면)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer 설정 (로컬 디스크 스토리지)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type = 'general' } = req.body;
    const userId = (req as any).user?.id || 'anonymous';
    const uploadPath = path.join(UPLOAD_DIR, type, userId);
    
    // 사용자별 디렉토리 생성
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 허용된 파일 형식
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  },
});

/**
 * POST /api/v1/upload
 * 파일 업로드 (이미지, 이력서, 포트폴리오)
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const file = req.file;
    const { type = 'general' } = req.body;
    
    // 로컬 파일 URL 생성
    const relativePath = path.relative(UPLOAD_DIR, file.path);
    const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    res.json({
      message: '파일이 업로드되었습니다.',
      url: fileUrl,
      filename: file.originalname,
      size: file.size,
      type: file.mimetype,
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({ 
      error: '파일 업로드에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * POST /api/v1/upload/multiple
 * 여러 파일 업로드
 */
router.post('/multiple', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const uploadedFiles = req.files.map((file) => {
      const relativePath = path.relative(UPLOAD_DIR, file.path);
      const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
      
      return {
        url: fileUrl,
        filename: file.originalname,
        size: file.size,
        type: file.mimetype,
      };
    });

    res.json({
      message: `${uploadedFiles.length}개의 파일이 업로드되었습니다.`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({ 
      error: '파일 업로드에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * DELETE /api/v1/upload
 * 파일 삭제
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL이 제공되지 않았습니다.' });
    }

    // URL에서 파일 경로 추출 (/uploads/...)
    const filePath = url.replace('/uploads/', '');
    const fullPath = path.join(UPLOAD_DIR, filePath);
    
    // 본인이 업로드한 파일인지 확인
    if (!filePath.includes(req.user.id)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 파일 존재 여부 확인
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ message: '파일이 삭제되었습니다.' });
    } else {
      res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({ 
      error: '파일 삭제에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;

