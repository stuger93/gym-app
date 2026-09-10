import { useForm } from 'react-hook-form'

export default function PlanForm({ defaultValues, onSubmit, isPending, submitLabel, errorMessage, successMessage }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })

  return (
    <form
      onSubmit={handleSubmit((datos) =>
        onSubmit({
          ...datos,
          precio: Number(datos.precio),
          duracion_dias: Number(datos.duracion_dias),
        }),
      )}
    >
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          type="text"
          style={{ display: 'block', width: '100%' }}
          {...register('nombre', { required: true })}
        />
        {errors.nombre && <span>El nombre es obligatorio</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="descripcion">Descripción (opcional)</label>
        <input
          id="descripcion"
          type="text"
          style={{ display: 'block', width: '100%' }}
          {...register('descripcion')}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="precio">Precio</label>
        <input
          id="precio"
          type="number"
          step="0.01"
          min="0"
          style={{ display: 'block', width: '100%' }}
          {...register('precio', { required: true, min: 0 })}
        />
        {errors.precio && <span>Ingresá un precio válido</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="duracion_dias">Duración (días)</label>
        <input
          id="duracion_dias"
          type="number"
          step="1"
          min="1"
          style={{ display: 'block', width: '100%' }}
          {...register('duracion_dias', { required: true, min: 1 })}
        />
        {errors.duracion_dias && <span>Ingresá una duración válida en días</span>}
      </div>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <button type="submit" disabled={isPending}>
        {submitLabel}
      </button>
    </form>
  )
}
