import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PRICES } from "@/constants";
import { useOrders } from "@/hooks/useOrders";

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
    Naver: {
      Pay: {
        create: (options: {
          mode: "development" | "production";
          clientId: string;
          chainId: string;
          openType?: "popup" | "iframe";
          onAuthorize: (data: {
            resultCode: string;
            resultMessage: string;
            paymentId?: string;
          }) => void;
        }) => {
          open: (options: {
            productName: string;
            totalPayAmount: number;
            returnUrl: string;
          }) => void;
        };
      };
    };
  }
}

export function OrderPage({ fromBuildOrder }: { fromBuildOrder?: string }) {
  const navigate = useNavigate();

  // 주문 관련 기능들
  // const { createOrder, isCreatingOrder } = useOrders();

  // const [buildOrderData, setBuildOrderData] = useState<{
  //   orderItems: Array<{
  //     artworkId: string;
  //     quantity: number;
  //     price: number;
  //   }>;
  //   plasticStandCount: number;
  //   plasticStandPrice: number;
  //   totalPrice: number;
  // }>();

  // const [orderState, setOrderState] = useState<OrderState>({
  //   quantity: 1,
  //   hasPlasticStand: false,
  //   recipientName: "",
  //   recipientPhone: "",
  //   postalCode: "",
  //   address: "",
  //   addressDetail: "",
  //   deliveryMemo: "",
  //   agreeCustomProduct: false,
  // });

  // const [isBlinking, setIsBlinking] = useState(false);

  // const updateOrderState = (updates: Partial<OrderState>) => {
  //   setOrderState((prev) => ({ ...prev, ...updates }));
  // };

  // useEffect(function loadDaumPostcodeScript() {
  //   const script = document.createElement("script");
  //   script.src =
  //     "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
  //   script.async = true;
  //   document.body.appendChild(script);

  //   return () => {
  //     document.body.removeChild(script);
  //   };
  // }, []);

  // useEffect(function loadNaverPayScript() {
  //   const script = document.createElement("script");
  //   script.src = "https://nsp.pay.naver.com/sdk/js/naverpay.min.js";
  //   script.async = true;
  //   document.body.appendChild(script);

  //   return () => {
  //     if (document.body.contains(script)) {
  //       document.body.removeChild(script);
  //     }
  //   };
  // }, []);

  // useEffect(
  //   function loadDataFromStorage() {
  //     if (fromBuildOrder) {
  //       const tempOrderData = localStorage.getItem("tempOrderData");
  //       if (tempOrderData) {
  //         setBuildOrderData(JSON.parse(tempOrderData));
  //       }
  //     }
  //   },
  //   [fromBuildOrder]
  // );

  // useEffect(
  //   function focusAddressDetailOnAddressChange() {
  //     if (orderState.address && orderState.postalCode) {
  //       const addressDetailInput = document.getElementById(
  //         "address-detail"
  //       ) as HTMLInputElement;
  //       if (addressDetailInput) {
  //         requestAnimationFrame(() => {
  //           addressDetailInput.focus();
  //         });
  //       }
  //     }
  //   },
  //   [orderState.address, orderState.postalCode]
  // );

  // let basePrice,
  //   plasticStandPrice,
  //   shippingFee,
  //   subtotal,
  //   optionPrice,
  //   totalPrice;

  // if (buildOrderData) {
  //   subtotal = buildOrderData.orderItems.reduce(
  //     (sum: number, item) => sum + item.price * item.quantity,
  //     0
  //   );
  //   optionPrice =
  //     buildOrderData.plasticStandCount * buildOrderData.plasticStandPrice;
  //   shippingFee = PRICES.SHIPPING;
  //   totalPrice = buildOrderData.totalPrice + shippingFee;
  // } else {
  //   basePrice = PRICES.CANVAS;
  //   plasticStandPrice = PRICES.PLASTIC_STAND;
  //   shippingFee = PRICES.SHIPPING;
  //   subtotal = basePrice * orderState.quantity;
  //   optionPrice = orderState.hasPlasticStand
  //     ? plasticStandPrice * orderState.quantity
  //     : 0;
  //   totalPrice = subtotal + optionPrice + shippingFee;
  // }

  // const handlePayment = async () => {
  //   if (!orderState.agreeCustomProduct) {
  //     setIsBlinking(true);
  //     setTimeout(() => setIsBlinking(false), 2000);
  //     return;
  //   }

  //   if (
  //     !orderState.recipientName ||
  //     !orderState.recipientPhone ||
  //     !orderState.address
  //   ) {
  //     alert("배송지 정보를 모두 입력해주세요.");
  //     return;
  //   }

  //   if (!window.Naver || !window.Naver.Pay) {
  //     alert("네이버페이 SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
  //     return;
  //   }

  //   try {
  //     const orderData = buildOrderData
  //       ? {
  //           orderItems: buildOrderData.orderItems,
  //           plasticStandCount: buildOrderData.plasticStandCount,
  //           plasticStandPrice: buildOrderData.plasticStandPrice,
  //           totalPrice: buildOrderData.totalPrice,
  //           recipient: {
  //             name: orderState.recipientName,
  //             phone: orderState.recipientPhone,
  //             postalCode: orderState.postalCode,
  //             address: orderState.address,
  //             addressDetail: orderState.addressDetail,
  //             memo: orderState.deliveryMemo,
  //           },
  //         }
  //       : {
  //           orderItems: [
  //             {
  //               artworkId: "temp-id",
  //               quantity: orderState.quantity,
  //               price: basePrice!,
  //             },
  //           ],
  //           plasticStandCount: orderState.hasPlasticStand
  //             ? orderState.quantity
  //             : 0,
  //           plasticStandPrice: PRICES.PLASTIC_STAND,
  //           totalPrice: totalPrice - shippingFee,
  //           recipient: {
  //             name: orderState.recipientName,
  //             phone: orderState.recipientPhone,
  //             postalCode: orderState.postalCode,
  //             address: orderState.address,
  //             addressDetail: orderState.addressDetail,
  //             memo: orderState.deliveryMemo,
  //           },
  //         };

  //     console.log("Order data prepared:", orderData);

  //     const oPay = window.Naver.Pay.create({
  //       mode: "development",
  //       clientId: import.meta.env.VITE_NAVER_PAY_CLIENT_ID,
  //       chainId: import.meta.env.VITE_NAVER_PAY_CHAIN_ID,
  //       openType: "popup",
  //       onAuthorize: async (data) => {
  //         if (data.resultCode === "Success" && data.paymentId) {
  //           // 네이버페이 결제 성공 후 주문 생성
  //           try {
  //             const orderResponse = await createOrder({
  //               orderItems: orderData.orderItems,
  //               plasticStandCount: orderData.plasticStandCount,
  //               plasticStandPrice: orderData.plasticStandPrice,
  //               totalPrice: orderData.totalPrice,
  //               naverPaymentId: data.paymentId,
  //               recipient: orderData.recipient,
  //             });

  //             localStorage.removeItem("tempOrderData");
  //             navigate({
  //               to: "/order-complete",
  //               search: {
  //                 orderId: orderResponse.orderId,
  //                 amount: totalPrice.toString(),
  //               },
  //             });
  //           } catch (error) {
  //             console.error("Order creation failed:", error);
  //             alert(
  //               "주문 생성 중 오류가 발생했습니다. 고객센터로 문의해주세요."
  //             );
  //           }
  //         } else {
  //           alert(
  //             `결제가 취소되거나 실패했습니다: ${data.resultMessage || "알 수 없는 오류"}`
  //           );
  //         }
  //       },
  //     });

  //     const productName = buildOrderData
  //       ? `${buildOrderData.orderItems[0]?.artworkId || "커스텀 캔버스"} 외 ${buildOrderData.orderItems.length - 1}건`
  //       : "커스텀 캔버스";

  //     oPay.open({
  //       productName,
  //       totalPayAmount: totalPrice,
  //       returnUrl: `${window.location.origin}/order-complete`,
  //     });
  //   } catch (error) {
  //     console.error("Order creation failed:", error);
  //     alert("주문 생성 중 오류가 발생했습니다.");
  //   }
  // };

  // const handleBackToStudio = () => {
  //   if (artworkDefinition) {
  //     navigate({
  //       to: "/studio",
  //       search: {
  //         artwork: "true",
  //       },
  //     });
  //   } else {
  //     navigate({ to: "/studio", search: { artwork: undefined } });
  //   }
  // };

  // const searchAddress = () => {
  //   if (!window.daum) {
  //     alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
  //     return;
  //   }

  //   new window.daum.Postcode({
  //     oncomplete: function (data) {
  //       const addr =
  //         data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;

  //       updateOrderState({
  //         postalCode: data.zonecode,
  //         address: addr,
  //       });
  //     },
  //   }).open();
  // };

  // return (
  //   <div className="container mx-auto max-w-7xl p-4">
  //     <div className="flex items-center justify-between mb-6">
  //       <h1 className="text-3xl font-bold">주문/결제</h1>
  //       {artworkDefinition && (
  //         <Button
  //           onClick={handleBackToStudio}
  //           variant="outline"
  //           className="flex items-center gap-2"
  //         >
  //           <ArrowLeft className="w-4 h-4" />
  //           편집 화면으로 돌아가기
  //         </Button>
  //       )}
  //     </div>

  //     <div className="space-y-8">
  //       <div className="space-y-6">
  //         <Card>
  //           <CardHeader>
  //             <CardTitle>주문 내역</CardTitle>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  //               <div className="lg:col-span-2 flex justify-center">
  //                 {/* TODO <div className="flex gap-4">
  //                   <CanvasView
  //                     angle="front"
  //                     texture={studioTexture}
  //                     className="h-56 w-42"
  //                   />
  //                   <CanvasView
  //                     angle="rightBottomUp"
  //                     texture={studioTexture}
  //                     className="h-56 w-42"
  //                   />
  //                   <CanvasView
  //                     angle="leftTopDown"
  //                     texture={studioTexture}
  //                     className="h-56 w-42"
  //                   />
  //                 </div> */}
  //               </div>

  //               <div className="space-y-4">
  //                 <div>
  //                   <h3 className="text-lg font-semibold">
  //                     10x15cm 커스텀 캔버스
  //                   </h3>
  //                   <p className="text-gray-600">최종 디자인</p>
  //                 </div>

  //                 <div className="space-y-3 ml-4">
  //                   <div className="flex items-center space-x-2">
  //                     <Checkbox
  //                       id="plastic-stand"
  //                       checked={orderState.hasPlasticStand}
  //                       onCheckedChange={(checked) =>
  //                         updateOrderState({
  //                           hasPlasticStand: checked as boolean,
  //                         })
  //                       }
  //                     />
  //                     <Label
  //                       htmlFor="plastic-stand"
  //                       className="text-sm font-medium"
  //                     >
  //                       다이소 플라스틱 받침대 추가 (+{plasticStandPrice}원)
  //                     </Label>
  //                   </div>

  //                   <div className="flex items-center justify-between">
  //                     <div className="flex items-center gap-3">
  //                       <span className="text-sm font-medium">수량</span>
  //                       <div className="flex items-center border rounded-md">
  //                         <Button
  //                           type="button"
  //                           variant="ghost"
  //                           size="sm"
  //                           className="h-8 w-8 p-0"
  //                           onClick={() =>
  //                             updateOrderState({
  //                               quantity: Math.max(1, orderState.quantity - 1),
  //                             })
  //                           }
  //                           disabled={orderState.quantity <= 1}
  //                         >
  //                           -
  //                         </Button>
  //                         <Input
  //                           className="h-8 w-16 text-center border-0 focus-visible:ring-0"
  //                           value={orderState.quantity}
  //                           onChange={(e) => {
  //                             const value = parseInt(e.target.value) || 1;
  //                             updateOrderState({
  //                               quantity: Math.max(1, Math.min(99, value)),
  //                             });
  //                           }}
  //                         />
  //                         <Button
  //                           type="button"
  //                           variant="ghost"
  //                           size="sm"
  //                           className="h-8 w-8 p-0"
  //                           onClick={() =>
  //                             updateOrderState({
  //                               quantity: Math.min(99, orderState.quantity + 1),
  //                             })
  //                           }
  //                           disabled={orderState.quantity >= 99}
  //                         >
  //                           +
  //                         </Button>
  //                       </div>
  //                     </div>
  //                     <p className="text-xl font-bold text-gray-800">
  //                       {(subtotal + optionPrice).toLocaleString()}원
  //                     </p>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>

  //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  //         <Card className="lg:col-span-2">
  //           <CardHeader>
  //             <CardTitle>배송 정보</CardTitle>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="flex flex-col gap-6">
  //               <div className="grid gap-3">
  //                 <Label htmlFor="recipient-name">수령인</Label>
  //                 <Input
  //                   id="recipient-name"
  //                   className="max-w-xs"
  //                   value={orderState.recipientName}
  //                   onChange={(e) =>
  //                     updateOrderState({ recipientName: e.target.value })
  //                   }
  //                   placeholder="이름을 입력하세요"
  //                 />
  //               </div>

  //               <div className="grid gap-3">
  //                 <Label htmlFor="recipient-phone">연락처</Label>
  //                 <Input
  //                   id="recipient-phone"
  //                   className="max-w-xs"
  //                   value={orderState.recipientPhone}
  //                   onChange={(e) =>
  //                     updateOrderState({ recipientPhone: e.target.value })
  //                   }
  //                   placeholder="010-0000-0000"
  //                 />
  //               </div>

  //               <div className="grid gap-3">
  //                 <Label htmlFor="address">주소</Label>
  //                 <div className="flex gap-2">
  //                   <Button
  //                     type="button"
  //                     variant="outline"
  //                     onClick={searchAddress}
  //                   >
  //                     주소 검색
  //                   </Button>
  //                   <Input
  //                     id="address"
  //                     className="flex-1 cursor-pointer"
  //                     value={
  //                       orderState.postalCode
  //                         ? `[${orderState.postalCode}] ${orderState.address}`
  //                         : ""
  //                     }
  //                     placeholder="주소를 검색해주세요"
  //                     onClick={searchAddress}
  //                     readOnly
  //                   />
  //                 </div>
  //               </div>

  //               <div className="grid gap-3">
  //                 <Label htmlFor="address-detail">상세 주소</Label>
  //                 <Input
  //                   id="address-detail"
  //                   value={orderState.addressDetail}
  //                   onChange={(e) =>
  //                     updateOrderState({ addressDetail: e.target.value })
  //                   }
  //                   placeholder={
  //                     orderState.address
  //                       ? "상세 주소를 입력하세요"
  //                       : "먼저 주소를 검색해주세요"
  //                   }
  //                   disabled={!orderState.address}
  //                 />
  //               </div>

  //               <div className="grid gap-3">
  //                 <Label htmlFor="delivery-memo">배송 메모</Label>
  //                 <Textarea
  //                   id="delivery-memo"
  //                   value={orderState.deliveryMemo}
  //                   onChange={(e) =>
  //                     updateOrderState({ deliveryMemo: e.target.value })
  //                   }
  //                   placeholder="배송 시 요청사항을 입력하세요"
  //                   rows={3}
  //                 />
  //               </div>
  //             </div>
  //           </CardContent>
  //         </Card>

  //         <div className="space-y-6">
  //           <Card>
  //             <CardHeader>
  //               <CardTitle>최종 결제 정보</CardTitle>
  //             </CardHeader>
  //             <CardContent>
  //               <div className="space-y-2">
  //                 <div className="flex justify-between">
  //                   <span>
  //                     상품 금액{" "}
  //                     {buildOrderData
  //                       ? `(${buildOrderData.orderItems.reduce((sum: number, item) => sum + item.quantity, 0)}개)`
  //                       : `(${orderState.quantity}개)`}
  //                   </span>
  //                   <span>{subtotal.toLocaleString()}원</span>
  //                 </div>
  //                 {optionPrice > 0 && (
  //                   <div className="flex justify-between">
  //                     <span>
  //                       {buildOrderData
  //                         ? `플라스틱 스탠드 (${buildOrderData.plasticStandCount}개)`
  //                         : "옵션 금액"}
  //                     </span>
  //                     <span>{optionPrice.toLocaleString()}원</span>
  //                   </div>
  //                 )}
  //                 <div className="flex justify-between">
  //                   <span>배송비</span>
  //                   <span>{shippingFee.toLocaleString()}원</span>
  //                 </div>
  //                 <div className="border-t pt-2 mt-2">
  //                   <div className="flex justify-between text-lg font-bold">
  //                     <span>총 결제 금액</span>
  //                     <span className="text-blue-600">
  //                       {totalPrice.toLocaleString()}원
  //                     </span>
  //                   </div>
  //                 </div>
  //               </div>
  //             </CardContent>
  //           </Card>

  //           <Card
  //             className={`border-amber-200 bg-amber-50 transition-all duration-200 ${isBlinking ? "animate-pulse border-red-500 bg-red-50" : ""}`}
  //           >
  //             <CardContent className="p-4">
  //               <div className="flex items-start space-x-3">
  //                 <Checkbox
  //                   id="agree-custom-product"
  //                   checked={orderState.agreeCustomProduct}
  //                   onCheckedChange={(checked) =>
  //                     updateOrderState({
  //                       agreeCustomProduct: checked as boolean,
  //                     })
  //                   }
  //                   className="mt-1"
  //                 />
  //                 <Label
  //                   htmlFor="agree-custom-product"
  //                   className="text-sm leading-relaxed cursor-pointer flex-1"
  //                 >
  //                   <span className="text-red-600 font-semibold">[필수]</span>{" "}
  //                   제공한 이미지로 맞춤 제작되어 다른 소비자에게 재판매가
  //                   곤란한 맞춤주문제작 상품임을 확인하였습니다.
  //                   청약철회(교환/환불)은 상품 제작 전 혹은 하자가 있는 상품을
  //                   수령했을 때만 가능합니다.
  //                 </Label>
  //               </div>
  //             </CardContent>
  //           </Card>

  //           <Button
  //             className="w-full h-14 text-lg"
  //             size="lg"
  //             onClick={handlePayment}
  //             disabled={isCreatingOrder}
  //             style={{ backgroundColor: "#1EC800", color: "white" }}
  //           >
  //             {isCreatingOrder ? (
  //               <>
  //                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  //                 결제 중...
  //               </>
  //             ) : (
  //               "네이버페이로 결제"
  //             )}
  //           </Button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
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
  agreeCustomProduct: boolean;
};
