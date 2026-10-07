import { useState, useEffect, useCallback } from "react";
import { categoryService } from "@/services/category.service";
import { Edit2, Trash2, RotateCcw, ShieldAlert, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, Loader } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { formatDate } from "@/lib/utils";
import type { CategoryRecord } from "@/types/api.types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";

export default function CategoryMasterPage() {
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const response = await categoryService.getAllCategories(search);
      if (response.data.responseStatus === "Success" && response.data.data) {
        setCategories(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load categories");
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchCategories(searchTerm);
    }
  }, [fetchCategories, searchTerm, currentUser?.role]);

  // Role Access Guard: SOW states Admin only has access to Category Master!
  if (currentUser?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Category Master module is restricted to **Administrator** accounts only. Managers and Staff do not have viewing or modification permissions.
        </p>
      </div>
    );
  }

  const handleResetForm = () => {
    setEditingCategory(null);
    setName("");
    setError("");
    setIsModalOpen(false);
  };

  const handleOpenEdit = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setName(cat.categoryName);
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category Name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const response = await categoryService.updateCategory({
          categoryId: editingCategory.categoryId,
          categoryName: name.trim(),
          updatedBy: 1, // Replace with actual user ID when available
        });

        if (response.data.responseStatus === "Success") {
          toast.success("Category updated successfully");
          fetchCategories(searchTerm);
        } else {
          toast.error(response.data.message || "Failed to update category");
        }
      } else {
        const response = await categoryService.addCategory({
          categoryName: name.trim(),
          createdBy: 1, // Replace with actual user ID when available
        });

        if (response.data.responseStatus === "Success") {
          toast.success("Category added successfully");
          fetchCategories(searchTerm);
        } else {
          toast.error(response.data.message || "Failed to add category");
        }
      }
      handleResetForm();
    } catch (error: any) {
      console.error("Error submitting category:", error);
      toast.error(error.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateToggle = async (cat: CategoryRecord) => {
    if (cat.isActive) {
      Swal.fire({
        title: "Deactivate Category?",
        text: `Are you sure you want to deactivate "${cat.categoryName}"? It will be hidden from dropdowns.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "hsl(var(--destructive))",
        cancelButtonColor: "hsl(var(--muted-foreground))",
        confirmButtonText: "Yes, Deactivate",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await categoryService.updateCategoryStatus(cat.categoryId, 1, false);
            if (response.data.responseStatus === "Success") {
              toast.success("Category deactivated successfully");
              fetchCategories(searchTerm);
            } else {
              toast.error(response.data.message || "Failed to deactivate category");
            }
          } catch (error: any) {
            console.error("Error Deactivating category:", error);
            toast.error("Failed to deactivate category. Please try again.");
          }
        }
      });
    } else {
      Swal.fire({
        title: "Activate Category?",
        text: `Are you sure you want to activate "${cat.categoryName}"? It will be visible in dropdowns.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "hsl(var(--primary))",
        cancelButtonColor: "hsl(var(--muted-foreground))",
        confirmButtonText: "Yes, Activate",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await categoryService.updateCategoryStatus(cat.categoryId, 1, true);
            if (response.data.responseStatus === "Success") {
              toast.success("Category activated successfully");
              fetchCategories(searchTerm);
            } else {
              toast.error(response.data.message || "Failed to activate category");
            }
          } catch (error: any) {
            console.error("Error Activating category:", error);
            toast.error("Failed to activate category. Please try again.");
          }
        }
      });
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.categoryId.toString().includes(searchTerm)
  );

  return (
    <div className="flex-grow flex flex-col gap-4">
      <PageHeader
        title="Category Master"
        description="Manage the product classification hierarchy for inventory and reporting."
        entriesCount={filteredCategories.length}
        entriesLabel="Categories"
      />

      <div className="flex flex-col lg:flex-row gap-4 flex-grow">
        {/* Left Side: Search Bar & Categories Grid (70% on desktop, 100% on mobile) */}
        <div className="w-full lg:w-[70%] flex flex-col gap-4 flex-grow">
          {/* Search Bar & Mobile Add Button */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center gap-3">
            <div className="flex-grow">
              <SearchInput
                placeholder="Search categories..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <button
              onClick={() => {
                handleResetForm();
                setIsModalOpen(true);
              }}
              className="lg:hidden flex items-center justify-center h-9 px-3 gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
              title="Add Category"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Category Table */}
          <DataTable
            loading={loading}
            loadingText="Loading categories..."
            headers={["#", "Category Name", "Status", "Actions"]}
            headerClassNames={["", "min-w-[120px]", "", "text-right min-w-[80px]"]}
            emptyMessage="No categories found."
          >
            {filteredCategories.map((cat) => (
              <tr key={cat.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-3.5 whitespace-nowrap">{cat.categoryId}</td>
                <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{cat.categoryName}</td>
                <td className="p-3.5 whitespace-nowrap">
                  <Badge variant={cat.isActive ? "success" : "neutral"}>
                    {cat.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3.5 text-right space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors cursor-pointer"
                    title="Edit"
                    disabled={submitting}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeactivateToggle(cat)}
                    className={`p-1 rounded transition-colors cursor-pointer ${cat.isActive
                      ? "hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      }`}
                    title={cat.isActive ? "Deactivate" : "Restore"}
                    disabled={submitting}
                  >
                    {cat.isActive ? (
                      <Trash2 className="h-3.5 w-3.5" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>

        {/* Right Side: Inline Add/Edit Form (Desktop only, hidden on mobile - 30%) */}
        <div className="hidden lg:flex lg:w-[30%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-fit sticky top-4 flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h3>
            {(editingCategory || name) && !submitting && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
              >
                Clear Form
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <Input
              label="Category Name *"
              type="text"
              placeholder="e.g. TMT Rebars, Steel Plates"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              error={error}
              maxLength={100}
              disabled={submitting}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-9 cursor-pointer"
                disabled={submitting}
                loading={submitting}
              >
                {!submitting && <Check className="h-4 w-4" />}
                <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  handleResetForm();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
              <Input
                label="Category Name *"
                type="text"
                placeholder="e.g. TMT Rebars, Steel Plates"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                error={error}
                maxLength={100}
                disabled={submitting}
              />

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleResetForm();
                  }}
                  className="flex-1 h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="flex-grow h-9 cursor-pointer"
                  disabled={submitting}
                  loading={submitting}
                >
                  {!submitting && <Check className="h-4 w-4" />}
                  <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
