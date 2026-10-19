
export type TodoStatus = "pending" | "completed";

export interface TodoItem {
  id: number;
  name: string;
  description: string;
  status: TodoStatus;
  image: string | null;
}

export interface TodoFormData {
  name: string;
  description: string;
  status: TodoStatus;
  image: File | null;
}

export interface ApiItemResponse {
  message: string;
  item: TodoItem;
}

export interface ApiMessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  error?: string;
}
