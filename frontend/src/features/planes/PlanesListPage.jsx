import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'
import { usePlanes } from './usePlanes'

function PlanesList() {
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const queryClient = useQueryClient()

  const { data: planes, isLoading, isError } = usePlanes({ incluirInactivos })

  const desactivarMutation = useMutation({
    mutationFn: (id) => client.delete(`/planes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes'] })
    },
  })

  const handleDesactivar = (plan) => {
    if (window.confirm(`¿Desactivar el plan "${plan.nombre}"?`)) {
      desactivarMutation.mutate(plan.id)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Planes de membresía</h1>

      <p>
        <Link to="/planes/nuevo">Nuevo plan</Link>
      </p>

      <label style={{ display: 'block', marginBottom: '1rem' }}>
        <input
          type="checkbox"
          checked={incluirInactivos}
          onChange={(e) => setIncluirInactivos(e.target.checked)}
        />
        {' '}Mostrar inactivos
      </label>

      {isLoading && <p>Cargando...</p>}

      {isError && <p style={{ color: 'red' }}>No se pudo cargar la lista de planes</p>}

      {!isLoading && !isError && planes.length === 0 && (
        <p>
          No hay planes definidos todavía. <Link to="/planes/nuevo">Crear el primero</Link>
        </p>
      )}

      {!isLoading && !isError && planes.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Nombre</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Descripción</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Precio</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Duración</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Estado</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.nombre}</td>
                <td>{plan.descripcion || '-'}</td>
                <td>${plan.precio}</td>
                <td>{plan.duracion_dias} días</td>
                <td>{plan.activo ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <Link to={`/planes/${plan.id}/editar`}>Editar</Link>
                  {plan.activo && (
                    <>
                      {' | '}
                      <button type="button" onClick={() => handleDesactivar(plan)}>
                        Desactivar
                      </button>
                    </>
                  )}
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

export default function PlanesListPage() {
  return (
    <RequireAuth>
      {(currentUser) =>
        currentUser.rol === 'admin' ? (
          <PlanesList />
        ) : (
          <p style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
            No tenés permiso para ver esta página.
          </p>
        )
      }
    </RequireAuth>
  )
}
