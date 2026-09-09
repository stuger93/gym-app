import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './features/auth/LoginPage'
import HomePage from './features/auth/HomePage'
import NuevoSocioPage from './features/socios/NuevoSocioPage'
import SociosListPage from './features/socios/SociosListPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/socios" element={<SociosListPage />} />
      <Route path="/socios/nuevo" element={<NuevoSocioPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
