import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'
import PlanForm from './PlanForm'

function NuevoPlanForm() {
  const [formKey, setFormKey] = useState(0)

  const crearPlanMutation = useMutation({
    mutationFn: (datos) => client.post('/planes', datos).then((res) => res.data),
    onSuccess: () => {
      setFormKey((k) => k + 1)
    },
  })

  return (
    <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Nuevo plan</h1>
      <PlanForm
        key={formKey}
        onSubmit={(datos) => crearPlanMutation.mutate(datos)}
        isPending={crearPlanMutation.isPending}
        submitLabel={crearPlanMutation.isPending ? 'Guardando...' : 'Guardar'}
        errorMessage={
          crearPlanMutation.isError &&
          (crearPlanMutation.error?.response?.data?.detail || 'No se pudo crear el plan')
        }
        successMessage={crearPlanMutation.isSuccess && 'Plan creado correctamente'}
      />

      <p>
        <Link to="/planes">Volver</Link>
      </p>
    </div>
  )
}

export default function NuevoPlanPage() {
  return (
    <RequireAuth>
      {() => <NuevoPlanForm />}
    </RequireAuth>
  )
}
