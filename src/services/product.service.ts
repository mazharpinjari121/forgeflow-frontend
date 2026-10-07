import api from "./api";
import type {
  ApiResponse,
  ProductRecord,
  AddProductRequest,
  UpdateProductRequest,
  ProductGalleryRecord,
} from "@/types/api.types";

export const productService = {
  // Product Endpoints
  getAllProducts: (categoryId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (categoryId !== undefined) params.append("categoryId", categoryId.toString());
    if (status) params.append("status", status);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<ApiResponse<ProductRecord[]>>(`/product/all${queryString}`);
  },

  getProductById: (productId: number) =>
    api.get<ApiResponse<ProductRecord>>(`/product/${productId}`),

  getProductStockSummary: (productId: number) =>
    api.get<ApiResponse<any>>(`/product/productstocksummary/${productId}`),

  addProduct: (data: AddProductRequest) =>
    api.post<ApiResponse<any>>("/product/add", data),

  updateProduct: (data: UpdateProductRequest) =>
    api.post<ApiResponse<any>>("/product/update", data),

  deleteProduct: (productId: number, userId: number) =>
    api.post<ApiResponse<any>>(`/product/Delete/${productId}?userId=${userId}`),

  // Product Gallery Endpoints
  getAllProductGallery: (productId: number) =>
    api.get<ApiResponse<ProductGalleryRecord[]>>(`/productgallery/all?productId=${productId}`),

  getProductGalleryById: (galleryId: number) =>
    api.get<ApiResponse<ProductGalleryRecord>>(`/productgallery/${galleryId}`),

  addProductGalleryItem: (formData: FormData) => {
    return api.post<ApiResponse<any>>("/productgallery/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteProductGalleryItem: (galleryId: number, userId: number) =>
    api.post<ApiResponse<any>>(`/productgallery/Delete/${galleryId}/${userId}`),
};
