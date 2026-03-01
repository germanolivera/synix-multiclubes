import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { BranchProvider } from './contexts/BranchContext'
import { ThemeProvider } from './contexts/ThemeContext'
import DashboardLayout from './components/layout/DashboardLayout'
import Calendar from './components/calendar/Calendar'
import Jugadores from './pages/Jugadores'
import Espacios from './pages/Espacios'
import Configuracion from './pages/Configuracion'
import Sedes from './pages/Configuracion/Sedes'
import Precios from './pages/Configuracion/Precios'
import PreciosConsulta from './pages/Consultas/Precios'
import { CajaDashboard } from './pages/Caja'
import Login from './pages/Login'

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <BranchProvider>
                        <Routes>
                            {/* Public Route */}
                            <Route path="/login" element={<Login />} />

                            {/* Protected Dashboard Routes */}
                            <Route path="/" element={<DashboardLayout />}>
                                <Route index element={<Navigate to="/calendario" replace />} />
                                <Route path="calendario" element={<Calendar />} />
                                <Route path="jugadores" element={<Jugadores />} />
                                <Route path="precios" element={<PreciosConsulta />} />
                                <Route path="caja" element={<CajaDashboard />} />
                                <Route path="espacios" element={<Espacios />} />
                                <Route path="configuracion" element={<Configuracion />} />
                                <Route path="configuracion/sedes" element={<Sedes />} />
                                <Route path="configuracion/precios" element={<Precios />} />
                                {/* Add more routes here as we build them */}
                                <Route path="*" element={<Navigate to="/calendario" replace />} />
                            </Route>
                        </Routes>
                    </BranchProvider>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
