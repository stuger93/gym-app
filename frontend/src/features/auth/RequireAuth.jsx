import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from './useCurrentUser'

export default function RequireAuth({ children }) {
  const { data: currentUser, isLoading, isError } = useCurrentUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isError) {
      navigate('/login', { replace: true })
    }
  }, [isLoading, isError, navigate])

  if (isLoading || !currentUser) {
    return null
  }

  return children(currentUser)
}
