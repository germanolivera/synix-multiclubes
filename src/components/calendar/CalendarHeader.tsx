import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Trophy, Settings, Check, Calendar as CalendarIcon } from 'lucide-react'

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

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
}

interface CalendarHeaderProps {
    onOpenSettings: () => void;
    sports: { id: string, nombre: string }[];
    selectedSport: string | null;
    onSportSelect: (sportId: string | null) => void;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export default function CalendarHeader({ onOpenSettings, sports, selectedSport, onSportSelect, selectedDate, onDateChange }: CalendarHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())
    
    const dropdownRef = useRef<HTMLDivElement>(null)
    const datePickerRef = useRef<HTMLDivElement>(null)

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedSportName = selectedSport
        ? sports.find(s => s.id === selectedSport)?.nombre || "Todos los deportes"
        : "Todos los deportes"

    const handlePrevDay = () => {
        const prev = new Date(selectedDate)
        prev.setDate(prev.getDate() - 1)
        onDateChange(prev)
    }

    const handleNextDay = () => {
        const next = new Date(selectedDate)
        next.setDate(next.getDate() + 1)
        onDateChange(next)
    }

    const handleToday = () => {
        onDateChange(new Date())
        setIsDatePickerOpen(false)
    }

    // Sync view with selectedDate changes from outside
    useEffect(() => {
        setViewYear(selectedDate.getFullYear())
        setViewMonth(selectedDate.getMonth())
    }, [selectedDate])

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

    const cells: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))

    const handleDayClick = (day: Date) => {
        onDateChange(day)
        setIsDatePickerOpen(false)
    }

    const formattedDate = selectedDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).toUpperCase()

    return (
        <header className="h-16 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
                <h2 className="text-xl font-bold text-white">Calendario</h2>

                {/* Date Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-surface border border-border rounded-lg overflow-visible" ref={datePickerRef}>
                        <button onClick={handlePrevDay} className="px-3 py-2 text-textMuted hover:text-white hover:bg-white/5 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        
                        <div className="relative border-x border-border">
                            <button 
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                className="px-5 py-2 text-sm font-semibold text-textMain min-w-[130px] text-center hover:bg-white/5 hover:text-white transition-colors h-full w-full flex items-center justify-center gap-2"
                            >
                                <CalendarIcon size={14} className="text-primary" />
                                {formattedDate}
                            </button>

                            {/* Date Picker Dropdown */}
                            {isDatePickerOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-surface border border-border rounded-xl shadow-2xl shadow-black/30 w-[300px] overflow-hidden animate-in fade-in slide-in-from-top-2">
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

                                    <div className="grid grid-cols-7 px-3 pt-3">
                                        {DAY_NAMES.map(dn => (
                                            <div key={dn} className="text-[10px] uppercase font-bold text-textMuted text-center py-1">{dn}</div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                                        {cells.map((cell, i) => {
                                            if (!cell) return <div key={`e-${i}`} />
                                            const isSelected = isSameDay(cell, selectedDate)
                                            const isToday = isSameDay(cell, today)
                                            
                                            return (
                                                <button
                                                    key={cell.toISOString()}
                                                    onClick={() => handleDayClick(cell)}
                                                    className={`relative w-full aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-all cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-primary text-white' 
                                                            : 'text-textMuted hover:bg-white/5 hover:text-textMain'
                                                    }`}
                                                >
                                                    {cell.getDate()}
                                                    {isToday && !isSelected && (
                                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="border-t border-border p-3 flex justify-center">
                                        <button onClick={handleToday} className="px-4 py-1.5 text-xs font-medium text-textMuted hover:text-textMain hover:bg-white/5 rounded-md transition-colors border border-border w-full">
                                            Ir a Hoy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleNextDay} className="px-3 py-2 text-textMuted hover:text-white hover:bg-white/5 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button onClick={handleToday} className="px-5 py-2 text-sm font-medium text-textMuted bg-surface border border-border rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                        Hoy
                    </button>
                </div>
            </div>

            {/* Right Filters */}
            <div className="flex items-center gap-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-textMain hover:text-white transition-colors"
                    >
                        <Trophy size={16} className={selectedSport ? "text-primary" : "text-textMuted"} />
                        <span>{selectedSportName}</span>
                        <ChevronRight size={14} className={`ml-1 opacity-50 transition-transform ${isDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50">
                            <div className="p-1">
                                <button
                                    onClick={() => { onSportSelect(null); setIsDropdownOpen(false) }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-textMain hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <span>Todos los deportes</span>
                                    {!selectedSport && <Check size={16} className="text-primary" />}
                                </button>
                                {sports.length > 0 && <div className="h-px bg-border my-1 mx-2" />}
                                {sports.map(sport => (
                                    <button
                                        key={sport.id}
                                        onClick={() => { onSportSelect(sport.id); setIsDropdownOpen(false) }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-textMain hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        <span>{sport.nombre}</span>
                                        {selectedSport === sport.id && <Check size={16} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={onOpenSettings}
                    className="p-2 text-textMuted hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-border"
                    title="Configuración de Vista"
                >
                    <Settings size={20} />
                </button>
            </div>
        </header>
    )
}
