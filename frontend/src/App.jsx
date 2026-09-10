import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/LoginPage'
import HomePage from './features/auth/HomePage'
import NuevoSocioPage from './features/socios/NuevoSocioPage'
import SociosListPage from './features/socios/SociosListPage'
import EditarSocioPage from './features/socios/EditarSocioPage'
import PlanesListPage from './features/planes/PlanesListPage'
import NuevoPlanPage from './features/planes/NuevoPlanPage'
import EditarPlanPage from './features/planes/EditarPlanPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/socios" element={<SociosListPage />} />
      <Route path="/socios/nuevo" element={<NuevoSocioPage />} />
      <Route path="/socios/:id/editar" element={<EditarSocioPage />} />
      <Route path="/planes" element={<PlanesListPage />} />
      <Route path="/planes/nuevo" element={<NuevoPlanPage />} />
      <Route path="/planes/:id/editar" element={<EditarPlanPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
