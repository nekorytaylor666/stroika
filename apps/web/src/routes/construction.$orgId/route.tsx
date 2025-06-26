import MainLayout from '@/components/layout/main-layout'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/construction/$orgId')({
    component: RouteComponent,
})

function RouteComponent() {
    return <MainLayout>
        <Outlet />
    </MainLayout>
}
