import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'

function NuevoSocioForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const crearSocioMutation = useMutation({
    mutationFn: (datos) => client.post('/socios', datos).then((res) => res.data),
    onSuccess: () => {
      reset()
    },
  })

  const onSubmit = (data) => crearSocioMutation.mutate(data)

  return (
    <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Nuevo socio</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            style={{ display: 'block', width: '100%' }}
            {...register('nombre', { required: true })}
          />
          {errors.nombre && <span>El nombre es obligatorio</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            style={{ display: 'block', width: '100%' }}
            {...register('email', {
              required: true,
              pattern: /^\S+@\S+\.\S+$/,
            })}
          />
          {errors.email && <span>Ingresá un email válido</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="documento">Documento</label>
          <input
            id="documento"
            type="text"
            style={{ display: 'block', width: '100%' }}
            {...register('documento', { required: true })}
          />
          {errors.documento && <span>El documento es obligatorio</span>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="telefono">Teléfono (opcional)</label>
          <input
            id="telefono"
            type="text"
            style={{ display: 'block', width: '100%' }}
            {...register('telefono')}
          />
        </div>

        {crearSocioMutation.isError && (
          <p style={{ color: 'red' }}>
            {crearSocioMutation.error?.response?.data?.detail || 'No se pudo crear el socio'}
          </p>
        )}

        {crearSocioMutation.isSuccess && (
          <p style={{ color: 'green' }}>Socio creado correctamente</p>
        )}

        <button type="submit" disabled={crearSocioMutation.isPending}>
          {crearSocioMutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      <p>
        <Link to="/">Volver</Link>
      </p>
    </div>
  )
}

export default function NuevoSocioPage() {
  return (
    <RequireAuth>
      {() => <NuevoSocioForm />}
    </RequireAuth>
  )
}
