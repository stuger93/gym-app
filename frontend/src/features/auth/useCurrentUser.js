import { useQuery } from '@tanstack/react-query'
import { client } from '../../api/client'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => client.get('/me').then((res) => res.data),
    retry: false,
  })
}
