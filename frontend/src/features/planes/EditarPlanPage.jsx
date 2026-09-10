import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'
import PlanForm from './PlanForm'

function EditarPlanForm({ id }) {
  const navigate = useNavigate()

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['plan', id],
    queryFn: () => client.get(`/planes/${id}`).then((res) => res.data),
  })

  const actualizarPlanMutation = useMutation({
    mutationFn: (datos) => client.put(`/planes/${id}`, datos).then((res) => res.data),
    onSuccess: () => {
      navigate('/planes', { replace: true })
    },
  })

  if (isLoading) {
    return <p>Cargando...</p>
  }

  if (isError || !plan) {
    return <p style={{ color: 'red' }}>No se pudo cargar el plan</p>
  }

  return (
    <PlanForm
      defaultValues={plan}
      onSubmit={(datos) => actualizarPlanMutation.mutate(datos)}
      isPending={actualizarPlanMutation.isPending}
      submitLabel={actualizarPlanMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      errorMessage={
        actualizarPlanMutation.isError &&
        (actualizarPlanMutation.error?.response?.data?.detail || 'No se pudo actualizar el plan')
      }
    />
  )
}

export default function EditarPlanPage() {
  const { id } = useParams()

  return (
    <RequireAuth>
      {(currentUser) => (
        <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
          <h1>Editar plan</h1>
          {currentUser.rol === 'admin' ? (
            <EditarPlanForm id={id} />
          ) : (
            <p>No tenés permiso para editar planes.</p>
          )}
          <p>
            <Link to="/planes">Volver</Link>
          </p>
        </div>
      )}
    </RequireAuth>
  )
}
