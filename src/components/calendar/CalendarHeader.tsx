import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Trophy, Settings, Check } from 'lucide-react'

interface CalendarHeaderProps {
    onOpenSettings: () => void;
    sports: { id: string, nombre: string }[];
    selectedSport: string | null;
    onSportSelect: (sportId: string | null) => void;
}

export default function CalendarHeader({ onOpenSettings, sports, selectedSport, onSportSelect }: CalendarHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedSportName = selectedSport
        ? sports.find(s => s.id === selectedSport)?.nombre || "Todos los deportes"
        : "Todos los deportes"
    return (
        <header className="h-16 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
                <h2 className="text-xl font-bold text-white">Calendario</h2>

                {/* Date Controls */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-surface border border-border rounded-lg overflow-hidden">
                        <button className="px-3 py-2 text-textMuted hover:text-white hover:bg-white/5 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-5 py-2 text-sm font-semibold text-textMain border-x border-border min-w-[130px] text-center">
                            22 FEB 2026
                        </span>
                        <button className="px-3 py-2 text-textMuted hover:text-white hover:bg-white/5 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button className="px-5 py-2 text-sm font-medium text-textMuted bg-surface border border-border rounded-lg hover:text-white hover:bg-white/5 transition-colors">
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
