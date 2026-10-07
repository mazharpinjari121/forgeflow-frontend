import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { productService, categoryService } from "@/services";
import { Plus, Edit2, ShieldAlert, Check, Image as ImageIcon, Video, Package, X, FileText, Trash2, SlidersHorizontal, FilterX } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { PageHeader, Loader, FilterDrawer } from "@/components/common";
import { SearchInput } from "@/components/ui/search-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ProductRecord, CategoryRecord, ProductGalleryRecord } from "@/types/api.types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/table";

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1920;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const mimeType = file.type === "image/png" ? "image/jpeg" : file.type;
            const extension = file.type === "image/png" ? ".jpg" : "";
            let newName = file.name;
            if (extension && !newName.toLowerCase().endsWith(extension)) {
              newName = newName.substring(0, newName.lastIndexOf(".")) + extension;
            }

            const compressedFile = new File([blob], newName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            if (compressedFile.size >= file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export default function ProductMasterPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    return [
      categoryFilter !== "all",
      statusFilter !== "all"
    ].filter(Boolean).length;
  }, [categoryFilter, statusFilter]);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" || categoryFilter !== "all" || statusFilter !== "all";
  }, [searchTerm, categoryFilter, statusFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
  }, []);

  const products = useMemo(() => {
    if (!searchTerm) return allProducts;
    const term = searchTerm.toLowerCase();
    return allProducts.filter((p) =>
      p.productName.toLowerCase().includes(term) ||
      p.productId.toString().includes(term) ||
      p.categoryName?.toLowerCase().includes(term)
    );
  }, [allProducts, searchTerm]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [currentProductGallery, setCurrentProductGallery] = useState<ProductGalleryRecord[]>([]);

  // Form States
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Discontinued">("Active");
  const [minStockAlert, setMinStockAlert] = useState("0");
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [pdf, setPdf] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [sgst, setSgst] = useState("0");
  const [cgst, setCgst] = useState("0");
  const [shareOnWhatsApp, setShareOnWhatsApp] = useState(true);
  const [error, setError] = useState("");

  // Preview Modal
  const [previewMedia, setPreviewMedia] = useState<{ type: "image" | "video" | "pdf"; url: string; index: number; galleryItem?: ProductGalleryRecord } | null>(null);

  // Fetch data
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const catId = categoryFilter !== "all" ? parseInt(categoryFilter) : undefined;
      const st = statusFilter !== "all" ? statusFilter : undefined;
      const response = await productService.getAllProducts(catId, st);
      if (response.data.responseStatus === "Success" && response.data.data) {
        setAllProducts(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response.data.responseStatus === "Success" && response.data.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchCategories();
    }
  }, [fetchCategories, currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchProducts();
    }
  }, [fetchProducts, currentUser?.role]);

  // Role Access Guard: SOW states Admin only has access to Product Master!
  if (currentUser?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Product Master module is restricted to **Administrator** accounts only. Managers and Staff do not have viewing or modification permissions.
        </p>
      </div>
    );
  }

  const handleResetForm = () => {
    setEditingProduct(null);
    setCurrentProductGallery([]);
    setName("");
    setCategoryId("");
    setPrice("");
    setSpecifications("Size: 8ft x 4ft, Thickness: 2mm, Grade: IS 2062");
    setDescription("");
    setStatus("Active");
    setMinStockAlert("0");
    setPhotos([]);
    setVideos([]);
    setPdf(null);
    setPdfName("");
    setHsnCode("");
    setSgst("0");
    setCgst("0");
    setShareOnWhatsApp(true);
    setError("");
  };

  const fetchProductGallery = async (productId: number) => {
    try {
      const response = await productService.getAllProductGallery(productId);
      if (response.data.responseStatus === "Success" && response.data.data) {
        setCurrentProductGallery(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenEdit = async (prod: ProductRecord) => {
    setEditingProduct(prod);
    setName(prod.productName);
    setCategoryId(prod.categoryId.toString());
    setPrice(prod.price.toString());
    setSpecifications(prod.specification);
    setDescription(prod.description || prod.discription || "");
    setStatus(prod.status as any);
    setMinStockAlert(prod.minimumStockAlert.toString());
    setHsnCode(prod.hsnCode || prod.hsncode || "");
    setSgst((prod.sgst ?? prod.igst ?? 0).toString());
    setCgst(prod.cgst.toString());
    setPhotos([]);
    setVideos([]);
    setPdf(null);
    setPdfName("");
    setShareOnWhatsApp(false);
    setError("");
    await fetchProductGallery(prod.productId);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (prod: ProductRecord) => {
    const result = await Swal.fire({
      title: "Delete Product?",
      text: `Are you sure you want to delete "${prod.productName}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Delete",
    });
    if (result.isConfirmed) {
      try {
        const response = await productService.deleteProduct(prod.productId, 1);
        if (response.data.responseStatus === "Success") {
          toast.success("Product deleted successfully");
          await fetchProducts();
        } else {
          toast.error(response.data.message || "Failed to delete product");
        }
      } catch (error: any) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product. Please try again.");
      }
    }
  };

  const handleDeleteGalleryItem = async (galleryItem: ProductGalleryRecord) => {
    const result = await Swal.fire({
      title: "Delete Gallery Item?",
      text: `Are you sure you want to delete this item? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "hsl(var(--destructive))",
      cancelButtonColor: "hsl(var(--muted-foreground))",
      confirmButtonText: "Yes, Delete",
    });
    if (result.isConfirmed) {
      try {
        const response = await productService.deleteProductGalleryItem(galleryItem.galleryId, 1);
        if (response.data.responseStatus === "Success") {
          toast.success("Gallery item deleted successfully");
          if (editingProduct) {
            await fetchProductGallery(editingProduct.productId);
          }
        } else {
          toast.error(response.data.message || "Failed to delete gallery item");
        }
      } catch (error: any) {
        console.error("Error deleting gallery item:", error);
        toast.error("Failed to delete gallery item. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Product Name is required");
    if (!categoryId) return setError("Category is required");
    if (!price || parseFloat(price) <= 0) return setError("Valid Price is required");
    if (!specifications.trim()) return setError("Dimensions / Specifications are required");

    setSubmitting(true);
    try {
      let productId: number | null = null;

      if (editingProduct) {
        const updateResponse = await productService.updateProduct({
          productId: editingProduct.productId,
          productName: name.trim(),
          categoryId: parseInt(categoryId),
          price: parseFloat(price),
          specification: specifications.trim(),
          discription: description.trim(),
          minimumStockAlert: parseInt(minStockAlert) || 0,
          isBroadcast: editingProduct.isBroadcast ?? false,
          status,
          hsnCode: hsnCode.trim(),
          cgst: parseFloat(cgst) || 0,
          sgst: parseFloat(sgst) || 0,
          updatedBy: 1,
        });
        if (updateResponse.data.responseStatus === "Success") {
          productId = editingProduct.productId;
          toast.success("Product updated successfully");
        } else {
          toast.error(updateResponse.data.message || "Failed to update product");
          return;
        }
      } else {
        const addResponse = await productService.addProduct({
          productName: name.trim(),
          categoryId: parseInt(categoryId),
          price: parseFloat(price),
          specification: specifications.trim(),
          discription: description.trim(),
          minimumStockAlert: parseInt(minStockAlert) || 0,
          isBroadcast: shareOnWhatsApp,
          status,
          hsnCode: hsnCode.trim(),
          cgst: parseFloat(cgst) || 0,
          sgst: parseFloat(sgst) || 0,
          createdBy: 1,
        });
        if (addResponse.data.responseStatus === "Success") {
          toast.success("Product added successfully");
          const dataVal = addResponse.data.data;
          productId = typeof dataVal === 'object' && dataVal !== null ? dataVal.productId : dataVal;
        } else {
          toast.error(addResponse.data.message || "Failed to add product");
          return;
        }
      }

      // Upload newly added files to gallery if we have a valid product ID
      if (productId) {
        const uploadPromises = [];

        // Photos
        for (const file of photos) {
          const fd = new FormData();
          fd.append("ProductId", productId.toString());
          fd.append("Type", "photo");
          fd.append("File", file);
          fd.append("CreatedBy", "1");
          uploadPromises.push(productService.addProductGalleryItem(fd));
        }

        // Videos
        for (const file of videos) {
          const fd = new FormData();
          fd.append("ProductId", productId.toString());
          fd.append("Type", "video");
          fd.append("File", file);
          fd.append("CreatedBy", "1");
          uploadPromises.push(productService.addProductGalleryItem(fd));
        }

        // PDF Spec Sheet
        if (pdf) {
          const fd = new FormData();
          fd.append("ProductId", productId.toString());
          fd.append("Type", "pdf");
          fd.append("File", pdf);
          fd.append("CreatedBy", "1");
          uploadPromises.push(productService.addProductGalleryItem(fd));
        }

        if (uploadPromises.length > 0) {
          try {
            await Promise.all(uploadPromises);
          } catch (uploadErr) {
            console.error("Error uploading gallery files:", uploadErr);
            toast.error("Some gallery files failed to upload.");
          }
        }
      }

      await fetchProducts();
      if (productId) {
        await fetchProductGallery(productId);
      }
      handleResetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error submitting product:", error);
      toast.error(error.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCategories = categories.filter((c) => c.isActive);

  const nameError = (error.toLowerCase().includes("product name") || error.toLowerCase().includes("name")) ? error : "";
  const catError = (error.toLowerCase().includes("category") || error.toLowerCase().includes("catid")) ? error : "";
  const priceError = error.toLowerCase().includes("price") ? error : "";
  const specError = (error.toLowerCase().includes("specification") || error.toLowerCase().includes("dimension") || error.toLowerCase().includes("spec")) ? error : "";
  const generalError = error && !nameError && !catError && !priceError && !specError ? error : "";

  return (
    <div className="flex-grow flex flex-col gap-4">
      <PageHeader
        title="Product Master"
        description="Manage standard steel items, prices, dimensions, specs, and stock levels."
        entriesCount={products.length}
        entriesLabel="Products"
      />

      {/* Filter and Actions Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 flex-grow">
          <div className="flex-grow max-w-full lg:max-w-md">
            <SearchInput
              placeholder="Search Product code, name, category..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>

          {/* Mobile Filter Trigger Button (hidden on desktop lg) */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            type="button"
            className={`lg:hidden h-9 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${activeFiltersCount > 0
              ? "border-blue-500/50 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[8px] font-bold text-white leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Mobile Add Product Button (hidden on desktop lg) */}
          <button
            onClick={() => { handleResetForm(); setIsModalOpen(true); }}
            className="lg:hidden flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
            title="Add Product"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Quick Filters for Desktop (lg and up) */}
          <div className="hidden lg:flex items-center gap-3">
            <SearchableSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((c) => ({ value: c.categoryId.toString(), label: c.categoryName })),
              ]}
              className="w-40 font-semibold"
            />
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Discontinued", label: "Discontinued" },
              ]}
              className="w-36 font-semibold"
            />
          </div>

          {/* Clear Filters Button (Mobile & Desktop) */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              type="button"
              className="h-9 px-2 text-red-600 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              title="Clear all active filters"
            >
              <FilterX className="h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>

        {/* Add Product Button (hidden on mobile, visible on lg) */}
        <button
          onClick={() => { handleResetForm(); setIsModalOpen(true); }}
          className="hidden lg:flex h-9 px-3 gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all shadow-sm shadow-primary/20 shrink-0 cursor-pointer active:scale-95 items-center justify-center"
          title="Add Product"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs px-1 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1.5">
            Active Filters:
          </span>

          {categoryFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Category: {categories.find(c => c.categoryId.toString() === categoryFilter)?.categoryName}</span>
              <button onClick={() => setCategoryFilter("all")} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-755 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 text-[11px] font-semibold">
              <span>Status: {statusFilter}</span>
              <button onClick={() => setStatusFilter("all")} className="hover:text-blue-950 dark:hover:text-blue-200 transition-colors cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleClearFilters}
            className="text-[10px] text-red-500 hover:text-red-750 hover:underline font-bold transition-all ml-1.5 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Right sliding Filter Drawer Sidebar */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Products"
        activeFiltersCount={activeFiltersCount}
        hasActiveFilters={hasActiveFilters}
        onClearAll={handleClearFilters}
      >
        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Category</span>
          </label>
          <SearchableSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((c) => ({ value: c.categoryId.toString(), label: c.categoryName })),
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>

        {/* Status Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-slate-400" />
            <span>Status</span>
          </label>
          <SearchableSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
              { value: "Discontinued", label: "Discontinued" },
            ]}
            className="w-full text-xs font-semibold"
          />
        </div>
      </FilterDrawer>

      {/* Product List */}
      <DataTable
        loading={loading}
        loadingText="Loading products..."
        headers={["#", "Product Name", "Category", "Price / Unit", "Status", "Actions"]}
        headerClassNames={["w-36", "", "", "", "", "text-right min-w-[90px]"]}
        emptyMessage="No products found."
      >
        {products.map((prod) => (
          <tr 
            key={prod.productId} 
            onClick={() => navigate(`/masters/products/${prod.productId}`)}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
          >
            <td className="p-3.5 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              {prod.productId}
            </td>
            <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/masters/products/${prod.productId}`);
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline text-left cursor-pointer"
              >
                {prod.productName}
              </button>
            </td>
            <td className="p-3.5 text-slate-500 whitespace-nowrap">{prod.categoryName}</td>
            <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
              ₹{prod.price.toLocaleString("en-IN")}
            </td>
            <td className="p-3.5">
              <Badge
                variant={
                  prod.status === "Active"
                    ? "success"
                    : prod.status === "Inactive"
                      ? "neutral"
                      : "danger"
                }
              >
                {prod.status}
              </Badge>
            </td>
            <td className="p-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleOpenEdit(prod)}
                className="p-1 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit"
                disabled={submitting}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDeleteProduct(prod)}
                className="p-1 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete"
                disabled={submitting}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {generalError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded bg-red-50 dark:bg-red-900/20 text-red-655 dark:text-red-400 font-medium">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Product Name *"
                  type="text"
                  placeholder="e.g. TMT Bar Fe 550D 12mm"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  error={nameError}
                  maxLength={200}
                  disabled={submitting}
                />

                <div className="space-y-1.5">
                  <label className={`font-semibold ${catError ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-300"} text-[10px] font-bold text-black uppercase ml-1 tracking-wider block`}>
                    Category *
                  </label>
                  <SearchableSelect
                    value={categoryId}
                    onChange={setCategoryId}
                    options={[
                      { value: "", label: "Please select the category" },
                      ...activeCategories.map((c) => ({ value: c.categoryId.toString(), label: c.categoryName }))
                    ]}
                    placeholder="Please select the category"
                    className="w-full text-xs font-semibold"
                    disabled={submitting}
                    hasError={!!catError}
                  />
                  {catError && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{catError}</p>
                  )}
                </div>

                <Input
                  label="Price (₹ per Unit) *"
                  type="number"
                  placeholder="e.g. 58000"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setError("");
                  }}
                  error={priceError}
                  disabled={submitting}
                />

                <Input
                  label="HSN Code"
                  type="text"
                  placeholder="e.g. 72139100"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  disabled={submitting}
                />


                <Input
                  label="CGST (%)"
                  type="number"
                  placeholder="e.g. 9"
                  value={cgst}
                  onChange={(e) => setCgst(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={submitting}
                />

                <Input
                  label="SGST (%)"
                  type="number"
                  placeholder="e.g. 9"
                  value={sgst}
                  onChange={(e) => setSgst(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={submitting}
                />
                <Input
                  label="Minimum Stock Alert Level (Qty)"
                  type="number"
                  placeholder="e.g. 5"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  disabled={submitting}
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase ml-1 tracking-wider block">Product Status</label>
                  <SearchableSelect
                    value={status}
                    onChange={(val) => setStatus(val as any)}
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                      { value: "Discontinued", label: "Discontinued" },
                    ]}
                    className="w-full text-xs font-semibold"
                    disabled={submitting}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Specifications / Dimensions *"
                    type="text"
                    placeholder="e.g. Size: 8ft x 4ft, Thickness: 2mm, Grade: IS 2062"
                    value={specifications}
                    onChange={(e) => {
                      setSpecifications(e.target.value);
                      setError("");
                    }}
                    error={specError}
                    disabled={submitting}
                  />
                </div>
              </div>

              <Textarea
                label="Product Description"
                placeholder="A rich details list designed for sharing with clients..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[70px]"
                rows={3}
                disabled={submitting}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Photo Upload and Preview */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                    Product Photos (Up to 10 photos)
                  </label>

                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group bg-slate-50/30 dark:bg-slate-900/10"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1 text-center">
                      <div className="h-9 w-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-4.5 w-4.5" />
                      </div>
                      <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">Click to upload photos</p>
                      <p className="text-[10px] text-slate-500">Multiple JPEG/PNG/WebP, auto-compressed, up to 10</p>
                    </div>
                    <input
                      type="file"
                      id="photo-upload"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const compressToastId = toast.loading("Compressing uploaded images...");
                          try {
                            const compressedFiles = await Promise.all(
                              files.map(async (file) => {
                                if (file.size > 500 * 1024) {
                                  return await compressImage(file);
                                }
                                return file;
                              })
                            );
                            toast.success("Images compressed successfully!", { id: compressToastId });
                            setPhotos(prev => [...prev, ...compressedFiles].slice(0, 10));
                          } catch (err) {
                            console.error("Compression error:", err);
                            toast.error("Failed to process some images.", { id: compressToastId });
                            setPhotos(prev => [...prev, ...files].slice(0, 10));
                          }
                        }
                      }}
                      className="hidden"
                      disabled={submitting}
                    />
                  </label>

                  {/* Inline Photos Grid (Newly added first, then saved) */}
                  {((editingProduct && currentProductGallery.some(item => ["image", "photo"].includes(item.type.toLowerCase()))) || photos.length > 0) && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {/* Newly added photos */}
                      {photos.map((file, idx) => (
                        <div key={`new-photo-${idx}`} className="relative group bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-blue-500 dark:border-blue-600 shadow-sm aspect-square">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewMedia({
                              type: "image",
                              url: URL.createObjectURL(file),
                              index: idx
                            })}
                          />
                          <div className="absolute top-0.5 left-0.5 px-1 rounded bg-blue-600 text-white font-bold text-[7px] uppercase tracking-wide">
                            New
                          </div>
                          <button
                            type="button"
                            onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm"
                            title="Remove photo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Saved photos */}
                      {editingProduct && currentProductGallery.filter(item => ["image", "photo"].includes(item.type.toLowerCase())).map((item) => (
                        <div key={item.galleryId} className="relative group bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-emerald-500 dark:border-emerald-600 shadow-sm aspect-square">
                          <img
                            src={item.fileUrl}
                            alt={item.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewMedia({
                              type: "image",
                              url: item.fileUrl,
                              index: currentProductGallery.indexOf(item),
                              galleryItem: item
                            })}
                          />
                          <div className="absolute top-0.5 left-0.5 px-1 rounded bg-emerald-600 text-white font-bold text-[7px] uppercase tracking-wide">
                            Saved
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGalleryItem(item);
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Delete saved item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload and Preview */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Video className="h-3.5 w-3.5 text-slate-400" />
                    Product Videos (Up to 3 videos)
                  </label>

                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group bg-slate-50/30 dark:bg-slate-900/10"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1 text-center">
                      <div className="h-9 w-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="h-4.5 w-4.5" />
                      </div>
                      <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">Click to upload videos</p>
                      <p className="text-[10px] text-slate-500">Multiple MP4, max 30 MB each, up to 3</p>
                    </div>
                    <input
                      type="file"
                      id="video-upload"
                      multiple
                      accept="video/mp4"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const validFiles: File[] = [];
                          const invalidFiles: string[] = [];
                          files.forEach((file) => {
                            if (file.size > 30 * 1024 * 1024) {
                              invalidFiles.push(file.name);
                            } else {
                              validFiles.push(file);
                            }
                          });
                          if (invalidFiles.length > 0) {
                            toast.error(`Video files exceed 30 MB size limit: ${invalidFiles.join(", ")}`);
                          }
                          if (validFiles.length > 0) {
                            setVideos(prev => [...prev, ...validFiles].slice(0, 3));
                          }
                        }
                      }}
                      className="hidden"
                      disabled={submitting}
                    />
                  </label>

                  {/* Inline Videos Grid (Newly added first, then saved) */}
                  {((editingProduct && currentProductGallery.some(item => ["video"].includes(item.type.toLowerCase()))) || videos.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {/* Newly added videos */}
                      {videos.map((file, idx) => (
                        <div key={`new-video-${idx}`} className="relative group bg-slate-950 rounded-lg overflow-hidden border border-blue-500 dark:border-blue-600 shadow-sm aspect-square flex items-center justify-center">
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full h-full object-cover opacity-70 cursor-pointer"
                            muted
                            onClick={() => setPreviewMedia({
                              type: "video",
                              url: URL.createObjectURL(file),
                              index: idx
                            })}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <Video className="h-6 w-6 text-white filter drop-shadow-md" />
                          </div>
                          <div className="absolute top-0.5 left-0.5 px-1 rounded bg-blue-600 text-white font-bold text-[7px] uppercase tracking-wide">
                            New
                          </div>
                          <button
                            type="button"
                            onClick={() => setVideos(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm"
                            title="Remove video"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Saved videos */}
                      {editingProduct && currentProductGallery.filter(item => ["video"].includes(item.type.toLowerCase())).map((item) => (
                        <div key={item.galleryId} className="relative group bg-slate-950 rounded-lg overflow-hidden border border-emerald-500 dark:border-emerald-600 shadow-sm aspect-square flex items-center justify-center">
                          <video
                            src={item.fileUrl}
                            className="w-full h-full object-cover opacity-60 cursor-pointer"
                            muted
                            onClick={() => setPreviewMedia({
                              type: "video",
                              url: item.fileUrl,
                              index: currentProductGallery.indexOf(item),
                              galleryItem: item
                            })}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <Video className="h-6 w-6 text-white filter drop-shadow-md" />
                          </div>
                          <div className="absolute top-0.5 left-0.5 px-1 rounded bg-emerald-600 text-white font-bold text-[7px] uppercase tracking-wide">
                            Saved
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGalleryItem(item);
                            }}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Delete saved item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PDF Document Upload and Preview */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Product Specifications PDF
                  </label>

                  <label
                    htmlFor="pdf-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group bg-slate-50/30 dark:bg-slate-900/10"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1 text-center">
                      <div className="h-9 w-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">Click to upload PDF</p>
                      <p className="text-[10px] text-slate-500">Single PDF, max 5 MB</p>
                    </div>
                    <input
                      type="file"
                      id="pdf-upload"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(`PDF file size exceeds 5 MB limit: ${file.name}`);
                            return;
                          }
                          setPdf(file);
                          setPdfName(file.name);
                        }
                      }}
                      className="hidden"
                      disabled={submitting}
                    />
                  </label>

                  {/* Inline PDF List (Newly added first, then saved) */}
                  {((editingProduct && currentProductGallery.some(item => ["pdf"].includes(item.type.toLowerCase()))) || pdf) && (
                    <div className="space-y-2 mt-2">
                      {/* Newly added PDF */}
                      {pdf && (
                        <div className="relative group bg-red-50 dark:bg-red-950/20 rounded-lg overflow-hidden border border-blue-500 dark:border-blue-600 p-2.5 flex items-center gap-2.5 shadow-sm">
                          <FileText className="h-5 w-5 text-red-600 shrink-0" />
                          <span
                            className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline flex-1"
                            onClick={() => setPreviewMedia({
                              type: "pdf",
                              url: URL.createObjectURL(pdf),
                              index: 999
                            })}
                            title={pdfName}
                          >
                            {pdfName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[7px] uppercase tracking-wide">
                            New
                          </span>
                          <button
                            type="button"
                            onClick={() => { setPdf(null); setPdfName(""); }}
                            className="p-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-600 rounded-lg"
                            title="Remove PDF"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Saved PDFs */}
                      {editingProduct && currentProductGallery.filter(item => ["pdf"].includes(item.type.toLowerCase())).map((item) => (
                        <div key={item.galleryId} className="relative group bg-red-50 dark:bg-red-950/20 rounded-lg overflow-hidden border border-emerald-500 dark:border-emerald-600 p-2.5 flex items-center gap-2.5 shadow-sm">
                          <FileText className="h-5 w-5 text-red-600 shrink-0" />
                          <span
                            className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline flex-1"
                            onClick={() => setPreviewMedia({
                              type: "pdf",
                              url: item.fileUrl,
                              index: currentProductGallery.indexOf(item),
                              galleryItem: item
                            })}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[7px] uppercase tracking-wide">
                            Saved
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGalleryItem(item);
                            }}
                            className="p-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete saved PDF"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!editingProduct && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <Checkbox
                    id="wa-check"
                    checked={shareOnWhatsApp}
                    onChange={(e) => setShareOnWhatsApp(e.target.checked)}
                    disabled={submitting}
                    className="mt-0.5"
                  />
                  <label htmlFor="wa-check" className="cursor-pointer select-none flex-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.436.002 9.858-4.384 9.86-9.774.002-2.611-1.011-5.066-2.855-6.914C16.43 2.067 13.987 1.05 11.39 1.05c-5.442 0-9.866 4.385-9.87 9.776-.001 1.516.4 2.99 1.159 4.269l.102.179-1.02 3.725 3.824-1.002.175.104zM16.51 13.56c-.267-.134-1.586-.783-1.83-.872-.246-.089-.425-.134-.605.134-.18.267-.695.872-.851 1.05-.156.178-.313.201-.58.067-.268-.134-1.13-.417-2.153-1.331-.797-.71-1.335-1.587-1.492-1.854-.156-.267-.017-.412.117-.545.121-.12.267-.312.4-.468.134-.156.179-.267.268-.446.089-.178.045-.335-.022-.469-.067-.134-.605-1.456-.83-1.99-.22-.53-.443-.459-.605-.468-.157-.008-.337-.01-.518-.01a1 1 0 00-.723.337c-.246.267-.94.913-.94 2.227s.96 2.607 1.092 2.786c.134.179 1.888 2.884 4.574 4.043.64.276 1.137.44 1.526.564.64.203 1.22.174 1.68.106.513-.077 1.586-.648 1.81-1.272.223-.624.223-1.159.156-1.272-.067-.113-.245-.178-.513-.312z" />
                      </svg>
                      Broadcast to WhatsApp immediately
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      Check this to broadcast product specifications, pricing, and details to all active retailers and customers via WhatsApp automatically.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                >
                  {!submitting && <Check className="h-4 w-4 mr-1.5" />}
                  <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal */}
      {previewMedia && createPortal(
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in" onClick={() => setPreviewMedia(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Preview</h3>
              <div className="flex items-center gap-2">
                {previewMedia.galleryItem && (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewMedia.galleryItem) {
                        handleDeleteGalleryItem(previewMedia.galleryItem);
                      }
                      setPreviewMedia(null);
                    }}
                    className="p-1.5 rounded-lg text-red-650 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5 font-semibold"
                    title="Delete saved item"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
              {previewMedia.type === "image" ? (
                <img src={previewMedia.url} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
              ) : previewMedia.type === "video" ? (
                <video key={previewMedia.url} src={previewMedia.url} className="max-w-full max-h-[75vh] rounded-lg" controls autoPlay />
              ) : (
                <iframe src={previewMedia.url} className="w-full h-[75vh] rounded-lg border-0 bg-white" title="PDF Preview" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
