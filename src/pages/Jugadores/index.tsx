import { Search, Users, UserPlus, Trophy, MessageCircle, Download } from 'lucide-react'
import { usePlayersData } from '../../hooks/usePlayersData'
import { useDeportesData } from '../../hooks/useDeportesData'
import { useState } from 'react'
import PlayerModal from '../../components/jugadores/PlayerModal'

export default function Jugadores() {
    const { players, loading, error, refreshPlayers } = usePlayersData()
    const { deportes } = useDeportesData()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedDeporteId, setSelectedDeporteId] = useState('')
    const [selectedNivel, setSelectedNivel] = useState('')
    const [selectedTipo, setSelectedTipo] = useState<'' | 'jugador' | 'profesor'>('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

    const handleOpenNew = () => {
        setSelectedPlayer(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (player: any) => {
        setSelectedPlayer(player)
        setIsModalOpen(true)
    }

    // Client side filtering
    const filteredPlayers = players.filter(p => {
        const fullName = `${p.nombre} ${p.apellido}`.toLowerCase()
        const matchSearch = fullName.includes(searchTerm.toLowerCase()) ||
            (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.dni && p.dni.includes(searchTerm))

        let matchDeporte = true
        let matchNivel = true

        if (selectedDeporteId) {
            let parsedLevels: Record<string, string> = {}
            if (p.niveles_por_deporte) {
                if (typeof p.niveles_por_deporte === 'string') {
                    try { parsedLevels = JSON.parse(p.niveles_por_deporte) }
                    catch (e) { parsedLevels = {} }
                } else if (typeof p.niveles_por_deporte === 'object') {
                    parsedLevels = { ...p.niveles_por_deporte }
                }
            }

            matchDeporte = parsedLevels[selectedDeporteId] !== undefined

            if (selectedNivel) {
                matchNivel = parsedLevels[selectedDeporteId] === selectedNivel
            }
        }

        // Tipo filter
        let matchTipo = true
        if (selectedTipo) {
            matchTipo = (p.tipo || 'jugador') === selectedTipo
        }

        return matchSearch && matchDeporte && matchNivel && matchTipo
    })
    const handleExportCSV = () => {
        // Headers
        const headers = ['Nombre', 'Apellido', 'Tipo', 'Email', 'Telefono', 'DNI', 'Deportes_Niveles']

        // Data Rows
        const csvRows = filteredPlayers.map(p => {
            let deportesStr = ''
            if (p.niveles_por_deporte && Object.keys(p.niveles_por_deporte).length > 0) {
                const pairs = Object.entries(p.niveles_por_deporte).map(([depId, nivel]) => {
                    const d = deportes.find(x => x.id === depId)
                    return `${d?.nombre || 'Desconocido'}: ${nivel}`
                })
                deportesStr = pairs.join(' | ')
            }

            // Wrapping strings in quotes escapes embedded commas in CSV
            return [
                `"${p.nombre || ''}"`,
                `"${p.apellido || ''}"`,
                `"${(p.tipo || 'jugador') === 'profesor' ? 'Profesor' : 'Jugador'}"`,
                `"${p.email || ''}"`,
                `"${p.telefono || ''}"`,
                `"${p.dni || ''}"`,
                `"${deportesStr}"`
            ].join(',')
        })

        // Combine and download (including UTF-8 BOM for Excel compatibility)
        const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.setAttribute('href', url)
        link.setAttribute('download', `personas_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-textMain tracking-tight">Personas</h1>
                    <p className="text-sm text-textMuted mt-1">
                        Gestiona la base de datos de jugadores y profesores de tu club
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-surface hover:bg-surfaceHover border border-border text-textMain px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto justify-center"
                        title="Exportar listado actual a formato CSV"
                    >
                        <Download size={18} className="text-textMuted" />
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                        <UserPlus size={18} />
                        <span>Nueva Persona</span>
                    </button>
                </div>
            </div>

            {/* Toolbar / Search & Filters */}
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center w-full">
                    {/* Search */}
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textMuted" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-textMain"
                        />
                    </div>

                    {/* Filters & Results Count */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        {/* Tipo Segmented Filter */}
                        <div className="flex bg-background border border-border rounded-lg p-0.5 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setSelectedTipo('')}
                                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    selectedTipo === '' ? 'bg-surface text-textMain shadow-sm' : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTipo('jugador')}
                                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    selectedTipo === 'jugador' ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                Jugadores
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTipo('profesor')}
                                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    selectedTipo === 'profesor' ? 'bg-emerald-600 text-white shadow-sm' : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                Profesores
                            </button>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <select
                                value={selectedDeporteId}
                                onChange={(e) => {
                                    setSelectedDeporteId(e.target.value)
                                    setSelectedNivel('')
                                }}
                                className="w-full sm:w-40 px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            >
                                <option value="">Todos los deportes</option>
                                {deportes.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>

                            <select
                                value={selectedNivel}
                                onChange={(e) => setSelectedNivel(e.target.value)}
                                disabled={!selectedDeporteId}
                                className="w-full sm:w-36 px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
                            >
                                <option value="">Cualquier nivel</option>
                                {selectedDeporteId && deportes.find(d => d.id === selectedDeporteId)?.niveles_posibles.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-sm text-textMuted whitespace-nowrap self-end sm:self-center">
                            {filteredPlayers.length} {filteredPlayers.length === 1 ? 'resultado' : 'resultados'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-6 text-center">
                    <p>Ocurrió un error cargando los jugadores.</p>
                    <p className="text-sm mt-2 opacity-80">{error}</p>
                </div>
            ) : (
                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-background/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Persona</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider w-24">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Contacto</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider hidden md:table-cell">DNI</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider hidden sm:table-cell">Deportes (Nivel)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-textMuted">
                                            <div className="flex justify-center items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span>Cargando jugadores...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPlayers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users className="h-12 w-12 text-textMuted/30 mb-4" />
                                                <h3 className="text-lg font-medium text-textMain">No se encontraron personas</h3>
                                                <p className="text-sm text-textMuted mt-1">
                                                    {searchTerm ? 'Prueba con otros términos de búsqueda.' : 'Comienza añadiendo jugadores o profesores a tu club.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPlayers.map((player) => (
                                        <tr
                                            key={player.id}
                                            onClick={() => handleOpenEdit(player)}
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                                        {player.nombre.charAt(0)}{player.apellido.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-textMain">
                                                            {player.nombre} {player.apellido}
                                                        </div>
                                                        <div className="text-xs text-textMuted sm:hidden mt-0.5 flex items-center gap-2">
                                                            <span>{player.telefono || 'Sin teléfono'}</span>
                                                            {player.telefono && (
                                                                <a
                                                                    href={`https://wa.me/${player.telefono.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-green-500 hover:text-green-400 p-0.5 hover:bg-green-500/10 rounded transition-colors"
                                                                    title="Contactar por WhatsApp"
                                                                >
                                                                    <MessageCircle size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(player.tipo || 'jugador') === 'profesor' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Profesor
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                        Jugador
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-textMain truncate max-w-[200px]">{player.email || '-'}</div>
                                                <div className="text-xs text-textMuted hidden sm:flex items-center gap-2 mt-0.5">
                                                    <span>{player.telefono || '-'}</span>
                                                    {player.telefono && (
                                                        <a
                                                            href={`https://wa.me/${player.telefono.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-green-500 hover:text-green-400 p-0.5 hover:bg-green-500/10 rounded transition-colors"
                                                            title="Contactar por WhatsApp"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted hidden md:table-cell">
                                                {player.dni || '-'}
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {player.niveles_por_deporte && Object.keys(player.niveles_por_deporte).length > 0 ? (
                                                        Object.entries(player.niveles_por_deporte).map(([depId, nivel]) => {
                                                            const d = deportes.find(x => x.id === depId)
                                                            return (
                                                                <span key={depId} className="px-2 py-0.5 rounded text-xs bg-surface border border-border text-textMuted flex items-center gap-1">
                                                                    <Trophy size={10} className="text-primary/70" />
                                                                    {d?.nombre || 'Deporte'}: <span className="text-textMain font-medium">{nivel}</span>
                                                                </span>
                                                            )
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-textMuted italic">Sin asignar</span>
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

            {/* Modal Injection */}
            {isModalOpen && (
                <PlayerModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshPlayers}
                    playerToEdit={selectedPlayer}
                />
            )}
        </div>
    )
}
