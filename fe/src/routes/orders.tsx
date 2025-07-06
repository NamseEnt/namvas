import { createFileRoute } from '@tanstack/react-router'
import { OrdersPage } from '@/components/pages/OrdersPage'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})