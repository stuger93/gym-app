import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { client } from '../../api/client'

export function useSocios({ search, page, incluirInactivos }) {
  return useQuery({
    queryKey: ['socios', { search, page, incluirInactivos }],
    queryFn: () =>
      client
        .get('/socios', {
          params: {
            search: search || undefined,
            page,
            incluir_inactivos: incluirInactivos || undefined,
          },
        })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  })
}
