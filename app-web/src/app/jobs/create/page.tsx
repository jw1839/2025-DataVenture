'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';

export default function CreateJobPostingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // 권한 확인
  if (!isAuthenticated || user?.role !== 'RECRUITER') {
    router.push('/dashboard');
    return null;
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: '',
    experienceMin: 0,
    experienceMax: null as number | null,
    salaryMin: null as number | null,
    salaryMax: null as number | null,
    requirements: [''] as string[],
    preferredSkills: [''] as string[],
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'requirements' | 'preferredSkills', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'requirements' | 'preferredSkills') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'preferredSkills', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      [field]: newArray.length > 0 ? newArray : [''],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title.trim() || !formData.description.trim() || !formData.position.trim()) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 빈 문자열 제거
      const cleanedRequirements = formData.requirements.filter((r) => r.trim());
      const cleanedPreferredSkills = formData.preferredSkills.filter((s) => s.trim());

      const response = await apiClient.post('/api/v1/jobs', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        position: formData.position.trim(),
        experienceMin: formData.experienceMin,
        experienceMax: formData.experienceMax,
        salaryMin: formData.salaryMin,
        salaryMax: formData.salaryMax,
        requirements: cleanedRequirements,
        preferredSkills: cleanedPreferredSkills,
      });

      toast.success('채용 공고가 등록되었습니다!');
      router.push(`/jobs/${response.data.jobPosting.id}`);
    } catch (error: any) {
      console.error('공고 등록 실패:', error);
      toast.error(error.response?.data?.message || '공고 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 임시 저장 (localStorage)
  const handleSaveDraft = () => {
    localStorage.setItem('jobPostingDraft', JSON.stringify(formData));
    toast.success('임시 저장되었습니다.');
  };

  // 임시 저장 불러오기
  const loadDraft = () => {
    const draft = localStorage.getItem('jobPostingDraft');
    if (draft) {
      setFormData(JSON.parse(draft));
      toast.success('임시 저장된 내용을 불러왔습니다.');
    } else {
      toast.error('임시 저장된 내용이 없습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">채용 공고 작성</h1>
            <p className="text-gray-600 mt-1">회사에 적합한 인재를 찾아보세요</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            취소
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-8">
            {/* 기본 정보 */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">공고 제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="예: 백엔드 개발자를 찾습니다"
                  required
                />
              </div>

              <div>
                <Label htmlFor="position">직무 *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="예: 백엔드 개발자"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">공고 설명 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="회사 소개, 업무 내용, 근무 조건 등을 자유롭게 작성해주세요"
                  rows={10}
                  required
                />
              </div>

              {/* 경력 요구사항 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experienceMin">최소 경력 (년)</Label>
                  <Input
                    id="experienceMin"
                    type="number"
                    min="0"
                    value={formData.experienceMin}
                    onChange={(e) => handleChange('experienceMin', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="experienceMax">최대 경력 (년)</Label>
                  <Input
                    id="experienceMax"
                    type="number"
                    min="0"
                    value={formData.experienceMax || ''}
                    onChange={(e) => handleChange('experienceMax', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="제한 없음"
                  />
                </div>
              </div>

              {/* 급여 범위 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">최소 연봉 (만원)</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    min="0"
                    value={formData.salaryMin || ''}
                    onChange={(e) => handleChange('salaryMin', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="예: 3000"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">최대 연봉 (만원)</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    min="0"
                    value={formData.salaryMax || ''}
                    onChange={(e) => handleChange('salaryMax', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="예: 5000"
                  />
                </div>
              </div>

              {/* 필수 요건 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>필수 요건</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('requirements')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={req}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        placeholder={`필수 요건 ${index + 1}`}
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('requirements', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 우대 사항 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>우대 사항</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('preferredSkills')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.preferredSkills.map((skill, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={skill}
                        onChange={(e) => handleArrayChange('preferredSkills', index, e.target.value)}
                        placeholder={`우대 사항 ${index + 1}`}
                      />
                      {formData.preferredSkills.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('preferredSkills', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                임시 저장
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadDraft}
                disabled={isSubmitting}
              >
                불러오기
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '공고 등록'
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}

