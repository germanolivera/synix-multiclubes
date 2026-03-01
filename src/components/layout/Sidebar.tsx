import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    CalendarDays,
    Users,
    LogOut,
    Settings,
    // RotateCcw, // Keep for when the 'Resetear Datos (Test)' button is re-enabled
    Moon,
    Sun,
    ChevronDown,
    Tag,
    ChevronLeft,
    ChevronRight,
    Wallet // Added Wallet icon
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useBranch } from '../../contexts/BranchContext'

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const location = useLocation()
    const { user, signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { clubs, activeClub, setActiveClub, loadingBranch } = useBranch()

    const menuItems = [
        { icon: CalendarDays, label: 'Calendario', href: '/' },
        { icon: Wallet, label: 'Caja y Reportes', href: '/caja' }, // Added new menu item
        { icon: Users, label: 'Jugadores', href: '/jugadores' },
        { icon: Tag, label: 'Precios', href: '/precios' }
    ]

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-background border-r border-border h-full flex flex-col transition-all duration-300 relative z-50`}>
            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 bg-surface border border-border text-textMuted hover:text-textMain rounded-full p-1 shadow-md transition-colors"
                title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Brand / Title */}
            <div className="p-6">
                {!isCollapsed && <h1 className="text-xl font-bold text-textMain tracking-tight mb-2 truncate">Gestión de Clubes</h1>}

                {loadingBranch ? (
                    <div className={`h-9 bg-surface animate-pulse rounded-md ${isCollapsed ? 'w-8' : 'w-full'}`}></div>
                ) : clubs.length > 0 && activeClub ? (
                    <div className="relative">
                        {isCollapsed ? (
                            <div className="flex justify-center mt-8">
                                <span
                                    className="text-sm font-semibold text-textMuted tracking-widest uppercase whitespace-nowrap"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                    title={activeClub.nombre}
                                >
                                    {activeClub.nombre}
                                </span>
                            </div>
                        ) : (
                            <>
                                <select
                                    value={activeClub.id}
                                    onChange={(e) => {
                                        const selected = clubs.find(c => c.id === e.target.value)
                                        if (selected) setActiveClub(selected)
                                    }}
                                    className="w-full appearance-none bg-surface border border-border text-textMain text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors font-medium truncate"
                                >
                                    {clubs.map(club => (
                                        <option key={club.id} value={club.id}>
                                            {club.nombre}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
                            </>
                        )}
                    </div>
                ) : (
                    <p className={`text-sm text-textMuted bg-surface border border-border rounded-md ${isCollapsed ? 'px-2 py-2 text-center text-xs' : 'px-3 py-2'}`}>
                        {isCollapsed ? '---' : 'Sin sedes'}
                    </p>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1">
                {menuItems.map((item, idx) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={idx}
                            to={item.href}
                            title={isCollapsed ? item.label : undefined}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-surface text-primary border-l-2 border-primary'
                                : 'text-textMuted hover:text-textMain hover:bg-surface/50 border-l-2 border-transparent'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-primary' : 'text-textMuted'} />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-2">
                {/* 
                <button
                    title={isCollapsed ? "Resetear Datos" : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors`}
                >
                    <RotateCcw size={18} />
                    {!isCollapsed && <span className="truncate">Resetear Datos (Test)</span>}
                </button>
                */}

                <div className="space-y-1 pt-4 border-t border-border">
                    <button
                        onClick={toggleTheme}
                        title={isCollapsed ? (theme === 'dark' ? "Modo Claro" : "Modo Oscuro") : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 min-h-[48px] text-sm font-medium rounded-lg transition-colors text-textMuted hover:bg-surface/50 hover:text-textMain group`}
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className={`h-5 w-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                                {!isCollapsed && <span className="truncate">Modo Claro</span>}
                            </>
                        ) : (
                            <>
                                <Moon className={`h-5 w-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                                {!isCollapsed && <span className="truncate">Modo Oscuro</span>}
                            </>
                        )}
                    </button>

                    <Link
                        to="/configuracion"
                        title={isCollapsed ? "Configuración" : undefined}
                        className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 min-h-[48px] text-sm font-medium rounded-lg transition-colors ${location.pathname === '/configuracion'
                            ? 'bg-primary/10 text-primary'
                            : 'text-textMuted hover:bg-surface/50 hover:text-textMain'
                            }`}
                    >
                        <Settings className={`h-5 w-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span className="truncate">Configuración</span>}
                    </Link>
                </div>

                {/* User Card */}
                <div className={`mt-4 flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-3'} bg-surface rounded-xl border border-border`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-textMain truncate">Usuario</span>
                                <span className="text-xs text-textMuted truncate w-24" title={user?.email || ''}>
                                    {user?.email || 'Cargando...'}
                                </span>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <button
                            onClick={signOut}
                            className="text-textMuted hover:text-textMain transition-colors shrink-0"
                            title="Cerrar sesión"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                    {isCollapsed && (
                        <div className="hidden">
                            {/* Provide a logout button somewhere else or expand to log out, but usually a simple logout icon on hover could work too. Leaving hidden for pure collapse */}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}
