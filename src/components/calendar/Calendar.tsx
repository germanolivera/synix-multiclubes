import { useState, useEffect } from 'react'
import { useCalendarData } from '../../hooks/useCalendarData'
import { useBranch } from '../../contexts/BranchContext'
import CreateSessionModal from './CreateSessionModal'
import CalendarSettingsModal from './CalendarSettingsModal'
import CalendarHeader from './CalendarHeader'
import { Espacio, Sesion } from '../../types/database.types'
import { MessageCircle } from 'lucide-react'

export default function Calendar() {
    const { activeClub } = useBranch()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const { espacios, sesiones, actividades, deportes, empleados, loading, error, refreshSessions } = useCalendarData(selectedDate)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedHour, setSelectedHour] = useState<number | null>(null)
    const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null)
    const [selectedSession, setSelectedSession] = useState<any>(null) // Using any locally to avoid import issues if Sesion isn't perfectly mapped

    // Sport Filter State
    const [selectedSportFilter, setSelectedSportFilter] = useState<string | null>(null)

    // Settings Modal State & Time Window
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [timeWindow, setTimeWindow] = useState({ start: 8, end: 23 })

    // Load branch-specific time window
    useEffect(() => {
        if (activeClub?.id) {
            const savedWindow = localStorage.getItem(`calendar_window_${activeClub.id}`)
            if (savedWindow) {
                try {
                    setTimeWindow(JSON.parse(savedWindow))
                } catch (e) {
                    console.error("Failed to parse calendar window settings")
                }
            } else {
                // Default
                setTimeWindow({ start: 8, end: 23 })
            }
        }
    }, [activeClub?.id])

    const handleSaveSettings = (start: number, end: number) => {
        const newWindow = { start, end }
        setTimeWindow(newWindow)
        if (activeClub?.id) {
            localStorage.setItem(`calendar_window_${activeClub.id}`, JSON.stringify(newWindow))
        }
        setIsSettingsOpen(false)
    }

    // Dynamic grid array
    const hours = Array.from({ length: timeWindow.end - timeWindow.start + 1 }, (_, i) => i + timeWindow.start)

    // Extract unique sports from the loaded espacios for the dropdown
    const sportOptions = Array.from(
        new Map(
            espacios
                .filter(e => e.deporte_id && e.club_deportes)
                .map(e => [e.deporte_id, e.club_deportes!.nombre])
        ).entries()
    ).map(([id, nombre]) => ({ id: id as string, nombre }))

    // Filter espacios based on selected sport (multi-sport spaces are always shown)
    const filteredEspacios = selectedSportFilter
        ? espacios.filter(e => e.es_multideporte || e.deporte_id === selectedSportFilter)
        : espacios

    if (loading) {
        return (
            <div className="h-full bg-surface border border-border rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full bg-surface border border-border rounded-xl flex items-center justify-center p-6 text-center">
                <p className="text-red-500">Error cargando el calendario: <br />{error}</p>
            </div>
        )
    }

    // Helper to open modal for creation or edit
    const handleCellClick = (espacio: Espacio, hour: number, existingSession?: Sesion) => {
        setSelectedEspacio(espacio)
        setSelectedHour(hour)
        if (existingSession) {
            setSelectedSession(existingSession)
        } else {
            setSelectedSession(null)
        }
        setIsModalOpen(true)
    }

    return (
        <div className="h-full flex flex-col">
            <CalendarHeader
                onOpenSettings={() => setIsSettingsOpen(true)}
                sports={sportOptions}
                selectedSport={selectedSportFilter}
                onSportSelect={setSelectedSportFilter}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />
            <div className="flex-1 bg-surface border border-border rounded-xl flex flex-col overflow-hidden relative">
                {/* Create/Edit Session Modal */}
                <CreateSessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshSessions}
                    selectedDate={selectedDate}
                    timeString={`${(selectedHour || 8).toString().padStart(2, '0')}:00`}
                    espacio={selectedEspacio}
                    actividades={actividades || []}
                    deportes={deportes || []}
                    empleados={empleados || []}
                    editSession={selectedSession}
                />
                <CalendarSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    initialStartHour={timeWindow.start}
                    initialEndHour={timeWindow.end}
                    onSave={handleSaveSettings}
                />
                {/* Scrollable Grid + Header Area */}
                <div className="flex-1 overflow-auto relative custom-scrollbar bg-background dark:bg-background/80">
                    <div className="min-w-max min-h-full">
                        {/* Header Row (Courts/Espacios) — sticky top so it scrolls horizontally but stays pinned vertically */}
                        <div className="flex border-b border-border bg-surface dark:bg-background sticky top-0 z-20">
                            <div className="w-20 shrink-0 border-r border-border bg-background dark:bg-surface sticky left-0 z-30"></div>
                            <div className="flex flex-1">
                                {filteredEspacios.length === 0 ? (
                                    <div className="flex-1 py-4 text-center text-textMuted text-sm">No hay espacios para el filtro seleccionado.</div>
                                ) : (
                                    filteredEspacios.map((espacio) => (
                                        <div
                                            key={espacio.id}
                                            className="flex-[1_0_120px] min-w-[120px] py-4 px-2 text-center border-r border-border flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-1.5"
                                        >
                                            <span className="text-[13px] font-semibold text-textMain line-clamp-1" title={espacio.nombre}>
                                                {espacio.nombre}
                                            </span>
                                            {espacio.es_multideporte ? (
                                                <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full tracking-wide">
                                                    Multi
                                                </span>
                                            ) : espacio.club_deportes?.nombre && (
                                                <span className="text-[11px] font-normal text-textMuted tracking-wide truncate">
                                                    ({espacio.club_deportes.nombre})
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Grid Rows */}
                        <div className="flex min-h-full">
                            {/* Fixed Time Column (Sticky to the left) */}
                            <div className="w-20 shrink-0 border-r border-border flex flex-col bg-surface dark:bg-surface/90 sticky left-0 z-10 shadow-sm">
                                {hours.map((hour) => (
                                    <div key={hour} className="flex-1 min-h-[40px] border-b border-border/50 dark:border-border text-[11px] font-medium text-textMuted flex items-start justify-center pr-2 pt-1.5">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            {/* Main Grid Columns */}
                            <div className="flex flex-1">
                                {filteredEspacios.map((espacio) => (
                                    <div key={`col-${espacio.id}`} className="flex-[1_0_120px] min-w-[120px] border-r border-border flex flex-col relative group">
                                        {/* Highlight Column on Hover */}
                                        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>

                                        {/* 1. Empty Grid Cells */}
                                        {hours.map((hour) => (
                                            <div
                                                key={`${espacio.id}-${hour}-empty`}
                                                className="flex-1 min-h-[40px] border-b border-border/50 dark:border-border relative cursor-pointer hover:bg-white/[0.03] transition-colors"
                                                onClick={() => handleCellClick(espacio, hour)}
                                            />
                                        ))}

                                        {/* 2. Session Blocks (Absolute Positioning) */}
                                        {sesiones
                                            .filter(s => s.espacio_id === espacio.id)
                                            .map(session => {
                                                const startObj = new Date(session.inicio)
                                                const endObj = new Date(session.fin)

                                                const startHourNum = startObj.getHours() + startObj.getMinutes() / 60
                                                const rawEndHour = endObj.getHours() + endObj.getMinutes() / 60
                                                const crossesMidnight = endObj.getDate() !== startObj.getDate() || endObj.getMonth() !== startObj.getMonth()
                                                const endHourNum = crossesMidnight ? rawEndHour + 24 : rawEndHour

                                                const windowEnd = timeWindow.end + 1
                                                const clampedEndHour = Math.min(endHourNum, windowEnd)

                                                const totalHoursDisplayed = timeWindow.end - timeWindow.start + 1
                                                const startPercentage = ((startHourNum - timeWindow.start) / totalHoursDisplayed) * 100
                                                const durationPercentage = ((clampedEndHour - startHourNum) / totalHoursDisplayed) * 100

                                                if (clampedEndHour <= timeWindow.start || startHourNum >= windowEnd) return null

                                                const statusStyles: Record<string, { bg: string, border: string, text: string }> = {
                                                    'pagado': { bg: 'bg-emerald-500/90', border: 'border-emerald-600', text: 'Pagado' },
                                                    'seña': { bg: 'bg-amber-500/90', border: 'border-amber-600', text: 'Seña' },
                                                    'pendiente': { bg: 'bg-rose-500/90', border: 'border-rose-600', text: 'Pendiente' }
                                                }

                                                const currentStatus = session.estado_pago?.toLowerCase() || 'pendiente'
                                                const styleMap = statusStyles[currentStatus] || { bg: 'bg-[#8b5cf6]', border: 'border-[#6d28d9]', text: 'Reserva' }

                                                const isShortSession = (clampedEndHour - startHourNum) <= 1.01

                                                return (
                                                    <div
                                                        key={`session-${session.id}`}
                                                        className={`absolute left-1 right-1 ${styleMap.bg} border-l-4 ${styleMap.border} rounded-lg ${isShortSession ? 'p-1.5' : 'p-2'} flex ${isShortSession ? 'flex-row items-center justify-between gap-2' : 'flex-col justify-between'} overflow-hidden group/session shadow-md hover:shadow-lg cursor-pointer z-10 transition-transform hover:-translate-y-0.5`}
                                                        style={{
                                                            top: `calc(${startPercentage}% + 2px)`,
                                                            height: `calc(${durationPercentage}% - 4px)`
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleCellClick(espacio, startObj.getHours(), session)
                                                        }}
                                                    >
                                                        {isShortSession ? (
                                                            <>
                                                                <div className="flex items-center gap-1.5 min-w-0 shrink">
                                                                    {session.clientes_globales ? (
                                                                        <>
                                                                            <span className="text-[13px] font-bold text-white/95 truncate leading-tight">
                                                                                {session.clientes_globales.nombre} {session.clientes_globales.apellido}
                                                                            </span>
                                                                            {session.clientes_globales.telefono && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        const cleanPhone = session.clientes_globales!.telefono!.replace(/\D/g, '')
                                                                                        window.open(`https://wa.me/${cleanPhone}`, '_blank')
                                                                                    }}
                                                                                    className="p-0.5 hover:bg-white/20 rounded-md transition-colors shrink-0"
                                                                                    title="Enviar WhatsApp"
                                                                                >
                                                                                    <MessageCircle size={12} className="text-white" fill="currentColor" />
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-[13px] font-bold text-white/70 italic truncate leading-tight">Sin jugador</span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2 shrink-0 min-w-0">
                                                                    <span className="text-[10px] sm:text-[11px] font-medium text-white/90 truncate hidden md:block">
                                                                        {startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        {' - '}
                                                                        {endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                                                                    </span>
                                                                    <span className="text-[13px] font-bold text-white shrink-0">${session.precio || 0}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between items-start shrink-0 w-full gap-1">
                                                                    <div className="flex items-center gap-1.5 min-w-0 pr-1 shrink">
                                                                        {session.clientes_globales ? (
                                                                            <>
                                                                                <span className="text-[1rem] font-bold text-white/95 truncate leading-tight">
                                                                                    {session.clientes_globales.nombre} {session.clientes_globales.apellido}
                                                                                </span>
                                                                                {session.clientes_globales.telefono && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            const cleanPhone = session.clientes_globales!.telefono!.replace(/\D/g, '')
                                                                                            window.open(`https://wa.me/${cleanPhone}`, '_blank')
                                                                                        }}
                                                                                        className="p-1 hover:bg-white/20 rounded-md transition-colors shrink-0"
                                                                                        title="Enviar WhatsApp"
                                                                                    >
                                                                                        <MessageCircle size={14} className="text-white" fill="currentColor" />
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-[1rem] font-bold text-white/70 italic truncate leading-tight">Sin jugador</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[13px] font-bold text-white shrink-0 mt-0.5">${session.precio || 0}</span>
                                                                </div>

                                                                <div className="mt-auto shrink-0 pt-0.5">
                                                                    <span className="text-[11px] font-medium text-white/90 truncate block">
                                                                        {startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        {' - '}
                                                                        {endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
