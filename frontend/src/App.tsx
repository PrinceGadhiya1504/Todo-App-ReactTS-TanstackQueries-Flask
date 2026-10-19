
import { useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Pencil, Trash } from "lucide-react";

const API_URL = "http://127.0.0.1:5000";

type TodoStatus = "pending" | "completed";

interface TodoItem {
  id: number;
  name: string;
  description: string;
  status: TodoStatus;
  image: string | null;
}

interface TodoFormData {
  name: string;
  description: string;
  status: TodoStatus;
  image: File | null;
}

interface ApiItemResponse {
  message: string;
  item: TodoItem;
}

interface ApiMessageResponse {
  message: string;
}

interface ApiErrorResponse {
  error?: string;
}

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | ApiErrorResponse
      | null;

    throw new Error(data?.error || fallbackMessage);
  }

  return response.json() as Promise<T>;
}

async function fetchItems(): Promise<TodoItem[]> {
  const response = await fetch(`${API_URL}/items`);

  return parseResponse<TodoItem[]>(
    response,
    "Failed to fetch tasks",
  );
}

async function saveItem({ id, item }: { id: number | null; item: TodoFormData; }): Promise<ApiItemResponse> {
  const formData = new FormData();

  formData.append("name", item.name.trim());
  formData.append("description", item.description.trim());
  formData.append("status", item.status);

  if (item.image) {
    formData.append("image", item.image);
  }

  const isEditing = id !== null;

  const response = await fetch(isEditing ? `${API_URL}/items/${id}` : `${API_URL}/items`, {
    method: isEditing ? "PUT" : "POST",
    body: formData,
  });

  return parseResponse<ApiItemResponse>(
    response,
    isEditing ? "Failed to update task" : "Failed to create task",
  );
}

async function updateItemStatus({ id, status }: { id: number; status: TodoStatus; }): Promise<ApiItemResponse> {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return parseResponse<ApiItemResponse>(
    response,
    "Failed to update task status",
  );
}

async function deleteItem(id: number): Promise<ApiMessageResponse> {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
  });

  return parseResponse<ApiMessageResponse>(
    response,
    "Failed to delete task",
  );
}

function App() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoStatus>("pending");
  const [file, setFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);

  const {
    data: items = [], isPending, isError, error } = useQuery({
      queryKey: ["items"],
      queryFn: fetchItems
    });

  const completedCount = items.filter((item) => item.status === "completed").length;
  const pendingCount = items.filter((item) => item.status === "pending").length;

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("pending");
    setFile(null);
    setEditId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveMutation = useMutation({
    mutationFn: saveItem,

    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["items"],
      });

      resetForm();

      alert(
        variables.id === null
          ? "Task created successfully!"
          : "Task updated successfully!",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: updateItemStatus,

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["items"],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["items"],
      });

      alert("Task deleted successfully!");
    },
  });

  const handleEditClick = (item: TodoItem) => {
    setEditId(item.id);
    setName(item.name);
    setDescription(item.description);
    setStatus(item.status);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Task name is required");
      return;
    }

    saveMutation.mutate({ id: editId, item: { name: name.trim(), description: description.trim(), status, image: file } });
  };

  const handleToggleStatus = (item: TodoItem) => {
    const newStatus: TodoStatus = item.status === "completed" ? "pending" : "completed";
    toggleMutation.mutate({ id: item.id, status: newStatus });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteMutation.mutate(id);
    }
  };

  const isSaving = saveMutation.isPending;
  const isBusy = isSaving || toggleMutation.isPending;
  const mutationError = saveMutation.error || toggleMutation.error || deleteMutation.error;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Todo List
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize your work and keep track of your tasks.
          </p>
        </header>

        <Card className="gap-0 overflow-hidden shadow-sm">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-lg">
              {editId !== null ? "Update Task" : "Add a New Task"}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  className="h-10"
                  placeholder="Enter your task"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                  required
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  disabled={isSaving}
                  onChange={(e) =>
                    setFile(e.target.files?.[0] ?? null)
                  }
                  className="h-10 w-full min-w-0 rounded-md border border-input bg-transparent text-sm file:mr-3 file:h-full file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-0 hover:file:bg-slate-200"
                />
              </div>

              <Textarea
                className="min-h-24 w-full resize-y"
                placeholder="Add a description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : editId !== null
                      ? "Update Task"
                      : "Add Task"}
                </Button>

                {editId !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Tasks
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Here are all your tasks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                Total: {items.length}
              </Badge>

              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                Completed: {completedCount}
              </Badge>

              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                Pending: {pendingCount}
              </Badge>
            </div>
          </div>

          {isPending && (
            <p className="text-center text-sm text-slate-500">
              Loading tasks...
            </p>
          )}

          {isError && (
            <p className="text-center text-sm text-red-500">
              Error: {error.message}
            </p>
          )}

          {mutationError && (
            <p className="text-sm text-red-500" role="alert">
              {mutationError.message}
            </p>
          )}

          {!isPending && !isError && items.length === 0 && (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center px-4 py-12 text-center">
                <p className="font-semibold text-slate-800">
                  No tasks yet
                </p>
                <CardDescription className="mt-1">
                  Add your first task using the form above.
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {!isError && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="gap-0 overflow-hidden border-slate-200 py-0 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:gap-4">
                      <div className="flex justify-center pt-1">
                        <Checkbox
                          checked={item.status === "completed"}
                          disabled={isBusy}
                          onCheckedChange={() =>
                            handleToggleStatus(item)
                          }
                          aria-label={`Mark ${item.name} as ${item.status === "completed"
                            ? "pending"
                            : "completed"
                            }`}
                        />
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`break-words font-semibold ${item.status === "completed"
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                              }`}
                          >
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="col-start-2 flex flex-wrap items-start gap-2 border-t border-slate-100 pt-3 sm:col-start-3 sm:row-start-1 sm:flex-nowrap sm:justify-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setSelectedItem(item)}
                          aria-label={`View ${item.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSaving}
                          onClick={() => handleEditClick(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(item.id)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Dialog
          open={selectedItem !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="break-words pr-6 text-xl">
                    {selectedItem.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      Task #{selectedItem.id}
                    </Badge>

                    <Badge
                      variant={
                        selectedItem.status === "completed"
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedItem.status === "completed"
                        ? "Completed"
                        : "Pending"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Description
                    </h4>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {selectedItem.description ||
                        "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Attached Image
                    </h4>

                    {selectedItem.image ? (
                      <img
                        src={`${API_URL}/uploads/${encodeURIComponent(
                          selectedItem.image,
                        )}`}
                        alt={selectedItem.name}
                        className="max-h-80 w-full rounded-lg border border-slate-200 object-contain"
                      />
                    ) : (
                      <p className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                        No image attached.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
