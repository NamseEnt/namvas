import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, ShoppingCart, Search } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import type { Order } from "../../../../shared/types";

export function OrdersPage() {
  const { orders, isLoading, error, hasMore, loadOrders, loadMore } = useOrders()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<'1month' | '3months' | 'all'>('all')

  useEffect(function loadInitialOrders() {
    loadOrders()
  }, [loadOrders])

  const handleOneClickReorder = (order: Order) => {
    // TODO: Implement reorder functionality
    console.log('1-Click 재주문:', order)
  }

  const filteredOrders = orders.filter(order => {
    // Basic status filtering
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }
    
    // Basic search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return order.id.toLowerCase().includes(searchLower) ||
             order.rows.some(row => 
               row.item.type === 'artwork' && row.item.title.toLowerCase().includes(searchLower)
             )
    }
    
    return true
  })

  if (isLoading && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>주문내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">주문내역을 불러오는 중 오류가 발생했습니다.</p>
          <Button onClick={() => loadOrders()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="주문번호나 상품명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="주문상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="payment_verifing">결제 확인중</SelectItem>
              <SelectItem value="payment_failed">결제실패</SelectItem>
              <SelectItem value="waiting_start_production">제작 대기중</SelectItem>
              <SelectItem value="in_production">제작중</SelectItem>
              <SelectItem value="shipping">배송중</SelectItem>
              <SelectItem value="delivered">배송완료</SelectItem>
              <SelectItem value="payment_cancelling">결제 취소중</SelectItem>
              <SelectItem value="payment_canceled">결제 취소됨</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as '1month' | '3months' | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="1month">최근 1개월</SelectItem>
              <SelectItem value="3months">최근 3개월</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">주문내역이 없습니다.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} onReorder={handleOneClickReorder} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? '로딩 중...' : '더 보기'}
          </Button>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, onReorder }: { order: Order; onReorder: (order: Order) => void }) {
  const artworkItems = order.rows.filter(row => row.item.type === 'artwork')
  const plasticStandItems = order.rows.filter(row => row.item.type === 'plasticStand')
  const mainItem = artworkItems[0]
  const remainingCount = artworkItems.length - 1

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

  const getTotalPrice = () => {
    return order.rows.reduce((total, row) => total + (row.price * row.count), 0)
  }

  const getTotalQuantity = () => {
    return artworkItems.reduce((total, row) => total + row.count, 0)
  }

  const getPlasticStandCount = () => {
    return plasticStandItems.reduce((total, row) => total + row.count, 0)
  }

  if (!mainItem) {
    return null
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              주문번호: {order.id}
            </CardTitle>
            <p className="text-sm text-gray-600">
              수령인: {order.recipient.name}
            </p>
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
            {mainItem.item.type === 'artwork' && (
              <h3 className="font-medium">
                {mainItem.item.title} (10x15cm)
                {remainingCount > 0 && ` 외 ${remainingCount}건`}
              </h3>
            )}
            <p className="text-sm text-gray-600">
              총 {getTotalQuantity()}개
              {getPlasticStandCount() > 0 && `, 플라스틱 스탠드 ${getPlasticStandCount()}개`}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-lg font-semibold">
              결제금액: {getTotalPrice().toLocaleString()}원
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders/$orderId" params={{ orderId: order.id }}>상세보기</Link>
          </Button>
          
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