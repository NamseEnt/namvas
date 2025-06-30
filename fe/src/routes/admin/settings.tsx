import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsApi } from "@/lib/api";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type SiteSettings = ReturnType<typeof settingsApi.getSiteSettings> extends Promise<infer T> ? T : never;

export default function AdminSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: settingsApi.getSiteSettings,
  });

  const updateMutation = useMutation({
    mutationFn: settingsApi.updateSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      alert("설정이 저장되었습니다.");
    },
    onError: () => {
      alert("설정 저장에 실패했습니다.");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">사이트 관리</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">사이트 관리</h1>
        <div className="text-center py-8">설정을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">사이트 관리</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnnouncementsCard
          announcements={settings.announcements || {}}
          onSave={(announcements) => updateMutation.mutate({ announcements })}
          isSaving={updateMutation.isPending}
        />
        <PricingCard
          pricing={settings.pricing}
          onSave={(pricing) => updateMutation.mutate({ pricing })}
          isSaving={updateMutation.isPending}
        />
      </div>
    </div>
  );
}

function AnnouncementsCard({
  announcements,
  onSave,
  isSaving,
}: {
  announcements: SiteSettings["announcements"] | {};
  onSave: (announcements: any) => void;
  isSaving: boolean;
}) {
  const [editingAnnouncements, setEditingAnnouncements] = useState<any[]>(
    announcements.mainBanner || announcements.orderComplete ? 
      [{ message: announcements.mainBanner || '', type: 'mainBanner' },
       { message: announcements.orderComplete || '', type: 'orderComplete' }] : []
  );

  const updateAnnouncement = (index: number, message: string) => {
    const updated = [...editingAnnouncements];
    updated[index] = { ...updated[index], message };
    setEditingAnnouncements(updated);
  };

  const handleSave = () => {
    const announcements: any = {};
    editingAnnouncements.forEach(a => {
      if (a.type === 'mainBanner' && a.message) {
        announcements.mainBanner = a.message;
      } else if (a.type === 'orderComplete' && a.message) {
        announcements.orderComplete = a.message;
      }
    });
    onSave(announcements);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>공지사항 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingAnnouncements.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          editingAnnouncements.map((announcement, index) => (
            <div key={index} className="space-y-2">
              <Label>
                {announcement.type === 'mainBanner' ? '메인 배너 공지' : '주문 완료 페이지 공지'}
              </Label>
              <Textarea
                value={announcement.message}
                onChange={(e) => updateAnnouncement(index, e.target.value)}
                placeholder={announcement.type === 'mainBanner' ? 
                  "메인 페이지에 표시될 공지사항" : 
                  "주문 완료 후 표시될 메시지"}
                rows={3}
              />
            </div>
          ))
        )}
        
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "저장 중..." : "공지사항 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  pricing,
  onSave,
  isSaving,
}: {
  pricing: SiteSettings["pricing"];
  onSave: (pricing: SiteSettings["pricing"]) => void;
  isSaving: boolean;
}) {
  const [editingPricing, setEditingPricing] = useState({
    basePrice: pricing.basePrice || 0,
    additionalOptions: pricing.additionalOptions || []
  });

  const updatePricing = (field: string, value: any) => {
    setEditingPricing(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editingPricing);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>가격 및 배송비 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>캔버스 기본가 (원)</Label>
          <Input
            type="number"
            value={editingPricing.basePrice}
            onChange={(e) => updatePricing("basePrice", Number(e.target.value))}
            placeholder="기본 캔버스 가격"
          />
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 기본가: {editingPricing.basePrice.toLocaleString()}원</p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "저장 중..." : "가격 설정 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}