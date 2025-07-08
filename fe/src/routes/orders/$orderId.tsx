import { createFileRoute } from '@tanstack/react-router'
import { OrderDetailPage } from '@/components/pages/OrderDetailPage'

export const Route = createFileRoute('/orders/$orderId')({
  component: function OrderDetailComponent() {
    const { orderId } = Route.useParams()
    return <OrderDetailPage orderId={orderId} />
  },
})