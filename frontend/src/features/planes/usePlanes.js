import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'

export function usePlanes({ incluirInactivos }) {
  return useQuery({
    queryKey: ['planes', { incluirInactivos }],
    queryFn: () =>
      client
        .get('/planes', { params: { incluir_inactivos: incluirInactivos || undefined } })
        .then((res) => res.data),
  })
}
