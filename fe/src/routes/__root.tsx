import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { PageHeader } from '@/components/common/PageHeader'
import { PageFooter } from '@/components/common/PageFooter'

function RootLayout() {
  const location = useLocation()
  
  // Studio 페이지는 독립적인 레이아웃 유지
  const isStudioPage = location.pathname.startsWith('/studio')
  
  if (isStudioPage) {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    )
  }
  
  // 나머지 페이지는 공통 헤더/푸터 적용
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PageFooter />
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
