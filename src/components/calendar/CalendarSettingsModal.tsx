import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'

interface CalendarSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    initialStartHour: number
    initialEndHour: number
    onSave: (start: number, end: number) => void
}

export default function CalendarSettingsModal({
    isOpen,
    onClose,
    initialStartHour,
    initialEndHour,
    onSave
}: CalendarSettingsModalProps) {
    const [startHour, setStartHour] = useState(initialStartHour)
    const [endHour, setEndHour] = useState(initialEndHour)
    const [error, setError] = useState<string | null>(null)

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStartHour(initialStartHour)
            setEndHour(initialEndHour)
            setError(null)
        }
    }, [isOpen, initialStartHour, initialEndHour])

    const hours = Array.from({ length: 24 }, (_, i) => i)

    const handleSave = () => {
        if (startHour >= endHour) {
            setError("La hora de inicio debe ser menor a la hora de fin.")
            return
        }
        onSave(startHour, endHour)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuración de Vista del Calendario">
            <div className="space-y-4">
                <p className="text-sm text-textMuted mb-2">
                    Define la ventana horaria visible en la grilla para esta sede. El calendario soporta turnos las 24 horas internamente.
                </p>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-500">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">
                            Hora de Inicio
                        </label>
                        <select
                            value={startHour}
                            onChange={(e) => setStartHour(Number(e.target.value))}
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                        >
                            {hours.map(h => (
                                <option key={h} value={h}>
                                    {h.toString().padStart(2, '0')}:00
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">
                            Hora de Fin
                        </label>
                        <select
                            value={endHour}
                            onChange={(e) => setEndHour(Number(e.target.value))}
                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                        >
                            {hours.map(h => (
                                <option key={h} value={h} disabled={h <= startHour}>
                                    {h === 24 ? '23:59' : `${h.toString().padStart(2, '0')}:00`}
                                </option>
                            ))}
                            <option value={24}>23:59</option>
                        </select>
                        <p className="text-xs text-textMuted mt-1">Selecciona 24 para fin del día.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textMuted hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primaryHover transition-colors"
                    >
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </Modal>
    )
}
