import { useState, useEffect } from 'react'
import { useCalendarData } from '../../hooks/useCalendarData'
import { useBranch } from '../../contexts/BranchContext'
import CreateSessionModal from './CreateSessionModal'
import CalendarSettingsModal from './CalendarSettingsModal'
import CalendarHeader from './CalendarHeader'
import { Espacio, Sesion } from '../../types/database.types'

export default function Calendar() {
    const { activeClub } = useBranch()
    const [selectedDate] = useState(new Date()) // TODO: Add date picker logic
    const { espacios, sesiones, actividades, loading, error, refreshSessions } = useCalendarData(selectedDate)

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

    // Filter espacios based on selected sport
    const filteredEspacios = selectedSportFilter
        ? espacios.filter(e => e.deporte_id === selectedSportFilter)
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
            />
            <div className="flex-1 bg-surface border border-border rounded-xl flex flex-col overflow-hidden relative">
                {/* Create/Edit Session Modal */}
                <CreateSessionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshSessions}
                    selectedDate={selectedDate}
                    hour={selectedHour || 8}
                    espacio={selectedEspacio}
                    actividades={actividades || []}
                    editSession={selectedSession}
                />
                <CalendarSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    initialStartHour={timeWindow.start}
                    initialEndHour={timeWindow.end}
                    onSave={handleSaveSettings}
                />
                {/* Header Row (Courts/Espacios) */}
                <div className="flex border-b border-[#2a2d3d] bg-surface/30">
                    <div className="w-20 shrink-0 border-r border-[#2a2d3d] bg-[#0f121b]/80 z-10 relative"></div>
                    <div className="flex flex-1 overflow-hidden">
                        {filteredEspacios.length === 0 ? (
                            <div className="flex-1 py-4 text-center text-textMuted text-sm">No hay espacios para el filtro seleccionado.</div>
                        ) : (
                            filteredEspacios.map((espacio) => (
                                <div
                                    key={espacio.id}
                                    className="flex-[1_0_120px] min-w-[120px] py-4 px-2 text-center border-r border-[#2a2d3d] flex flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-1.5"
                                >
                                    <span className="text-[13px] font-semibold text-textMain line-clamp-1" title={espacio.nombre}>
                                        {espacio.nombre}
                                    </span>
                                    {espacio.club_deportes?.nombre && (
                                        <span className="text-[11px] font-normal text-textMuted tracking-wide truncate">
                                            ({espacio.club_deportes.nombre})
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Grid Area */}
                <div className="flex-1 overflow-auto relative custom-scrollbar bg-[#0f121b]/40">
                    <div className="flex min-w-max min-h-full">
                        {/* Fixed Time Column (Sticky to the left) */}
                        <div className="w-20 shrink-0 border-r border-[#2a2d3d]/60 flex flex-col bg-[#0f121b]/95 sticky left-0 z-10 shadow-[1px_0_4px_rgba(0,0,0,0.2)]">
                            {hours.map((hour) => (
                                <div key={hour} className="flex-1 min-h-[40px] border-b border-[#2a2d3d]/40 text-[11px] font-medium text-textMuted flex items-start justify-center pr-2 pt-1.5">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Main Grid Columns */}
                        <div className="flex flex-1 min-w-max">
                            {filteredEspacios.map((espacio) => (
                                <div key={`col-${espacio.id}`} className="w-[120px] flex-1 border-r border-[#2a2d3d]/30 flex flex-col relative group">
                                    {/* Highlight Column on Hover */}
                                    <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>

                                    {/* 1. Empty Grid Cells */}
                                    {hours.map((hour) => (
                                        <div
                                            key={`${espacio.id}-${hour}-empty`}
                                            className="flex-1 min-h-[40px] border-b border-[#2a2d3d]/30 relative group/cell p-0.5"
                                        >
                                            <div
                                                className="absolute inset-0 m-1 flex items-center justify-center rounded-lg opacity-0 group-hover/cell:opacity-100 group-hover/cell:bg-white/[0.03] transition-all cursor-pointer"
                                                onClick={() => handleCellClick(espacio, hour)}
                                            >
                                                <span className="text-xs text-textMuted/70 font-medium">+ Reservar</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* 2. Session Blocks (Absolute Positioning) */}
                                    {sesiones
                                        .filter(s => s.espacio_id === espacio.id)
                                        .map(session => {
                                            const startObj = new Date(session.inicio)
                                            const endObj = new Date(session.fin)

                                            const startHourNum = startObj.getHours() + startObj.getMinutes() / 60
                                            // If the session crosses midnight to the next day, add 24 so the
                                            // hour is expressed as e.g. 25 instead of 1
                                            const rawEndHour = endObj.getHours() + endObj.getMinutes() / 60
                                            const crossesMidnight = endObj.getDate() !== startObj.getDate() || endObj.getMonth() !== startObj.getMonth()
                                            const endHourNum = crossesMidnight ? rawEndHour + 24 : rawEndHour

                                            // Clamp end to the window boundary so sessions that overflow past the
                                            // calendar window are shown truncated at the bottom of the grid.
                                            const windowEnd = timeWindow.end + 1
                                            const clampedEndHour = Math.min(endHourNum, windowEnd)

                                            // Determine vertical percentages relative to the Total Displayed Hours
                                            const totalHoursDisplayed = timeWindow.end - timeWindow.start + 1
                                            const startPercentage = ((startHourNum - timeWindow.start) / totalHoursDisplayed) * 100
                                            const durationPercentage = ((clampedEndHour - startHourNum) / totalHoursDisplayed) * 100

                                            // Only render if it falls partially within the viewing window
                                            if (clampedEndHour <= timeWindow.start || startHourNum >= windowEnd) return null

                                            // Color mapping based on estado_pago
                                            const statusStyles: Record<string, { bg: string, border: string, text: string }> = {
                                                'pagado': { bg: 'bg-emerald-500/90', border: 'border-emerald-600', text: 'Pagado' },
                                                'seña': { bg: 'bg-amber-500/90', border: 'border-amber-600', text: 'Seña' },
                                                'pendiente': { bg: 'bg-rose-500/90', border: 'border-rose-600', text: 'Pendiente' }
                                            }

                                            // Default to a generic color if status is unknown/missing
                                            const currentStatus = session.estado_pago?.toLowerCase() || 'pendiente'
                                            const styleMap = statusStyles[currentStatus] || { bg: 'bg-[#8b5cf6]', border: 'border-[#6d28d9]', text: 'Reserva' }

                                            return (
                                                <div
                                                    key={`session-${session.id}`}
                                                    className={`absolute left-1 right-1 ${styleMap.bg} border-l-4 ${styleMap.border} rounded-lg p-2 flex flex-col justify-between overflow-hidden group/session shadow-md hover:shadow-lg cursor-pointer z-10 transition-transform hover:-translate-y-0.5`}
                                                    style={{
                                                        top: `calc(${startPercentage}% + 2px)`,
                                                        height: `calc(${durationPercentage}% - 4px)`
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation() // Prevent triggering the underlying empty cell click
                                                        handleCellClick(espacio, startObj.getHours(), session)
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[13px] font-bold text-white tracking-wide capitalize">{styleMap.text}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end mt-auto">
                                                        <span className="text-[11px] font-medium text-white/90">
                                                            {startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {' - '}
                                                            {endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs
                                                        </span>
                                                        <span className="text-[12px] font-bold text-white">${session.precio || 0}</span>
                                                    </div>
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
    )
}
