import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import { useCurrentUser } from './useCurrentUser'

export default function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser, isLoading, isError } = useCurrentUser()

  useEffect(() => {
    if (!isLoading && isError) {
      navigate('/login', { replace: true })
    }
  }, [isLoading, isError, navigate])

  const handleLogout = async () => {
    await client.post('/logout')
    queryClient.setQueryData(['me'], null)
    navigate('/login', { replace: true })
  }

  if (isLoading || !currentUser) {
    return null
  }

  return (
    <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Gym App</h1>
      <p>
        Sesión iniciada como <strong>{currentUser.email}</strong> ({currentUser.rol})
      </p>
      <button type="button" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </div>
  )
}
