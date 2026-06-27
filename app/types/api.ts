
export interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  error: string | null;
  pagination?: PaginationInfo;
}
