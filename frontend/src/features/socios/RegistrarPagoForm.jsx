import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../../api/client'
import { usePlanes } from '../planes/usePlanes'

export default function RegistrarPagoForm({ socioId }) {
  const queryClient = useQueryClient()
  const { data: planes, isLoading: cargandoPlanes } = usePlanes({ incluirInactivos: false })
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { metodo: 'efectivo', renovar: false } })

  const renovar = watch('renovar')

  const registrarPagoMutation = useMutation({
    mutationFn: (datos) => {
      const payload = {
        monto: Number(datos.monto),
        metodo: datos.metodo,
        fecha: datos.fecha || undefined,
      }
      if (datos.renovar && datos.plan_id) {
        payload.renovar_con_plan_id = Number(datos.plan_id)
      }
      return client.post(`/socios/${socioId}/pagos`, payload).then((res) => res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos', socioId] })
      queryClient.invalidateQueries({ queryKey: ['membresias', socioId] })
      reset({ monto: '', metodo: 'efectivo', fecha: '', renovar: false, plan_id: '' })
    },
  })

  const onSubmit = (datos) => registrarPagoMutation.mutate(datos)

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="monto">Monto</label>
        <input
          id="monto"
          type="number"
          step="0.01"
          min="0"
          style={{ display: 'block', width: '100%' }}
          {...register('monto', { required: true, min: 0 })}
        />
        {errors.monto && <span>Ingresá un monto válido</span>}
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="metodo">Método</label>
        <select
          id="metodo"
          style={{ display: 'block', width: '100%' }}
          {...register('metodo', { required: true })}
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="fecha">Fecha (opcional, por defecto hoy)</label>
        <input
          id="fecha"
          type="date"
          style={{ display: 'block', width: '100%' }}
          {...register('fecha')}
        />
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          <input type="checkbox" {...register('renovar')} /> Renovar membresía con este pago
        </label>
      </div>

      {renovar && (
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="plan_id">Plan</label>
          {cargandoPlanes ? (
            <p>Cargando planes...</p>
          ) : (
            <select
              id="plan_id"
              style={{ display: 'block', width: '100%' }}
              {...register('plan_id', { required: renovar })}
            >
              <option value="" disabled>
                Seleccioná un plan...
              </option>
              {(planes || []).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} — ${plan.precio} ({plan.duracion_dias} días)
                </option>
              ))}
            </select>
          )}
          {errors.plan_id && <span>Seleccioná un plan para renovar</span>}
        </div>
      )}

      {registrarPagoMutation.isError && (
        <p style={{ color: 'red' }}>
          {registrarPagoMutation.error?.response?.data?.detail || 'No se pudo registrar el pago'}
        </p>
      )}

      {registrarPagoMutation.isSuccess && (
        <p style={{ color: 'green' }}>Pago registrado correctamente</p>
      )}

      <button type="submit" disabled={registrarPagoMutation.isPending}>
        {registrarPagoMutation.isPending ? 'Registrando...' : 'Registrar pago'}
      </button>
    </form>
  )
}
