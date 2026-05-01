import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import ColeccionesPage from './pages/colecciones/ColeccionesPage'
import PlacasPage from './pages/placas/PlacasPage'
import UbicacionesPage from './pages/ubicaciones/UbicacionesPage'
import CatalogosPage from './pages/catalogos/CatalogosPage'
import ReportesPage from './pages/reportes/ReportesPage'
import InventarioColeccion from './pages/reportes/InventarioColeccion'
import PlacasProblemas from './pages/reportes/PlacasProblemas'
import OcupacionMuebles from './pages/reportes/OcupacionMuebles'
import GestionUsuarios from './pages/usuarios/GestionUsuarios'
import ImportarDatos from './pages/importar/ImportarDatos'
import { WithAdmin, WithCurador, WithRevisor } from './components/shared/roleGuards'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Acceso total (todos autenticados) */}
        <Route path="/colecciones" element={<ColeccionesPage />} />
        <Route path="/placas" element={<PlacasPage />} />
        <Route path="/ubicaciones" element={<UbicacionesPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/reportes/inventario" element={<InventarioColeccion />} />
        <Route path="/reportes/problemas" element={<PlacasProblemas />} />
        <Route path="/reportes/ocupacion-muebles" element={<OcupacionMuebles />} />

        {/* Curador+ (acceso a catálogos) */}
        <Route path="/catalogos" element={<WithCurador><CatalogosPage /></WithCurador>} />

        {/* Admin-only routes */}
        <Route path="/usuarios" element={<WithAdmin><GestionUsuarios /></WithAdmin>} />
        <Route path="/importar" element={<WithAdmin><ImportarDatos /></WithAdmin>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
