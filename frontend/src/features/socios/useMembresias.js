import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'

export function useMembresias(socioId) {
  return useQuery({
    queryKey: ['membresias', socioId],
    queryFn: () => client.get(`/socios/${socioId}/membresias`).then((res) => res.data),
  })
}
