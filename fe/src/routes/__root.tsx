import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { DropdownGNB } from '@/components/common/DropdownGNB'
import { PageFooter } from '@/components/common/PageFooter'
import { Toaster } from '@/components/ui/sonner'
import { LoginIntentProvider } from '@/contexts/LoginIntentContext'

function RootLayout() {
  const location = useLocation()
  
  // 랜딩 페이지는 GNB 없이 기존 레이아웃 유지
  const isLandingPage = location.pathname === '/'
  
  return (
    <LoginIntentProvider>
      {isLandingPage ? (
        <div className="min-h-screen flex flex-col bg-background">
          <PageHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <PageFooter />
          <Toaster />
        </div>
      ) : (
        <>
          <DropdownGNB />
          <main className="pt-14">
            <Outlet />
          </main>
          <Toaster />
        </>
      )}
    </LoginIntentProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
