import { Product } from "./data";

export interface FilterState {
  search: string;
  category: Product["category"] | "all";
  brand: string;
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sortBy: "price-asc" | "price-desc" | "rating" | "reviews";
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "all",
  brand: "",
  minPrice: 0,
  maxPrice: 2000000,
  inStockOnly: false,
  sortBy: "rating",
};

export const ITEMS_PER_PAGE = 4;
export function applyFilters(
  products: Product[],
  filters: FilterState,
): Product[] {
  let result = [...products];
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.includes(q)),
    );
  }
  if (filters.category !== "all") {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.brand) {
    result = result.filter((p) => p.brand === filters.brand);
  }
  result = result.filter(
    (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice,
  );
  if (filters.inStockOnly) {
    result = result.filter((p) => p.inStock);
  }
  result.sort((a, b) => {
    if (filters.sortBy === "price-asc") return a.price - b.price;
    if (filters.sortBy === "price-desc") return b.price - a.price;
    if (filters.sortBy === "rating") return b.rating - a.rating;
    if (filters.sortBy === "reviews") return b.reviewCount - a.reviewCount;
    return 0;
  });
  return result;
}

export function paginateProducts(products: Product[], page: number) {
  const totalElements = products.length;
  const totalPages = Math.ceil(totalElements / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const items = products.slice(start, start + ITEMS_PER_PAGE);
  return { items, totalElements, totalPages, currentPage: page };
}

export function getBrands(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.brand))].sort();
}
