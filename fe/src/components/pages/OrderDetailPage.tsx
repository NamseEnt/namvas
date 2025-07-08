import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, ArrowLeft, ShoppingCart, MessageSquare, FileText, ExternalLink } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import type { Order } from '../../../../shared/types'

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const navigate = useNavigate()
  const { orders, isLoading, error, loadOrders } = useOrders()
  const [order, setOrder] = useState<Order | undefined>()

  useEffect(function loadOrderDetails() {
    if (orders.length === 0) {
      loadOrders()
    } else {
      const foundOrder = orders.find(o => o.id === orderId)
      setOrder(foundOrder)
    }
  }, [orders, orderId, loadOrders])

  const getStatusBadge = (status: Order['status']) => {
    const statusMap: Record<Order['status'], { text: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
      payment_verifing: { text: '결제 확인중', variant: 'secondary' },
      payment_failed: { text: '결제실패', variant: 'destructive' },
      waiting_start_production: { text: '제작 대기중', variant: 'default' },
      in_production: { text: '제작중', variant: 'default' },
      shipping: { text: '배송중', variant: 'default' },
      delivered: { text: '배송완료', variant: 'outline' },
      payment_cancelling: { text: '결제 취소중', variant: 'secondary' },
      payment_canceled: { text: '결제 취소됨', variant: 'destructive' },
      payment_cancel_rejected: { text: '취소 거부됨', variant: 'destructive' }
    }
    
    const statusInfo = statusMap[status]
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
  }

  const handleOneClickReorder = () => {
    // TODO: Implement reorder functionality
    console.log('1-Click 재주문:', order)
    alert('장바구니에 상품이 추가되었습니다!')
  }

  const handleInquiry = () => {
    // TODO: Implement 1:1 inquiry functionality
    console.log('1:1 문의')
    alert('1:1 문의 기능은 준비중입니다.')
  }

  const handleInvoicePrint = () => {
    // TODO: Implement invoice printing
    console.log('거래명세서 출력')
    alert('거래명세서 출력 기능은 준비중입니다.')
  }

  const handleTrackingQuery = () => {
    // TODO: Implement tracking query
    console.log('배송 조회')
    alert('배송 조회 기능은 준비중입니다.')
  }

  const handleGoBack = () => {
    navigate({ to: '/orders' })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>주문 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">주문 정보를 불러오는 중 오류가 발생했습니다.</p>
          <Button onClick={() => loadOrders()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">주문 정보를 찾을 수 없습니다.</p>
          <Button onClick={handleGoBack} className="mt-4">
            이전 페이지로
          </Button>
        </div>
      </div>
    )
  }

  const artworkItems = order.rows.filter(row => row.item.type === 'artwork')
  const plasticStandItems = order.rows.filter(row => row.item.type === 'plasticStand')
  
  const getTotalPrice = () => {
    return order.rows.reduce((total, row) => total + (row.price * row.count), 0)
  }

  const getTotalQuantity = () => {
    return artworkItems.reduce((total, row) => total + row.count, 0)
  }

  const getPlasticStandCount = () => {
    return plasticStandItems.reduce((total, row) => total + row.count, 0)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          주문내역으로 돌아가기
        </Button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">주문 상세정보</h1>
            <p className="text-muted-foreground">주문번호: {order.id}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                주문 상품 ({getTotalQuantity() + getPlasticStandCount()}개)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {artworkItems.map((row, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {row.item.type === 'artwork' ? row.item.title : '상품'}
                    </h3>
                    <p className="text-sm text-gray-600">10x15cm 커스텀 캔버스</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">수량: {row.count}개</span>
                      <span className="font-medium">{(row.price * row.count).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {plasticStandItems.map((row, index) => (
                <div key={`stand-${index}`} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">플라스틱 스탠드</h3>
                    <p className="text-sm text-gray-600">캔버스 전용 받침대</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">수량: {row.count}개</span>
                      <span className="font-medium">{(row.price * row.count).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Progress */}
          <Card>
            <CardHeader>
              <CardTitle>주문 진행 상황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.logs.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">{getLogTypeText(log.type)}</p>
                      <p className="text-sm text-gray-600">{log.message}</p>
                      <p className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>주문 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>상품금액</span>
                <span>{getTotalPrice().toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>3,000원</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>총 결제금액</span>
                <span>{(getTotalPrice() + 3000).toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>주문 관련 기능</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleOneClickReorder}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                1-Click 재주문
              </Button>
              
              {(order.status === 'shipping' || order.status === 'delivered') && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleTrackingQuery}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  배송 조회
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleInquiry}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                1:1 문의
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleInvoicePrint}
              >
                <FileText className="h-4 w-4 mr-2" />
                거래명세서 출력
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle>배송 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">수령인</p>
                <p className="font-medium">{order.recipient.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">연락처</p>
                <p className="font-medium">{order.recipient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">배송주소</p>
                <p className="font-medium">
                  ({order.recipient.postalCode}) {order.recipient.address}
                  {order.recipient.addressDetail && ` ${order.recipient.addressDetail}`}
                </p>
              </div>
              {order.recipient.memo && (
                <div>
                  <p className="text-sm text-gray-600">배송메모</p>
                  <p className="font-medium">{order.recipient.memo}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getLogTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    order_arrived: '주문 접수',
    payment_verification_failed: '결제 확인 실패',
    payment_verification_completed: '결제 확인 완료',
    production_started: '제작 시작',
    production_completed: '제작 완료',
    shipment_registered: '배송 등록',
    package_picked_up: '상품 픽업',
    package_delivered: '배송 완료',
    order_cancel_requested: '주문 취소 요청',
    payment_canceled: '결제 취소',
    payment_cancel_rejected: '취소 거부'
  }
  return typeMap[type] || type
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}