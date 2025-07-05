import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, ShoppingCart, Search } from 'lucide-react'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
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
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  shippingCost: number
  deliveryInfo?: {
    carrier: string
    trackingNumber: string
  }
}

// Mock data
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '20250705-000123',
    orderDate: '2025.07.05',
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
    }
  }
]

export default function OrdersPage() {
  const [orders] = useState<Order[]>(mockOrders)
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
            <SelectItem value="preparing">상품준비중</SelectItem>
            <SelectItem value="shipping">배송중</SelectItem>
            <SelectItem value="delivered">배송완료</SelectItem>
            <SelectItem value="cancelled">주문취소</SelectItem>
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

function OrderCard({ order, onReorder }: { order: Order; onReorder: (order: Order) => void }) {
  const mainItem = order.items[0]
  const remainingCount = order.items.length - 1

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
              {mainItem.name} ({mainItem.options})
              {remainingCount > 0 && ` 외 ${remainingCount}건`}
            </h3>
            <p className="text-sm text-gray-600">
              총 {order.items.reduce((sum, item) => sum + item.quantity, 0)}개
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-lg font-semibold">
              결제금액: {order.totalAmount.toLocaleString()}원
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