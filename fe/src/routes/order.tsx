import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CanvasView from "@/components/CanvasView";
import { X, ArrowLeft } from "lucide-react";
import { type ArtworkDefinition } from "@/types/artwork";
import {
  getArtworkFromStorage,
  getTextureFromStorage,
} from "@/utils/storageManager";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          userSelectedType: string;
          roadAddress: string;
          jibunAddress: string;
          zonecode: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>) => ({
    fromStudio: search.fromStudio as string | undefined,
  }),
  component: OrderPage,
});

export default function OrderPage() {
  const navigate = useNavigate();
  const { fromStudio } = Route.useSearch();

  // Get data from storage if coming from studio
  const [artworkDefinition, setArtworkDefinition] =
    useState<ArtworkDefinition>();
  const [studioTexture, setStudioTexture] = useState<THREE.Texture>();

  useEffect(
    function loadDataFromStorage() {
      if (fromStudio) {
        getArtworkFromStorage().then(setArtworkDefinition);
        
        // Load studio-generated texture as THREE.Texture
        getTextureFromStorage().then((textureDataUrl) => {
          if (textureDataUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              // Create a canvas and draw the image to it
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              const texture = new THREE.CanvasTexture(canvas);
              texture.needsUpdate = true;
              setStudioTexture(texture);
            };
            img.src = textureDataUrl;
          }
        });
      }
    },
    [fromStudio]
  );

  const [orderState, setOrderState] = useState<OrderState>({
    quantity: 1,
    hasPlasticStand: false,
    recipientName: "",
    recipientPhone: "",
    postalCode: "",
    address: "",
    addressDetail: "",
    deliveryMemo: "",
  });

  const updateOrderState = (updates: Partial<OrderState>) => {
    setOrderState((prev) => ({ ...prev, ...updates }));
  };

  useEffect(function loadDaumPostcodeScript() {
    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(function focusAddressDetailOnAddressChange() {
    if (orderState.address && orderState.postalCode) {
      const addressDetailInput = document.getElementById("address-detail") as HTMLInputElement;
      if (addressDetailInput) {
        requestAnimationFrame(() => {
          addressDetailInput.focus();
        });
      }
    }
  }, [orderState.address, orderState.postalCode]);

  const basePrice = 10000;
  const plasticStandPrice = 250;
  const shippingFee = 3000;
  const subtotal = basePrice * orderState.quantity;
  const optionPrice = orderState.hasPlasticStand
    ? plasticStandPrice * orderState.quantity
    : 0;
  const totalPrice = subtotal + optionPrice + shippingFee;

  const handlePayment = () => {
    const orderId = "ORDER-" + Date.now().toString();
    navigate({
      to: "/order-complete",
      search: {
        orderId,
        amount: totalPrice.toString(),
      },
    });
  };

  const handleBackToStudio = () => {
    if (artworkDefinition) {
      // Navigate back to studio (data already in localStorage)
      navigate({
        to: "/studio",
        search: {
          artwork: "true", // Just a trigger to load from localStorage
        },
      });
    } else {
      // No artwork definition available, just go to studio
      navigate({ to: "/studio", search: { artwork: undefined } });
    }
  };

  const searchAddress = () => {
    if (!window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data) {
        const addr =
          data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

        updateOrderState({
          postalCode: data.zonecode,
          address: addr,
        });
      },
    }).open();
  };

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">주문/결제</h1>
        {artworkDefinition && (
          <Button
            onClick={handleBackToStudio}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            편집 화면으로 돌아가기
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {/* 상단: 상품 정보 (전체 폭) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>주문 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 왼쪽: 캔버스 미리보기 (2/3) */}
                <div className="lg:col-span-2 flex justify-center">
                  <div className="flex gap-4">
                    <CanvasView
                      angle="front"
                      texture={studioTexture}
                      className="h-56 w-42"
                    />
                    <CanvasView
                      angle="rightBottomUp"
                      texture={studioTexture}
                      className="h-56 w-42"
                    />
                    <CanvasView
                      angle="leftTopDown"
                      texture={studioTexture}
                      className="h-56 w-42"
                    />
                  </div>
                </div>

                {/* 오른쪽: 제품 정보 및 옵션 (1/3) */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      10x15cm 커스텀 캔버스
                    </h3>
                    <p className="text-gray-600">최종 디자인</p>
                  </div>

                  <div className="space-y-3 ml-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="plastic-stand"
                        checked={orderState.hasPlasticStand}
                        onCheckedChange={(checked) =>
                          updateOrderState({
                            hasPlasticStand: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="plastic-stand"
                        className="text-sm font-medium"
                      >
                        다이소 플라스틱 받침대 추가 (+{plasticStandPrice}원)
                      </Label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">수량</span>
                        <div className="flex items-center border rounded-md">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              updateOrderState({
                                quantity: Math.max(1, orderState.quantity - 1),
                              })
                            }
                            disabled={orderState.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            className="h-8 w-16 text-center border-0 focus-visible:ring-0"
                            value={orderState.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              updateOrderState({
                                quantity: Math.max(1, Math.min(99, value)),
                              });
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              updateOrderState({
                                quantity: Math.min(99, orderState.quantity + 1),
                              })
                            }
                            disabled={orderState.quantity >= 99}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-800">
                        {(subtotal + optionPrice).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단: 배송정보 + 결제정보 (2열) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 배송 정보 (2/3 폭) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>배송 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="recipient-name">수령인</Label>
                  <Input
                    id="recipient-name"
                    className="max-w-xs"
                    value={orderState.recipientName}
                    onChange={(e) =>
                      updateOrderState({ recipientName: e.target.value })
                    }
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="recipient-phone">연락처</Label>
                  <Input
                    id="recipient-phone"
                    className="max-w-xs"
                    value={orderState.recipientPhone}
                    onChange={(e) =>
                      updateOrderState({ recipientPhone: e.target.value })
                    }
                    placeholder="010-0000-0000"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="address">주소</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={searchAddress}
                    >
                      주소 검색
                    </Button>
                    <Input
                      id="address"
                      className="flex-1 cursor-pointer"
                      value={
                        orderState.postalCode
                          ? `[${orderState.postalCode}] ${orderState.address}`
                          : ""
                      }
                      placeholder="주소를 검색해주세요"
                      onClick={searchAddress}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="address-detail">상세 주소</Label>
                  <Input
                    id="address-detail"
                    value={orderState.addressDetail}
                    onChange={(e) =>
                      updateOrderState({ addressDetail: e.target.value })
                    }
                    placeholder={
                      orderState.address
                        ? "상세 주소를 입력하세요"
                        : "먼저 주소를 검색해주세요"
                    }
                    disabled={!orderState.address}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="delivery-memo">배송 메모</Label>
                  <Textarea
                    id="delivery-memo"
                    value={orderState.deliveryMemo}
                    onChange={(e) =>
                      updateOrderState({ deliveryMemo: e.target.value })
                    }
                    placeholder="배송 시 요청사항을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 우측: 결제 정보 (1/3 폭) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>최종 결제 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>상품 금액 ({orderState.quantity}개)</span>
                    <span>{subtotal.toLocaleString()}원</span>
                  </div>
                  {optionPrice > 0 && (
                    <div className="flex justify-between">
                      <span>옵션 금액</span>
                      <span>{optionPrice.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>배송비</span>
                    <span>{shippingFee.toLocaleString()}원</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 결제 금액</span>
                      <span className="text-blue-600">
                        {totalPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full h-14 text-lg"
              size="lg"
              onClick={handlePayment}
              style={{ backgroundColor: "#1EC800", color: "white" }}
            >
              네이버페이로 결제
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-16">
        <PageFooter />
      </div>
    </div>
  );
}

function PageFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center gap-8">
          <a
            href="https://x.com/messages/compose?recipient_id=NAMVAS_X_ID"
            className="text-muted-foreground hover:text-sky-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <X className="w-5 h-5" />
          </a>
          <div className="flex gap-6 text-sm">
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              서비스 이용약관
            </a>
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

type OrderState = {
  quantity: number;
  hasPlasticStand: boolean;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  deliveryMemo: string;
};
