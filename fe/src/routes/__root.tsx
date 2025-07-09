import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { PageHeader } from '@/components/common/PageHeader'
import { PageFooter } from '@/components/common/PageFooter'
import { Toaster } from '@/components/ui/sonner'
import { LoginIntentProvider } from '@/contexts/LoginIntentContext'

function RootLayout() {
  const location = useLocation()
  
  // Studio 페이지는 독립적인 레이아웃 유지
  const isStudioPage = location.pathname.startsWith('/studio')
  
  return (
    <LoginIntentProvider>
      {isStudioPage ? (
        <>
          <Outlet />
          <Toaster />
          <TanStackRouterDevtools />
        </>
      ) : (
        <div className="min-h-screen flex flex-col bg-background">
          <PageHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <PageFooter />
          <Toaster />
          <TanStackRouterDevtools />
        </div>
      )}
    </LoginIntentProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
