import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import { usePlanes } from '../planes/usePlanes'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AsignarPlanForm({ socioId }) {
  const queryClient = useQueryClient()
  const { data: planes, isLoading: cargandoPlanes } = usePlanes({ incluirInactivos: false })
  const [planId, setPlanId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(hoyISO())

  const asignarMutation = useMutation({
    mutationFn: () =>
      client
        .post(`/socios/${socioId}/membresias`, {
          plan_id: Number(planId),
          fecha_inicio: fechaInicio,
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membresias', socioId] })
      setPlanId('')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (planId) {
      asignarMutation.mutate()
    }
  }

  if (cargandoPlanes) {
    return <p>Cargando planes...</p>
  }

  if (!planes || planes.length === 0) {
    return <p>No hay planes activos disponibles para asignar.</p>
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="plan">Plan</label>
        <select
          id="plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          required
          style={{ display: 'block', width: '100%' }}
        >
          <option value="" disabled>
            Seleccioná un plan...
          </option>
          {planes.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.nombre} — ${plan.precio} ({plan.duracion_dias} días)
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="fecha_inicio">Fecha de inicio</label>
        <input
          id="fecha_inicio"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
          style={{ display: 'block', width: '100%' }}
        />
      </div>

      {asignarMutation.isError && (
        <p style={{ color: 'red' }}>
          {asignarMutation.error?.response?.data?.detail || 'No se pudo asignar el plan'}
        </p>
      )}

      <button type="submit" disabled={asignarMutation.isPending}>
        {asignarMutation.isPending ? 'Asignando...' : 'Asignar plan'}
      </button>
    </form>
  )
}
