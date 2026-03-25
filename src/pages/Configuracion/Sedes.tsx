import { useState } from 'react'
import { Plus, Building2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBranch, Club } from '../../contexts/BranchContext'
import SedeModal from '../../components/configuracion/SedeModal'

export default function Sedes() {
    const { clubs, loadingBranch, refreshClubs, activeClub } = useBranch()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSede, setSelectedSede] = useState<Club | null>(null)

    const handleOpenNew = () => {
        setSelectedSede(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (sede: Club) => {
        setSelectedSede(sede)
        setIsModalOpen(true)
    }

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Back Navigation */}
            <div>
                <Link to="/configuracion" className="inline-flex items-center gap-2 text-sm text-textMuted hover:text-textMain transition-colors">
                    <ArrowLeft size={16} /> Volver a Configuración
                </Link>
            </div>

            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-textMain tracking-tight">Sedes / Sucursales</h1>
                        <p className="text-sm text-textMuted mt-1">
                            Administra los clubes o sucursales que pertenecen a tu organización.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
                    >
                        <Plus size={18} />
                        <span>Nueva Sede</span>
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3 max-w-4xl">
                    <p className="text-sm text-textMuted leading-relaxed">
                        <strong className="text-textMain font-medium">Nota sobre sucursales:</strong> La etiqueta <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 mx-1">ACTIVA</span> en la lista inferior indica en qué sucursal estás trabajando <strong>actualmente</strong>. Para ver los datos y operar en otra sucursal, debes cambiarla utilizando el selector ubicado en el menú lateral izquierdo, justo debajo del título "Gestión de Clubes".
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-background/50">
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Nombre de la Sede</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider hidden md:table-cell">Ubicación</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider hidden lg:table-cell">Contacto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loadingBranch ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-textMuted">
                                        <div className="flex justify-center items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span>Cargando sedes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clubs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Building2 className="h-12 w-12 text-textMuted/30 mb-4" />
                                            <h3 className="text-lg font-medium text-textMain">Sin sedes</h3>
                                            <p className="text-sm text-textMuted mt-1">No tienes sucursales registradas.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clubs.map((sede) => (
                                    <tr
                                        key={sede.id}
                                        onClick={() => handleOpenEdit(sede)}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeClub?.id === sede.id ? 'bg-primary/20 text-primary' : 'bg-surface border border-border text-textMuted'}`}>
                                                    <Building2 size={14} />
                                                </div>
                                                <span className="text-sm font-medium text-textMain">{sede.nombre}</span>
                                                {activeClub?.id === sede.id && (
                                                    <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Activa</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-textMain">{sede.localidad || <span className="text-textMuted italic text-xs">Sin definir</span>}</span>
                                                {sede.domicilio && <span className="text-xs text-textMuted truncate max-w-[150px]">{sede.domicilio}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-textMain">{sede.telefono || <span className="text-textMuted italic text-xs">Sin definir</span>}</span>
                                                {sede.email && <span className="text-xs text-textMuted truncate max-w-[150px]">{sede.email}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getStatusBadgeColor(sede.estado as any)}`}>
                                                {sede.estado || 'Operativa'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <SedeModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshClubs}
                    sedeToEdit={selectedSede}
                />
            )}
        </div>
    )
}

function getStatusBadgeColor(estado: 'Operativa' | 'Parcialmente Operativa' | 'Suspendida' | 'Mantenimiento') {
    switch (estado) {
        case 'Operativa':
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        case 'Parcialmente Operativa':
            return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        case 'Suspendida':
            return 'bg-red-500/10 text-red-600 border-red-500/20';
        case 'Mantenimiento':
            return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        default:
            // Default to operative if undefined (legacy records)
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
}
