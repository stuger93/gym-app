import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import RequireAuth from '../auth/RequireAuth'
import { useSocios } from './useSocios'

function SociosList() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { data, isLoading, isError } = useSocios({ search, page })

  const total = data?.total ?? 0
  const pageSize = data?.page_size ?? 20
  const totalPages = Math.max(Math.ceil(total / pageSize), 1)

  return (
    <div style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Socios</h1>

      <input
        type="text"
        placeholder="Buscar por nombre, email o documento..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
      />

      {isLoading && <p>Cargando...</p>}

      {isError && <p style={{ color: 'red' }}>No se pudo cargar la lista de socios</p>}

      {!isLoading && !isError && total === 0 && search === '' && (
        <p>
          No hay socios registrados todavía. <Link to="/socios/nuevo">Crear el primero</Link>
        </p>
      )}

      {!isLoading && !isError && total === 0 && search !== '' && (
        <p>No se encontraron socios que coincidan con «{search}».</p>
      )}

      {!isLoading && !isError && total > 0 && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Nombre</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Documento</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((socio) => (
                <tr key={socio.id}>
                  <td>{socio.nombre}</td>
                  <td>{socio.email}</td>
                  <td>{socio.documento}</td>
                  <td>{socio.telefono || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem' }}>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span style={{ margin: '0 1rem' }}>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      <p style={{ marginTop: '2rem' }}>
        <Link to="/">Volver</Link>
      </p>
    </div>
  )
}

export default function SociosListPage() {
  return (
    <RequireAuth>
      {(currentUser) =>
        currentUser.rol === 'admin' ? (
          <SociosList />
        ) : (
          <p style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
            No tenés permiso para ver esta página.
          </p>
        )
      }
    </RequireAuth>
  )
}
