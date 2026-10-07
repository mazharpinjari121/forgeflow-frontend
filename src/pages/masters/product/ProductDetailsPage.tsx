import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { productService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Calendar, ShieldAlert, AlertCircle, Package, X, FileText, ChevronLeft, ChevronRight, Tag, Hash, Layers, Coins, Percent, CheckCircle, Ruler, Trash2 } from "lucide-react";
import { PageHeader, Loader } from "@/components/common";
import type { ProductRecord, ProductGalleryRecord } from "@/types/api.types";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [gallery, setGallery] = useState<ProductGalleryRecord[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewMedia, setPreviewMedia] = useState<{ type: "image" | "video" | "pdf"; url: string; index: number; galleryItem: ProductGalleryRecord } | null>(null);

  // Role Access Guard: Product Details page is restricted to Admin only!
  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Product Details module is restricted to **Administrator** accounts only.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (productId) {
      fetchData(parseInt(productId));
    }
  }, [productId]);

  const fetchData = async (id: number) => {
    setLoading(true);
    try {
      const [productRes, galleryRes, stockRes] = await Promise.all([
        productService.getProductById(id),
        productService.getAllProductGallery(id),
        productService.getProductStockSummary(id)
      ]);

      if (productRes.data.responseStatus === "Success" && productRes.data.data) {
        setProduct(productRes.data.data);
      }
      if (galleryRes.data.responseStatus === "Success" && galleryRes.data.data) {
        setGallery(galleryRes.data.data);
      }
      if (stockRes.data.responseStatus === "Success" && stockRes.data.data) {
        setStockSummary(stockRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewMedia) return;
    const mediaItems = [...(gallery.filter(g => ["image", "photo"].includes(g.type.toLowerCase()))), ...(gallery.filter(g => ["video"].includes(g.type.toLowerCase())))];
    if (mediaItems.length > 1) {
      const prevIdx = (previewMedia.index - 1 + mediaItems.length) % mediaItems.length;
      const item = mediaItems[prevIdx];
      setPreviewMedia({
        type: ["image", "photo"].includes(item.type.toLowerCase()) ? "image" : "video",
        url: item.fileUrl,
        index: prevIdx,
        galleryItem: item
      });
    }
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewMedia) return;
    const mediaItems = [...(gallery.filter(g => ["image", "photo"].includes(g.type.toLowerCase()))), ...(gallery.filter(g => ["video"].includes(g.type.toLowerCase())))];
    if (mediaItems.length > 1) {
      const nextIdx = (previewMedia.index + 1) % mediaItems.length;
      const item = mediaItems[nextIdx];
      setPreviewMedia({
        type: ["image", "photo"].includes(item.type.toLowerCase()) ? "image" : "video",
        url: item.fileUrl,
        index: nextIdx,
        galleryItem: item
      });
    }
  };

  const handleDeleteGalleryItem = async (galleryItem: ProductGalleryRecord) => {
    const result = await Swal.fire({
      title: "Delete Gallery Item?",
      text: "Are you sure you want to delete this item? This action cannot be undone.",
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
          if (productId) {
            fetchData(parseInt(productId));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader fullScreen={false} text="Loading product details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Product Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested product does not exist or has been removed.
        </p>
        <Button onClick={() => navigate(-1)} className="h-9">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Go Back</span>
        </Button>
      </div>
    );
  }

  const photos = gallery.filter(g => ["image", "photo"].includes(g.type.toLowerCase()));
  const videos = gallery.filter(g => ["video"].includes(g.type.toLowerCase()));
  const pdfs = gallery.filter(g => ["pdf"].includes(g.type.toLowerCase()));

  const stock = stockSummary ? stockSummary.physicalStock : 0;
  const committed = stockSummary ? (stockSummary.committedStock !== undefined ? stockSummary.committedStock : stockSummary.commitedStock) : 0;
  const delivered = stockSummary ? (stockSummary.deliveredStock ?? 0) : 0;
  const netAvailable = stockSummary ? stockSummary.availableStock : 0;
  const isLowStock = product && stockSummary ? (stockSummary.availableStock <= product.minimumStockAlert) : false;

  return (
    <div className="space-y-6 text-xs">
      <PageHeader
        title="Product Details"
        description="Full product details and specifications"
        backUrl="-1"
      />

      {/* Technical Specifications Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" />

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">

          {/* Left Side: Technical Specifications & Description */}
          <div className="md:col-span-2 p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3.5">
              <div className="flex items-start gap-2.5">
                <Tag className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Product Name</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 leading-snug">{product.productName}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Hash className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Product Code</span>
                  <span className="font-mono font-semibold text-xs text-blue-600">{product.productId}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Layers className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Category</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{product.categoryName}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Coins className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Selling Price</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">₹{product.price.toLocaleString("en-IN")}/Unit</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Percent className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">CGST</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {product.cgst}%
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Percent className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">SGST</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {product.sgst ?? product.igst ?? 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Hash className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">HSN Code</span>
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                    {product.hsnCode || product.hsncode || "-"}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Minimum Stock Alert</span>
                  <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                    Below {product.minimumStockAlert} Qty
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Product Status</span>
                  <span className="block mt-0.5">
                    <Badge
                      variant={
                        product.status === "Active"
                          ? "success"
                          : product.status === "Inactive"
                            ? "neutral"
                            : "danger"
                      }
                    >
                      {product.status}
                    </Badge>
                  </span>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-3 flex items-start gap-2.5">
                <Ruler className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Specifications / Dimensions</span>
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 leading-normal">{product.specification}</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-2">
              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Product Description</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                {product.description || product.discription || ""}
              </p>
            </div>
          </div>

          {/* Right Side: Media Gallery split in 3 rows */}
          <div className="p-4 space-y-4">
            <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Product Gallery</h4>

            {((photos.length > 0) || (videos.length > 0) || (pdfs.length > 0)) ? (
              <div className="space-y-4">

                {/* Images Row */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-450 dark:text-slate-400 font-semibold uppercase block">Images ({photos.length})</span>
                  {photos.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {photos.map((item, idx) => (
                        <div
                          key={item.galleryId}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group shrink-0"
                          onClick={() => setPreviewMedia({ type: "image", url: item.fileUrl, index: idx, galleryItem: item })}
                        >
                          <img src={item.fileUrl} alt={`Product view ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic block pl-1">No images uploaded</span>
                  )}
                </div>

                {/* Videos Row */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-450 dark:text-slate-400 font-semibold uppercase block">Videos ({videos.length})</span>
                  {videos.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {videos.map((item, idx) => (
                        <div
                          key={item.galleryId}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group bg-slate-950 flex items-center justify-center shrink-0"
                          onClick={() => setPreviewMedia({ type: "video", url: item.fileUrl, index: idx, galleryItem: item })}
                        >
                          <video src={item.fileUrl} className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-200" muted />
                          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/25">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic block pl-1">No videos uploaded</span>
                  )}
                </div>

                {/* Spec Sheets (PDF) Row */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-450 dark:text-slate-400 font-semibold uppercase block">Documents ({pdfs.length})</span>
                  {pdfs.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5">
                      {pdfs.map((item) => (
                        <div
                          key={item.galleryId}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer group bg-red-50 dark:bg-red-950/20 flex flex-col items-center justify-center shrink-0"
                          onClick={() => setPreviewMedia({ type: "pdf", url: item.fileUrl, index: 0, galleryItem: item })}
                          title={item.name}
                        >
                          <FileText className="h-5 w-5 text-red-600" />
                          <span className="text-[8px] font-bold text-red-700 mt-1 uppercase tracking-wider truncate max-w-full px-1">PDF</span>
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic block pl-1">No documents uploaded</span>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 bg-slate-50 dark:bg-slate-950/20 rounded-lg border border-slate-100 dark:border-slate-800">
                <Package className="h-6 w-6 text-slate-350" />
                <span className="text-[10px] text-slate-450 mt-1">No media files uploaded.</span>
              </div>
            )}
          </div>

        </div>
      </div>
      {/* Available Stock Summary Cards */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
          <ShieldAlert className="h-4.5 w-4.5 text-blue-500" />
          Live Available Inventory Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="h-11 w-11 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center">
              <Package className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Physical Stock</span>
              <span className="font-black text-lg text-slate-850 dark:text-slate-100 block mt-0.5">{stock} Qty</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Total manufactured active in yard</span>
            </div>
          </div>


          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className="h-11 w-11 bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 rounded-full flex items-center justify-center">
              <Calendar className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Committed Dues</span>
              <span className="font-black text-lg text-amber-500 block mt-0.5">{committed > 0 ? `${committed} Qty` : "0 Qty"}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Reserved for booked sale orders</span>
            </div>
          </div>



          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm flex items-center gap-4 relative overflow-hidden">
            <div className={`h-11 w-11 rounded-full flex items-center justify-center ${isLowStock ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net Available Stock</span>
              <span className={`font-black text-lg block mt-0.5 ${isLowStock ? "text-red-500 animate-pulse font-black" : "text-emerald-600"}`}>
                {netAvailable} Qty
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Available for mapping new booking invoices</span>
            </div>
          </div>
        </div>

        {isLowStock && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-4 rounded-xl flex items-start gap-2.5 text-red-700 dark:text-red-400 font-semibold animate-pulse">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold">🚨 Safety stock trigger breached!</span>
              <span className="block text-[10.5px] mt-0.5 font-medium text-red-600 dark:text-red-400">
                Available Net Stock ({netAvailable} Qty) has dropped to or below the trigger level limit ({product.minimumStockAlert} Qty) for active sales. Please schedule a production batch run soon.
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Lightbox / Preview Modal */}
      {previewMedia && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setPreviewMedia(null)}>
          <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden w-full max-h-[85vh] flex flex-col relative animate-scale-in ${previewMedia.type === "pdf" ? "max-w-4xl h-[85vh]" : "max-w-2xl"}`} onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">Media Preview</h3>
              <div className="flex items-center gap-2">
                {previewMedia.galleryItem && (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewMedia.galleryItem) {
                        handleDeleteGalleryItem(previewMedia.galleryItem);
                        setPreviewMedia(null);
                      }
                    }}
                    className="p-1 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors inline-flex items-center justify-center gap-1 text-[11px] font-medium"
                    title="Delete saved item"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
            <div className={`flex-1 bg-slate-950 flex items-center justify-center p-2 overflow-hidden relative ${previewMedia.type !== "pdf" ? "aspect-video" : "h-full"}`}>
              {/* Previous button */}
              {(previewMedia.type === "image" || previewMedia.type === "video") && (photos.length > 1 || videos.length > 1) && (
                <button
                  onClick={handlePrevMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2.5 transition-all z-20 focus:outline-none"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {previewMedia.type === "image" ? (
                <img src={previewMedia.url} alt="Full view" className="max-w-full max-h-full object-cover rounded-lg" />
              ) : previewMedia.type === "video" ? (
                <video key={previewMedia.url} src={previewMedia.url} className="max-w-full max-h-full object-cover rounded-lg" controls autoPlay />
              ) : (
                <iframe src={previewMedia.url} className="w-full h-full rounded-lg border-0 bg-white" title="PDF Spec Sheet" />
              )}

              {/* Next button */}
              {(previewMedia.type === "image" || previewMedia.type === "video") && (photos.length > 1 || videos.length > 1) && (
                <button
                  onClick={handleNextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2.5 transition-all z-20 focus:outline-none"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
