import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function useApiQuery<T>(path: string, poll = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["api", user?._id ?? user?.["id"], path],
    queryFn: () => apiRequest<T>(path),
    enabled: !!user,
    staleTime: 10000,
    retry: 1,
    refetchInterval: poll ? 20000 : false,
  });
}
