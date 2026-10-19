import type { ApiErrorResponse, ApiItemResponse, ApiMessageResponse, TodoFormData, TodoItem } from "@/types/todo.types";

export const API_URL = "http://127.0.0.1:5000";

async function parseResponse<T>(
    response: Response,
    fallbackMessage: string
): Promise<T> {
    if (!response.ok) {
        let message = fallbackMessage;

        try {
            const errorData: ApiErrorResponse = await response.json();
            message = errorData.error || fallbackMessage;
        } catch {
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export async function fetchItems(): Promise<TodoItem[]> {
    const response = await fetch(`${API_URL}/items`);

    return parseResponse<TodoItem[]>(
        response,
        "Failed to fetch todos"
    );
}

export async function saveItem({
    id,
    item,
}: {
    id: number | null;
    item: TodoFormData;
}): Promise<ApiItemResponse> {
    const formData = new FormData();

    formData.append("name", item.name);
    formData.append("description", item.description);
    formData.append("status", item.status);

    if (item.image) {
        formData.append("image", item.image);
    }

    const url =
        id === null
            ? `${API_URL}/items`
            : `${API_URL}/items/${id}`;

    const response = await fetch(url, {
        method: id === null ? "POST" : "PUT",
        body: formData,
    });

    return parseResponse<ApiItemResponse>(
        response,
        id === null ? "Failed to create todo" : "Failed to update todo"
    );
}

export async function updateItemStatus({
    id,
    status,
}: {
    id: number;
    status: TodoItem["status"];
}): Promise<ApiItemResponse> {
    const response = await fetch(`${API_URL}/items/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
    });

    return parseResponse<ApiItemResponse>(
        response,
        "Failed to update todo status"
    );
}

export async function deleteItem(id: number): Promise<ApiMessageResponse> {
    const response = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
    });

    return parseResponse<ApiMessageResponse>(
        response,
        "Failed to delete todo"
    );
}
