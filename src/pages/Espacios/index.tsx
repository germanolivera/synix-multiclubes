import { Plus, LayoutTemplate, Activity, Trophy, ArrowLeft } from 'lucide-react'
import { useEspaciosData } from '../../hooks/useEspaciosData'
import { useDeportesData } from '../../hooks/useDeportesData'
import { useState } from 'react'
import EspacioModal from '../../components/espacios/EspacioModal'
import DeporteModal from '../../components/espacios/DeporteModal'
import { Link } from 'react-router-dom'

export default function Espacios() {
    const { espacios, loading: loadingE, error: errorE, refreshEspacios } = useEspaciosData()
    const { deportes, loading: loadingD, error: errorD, refreshDeportes } = useDeportesData()

    const [activeTab, setActiveTab] = useState<'espacios' | 'deportes'>('espacios')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEspacio, setSelectedEspacio] = useState<any>(null) // the one to edit (null = new)

    const [isDeporteModalOpen, setIsDeporteModalOpen] = useState(false)
    const [selectedDeporte, setSelectedDeporte] = useState<any>(null)

    const handleOpenNew = () => {
        if (activeTab === 'espacios') {
            setSelectedEspacio(null)
            setIsModalOpen(true)
        } else {
            setSelectedDeporte(null)
            setIsDeporteModalOpen(true)
        }
    }

    const handleOpenEditEspacio = (espacio: any) => {
        setSelectedEspacio(espacio)
        setIsModalOpen(true)
    }

    const handleOpenEditDeporte = (deporte: any) => {
        setSelectedDeporte(deporte)
        setIsDeporteModalOpen(true)
    }

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Back to Configuration */}
            <div>
                <Link to="/configuracion" className="inline-flex items-center gap-2 text-sm text-textMuted hover:text-textMain transition-colors">
                    <ArrowLeft size={16} /> Volver a Configuración
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-textMain tracking-tight">Estructura del Club</h1>
                    <p className="text-sm text-textMuted mt-1">
                        Administra los deportes configurados y sus canchas o salas.
                    </p>
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>{activeTab === 'espacios' ? 'Nuevo Espacio' : 'Nuevo Deporte'}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('espacios')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'espacios' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}
                >
                    <LayoutTemplate size={16} /> Espacios
                </button>
                <button
                    onClick={() => setActiveTab('deportes')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'deportes' ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-textMain'}`}
                >
                    <Trophy size={16} /> Deportes y Niveles
                </button>
            </div>

            {/* Main Content Area */}
            {(activeTab === 'espacios' ? errorE : errorD) ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-6 text-center">
                    <p>Ocurrió un error cargando los datos.</p>
                    <p className="text-sm mt-2 opacity-80">{activeTab === 'espacios' ? errorE : errorD}</p>
                </div>
            ) : activeTab === 'espacios' ? (
                // ESPACIOS TABLE
                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-background/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Espacio</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Deporte</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider hidden md:table-cell">Características</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loadingE ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-textMuted">
                                            <div className="flex justify-center items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span>Cargando espacios...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : espacios.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <LayoutTemplate className="h-12 w-12 text-textMuted/30 mb-4" />
                                                <h3 className="text-lg font-medium text-textMain">No tienes espacios configurados</h3>
                                                <p className="text-sm text-textMuted mt-1">
                                                    Comienza añadiendo tu primera cancha o sala.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    espacios.map((espacio) => (
                                        <tr
                                            key={espacio.id}
                                            onClick={() => handleOpenEditEspacio(espacio)}
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-textMain">{espacio.nombre}</div>
                                                <div className="text-xs text-textMuted sm:hidden mt-0.5">Cap: {espacio.capacidad}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Activity size={14} className="text-primary/70" />
                                                    <span className="text-sm text-textMain">{espacio.club_deportes?.nombre || <span className="text-textMuted italic">Sin Asignar</span>}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {espacio.estado === 'Activo' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-500/10 text-green-500 border border-green-500/20">{espacio.estado}</span>}
                                                {espacio.estado === 'Mantenimiento' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">{espacio.estado}</span>}
                                                {espacio.estado === 'Inactivo' && <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-red-500/10 text-red-500 border border-red-500/20">{espacio.estado}</span>}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <div className="flex flex-wrap gap-2 text-xs text-textMuted">
                                                    {Object.keys(espacio.caracteristicas || {}).length > 0 ? (
                                                        Object.entries(espacio.caracteristicas).map(([k, v]: [string, any]) => (
                                                            <div key={k} className="flex gap-1" title={`${k}: ${v}`}>
                                                                <span className="font-semibold">{k}:</span>
                                                                <span>{String(v)}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="italic">Sin carac.</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // DEPORTES TABLE
                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-background/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Deporte</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Escala de Niveles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loadingD ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-textMuted">
                                            <div className="flex justify-center items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span>Cargando deportes...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : deportes.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Trophy className="h-12 w-12 text-textMuted/30 mb-4" />
                                                <h3 className="text-lg font-medium text-textMain">Sin deportes</h3>
                                                <p className="text-sm text-textMuted mt-1">Configura las disciplinas que se practican en tu club.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    deportes.map((dep) => (
                                        <tr
                                            key={dep.id}
                                            onClick={() => handleOpenEditDeporte(dep)}
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Trophy size={14} className="text-primary/70" />
                                                    <span className="text-sm font-medium text-textMain">{dep.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {dep.activo ? (
                                                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Activo</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Inactivo</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(dep.niveles_posibles) && dep.niveles_posibles.length > 0 ? (
                                                        dep.niveles_posibles.map((nivel: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 rounded text-xs bg-surface border border-border text-textMuted">
                                                                {nivel}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-textMuted italic">Única categoría</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Editor Modal Espacios */}
            {isModalOpen && (
                <EspacioModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshEspacios}
                    espacioToEdit={selectedEspacio}
                    deportes={deportes}
                />
            )}

            {/* Editor Modal Deportes */}
            {isDeporteModalOpen && (
                <DeporteModal
                    isOpen={isDeporteModalOpen}
                    onClose={() => setIsDeporteModalOpen(false)}
                    onSuccess={refreshDeportes}
                    deporteToEdit={selectedDeporte}
                />
            )}
        </div>
    )
}
