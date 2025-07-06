import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, ShoppingCart, Search } from 'lucide-react'
import type { Order, OrderStatus } from "../../../../shared/types";

type DisplayOrder = Order & {
  orderNumber: string;
  shippingCost: number;
  deliveryInfo?: {
    carrier: string;
    trackingNumber: string;
  };
};

// Mock data
const mockOrders: DisplayOrder[] = [
  {
    id: '1',
    orderNumber: '20250705-000123',
    orderDate: '2025.07.05',
    status: 'delivered',
    items: [
      {
        artwork: {
          id: '1',
          title: '미니 우드 캔버스 A',
          originalImageId: 'image1',
          dpi: 300,
          imageCenterXy: { x: 0.5, y: 0.5 },
          sideProcessing: { type: 'clip' },
          thumbnailId: 'thumb1',
          createdAt: '2025-07-05',
          canvasBackgroundColor: '#ffffff'
        },
        quantity: 20,
        price: 10000
      },
      {
        artwork: {
          id: '2',
          title: '미니 우드 캔버스 B',
          originalImageId: 'image2',
          dpi: 300,
          imageCenterXy: { x: 0.5, y: 0.5 },
          sideProcessing: { type: 'clip' },
          thumbnailId: 'thumb2',
          createdAt: '2025-07-05',
          canvasBackgroundColor: '#ffffff'
        },
        quantity: 10,
        price: 10000
      }
    ],
    plasticStandCount: 5,
    plasticStandPrice: 250,
    totalPrice: 30000,
    recipient: {
      name: '홍길동',
      phone: '010-1234-5678',
      postalCode: '12345',
      address: '서울시 강남구 테헤란로',
      addressDetail: '123동 456호'
    },
    deliveryMemo: '문 앞에 남겨주세요',
    // Legacy properties for backward compatibility
    quantity: 30,
    plasticStand: true,
    artwork: {
      id: '1',
      title: '미니 우드 캔버스 A',
      originalImageId: 'image1',
      dpi: 300,
      imageCenterXy: { x: 0.5, y: 0.5 },
      sideProcessing: { type: 'clip' },
      thumbnailId: 'thumb1',
      createdAt: '2025-07-05',
      canvasBackgroundColor: '#ffffff'
    },
    shippingCost: 3000,
    deliveryInfo: {
      carrier: 'CJ대한통운',
      trackingNumber: '1234567890'
    }
  }
]

export function OrdersPage() {
  const [orders] = useState<DisplayOrder[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [periodFilter, setPeriodFilter] = useState<'1month' | '3months' | 'all'>('all')

  const handleOneClickReorder = (order: Order) => {
    // TODO: Implement reorder functionality
    console.log('1-Click 재주문:', order)
    alert('장바구니에 상품이 추가되었습니다!')
  }

  const filteredOrders = orders.filter(order => {
    if (searchTerm && !order.orderNumber.includes(searchTerm)) {
      return false
    }
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }
    // TODO: Implement period filter logic
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">주문내역</h1>
        <p className="text-gray-600">주문하신 상품의 주문상태를 확인해보세요.</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="주문번호로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: OrderStatus | 'all') => setStatusFilter(value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="주문상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="payment_pending">결제대기</SelectItem>
            <SelectItem value="payment_completed">결제완료</SelectItem>
            <SelectItem value="payment_failed">결제실패</SelectItem>
            <SelectItem value="in_production">제작중</SelectItem>
            <SelectItem value="shipping">배송중</SelectItem>
            <SelectItem value="delivered">배송완료</SelectItem>
            <SelectItem value="production_hold">제작보류</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={(value: '1month' | '3months' | 'all') => setPeriodFilter(value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="기간" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 기간</SelectItem>
            <SelectItem value="1month">최근 1개월</SelectItem>
            <SelectItem value="3months">최근 3개월</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">주문내역이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onReorder={handleOneClickReorder} />
          ))
        )}
      </div>
    </div>
  )
}

function OrderCard({ order, onReorder }: { order: DisplayOrder; onReorder: (order: DisplayOrder) => void }) {
  const mainItem = order.items[0]
  const remainingCount = order.items.length - 1

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { text: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
      payment_pending: { text: '결제대기', variant: 'secondary' },
      payment_completed: { text: '결제완료', variant: 'default' },
      payment_failed: { text: '결제실패', variant: 'destructive' },
      in_production: { text: '제작중', variant: 'default' },
      shipping: { text: '배송중', variant: 'default' },
      delivered: { text: '배송완료', variant: 'outline' },
      production_hold: { text: '제작보류', variant: 'secondary' }
    }
    
    const statusInfo = statusMap[status] || { text: status, variant: 'default' as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              주문일: {order.orderDate}
            </CardTitle>
            <p className="text-sm text-gray-600">주문번호: {order.orderNumber}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">
              {mainItem.artwork.title} (10x15cm)
              {remainingCount > 0 && ` 외 ${remainingCount}건`}
            </h3>
            <p className="text-sm text-gray-600">
              총 {order.items.reduce((sum, item) => sum + item.quantity, 0)}개
              {order.plasticStandCount > 0 && `, 플라스틱 스탠드 ${order.plasticStandCount}개`}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-lg font-semibold">
              결제금액: {(order.totalPrice + (order.shippingCost || 0)).toLocaleString()}원
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders/$orderId" params={{ orderId: order.id }}>상세보기</Link>
          </Button>
          
          {order.deliveryInfo && (order.status === 'shipping' || order.status === 'delivered') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // TODO: Implement tracking link
                alert(`배송조회: ${order.deliveryInfo?.carrier} ${order.deliveryInfo?.trackingNumber}`)
              }}
            >
              배송조회
            </Button>
          )}
          
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onReorder(order)}
            className="ml-auto"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            1-Click 재주문
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}