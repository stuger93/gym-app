import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'

export default function MiMembresiaView() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['mi-membresia'],
    queryFn: () => client.get('/me/membresia').then((res) => res.data),
  })

  if (isLoading) {
    return <p>Cargando...</p>
  }

  if (isError) {
    return <p style={{ color: 'red' }}>No se pudo cargar tu membresía</p>
  }

  if (!data.tiene_socio_vinculado) {
    return <p>Tu usuario no tiene un socio asociado.</p>
  }

  if (!data.tiene_membresia_activa) {
    return <p>No tenés una membresía asignada. Contactá al gimnasio.</p>
  }

  return (
    <div>
      <p>
        Plan: <strong>{data.plan_nombre}</strong>
      </p>
      <p>Vence el: {data.fecha_vencimiento}</p>
      <p>
        Estado:{' '}
        <strong style={{ color: data.vencida ? 'red' : 'green' }}>
          {data.vencida ? 'Vencida' : 'Al día'}
        </strong>
      </p>
    </div>
  )
}
