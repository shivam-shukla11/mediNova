import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Envelope } from "@/lib/appointments";

export interface Department {
  _id: string;
  departmentName: string;
  description?: string;
}

// Public data is shared by registration, booking, and the admin directory.
export function useDepartments(enabled = true) {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () =>
      apiRequest<Envelope<{ departments: Department[] }>>("/api/departments", { auth: false }),
    enabled,
    staleTime: 10000,
    refetchInterval: 20000,
    retry: 1,
  });
}
