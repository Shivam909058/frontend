// hooks
import { useQuery } from '@tanstack/react-query';

// utils
// import axios from '@/lib/axios';

export const useLoggedInUserQuery = ({ enabled }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ['loggedinUser'],
    queryFn: async () => {
      // const response = await axios.get('/api/v1/get-loggedIn-user');
      return 
      // response.data?.user;
    },
    enabled,
  });
