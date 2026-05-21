import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { WithAdmin, WithCurador } from './components/shared/roleGuards'
import AuthCallback from './pages/AuthCallback'
import CatalogosPage from './pages/catalogos/CatalogosPage'
import ColeccionesPage from './pages/colecciones/ColeccionesPage'
import PozosPage from './pages/pozos/PozosPage'
import Dashboard from './pages/Dashboard'
import { Agentation } from 'agentation'
import ImportarDatos from './pages/importar/ImportarDatos'
import Login from './pages/Login'
import PlacasPage from './pages/placas/PlacasPage'
import InventarioColeccion from './pages/reportes/InventarioColeccion'
import OcupacionMuebles from './pages/reportes/OcupacionMuebles'
import PlacasProblemas from './pages/reportes/PlacasProblemas'
import ReportesPage from './pages/reportes/ReportesPage'
import UbicacionesPage from './pages/ubicaciones/UbicacionesPage'
import GestionUsuarios from './pages/usuarios/GestionUsuarios'

export default function App() {
  // `App` define las rutas de la aplicación. Se separan rutas públicas,
  // rutas que requieren autenticación y rutas por rol mediante los guards en `roleGuards.tsx`.
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Acceso total (todos autenticados) */}
        <Route path="/colecciones" element={<ColeccionesPage />} />
        <Route path="/pozos" element={<PozosPage />} />
        <Route path="/placas" element={<PlacasPage />} />
        <Route path="/ubicaciones" element={<UbicacionesPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/reportes/inventario" element={<InventarioColeccion />} />
        <Route path="/reportes/problemas" element={<PlacasProblemas />} />
        <Route path="/reportes/ocupacion-muebles" element={<OcupacionMuebles />} />

        {/* Curador+ (acceso a catálogos) */}
        {/* Wrap con WithCurador para permitir sólo a curadores y admins */}
        <Route path="/catalogos" element={<WithCurador><CatalogosPage /></WithCurador>} />

        {/* Admin-only routes (gestión de usuarios, importación) */}
        <Route path="/usuarios" element={<WithAdmin><GestionUsuarios /></WithAdmin>} />
        <Route path="/importar" element={<WithAdmin><ImportarDatos /></WithAdmin>} />

        {/* Fallback: redirige a dashboard si ruta no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Agentation: visual feedback tool for AI coding agents */}
      <Agentation />
    </BrowserRouter>
  )
}
