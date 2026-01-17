'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, Eye, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface ResumeUploadProps {
  currentResumeUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onDelete?: () => void;
}

export default function ResumeUpload({
  currentResumeUrl,
  onUploadSuccess,
  onDelete,
}: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      // 진행률 시뮬레이션 (실제 진행률 추적은 추후 구현 가능)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiClient.post('/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('이력서가 업로드되었습니다!');
      onUploadSuccess(response.data.url);

      // 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('이력서 업로드 실패:', error);
      toast.error(
        error.response?.data?.error || '이력서 업로드에 실패했습니다.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentResumeUrl) return;

    if (!confirm('이력서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await apiClient.delete('/api/v1/upload', {
        data: { url: currentResumeUrl },
      });

      toast.success('이력서가 삭제되었습니다.');
      if (onDelete) onDelete();
    } catch (error: any) {
      console.error('이력서 삭제 실패:', error);
      toast.error(
        error.response?.data?.error || '이력서 삭제에 실패했습니다.'
      );
    }
  };

  const openPreview = () => {
    if (currentResumeUrl) {
      window.open(currentResumeUrl, '_blank');
    }
  };

  const getFileName = (url: string) => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return '이력서 파일';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          이력서 첨부
        </label>
        <span className="text-xs text-gray-500">PDF, DOCX (최대 10MB)</span>
      </div>

      {/* 업로드된 파일이 있는 경우 */}
      {currentResumeUrl && !isUploading && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName(currentResumeUrl)}
                </p>
                <p className="text-xs text-gray-500 mt-1">업로드 완료</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openPreview}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                미리보기
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-1 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 버튼 */}
      {!currentResumeUrl && !isUploading && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              이력서를 업로드하세요
            </p>
            <p className="text-xs text-gray-500">
              PDF 또는 DOCX 파일을 선택하거나 드래그하세요
            </p>
          </label>
        </div>
      )}

      {/* 업로드 중 */}
      {isUploading && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
            <p className="text-sm font-medium text-gray-900">
              업로드 중... {uploadProgress}%
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 파일 교체 버튼 */}
      {currentResumeUrl && !isUploading && (
        <div className="flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="resume-replace"
          />
          <label htmlFor="resume-replace" className="cursor-pointer">
            <Button type="button" variant="outline" size="sm" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              다른 파일로 교체
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}

