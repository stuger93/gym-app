import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { client } from '../../api/client'
import RequireAuth from '../auth/RequireAuth'
import SocioForm from './SocioForm'

function NuevoSocioForm() {
  const [formKey, setFormKey] = useState(0)

  const crearSocioMutation = useMutation({
    mutationFn: (datos) => client.post('/socios', datos).then((res) => res.data),
    onSuccess: () => {
      setFormKey((k) => k + 1)
    },
  })

  return (
    <div style={{ maxWidth: 320, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Nuevo socio</h1>
      <SocioForm
        key={formKey}
        onSubmit={(datos) => crearSocioMutation.mutate(datos)}
        isPending={crearSocioMutation.isPending}
        submitLabel={crearSocioMutation.isPending ? 'Guardando...' : 'Guardar'}
        errorMessage={
          crearSocioMutation.isError &&
          (crearSocioMutation.error?.response?.data?.detail || 'No se pudo crear el socio')
        }
        successMessage={crearSocioMutation.isSuccess && 'Socio creado correctamente'}
      />

      <p>
        <Link to="/">Volver</Link>
      </p>
    </div>
  )
}

export default function NuevoSocioPage() {
  return (
    <RequireAuth>
      {() => <NuevoSocioForm />}
    </RequireAuth>
  )
}
