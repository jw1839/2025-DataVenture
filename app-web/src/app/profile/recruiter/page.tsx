'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Save, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { profileAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function RecruiterProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  
  // 프로필 데이터
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [idealCandidate, setIdealCandidate] = useState('');
  const [hiringPositions, setHiringPositions] = useState<string[]>([]);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (user?.role !== 'RECRUITER') {
      toast.error('채용담당자 계정만 접근 가능합니다.');
      router.push('/');
      return;
    }
    
    loadProfile();
  }, [isAuthenticated, user]);

  // 프로필 로드
  const loadProfile = async () => {
    if (!user?.id) return;
    
    setIsFetching(true);
    try {
      const response = await profileAPI.getMyRecruiterProfile();
      const profile = response.data;
      
      setProfileId(profile.id);
      setCompanyName(profile.companyName || '');
      setCompanyLogoUrl(profile.companyLogoUrl || '');
      setCompanyDescription(profile.companyDescription || '');
      setCompanyWebsite(profile.companyWebsite || '');
      setPosition(profile.position || '');
      setDepartment(profile.department || '');
      setIdealCandidate(profile.idealCandidate || '');
      
      // hiringPositionsJson 파싱 (문자열 또는 배열 처리)
      try {
        if (profile.hiringPositionsJson) {
          if (typeof profile.hiringPositionsJson === 'string') {
            setHiringPositions(JSON.parse(profile.hiringPositionsJson));
          } else if (Array.isArray(profile.hiringPositionsJson)) {
            setHiringPositions(profile.hiringPositionsJson);
          }
        }
      } catch (parseError) {
        console.error('hiringPositionsJson 파싱 오류:', parseError);
        setHiringPositions([]);
      }
    } catch (error: any) {
      console.error('프로필 로딩 오류:', error);
      if (error.response?.status !== 404) {
        toast.error('프로필을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsFetching(false);
    }
  };

  // 로고 업로드
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const response = await uploadAPI.uploadFile(file, 'logo');
      setCompanyLogoUrl(response.data.url);
      toast.success('로고가 업로드되었습니다!');
    } catch (error) {
      toast.error('로고 업로드에 실패했습니다.');
    } finally {
      setUploadingLogo(false);
    }
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
      await profileAPI.updateRecruiterProfile(profileId, {
        companyName,
        companyLogoUrl,
        companyDescription,
        companyWebsite,
        position,
        department,
        idealCandidate,
        hiringPositionsJson: hiringPositions,
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
          <h1 className="text-3xl font-bold text-gray-900">채용담당자 프로필</h1>
          <p className="mt-2 text-gray-600">
            회사 정보와 채용 요구사항을 입력하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 회사 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
              <CardDescription>회사의 기본 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 회사 로고 */}
              <div>
                <Label>회사 로고</Label>
                <div className="mt-2 flex items-center gap-4">
                  {companyLogoUrl ? (
                    <img 
                      src={companyLogoUrl.startsWith('http') ? companyLogoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${companyLogoUrl}`} 
                      alt="Company Logo" 
                      className="h-20 w-20 rounded object-contain bg-gray-50 p-2 border" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="flex h-20 w-20 items-center justify-center rounded bg-gray-200"><svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-200">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {uploadingLogo ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 업로드 중...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> 로고 업로드</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 회사명 */}
              <div>
                <Label htmlFor="companyName">회사명 *</Label>
                <Input
                  id="companyName"
                  placeholder="예: (주)데이터벤처"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              {/* 회사 소개 */}
              <div>
                <Label htmlFor="companyDescription">회사 소개</Label>
                <Textarea
                  id="companyDescription"
                  placeholder="회사에 대한 간단한 소개를 작성해주세요..."
                  rows={4}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                />
              </div>

              {/* 회사 웹사이트 */}
              <div>
                <Label htmlFor="companyWebsite">회사 웹사이트</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  placeholder="https://..."
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 담당자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>담당자 정보</CardTitle>
              <CardDescription>채용 담당자 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="position">직책</Label>
                  <Input
                    id="position"
                    placeholder="예: 인사팀 과장"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="department">부서</Label>
                  <Input
                    id="department"
                    placeholder="예: 인사팀"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 채용 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>채용 정보</CardTitle>
              <CardDescription>현재 채용 중인 포지션과 인재상을 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 모집 직무 */}
              <div>
                <Label htmlFor="hiringPositions">모집 직무</Label>
                <Input
                  id="hiringPositions"
                  placeholder="예: 백엔드 개발자, 프론트엔드 개발자 (쉼표로 구분)"
                  value={hiringPositions.join(', ')}
                  onChange={(e) => setHiringPositions(e.target.value.split(',').map(p => p.trim()).filter(p => p))}
                />
                <p className="mt-1 text-sm text-gray-500">여러 직무는 쉼표(,)로 구분해주세요</p>
              </div>

              {/* 인재상 */}
              <div>
                <Label htmlFor="idealCandidate">인재상</Label>
                <Textarea
                  id="idealCandidate"
                  placeholder="우리 회사가 찾는 인재상을 작성해주세요..."
                  rows={5}
                  value={idealCandidate}
                  onChange={(e) => setIdealCandidate(e.target.value)}
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
