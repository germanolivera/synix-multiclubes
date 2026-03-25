import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { BranchProvider } from './contexts/BranchContext'
import { ThemeProvider } from './contexts/ThemeContext'
import DashboardLayout from './components/layout/DashboardLayout'

// Lazy load pages for code splitting
const Calendar = lazy(() => import('./components/calendar/Calendar'))
const Jugadores = lazy(() => import('./pages/Jugadores'))
const Espacios = lazy(() => import('./pages/Espacios'))
const Configuracion = lazy(() => import('./pages/Configuracion'))
const Sedes = lazy(() => import('./pages/Configuracion/Sedes'))
const Precios = lazy(() => import('./pages/Configuracion/Precios'))
const EliminarCuenta = lazy(() => import('./pages/Configuracion/EliminarCuenta'))
const PreciosConsulta = lazy(() => import('./pages/Consultas/Precios'))
const CajaDashboard = lazy(() => import('./pages/Caja').then(module => ({ default: module.CajaDashboard })))
const Login = lazy(() => import('./pages/Login'))
const Personal = lazy(() => import('./pages/Configuracion/Personal'))

const LoadingFallback = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
)

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <BranchProvider>
                        <Suspense fallback={<LoadingFallback />}>
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
                                    <Route path="configuracion/personal" element={<Personal />} />
                                    <Route path="configuracion/eliminar-cuenta" element={<EliminarCuenta />} />
                                    {/* Add more routes here as we build them */}
                                    <Route path="*" element={<Navigate to="/calendario" replace />} />
                                </Route>
                            </Routes>
                        </Suspense>
                    </BranchProvider>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
