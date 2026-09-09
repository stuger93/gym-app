import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { client } from '../../api/client'
import { useCurrentUser } from './useCurrentUser'

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true })
    }
  }, [currentUser, navigate])

  const loginMutation = useMutation({
    mutationFn: (credentials) => client.post('/login', credentials).then((res) => res.data),
    onSuccess: (usuario) => {
      queryClient.setQueryData(['me'], usuario)
      navigate('/', { replace: true })
    },
  })

  const onSubmit = (data) => loginMutation.mutate(data)

  return (
    <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            style={{ display: 'block', width: '100%' }}
            {...register('email', { required: true })}
          />
          {errors.email && <span>El email es obligatorio</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            style={{ display: 'block', width: '100%' }}
            {...register('password', { required: true })}
          />
          {errors.password && <span>La contraseña es obligatoria</span>}
        </div>

        {loginMutation.isError && (
          <p style={{ color: 'red' }}>
            {loginMutation.error?.response?.status === 429
              ? 'Demasiados intentos, esperá un minuto'
              : 'Credenciales inválidas'}
          </p>
        )}

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
