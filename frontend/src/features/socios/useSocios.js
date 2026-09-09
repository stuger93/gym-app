import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { client } from '../../api/client'

export function useSocios({ search, page }) {
  return useQuery({
    queryKey: ['socios', { search, page }],
    queryFn: () =>
      client
        .get('/socios', { params: { search: search || undefined, page } })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  })
}
