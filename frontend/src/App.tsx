
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  useTodos,
  useSaveTodo,
  useToggleTodoStatus,
  useDeleteTodo,
} from "@/hooks/useTodos";
import type { TodoItem, TodoFormData } from "@/types/todo.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Pencil, Trash } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { API_URL } from "./api/todo.api";

export default function App() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading, isFetching, isError, error } = useTodos();
  const saveMutation = useSaveTodo();
  const toggleMutation = useToggleTodoStatus();
  const deleteMutation = useDeleteTodo();

  const completedTasks = items.filter((item) => item.status === "completed").length;
  const pendingTasks = items.filter((item) => item.status === "pending").length;


  function resetForm() {
    setName("");
    setDescription("");
    setFile(null);
    setEditId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    const formData: TodoFormData = {
      name: name.trim(),
      description: description.trim(),
      status: items.find((item) => item.id === editId)?.status ?? "pending",
      image: file,
    };

    saveMutation.mutate({
      id: editId,
      item: formData,
    }, {
      onSuccess: () => {
        resetForm();
      },
    }
    );
  }

  function handleEdit(item: TodoItem) {
    setEditId(item.id);
    setName(item.name);
    setDescription(item.description);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleToggleStatus(item: TodoItem) {
    toggleMutation.mutate({
      id: item.id,
      status:
        item.status === "completed"
          ? "pending"
          : "completed",
    });
  }

  function handleDelete(item: TodoItem) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        if (editId === item.id) {
          resetForm();
        }

        if (selectedItem?.id === item.id) {
          setSelectedItem(null);
        }
      },
    });
  }

  const mutationError =
    saveMutation.error ??
    toggleMutation.error ??
    deleteMutation.error;

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
                  required
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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
              />

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
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
                    disabled={saveMutation.isPending}
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
                Completed: {completedTasks}
              </Badge>

              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                Pending: {pendingTasks}
              </Badge>
            </div>
          </div>

          {isLoading && (
            <p className="text-center text-sm text-slate-500">
              Loading tasks...
            </p>
          )}

          {isFetching && !isLoading && (
            <p className="text-sm text-slate-500">
              Refreshing tasks...
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

          {!isLoading && !isError && items.length === 0 && (
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
                          disabled={toggleMutation.isPending}
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
                          disabled={saveMutation.isPending}
                          onClick={() => handleEdit(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(item)}
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