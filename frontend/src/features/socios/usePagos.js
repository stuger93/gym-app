import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'

export function usePagos(socioId) {
  return useQuery({
    queryKey: ['pagos', socioId],
    queryFn: () => client.get(`/socios/${socioId}/pagos`).then((res) => res.data),
  })
}
