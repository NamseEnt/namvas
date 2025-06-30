import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type Announcement = {
  id?: string;
  message: string;
  type: "urgent" | "normal";
  isActive: boolean;
};

type SiteSettings = {
  announcements: Array<Announcement & { id: string; createdAt: string }>;
  pricing: {
    basePrice: number;
    plasticStandPrice: number;
    shippingFee: number;
  };
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(function loadSettings() {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/adminGetSiteSettings");
        const result = await response.json();
        
        if (result.ok) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (updates: Partial<SiteSettings>) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/adminUpdateSiteSettings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (result.ok) {
        // Reload settings to get updated data
        const updatedResponse = await fetch("/api/adminGetSiteSettings");
        const updatedResult = await updatedResponse.json();
        if (updatedResult.ok) {
          setSettings(updatedResult.settings);
        }
        alert("설정이 저장되었습니다.");
      } else {
        alert("설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">사이트 관리</h1>
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!settings) {
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
          announcements={settings.announcements}
          onSave={(announcements) => handleSaveSettings({ announcements })}
          isSaving={isSaving}
        />
        <PricingCard
          pricing={settings.pricing}
          onSave={(pricing) => handleSaveSettings({ pricing })}
          isSaving={isSaving}
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
  announcements: SiteSettings["announcements"];
  onSave: (announcements: SiteSettings["announcements"]) => void;
  isSaving: boolean;
}) {
  const [editingAnnouncements, setEditingAnnouncements] = useState<Announcement[]>(
    announcements.map(({ id, createdAt, ...rest }) => rest)
  );

  const addAnnouncement = () => {
    setEditingAnnouncements([
      ...editingAnnouncements,
      { message: "", type: "normal", isActive: true },
    ]);
  };

  const updateAnnouncement = (index: number, updates: Partial<Announcement>) => {
    const updated = [...editingAnnouncements];
    updated[index] = { ...updated[index], ...updates };
    setEditingAnnouncements(updated);
  };

  const removeAnnouncement = (index: number) => {
    const updated = editingAnnouncements.filter((_, i) => i !== index);
    setEditingAnnouncements(updated);
  };

  const handleSave = () => {
    const validAnnouncements = editingAnnouncements
      .filter(a => a.message.trim())
      .map(a => ({ ...a, id: a.id || Date.now().toString(), createdAt: new Date().toISOString() }));
    onSave(validAnnouncements);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>공지사항 관리</span>
          <Button onClick={addAnnouncement} size="sm">
            공지 추가
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingAnnouncements.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          editingAnnouncements.map((announcement, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Label>유형:</Label>
                  <select
                    value={announcement.type}
                    onChange={(e) => updateAnnouncement(index, { type: e.target.value as "urgent" | "normal" })}
                    className="border rounded px-2 py-1"
                  >
                    <option value="normal">일반</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeAnnouncement(index)}
                >
                  삭제
                </Button>
              </div>
              
              <div>
                <Label>공지 내용</Label>
                <Textarea
                  value={announcement.message}
                  onChange={(e) => updateAnnouncement(index, { message: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={announcement.isActive}
                  onCheckedChange={(checked) => updateAnnouncement(index, { isActive: !!checked })}
                />
                <Label>활성화</Label>
              </div>
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
  const [editingPricing, setEditingPricing] = useState(pricing);

  const updatePricing = (field: keyof SiteSettings["pricing"], value: number) => {
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
        
        <div>
          <Label>플라스틱 스탠드 가격 (원)</Label>
          <Input
            type="number"
            value={editingPricing.plasticStandPrice}
            onChange={(e) => updatePricing("plasticStandPrice", Number(e.target.value))}
            placeholder="플라스틱 스탠드 추가 가격"
          />
        </div>
        
        <div>
          <Label>기본 배송비 (원)</Label>
          <Input
            type="number"
            value={editingPricing.shippingFee}
            onChange={(e) => updatePricing("shippingFee", Number(e.target.value))}
            placeholder="기본 배송비"
          />
        </div>
        
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• 기본가: {editingPricing.basePrice.toLocaleString()}원</p>
            <p>• 스탠드 추가: +{editingPricing.plasticStandPrice.toLocaleString()}원</p>
            <p>• 배송비: {editingPricing.shippingFee.toLocaleString()}원</p>
            <p className="font-medium">
              총 예상가격: {(editingPricing.basePrice + editingPricing.plasticStandPrice + editingPricing.shippingFee).toLocaleString()}원
              (스탠드 포함시)
            </p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "저장 중..." : "가격 설정 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}