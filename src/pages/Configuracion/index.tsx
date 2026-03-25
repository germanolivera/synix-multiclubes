import { LayoutTemplate, ChevronRight, Building2, Tag, Trash2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Configuracion() {
    const configModules = [
        {
            title: 'Sedes / Sucursales',
            description: 'Añade, edita y gestiona las distintas sucursales de tu organización.',
            icon: Building2,
            href: '/configuracion/sedes',
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            title: 'Personal y Accesos',
            description: 'Invita y gestiona las cuentas de tus empleados.',
            icon: Users,
            href: '/configuracion/personal',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Estructura del Club',
            description: 'Gestiona los deportes ofrecidos y las canchas o espacios físicos disponibles.',
            icon: LayoutTemplate,
            href: '/espacios',
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        },
        {
            title: 'Precios y Artículos',
            description: 'Gestiona tu lista de precios para alquileres, kiosco, indumentaria, etc.',
            icon: Tag,
            href: '/configuracion/precios',
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            title: 'Peligro: Eliminar Cuenta',
            description: 'Advertencia: Borra tu cuenta y TODOS los datos asociados.',
            icon: Trash2,
            href: '/configuracion/eliminar-cuenta',
            color: 'text-red-500',
            bg: 'bg-red-500/10 border border-red-500/30'
        }
    ]

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-textMain tracking-tight">Configuración</h1>
                <p className="text-sm text-textMuted">
                    Administra los ajustes generales y la estructura de tu sede
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {configModules.map((module, idx) => {
                    const Icon = module.icon
                    return (
                        <Link
                            key={idx}
                            to={module.href}
                            className="bg-surface border border-border rounded-xl p-5 flex flex-col hover:border-primary/50 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${module.bg} ${module.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-textMuted group-hover:text-primary transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                            <h3 className="text-base font-semibold text-textMain mb-1">{module.title}</h3>
                            <p className="text-sm text-textMuted line-clamp-2">{module.description}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
