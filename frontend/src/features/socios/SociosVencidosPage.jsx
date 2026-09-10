import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'

function SociosVencidosList() {
  const { data: socios, isLoading, isError } = useQuery({
    queryKey: ['socios-vencidos'],
    queryFn: () => client.get('/socios/vencidos').then((res) => res.data),
  })

  return (
    <div style={{ maxWidth: 720, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Membresías vencidas</h1>

      {isLoading && <p>Cargando...</p>}

      {isError && <p style={{ color: 'red' }}>No se pudo cargar la lista de vencimientos</p>}

      {!isLoading && !isError && socios.length === 0 && (
        <p>No hay socios con membresía vencida. 🎉</p>
      )}

      {!isLoading && !isError && socios.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Nombre</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Teléfono</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Plan</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Venció el</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {socios.map((socio) => (
              <tr key={socio.id}>
                <td>{socio.nombre}</td>
                <td>{socio.email}</td>
                <td>{socio.telefono || '-'}</td>
                <td>{socio.plan_nombre}</td>
                <td>{socio.fecha_vencimiento}</td>
                <td>
                  <Link to={`/socios/${socio.id}/editar`}>Renovar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: '2rem' }}>
        <Link to="/">Volver</Link>
      </p>
    </div>
  )
}

export default function SociosVencidosPage() {
  return (
    <RequireAuth>
      {(currentUser) =>
        currentUser.rol === 'admin' ? (
          <SociosVencidosList />
        ) : (
          <p style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
            No tenés permiso para ver esta página.
          </p>
        )
      }
    </RequireAuth>
  )
}
