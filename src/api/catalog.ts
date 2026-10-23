import { apiRequest } from "./client";
import type { JsonRecord, Paged } from "./contracts";

type ProductForm = {
  name: string;
  code: string;
  isActive: boolean;
  description?: string | null;
  price?: number | null;
  stripPrice?: number | null;
  oldPrice?: number | null;
  stripQuantityInBox?: number | null;
  imageFile?: File | null;
  brandId?: number | null;
  categoryId?: number | null;
};

type BrandForm = {
  name: string;
  slug: string;
  imageFile?: File | null;
};

type BannerForm = {
  title: string;
  subtitle?: string | null;
  buttonText?: string | null;
  imageFile?: File | null;
  categoryId?: number | null;
  brandId?: number | null;
  displayOrder: number;
  isActive: boolean;
};

function toFormData(fields: Record<string, string | number | boolean | File | null | undefined>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    form.append(key, value instanceof File ? value : String(value));
  }
  return form;
}

function productForm(payload: ProductForm) {
  return toFormData({
    Name: payload.name,
    Code: payload.code,
    IsActive: payload.isActive,
    Description: payload.description,
    Price: payload.price,
    StripPrice: payload.stripPrice,
    OldPrice: payload.oldPrice,
    StripQuantityInBox: payload.stripQuantityInBox,
    ImageFile: payload.imageFile,
    BrandId: payload.brandId,
    CategoryId: payload.categoryId,
  });
}

function brandForm(payload: BrandForm) {
  return toFormData({
    Name: payload.name,
    Slug: payload.slug,
    ImageFile: payload.imageFile,
  });
}

function bannerForm(payload: BannerForm) {
  return toFormData({
    Title: payload.title,
    Subtitle: payload.subtitle,
    ButtonText: payload.buttonText,
    ImageFile: payload.imageFile,
    CategoryId: payload.categoryId,
    BrandId: payload.brandId,
    DisplayOrder: payload.displayOrder,
    IsActive: payload.isActive,
  });
}

export async function getProducts(params: {
  pageNumber?: number;
  pageSize?: number;
} = {}): Promise<Paged<JsonRecord>> {
  return apiRequest<Paged<JsonRecord>>("/dashboard/Products", { params });
}

export async function getProduct(id: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/dashboard/Products/${id}`);
}

export async function createProduct(payload: ProductForm): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/dashboard/Products", {
    method: "POST",
    body: productForm(payload),
  });
}

export async function updateProduct(id: number, payload: ProductForm): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/dashboard/Products/${id}`, {
    method: "PUT",
    body: productForm(payload),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  await apiRequest<null>(`/dashboard/Products/${id}`, { method: "DELETE" });
}

export async function getBrands(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/dashboard/Brands");
}

export async function getBrand(id: number): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/dashboard/Brands/${id}`);
}

export async function createBrand(payload: BrandForm): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/dashboard/Brands", {
    method: "POST",
    body: brandForm(payload),
  });
}

export async function updateBrand(id: number, payload: BrandForm): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/dashboard/Brands/${id}`, {
    method: "PUT",
    body: brandForm(payload),
  });
}

export async function deleteBrand(id: number): Promise<void> {
  await apiRequest<null>(`/dashboard/Brands/${id}`, { method: "DELETE" });
}

export async function getBanners(): Promise<JsonRecord[]> {
  return apiRequest<JsonRecord[]>("/dashboard/Banners");
}

export async function createBanner(payload: BannerForm): Promise<JsonRecord> {
  return apiRequest<JsonRecord>("/dashboard/Banners", {
    method: "POST",
    body: bannerForm(payload),
  });
}

export async function updateBanner(id: number, payload: BannerForm): Promise<JsonRecord> {
  return apiRequest<JsonRecord>(`/dashboard/Banners/${id}`, {
    method: "PUT",
    body: bannerForm(payload),
  });
}

export async function deleteBanner(id: number): Promise<void> {
  await apiRequest<null>(`/dashboard/Banners/${id}`, { method: "DELETE" });
}
