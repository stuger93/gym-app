import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import RequireAuth from './RequireAuth'

export default function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await client.post('/logout')
    queryClient.setQueryData(['me'], null)
    navigate('/login', { replace: true })
  }

  return (
    <RequireAuth>
      {(currentUser) => (
        <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
          <h1>Gym App</h1>
          <p>
            Sesión iniciada como <strong>{currentUser.email}</strong> ({currentUser.rol})
          </p>
          {currentUser.rol === 'admin' && (
            <p>
              <Link to="/socios">Ver socios</Link>
              {' | '}
              <Link to="/socios/nuevo">Nuevo socio</Link>
              {' | '}
              <Link to="/planes">Planes</Link>
            </p>
          )}
          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </RequireAuth>
  )
}
