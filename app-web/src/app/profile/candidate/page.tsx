'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, X, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { profileAPI, uploadAPI, CandidateProfile } from '@/lib/api';
import ResumeUpload from '@/components/profile/ResumeUpload';
import toast from 'react-hot-toast';

export default function CandidateProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // 프로필 데이터
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [desiredPosition, setDesiredPosition] = useState('');
  const [desiredSalary, setDesiredSalary] = useState<number | undefined>();
  
  const [newSkill, setNewSkill] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    loadProfile();
  }, [isAuthenticated]);

  // 프로필 로드
  const loadProfile = async () => {
    if (!user?.id) return;
    
    setIsFetching(true);
    try {
      const response = await profileAPI.getMyCandidateProfile();
      const profile = response.data;
      
      setProfileId(profile.id);
      setPhotoUrl(profile.photoUrl || '');
      setBio(profile.bio || '');
      
      // JSON 필드 파싱 (문자열인 경우에만)
      try {
        setEducation(profile.educationJson ? (typeof profile.educationJson === 'string' ? JSON.parse(profile.educationJson) : profile.educationJson) : []);
      } catch { setEducation([]); }
      
      try {
        setExperience(profile.experienceJson ? (typeof profile.experienceJson === 'string' ? JSON.parse(profile.experienceJson) : profile.experienceJson) : []);
      } catch { setExperience([]); }
      
      try {
        setProjects(profile.projectsJson ? (typeof profile.projectsJson === 'string' ? JSON.parse(profile.projectsJson) : profile.projectsJson) : []);
      } catch { setProjects([]); }
      
      // skills는 배열로 반환됨
      setSkills(Array.isArray(profile.skillsJson) ? profile.skillsJson : []);
      
      setPortfolioUrl(profile.portfolioFileUrl || ''); // portfolioFileUrl로 변경
      setBlogUrl(profile.blogUrl || '');
      setGithubUrl(profile.githubUrl || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setResumeUrl(profile.resumeUrl || '');
      setDesiredPosition(profile.desiredPosition || '');
      setDesiredSalary(profile.desiredSalary || undefined);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('프로필을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsFetching(false);
    }
  };

  // 사진 업로드
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const response = await uploadAPI.uploadFile(file, 'photo');
      setPhotoUrl(response.data.url);
      toast.success('사진이 업로드되었습니다!');
    } catch (error) {
      toast.error('사진 업로드에 실패했습니다.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 스킬 추가
  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // 경력 추가/삭제
  const handleAddExperience = () => {
    setExperience([...experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]);
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  // 프로젝트 추가/삭제
  const handleAddProject = () => {
    setProjects([...projects, { title: '', description: '', skills: [], startDate: '', endDate: '', url: '' }]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  // 학력 추가/삭제
  const handleAddEducation = () => {
    setEducation([...education, { school: '', degree: '', major: '', startDate: '', endDate: '' }]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  // 프로필 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileId) {
      toast.error('프로필 ID를 찾을 수 없습니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await profileAPI.updateCandidateProfile(profileId, {
        photoUrl,
        bio,
        educationJson: education,
        experienceJson: experience,
        projectsJson: projects,
        skillsJson: skills,
        portfolioFileUrl: portfolioUrl, // 백엔드 필드명에 맞춤
        blogUrl,
        githubUrl,
        linkedinUrl,
        resumeUrl,
        desiredPosition,
        desiredSalary,
      });
      
      toast.success('프로필이 저장되었습니다!');
      
      // 대시보드로 자동 이동 (0.5초 후)
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || '프로필 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">구직자 프로필</h1>
          <p className="mt-2 text-gray-600">
            상세한 정보를 입력하여 AI 인터뷰와 매칭 정확도를 높이세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>프로필 사진과 자기소개를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 프로필 사진 */}
              <div>
                <Label>프로필 사진</Label>
                <div className="mt-2 flex items-center gap-4">
                  {photoUrl ? (
                    <img 
                      src={photoUrl.startsWith('http') ? photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${photoUrl}`} 
                      alt="Profile" 
                      className="h-20 w-20 rounded-full object-cover border border-gray-200" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200"><svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={uploadingPhoto}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {uploadingPhoto ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 업로드 중...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> 사진 업로드</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 자기소개 */}
              <div>
                <Label htmlFor="bio">자기소개</Label>
                <Textarea
                  id="bio"
                  placeholder="간단한 자기소개를 작성해주세요..."
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {/* 희망 직무 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="desiredPosition">희망 직무</Label>
                  <Input
                    id="desiredPosition"
                    placeholder="예: 백엔드 개발자"
                    value={desiredPosition}
                    onChange={(e) => setDesiredPosition(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="desiredSalary">희망 연봉 (만원)</Label>
                  <Input
                    id="desiredSalary"
                    type="number"
                    placeholder="예: 5000"
                    value={desiredSalary || ''}
                    onChange={(e) => setDesiredSalary(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 학력 */}
          <Card>
            <CardHeader>
              <CardTitle>학력</CardTitle>
              <CardDescription>학력 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">학력 {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEducation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="학교명"
                      value={edu.school}
                      onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    />
                    <Input
                      placeholder="학위 (예: 학사, 석사)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    />
                    <Input
                      placeholder="전공"
                      value={edu.major}
                      onChange={(e) => updateEducation(index, 'major', e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="졸업일"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddEducation} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                학력 추가
              </Button>
            </CardContent>
          </Card>

          {/* 경력 */}
          <Card>
            <CardHeader>
              <CardTitle>경력</CardTitle>
              <CardDescription>경력 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">경력 {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExperience(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="회사명"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    />
                    <Input
                      placeholder="직책/포지션"
                      value={exp.position}
                      onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="시작일"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="종료일"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="주요 업무 및 성과"
                    rows={3}
                    value={exp.description}
                    onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddExperience} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                경력 추가
              </Button>
            </CardContent>
          </Card>

          {/* 프로젝트 */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트</CardTitle>
              <CardDescription>참여했던 프로젝트를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.map((project, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">프로젝트 {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProject(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="프로젝트명"
                    value={project.title}
                    onChange={(e) => updateProject(index, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="프로젝트 설명"
                    rows={3}
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                  />
                  <Input
                    placeholder="프로젝트 URL"
                    value={project.url}
                    onChange={(e) => updateProject(index, 'url', e.target.value)}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddProject} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                프로젝트 추가
              </Button>
            </CardContent>
          </Card>

          {/* 스킬 */}
          <Card>
            <CardHeader>
              <CardTitle>보유 기술</CardTitle>
              <CardDescription>보유하고 있는 기술 스택을 추가하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="예: React, Python, AWS"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" onClick={handleAddSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 이력서 업로드 */}
          <Card>
            <CardHeader>
              <CardTitle>이력서</CardTitle>
              <CardDescription>PDF 또는 DOCX 형식의 이력서를 업로드하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeUpload
                currentResumeUrl={resumeUrl}
                onUploadSuccess={(url) => setResumeUrl(url)}
                onDelete={() => setResumeUrl('')}
              />
            </CardContent>
          </Card>

          {/* 링크 */}
          <Card>
            <CardHeader>
              <CardTitle>링크</CardTitle>
              <CardDescription>포트폴리오, 블로그, SNS 링크를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="portfolioUrl">포트폴리오 URL</Label>
                <Input
                  id="portfolioUrl"
                  placeholder="https://..."
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="blogUrl">블로그 URL</Label>
                <Input
                  id="blogUrl"
                  placeholder="https://..."
                  value={blogUrl}
                  onChange={(e) => setBlogUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
