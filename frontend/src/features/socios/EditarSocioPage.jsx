import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'
import SocioForm from './SocioForm'

function EditarSocioForm({ id }) {
  const navigate = useNavigate()

  const { data: socio, isLoading, isError } = useQuery({
    queryKey: ['socio', id],
    queryFn: () => client.get(`/socios/${id}`).then((res) => res.data),
  })

  const actualizarSocioMutation = useMutation({
    mutationFn: (datos) => client.put(`/socios/${id}`, datos).then((res) => res.data),
    onSuccess: () => {
      navigate('/socios', { replace: true })
    },
  })

  if (isLoading) {
    return <p>Cargando...</p>
  }

  if (isError || !socio) {
    return <p style={{ color: 'red' }}>No se pudo cargar el socio</p>
  }

  return (
    <SocioForm
      defaultValues={socio}
      onSubmit={(datos) => actualizarSocioMutation.mutate(datos)}
      isPending={actualizarSocioMutation.isPending}
      submitLabel={actualizarSocioMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      errorMessage={
        actualizarSocioMutation.isError &&
        (actualizarSocioMutation.error?.response?.data?.detail || 'No se pudo actualizar el socio')
      }
    />
  )
}

export default function EditarSocioPage() {
  const { id } = useParams()

  return (
    <RequireAuth>
      {(currentUser) => (
        <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
          <h1>Editar socio</h1>
          {currentUser.rol === 'admin' ? (
            <EditarSocioForm id={id} />
          ) : (
            <p>No tenés permiso para editar socios.</p>
          )}
          <p>
            <Link to="/socios">Volver</Link>
          </p>
        </div>
      )}
    </RequireAuth>
  )
}
