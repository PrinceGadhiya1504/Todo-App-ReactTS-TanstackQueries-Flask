import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteItem, fetchItems, saveItem, updateItemStatus } from "../api/todo.api";
import type { TodoFormData, TodoStatus } from "@/types/todo.types";

export const ITEMS_QUERY_KEY = ["items"];

export function useTodos() {
    return useQuery({
        queryKey: ITEMS_QUERY_KEY,
        queryFn: fetchItems,
    });
}

export function useSaveTodo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            item,
        }: {
            id: number | null;
            item: TodoFormData;
        }) => saveItem({ id, item }),

        onSuccess: () => {
            return queryClient.invalidateQueries({
                queryKey: ITEMS_QUERY_KEY,
            });
        },
    });
}

export function useToggleTodoStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: number;
            status: TodoStatus;
        }) => updateItemStatus({ id, status }),

        onSuccess: () => {
            return queryClient.invalidateQueries({
                queryKey: ITEMS_QUERY_KEY,
            });
        },
    });
}

export function useDeleteTodo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteItem(id),

        onSuccess: () => {
            return queryClient.invalidateQueries({
                queryKey: ITEMS_QUERY_KEY,
            });
        },
    });
}