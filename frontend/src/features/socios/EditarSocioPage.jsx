import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'
import SocioForm from './SocioForm'
import AsignarPlanForm from './AsignarPlanForm'
import { useMembresias } from './useMembresias'

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

function MembresiaSection({ id }) {
  const { data: membresias, isLoading, isError } = useMembresias(id)

  if (isLoading) {
    return <p>Cargando membresías...</p>
  }

  if (isError) {
    return <p style={{ color: 'red' }}>No se pudo cargar la membresía</p>
  }

  const vigente = membresias.find((m) => m.activa)
  const historial = membresias.filter((m) => !m.activa)

  return (
    <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
      <h2>Membresía</h2>

      {vigente ? (
        <p>
          Plan vigente: <strong>{vigente.plan.nombre}</strong> — desde {vigente.fecha_inicio} hasta{' '}
          {vigente.fecha_vencimiento}
        </p>
      ) : (
        <p>Sin membresía activa.</p>
      )}

      {historial.length > 0 && (
        <>
          <h3>Historial</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Plan</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Inicio</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((m) => (
                <tr key={m.id}>
                  <td>{m.plan.nombre}</td>
                  <td>{m.fecha_inicio}</td>
                  <td>{m.fecha_vencimiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Asignar plan</h3>
      <AsignarPlanForm socioId={id} />
    </div>
  )
}

export default function EditarSocioPage() {
  const { id } = useParams()

  return (
    <RequireAuth>
      {(currentUser) => (
        <div style={{ maxWidth: 480, margin: '4rem auto', fontFamily: 'sans-serif' }}>
          <h1>Editar socio</h1>
          {currentUser.rol === 'admin' ? (
            <>
              <EditarSocioForm id={id} />
              <MembresiaSection id={id} />
            </>
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
