import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './LoginPage'
import { client } from '../../api/client'

vi.mock('../../api/client', () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Por defecto, simulamos que no hay sesión activa (GET /me falla).
    client.get.mockRejectedValue({ response: { status: 401 } })
  })

  it('muestra errores de validación si se envía el formulario vacío', async () => {
    const user = userEvent.setup()
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('El email es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(client.post).not.toHaveBeenCalled()
  })

  it('muestra "Credenciales inválidas" cuando el login responde 401', async () => {
    const user = userEvent.setup()
    client.post.mockRejectedValue({ response: { status: 401 } })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
  })

  it('muestra el mensaje de rate limit cuando el login responde 429', async () => {
    const user = userEvent.setup()
    client.post.mockRejectedValue({ response: { status: 429 } })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'incorrecta')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(
      await screen.findByText('Demasiados intentos, esperá un minuto'),
    ).toBeInTheDocument()
  })

  it('envía POST /login con las credenciales ingresadas', async () => {
    const user = userEvent.setup()
    client.post.mockResolvedValue({
      data: { id: 1, email: 'admin@test.com', rol: 'admin' },
    })
    renderLoginPage()

    await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/login', {
        email: 'admin@test.com',
        password: 'Password123!',
      })
    })
  })
})
