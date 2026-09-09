import { useForm } from 'react-hook-form'

export default function SocioForm({ defaultValues, onSubmit, isPending, submitLabel, errorMessage, successMessage }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          style={{ display: 'block', width: '100%' }}
          {...register('email', {
            required: true,
            pattern: /^\S+@\S+\.\S+$/,
          })}
        />
        {errors.email && <span>Ingresá un email válido</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="documento">Documento</label>
        <input
          id="documento"
          type="text"
          style={{ display: 'block', width: '100%' }}
          {...register('documento', { required: true })}
        />
        {errors.documento && <span>El documento es obligatorio</span>}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input
          id="telefono"
          type="text"
          style={{ display: 'block', width: '100%' }}
          {...register('telefono')}
        />
      </div>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <button type="submit" disabled={isPending}>
        {submitLabel}
      </button>
    </form>
  )
}
