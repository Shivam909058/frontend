import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";

export const useUserInfoQuery = ({ userId }: { userId: string }) =>
 useQuery({
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    queryKey: ["USER", userId],
 });
