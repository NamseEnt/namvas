import { createFileRoute } from '@tanstack/react-router'
import { OrdersPage } from '@/components/pages/OrdersPage'
import { AuthGuard } from '@/components/common/AuthGuard'

export const Route = createFileRoute('/orders')({
  component: () => (
    <AuthGuard>
      <OrdersPage />
    </AuthGuard>
  ),
})