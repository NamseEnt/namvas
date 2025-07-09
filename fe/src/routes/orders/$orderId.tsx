import { createFileRoute } from '@tanstack/react-router'
import { OrderDetailPage } from '@/components/pages/OrderDetailPage'
import { AuthGuard } from '@/components/common/AuthGuard'

export const Route = createFileRoute('/orders/$orderId')({
  component: function OrderDetailComponent() {
    const { orderId } = Route.useParams()
    return (
      <AuthGuard>
        <OrderDetailPage orderId={orderId} />
      </AuthGuard>
    )
  },
})