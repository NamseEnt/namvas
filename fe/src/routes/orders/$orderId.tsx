import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, ArrowLeft, ShoppingCart, MessageSquare, FileText, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderDetailPage,
})

type OrderStatus = 'payment_pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled'

type OrderItem = {
  id: string
  name: string
  options: string
  quantity: number
  price: number
  image: string
}

type Order = {
  id: string
  orderNumber: string
  orderDate: string
  orderTime: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  shippingCost: number
  deliveryInfo?: {
    carrier: string
    trackingNumber: string
  }
  shippingAddress: {
    name: string
    phone: string
    address: string
    memo: string
  }
  paymentInfo: {
    method: string
    card: string
  }
}

// Mock data - in real app, this would be fetched based on orderId
const mockOrder: Order = {
  id: '1',
  orderNumber: '20250705-000123',
  orderDate: '2025년 7월 5일',
  orderTime: '14:30',
  status: 'delivered',
  items: [
    {
      id: '1',
      name: '미니 우드 캔버스 A',
      options: '10x10cm',
      quantity: 20,
      price: 20000,
      image: '/api/placeholder/100/100'
    },
    {
      id: '2',
      name: '미니 우드 캔버스 B',
      options: '15x10cm',
      quantity: 10,
      price: 15000,
      image: '/api/placeholder/100/100'
    }
  ],
  totalAmount: 38000,
  shippingCost: 3000,
  deliveryInfo: {
    carrier: 'CJ대한통운',
    trackingNumber: '1234567890'
  },
  shippingAddress: {
    name: '김작가',
    phone: '010-1234-5678',
    address: '서울시 마포구 창작대로 123, 5층',
    memo: '부재 시 경비실에 맡겨주세요.'
  },
  paymentInfo: {
    method: '신용카드',
    card: '현대카드/일시불'
  }
}

export default function OrderDetailPage() {
  const [order] = useState<Order>(mockOrder)

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap = {
      payment_pending: { text: '결제대기', variant: 'secondary' as const },
      preparing: { text: '상품준비중', variant: 'default' as const },
      shipping: { text: '배송중', variant: 'default' as const },
      delivered: { text: '배송완료', variant: 'default' as const },
      cancelled: { text: '주문취소', variant: 'destructive' as const }
    }
    
    const { text, variant } = statusMap[status]
    return <Badge variant={variant}>{text}</Badge>
  }

  const handleAddToCart = (item: OrderItem) => {
    // TODO: Implement add to cart functionality
    console.log('장바구니에 추가:', item)
    alert(`${item.name} 상품이 장바구니에 추가되었습니다!`)
  }

  const handleAddAllToCart = () => {
    // TODO: Implement add all to cart functionality
    console.log('모든 상품 장바구니에 추가:', order.items)
    alert('모든 상품이 장바구니에 추가되었습니다!')
  }

  const handleTrackingClick = () => {
    if (order.deliveryInfo) {
      // TODO: Implement tracking link
      alert(`배송조회: ${order.deliveryInfo.carrier} ${order.deliveryInfo.trackingNumber}`)
    }
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
        <h1 className="text-3xl font-bold mb-2">주문상세</h1>
      </div>

      <div className="grid gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>주문 요약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">주문번호: {order.orderNumber}</p>
                <p className="text-sm text-gray-600">주문일시: {order.orderDate} {order.orderTime}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>주문 상품 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.options}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{item.quantity}개</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{item.price.toLocaleString()}원</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                  >
                    장바구니에 추가
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>배송 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">받는 분: {order.shippingAddress.name}</p>
              <p className="text-sm text-gray-600">연락처: {order.shippingAddress.phone}</p>
              <p className="text-sm text-gray-600">배송지: {order.shippingAddress.address}</p>
              <p className="text-sm text-gray-600">배송 메모: {order.shippingAddress.memo}</p>
            </div>
            
            {order.deliveryInfo && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">운송장 번호</p>
                    <p className="text-sm text-gray-600">
                      {order.deliveryInfo.carrier} {order.deliveryInfo.trackingNumber}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTrackingClick}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    배송조회
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>결제 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>상품 합계</span>
                <span>{subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span>{order.shippingCost.toLocaleString()}원</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>총 결제금액</span>
                <span>{order.totalAmount.toLocaleString()}원</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="font-medium">결제수단</p>
              <p className="text-sm text-gray-600">{order.paymentInfo.method} ({order.paymentInfo.card})</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="default" 
            onClick={handleAddAllToCart}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            장바구니에 추가
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Implement inquiry functionality with pre-filled order number
              alert(`주문번호 ${order.orderNumber}가 자동으로 입력된 1:1 문의 페이지로 이동합니다.`)
            }}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            1:1 문의하기
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Implement receipt printing
              alert('거래명세서를 출력합니다.')
            }}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-2" />
            거래명세서 출력
          </Button>
        </div>
      </div>
    </div>
  )
}