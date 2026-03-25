import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, PackageOpen, CreditCard, Activity, RefreshCw, Search, Download } from 'lucide-react'
import { useCajaData } from '../../hooks/useCajaData'

// Helper for formatting currency
const formatMoney = (amount: number) => `$${amount.toLocaleString('es-AR')}`

// ─── Date helpers ───────────────────────────────────────────
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function startOfDay(d: Date) {
    const n = new Date(d)
    n.setHours(0, 0, 0, 0)
    return n
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBetween(d: Date, start: Date, end: Date) {
    const t = startOfDay(d).getTime()
    return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime()
}

function formatShort(d: Date) {
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
    const day = new Date(year, month, 1).getDay()
    // Convert Sunday=0 to Monday-based (Mon=0)
    return day === 0 ? 6 : day - 1
}

// ─── DateRangePicker component ──────────────────────────────
interface DateRangePickerProps {
    startDate: Date
    endDate: Date
    onChange: (start: Date, end: Date) => void
}

function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false)
    const [viewYear, setViewYear] = useState(startDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(startDate.getMonth())
    const [selecting, setSelecting] = useState<'start' | 'end' | null>(null)
    const [tempStart, setTempStart] = useState<Date>(startDate)
    const [tempEnd, setTempEnd] = useState<Date>(endDate)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
                setSelecting(null)
            }
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const handleOpen = () => {
        setTempStart(startDate)
        setTempEnd(endDate)
        setSelecting('start')
        setViewYear(startDate.getFullYear())
        setViewMonth(startDate.getMonth())
        setOpen(true)
    }

    const handleDayClick = (day: Date) => {
        if (selecting === 'start') {
            setTempStart(day)
            // If selected start is after current tempEnd, reset end
            if (day.getTime() > tempEnd.getTime()) {
                setTempEnd(day)
            }
            setSelecting('end')
        } else {
            // selecting === 'end'
            if (day.getTime() < tempStart.getTime()) {
                // Clicked before start — swap
                setTempEnd(tempStart)
                setTempStart(day)
            } else {
                setTempEnd(day)
            }
            // Apply range
            const finalStart = day.getTime() < tempStart.getTime() ? day : tempStart
            const finalEnd = day.getTime() < tempStart.getTime() ? tempStart : day
            onChange(finalStart, finalEnd)
            setSelecting(null)
            setOpen(false)
        }
    }

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
    const today = startOfDay(new Date())

    const isSingleDay = isSameDay(startDate, endDate)
    const label = isSingleDay
        ? formatShort(startDate)
        : `${formatShort(startDate)} — ${formatShort(endDate)}`

    // Quick presets
    const setToday = () => {
        const t = new Date()
        onChange(t, t)
        setOpen(false)
        setSelecting(null)
    }
    const setLast7 = () => {
        const t = new Date()
        const s = new Date(t)
        s.setDate(s.getDate() - 6)
        onChange(s, t)
        setOpen(false)
        setSelecting(null)
    }
    const setLast30 = () => {
        const t = new Date()
        const s = new Date(t)
        s.setDate(s.getDate() - 29)
        onChange(s, t)
        setOpen(false)
        setSelecting(null)
    }
    const setThisMonth = () => {
        const t = new Date()
        const s = new Date(t.getFullYear(), t.getMonth(), 1)
        onChange(s, t)
        setOpen(false)
        setSelecting(null)
    }

    // Build calendar grid
    const cells: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))

    // determine highlight range for rendering
    const highlightStart = selecting === 'end' ? tempStart : startDate
    const highlightEnd = selecting === 'end' ? tempEnd : endDate

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
                <CalendarIcon size={16} className="text-primary shrink-0" />
                <span className="text-sm font-medium text-textMain whitespace-nowrap">{label}</span>
            </button>

            {open && (
                <div className="absolute top-full mt-2 right-0 z-50 bg-surface border border-border rounded-xl shadow-2xl shadow-black/30 w-[340px] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-textMuted hover:text-textMain">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold text-textMain">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-textMuted hover:text-textMain">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Selecting indicator */}
                    {selecting && (
                        <div className="px-4 py-2 text-xs font-medium text-center border-b border-border">
                            {selecting === 'start' ? (
                                <span className="text-primary">Seleccionar fecha de inicio</span>
                            ) : (
                                <span className="text-emerald-400">Seleccionar fecha de fin</span>
                            )}
                        </div>
                    )}

                    {/* Day names */}
                    <div className="grid grid-cols-7 px-3 pt-3">
                        {DAY_NAMES.map(dn => (
                            <div key={dn} className="text-[10px] uppercase font-bold text-textMuted text-center py-1">{dn}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                        {cells.map((cell, i) => {
                            if (!cell) return <div key={`e-${i}`} />

                            const isToday = isSameDay(cell, today)
                            const isStart = isSameDay(cell, highlightStart)
                            const isEnd = isSameDay(cell, highlightEnd)
                            const inRange = isBetween(cell, highlightStart, highlightEnd)
                            const isSingle = isStart && isEnd

                            let cellClasses = 'relative w-full aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-all cursor-pointer '

                            if (isSingle) {
                                cellClasses += 'bg-primary text-white '
                            } else if (isStart) {
                                cellClasses += 'bg-primary text-white rounded-r-none '
                            } else if (isEnd) {
                                cellClasses += 'bg-primary text-white rounded-l-none '
                            } else if (inRange) {
                                cellClasses += 'bg-primary/20 text-primary rounded-none '
                            } else {
                                cellClasses += 'text-textMuted hover:bg-white/5 hover:text-textMain '
                            }

                            return (
                                <button
                                    key={cell.toISOString()}
                                    className={cellClasses}
                                    onClick={() => handleDayClick(cell)}
                                >
                                    {cell.getDate()}
                                    {isToday && !isStart && !isEnd && !isSingle && (
                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Quick presets */}
                    <div className="border-t border-border p-3 grid grid-cols-2 gap-2">
                        <button onClick={setToday} className="px-3 py-1.5 text-xs font-medium text-textMuted hover:text-textMain hover:bg-white/5 rounded-md transition-colors border border-border">
                            Hoy
                        </button>
                        <button onClick={setLast7} className="px-3 py-1.5 text-xs font-medium text-textMuted hover:text-textMain hover:bg-white/5 rounded-md transition-colors border border-border">
                            Últimos 7 días
                        </button>
                        <button onClick={setLast30} className="px-3 py-1.5 text-xs font-medium text-textMuted hover:text-textMain hover:bg-white/5 rounded-md transition-colors border border-border">
                            Últimos 30 días
                        </button>
                        <button onClick={setThisMonth} className="px-3 py-1.5 text-xs font-medium text-textMuted hover:text-textMain hover:bg-white/5 rounded-md transition-colors border border-border">
                            Este mes
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main CajaDashboard ─────────────────────────────────────
export function CajaDashboard() {
    const [startDate, setStartDate] = useState<Date>(new Date())
    const [endDate, setEndDate] = useState<Date>(new Date())
    const { sesiones, summary, empleados, loading, error, refreshCaja } = useCajaData(startDate, endDate)

    const handleRangeChange = (start: Date, end: Date) => {
        setStartDate(start)
        setEndDate(end)
    }

    const isSingleDay = isSameDay(startDate, endDate)


    const rangeLabel = isSingleDay
        ? 'en el día'
        : `en ${Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1} días`

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('todos')

    const filteredSesiones = sesiones.filter(s => {
        const matchesSearch = searchTerm === '' ||
            (s.cliente && `${s.cliente.nombre} ${s.cliente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.espacio?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.actividad?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'todos' || s.estado_pago === statusFilter || (!s.estado_pago && statusFilter === 'pendiente')

        return matchesSearch && matchesStatus
    })

    const handleExportCSV = () => {
        const headers = ['Fecha', 'Horario', 'Cliente', 'Cancha / Espacio', 'Actividad', 'Items', 'Total', 'Estado']
        const rows = filteredSesiones.map(s => {
            const sessionDate = new Date(s.inicio)
            const startText = sessionDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            const dateText = sessionDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
            const clientName = s.cliente ? `${s.cliente.nombre} ${s.cliente.apellido}`.trim() : 'Sin Asignar'
            const spaceName = s.espacio?.nombre || '-'
            const actName = s.actividad?.nombre || '-'
            const total = s.precio !== null ? s.precio : 0
            const status = s.estado_pago || 'pendiente'
            const items = s.items?.map(i => `${i.cantidad}x ${i.nombre}`).join('; ') || ''

            return `"${dateText}","${startText}","${clientName}","${spaceName}","${actName}","${items}","${total}","${status.toUpperCase()}"`
        })

        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `reporte_caja_${formatShort(startDate).replace(/[\s/]/g, '_')}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header & Date Navigation */}
            <div className="shrink-0 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-textMain mb-1">Caja y Reportes</h1>
                    <p className="text-sm text-textMuted">Rendimiento financiero y cobros de la jornada.</p>
                </div>

                <div className="flex items-center gap-2">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={handleRangeChange}
                    />
                    <button
                        onClick={refreshCaja}
                        disabled={loading}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors text-textMuted hover:text-textMain disabled:opacity-50 border border-border"
                        title="Actualizar Datos"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        Error al cargar la caja: {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {/* Total Revenue */}
                            <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={80} className="text-primary -mr-4 -mt-4 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-textMuted mb-2">
                                        <DollarSign size={16} className="text-primary" />
                                        <h3 className="text-sm font-medium">Total Recaudado</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-textMain tracking-tight">{formatMoney(summary.totalRecaudado)}</p>
                                </div>
                            </div>

                            {/* Session Activity */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 text-textMuted mb-2">
                                    <Activity size={16} className="text-[#f43f5e]" />
                                    <h3 className="text-sm font-medium">Total Turnos</h3>
                                </div>
                                <p className="text-3xl font-bold text-textMain mb-1">{summary.cantidadTurnos}</p>
                                <p className="text-xs text-textMuted font-medium">Turnos registrados {rangeLabel}</p>
                            </div>

                            {/* Paid / Deposit Status */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 text-textMuted mb-2">
                                    <CreditCard size={16} className="text-emerald-400" />
                                    <h3 className="text-sm font-medium">Pagos Completos</h3>
                                </div>
                                <p className="text-3xl font-bold text-emerald-400 mb-1">{summary.turnosPagados}</p>
                                <div className="flex gap-3 text-xs font-medium text-textMuted">
                                    <span>Pagados: <span className="text-textMain">{summary.turnosPagados}</span></span>
                                    <span>Señas: <span className="text-textMain">{summary.turnosSenados}</span></span>
                                </div>
                            </div>

                            {/* Pending Status */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 text-textMuted mb-2">
                                    <PackageOpen size={16} className="text-amber-400" />
                                    <h3 className="text-sm font-medium">Por Cobrar</h3>
                                </div>
                                <p className="text-3xl font-bold text-amber-400 mb-1">{summary.turnosPendientes}</p>
                                <p className="text-xs text-textMuted font-medium">Requieren cierre de caja</p>
                            </div>
                        </div>

                        {/* Detailed Sessions Table */}
                        <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-textMain">Detalle de Operaciones</h2>
                                    <span className="text-xs font-medium px-2 py-1 bg-background rounded border border-border text-textMuted whitespace-nowrap">
                                        {filteredSesiones.length} registros
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                                        <input 
                                            type="text"
                                            placeholder="Buscar cliente, cancha..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-lg text-textMain focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48 transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden shrink-0 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-colors">
                                        <select 
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="px-3 py-1.5 text-sm bg-transparent text-textMain focus:outline-none cursor-pointer outline-none"
                                        >
                                            <option value="todos">Todos los Estados</option>
                                            <option value="pagado">Pagados</option>
                                            <option value="seña">Señas</option>
                                            <option value="pendiente">Pendientes</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={filteredSesiones.length === 0}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-textMain rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm shrink-0"
                                    >
                                        <Download size={14} className="text-primary" />
                                        <span className="hidden sm:inline">Exportar CSV</span>
                                    </button>
                                </div>
                            </div>

                            {filteredSesiones.length === 0 ? (
                                <div className="p-12 text-center text-textMuted">
                                    <PackageOpen size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>No hay turnos registrados que coincidan con los filtros en este período.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-textMuted">
                                        <thead className="bg-surface text-xs uppercase text-textMuted border-b border-border">
                                            <tr>
                                                {!isSingleDay && <th className="px-6 py-4 font-semibold">Fecha</th>}
                                                <th className="px-6 py-4 font-semibold">Horario</th>
                                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                                <th className="px-6 py-4 font-semibold">Cancha / Espacio</th>
                                                <th className="px-6 py-4 font-semibold">Actividad</th>
                                                <th className="px-6 py-4 font-semibold">Creador</th>
                                                <th className="px-6 py-4 font-semibold hidden lg:table-cell">Anotaciones</th>
                                                <th className="px-6 py-4 font-semibold bg-black/[0.02] dark:bg-white/[0.02]">Ítems</th>
                                                <th className="px-6 py-4 font-semibold bg-black/[0.02] dark:bg-white/[0.02]">Total</th>
                                                <th className="px-6 py-4 font-semibold bg-black/[0.02] dark:bg-white/[0.02] text-center">Estado de Pago</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredSesiones.map((s) => {
                                                const sessionDate = new Date(s.inicio)
                                                const startText = sessionDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                                const dateText = sessionDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                                                const itemsCount = s.items?.length || 0

                                                return (
                                                    <tr key={s.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-border group">
                                                        {!isSingleDay && (
                                                            <td className="px-6 py-4 font-medium text-textMuted text-xs whitespace-nowrap">{dateText}</td>
                                                        )}
                                                        <td className="px-6 py-4 font-medium text-textMain">{startText}</td>
                                                        <td className="px-6 py-4">
                                                            {s.cliente ? (
                                                                <span className="text-primary font-medium">{s.cliente.nombre} {s.cliente.apellido}</span>
                                                            ) : (
                                                                <span className="text-textMuted italic">Sin Asignar</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-textMain">{s.espacio?.nombre}</td>
                                                        <td className="px-6 py-4 text-textMuted">{s.actividad?.nombre || '-'}</td>
                                                        <td className="px-6 py-4 text-[11px] font-medium">
                                                            {s.created_by ? (
                                                                empleados.find(e => e.user_id === s.created_by) 
                                                                    ? <span className="text-textMuted border border-border px-2 py-1 rounded bg-surface shadow-sm">{`${empleados.find(e => e.user_id === s.created_by).nombre} ${empleados.find(e => e.user_id === s.created_by).apellido || ''}`.trim()}</span>
                                                                    : <span className="text-primary border border-primary/20 px-2 py-1 rounded bg-primary/10 shadow-sm">Titular</span>
                                                            ) : (
                                                                <span className="text-textMuted/50 italic">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-[11px] text-textMuted max-w-[150px] truncate hidden lg:table-cell" title={s.anotaciones || ''}>
                                                            {s.anotaciones || <span className="text-textMuted/30 italic">-</span>}
                                                        </td>

                                                        {/* Items Section highlighted */}
                                                        <td className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                {itemsCount > 0 ? (
                                                                    s.items?.map((it, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center gap-3">
                                                                            <span className="truncate max-w-[150px]" title={it.nombre}>
                                                                                {it.cantidad > 1 && <span className="text-textMuted mr-1">{it.cantidad}x</span>}
                                                                                <span className={it.es_alquiler ? 'text-[#818cf8] font-medium' : 'text-textMain'}>{it.nombre}</span>
                                                                            </span>
                                                                            <span className="font-medium text-textMain">{formatMoney(it.precio * it.cantidad)}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-textMuted italic">Reservado (Sin ítem de alquiler)</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors text-textMain font-bold text-[15px]">
                                                            {s.precio !== null ? formatMoney(s.precio) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors text-center">
                                                            {s.estado_pago === 'pagado' && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded font-medium text-xs">PAGADO</span>}
                                                            {s.estado_pago === 'seña' && <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded font-medium text-xs">SEÑA</span>}
                                                            {(s.estado_pago === 'pendiente' || !s.estado_pago) && <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded font-medium text-xs">PENDIENTE</span>}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
