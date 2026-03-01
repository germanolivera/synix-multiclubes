import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'
import CopilotChat from '../copilot/CopilotChat'

export default function DashboardLayout() {
    const { session } = useAuth()

    // Protected Route logic
    if (!session) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background align-top">
            {/* Sidebar - Fixed width */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Main Content (Nested Routes outlet) */}
                <main className="flex-1 overflow-auto px-6 pb-6 pt-4">
                    <Outlet />
                </main>
                <CopilotChat />
            </div>
        </div>
    )
}
