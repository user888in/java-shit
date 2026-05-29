"use client"

import { useState, useMemo } from "react"
import { PRODUCTS } from "@/lib/data"
import { DEFAULT_FILTERS, FilterState, applyFilters, paginateProducts, getBrands, ITEMS_PER_PAGE } from "@/lib/filters"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const BRANDS = getBrands(PRODUCTS)
const CATEGORIES = ["all", "electronics", "clothing", "books", "home"] as const

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const filteredProducts = useMemo(() => applyFilters(PRODUCTS, filters), [filters])
  const { items, totalElements, totalPages } = useMemo(
    () => paginateProducts(filteredProducts, page),
    [filteredProducts, page]
  )

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  return (
    <div className="w-full p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Products</h1>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-56 flex-shrink-0 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filters</span>
            <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground">
              Reset all
            </button>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-1.5">
            <Label>Search</Label>
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={filters.category}
              onValueChange={(val) => updateFilter("category", val as FilterState["category"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand */}
          <div className="flex flex-col gap-1.5">
            <Label>Brand</Label>
            <Select
              value={filters.brand || "all"}
              onValueChange={(val) => updateFilter("brand", val === "all" ? "" : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1.5">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(val) => updateFilter("sortBy", val as FilterState["sortBy"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* In Stock */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="instock"
              checked={filters.inStockOnly}
              onCheckedChange={(checked) => updateFilter("inStockOnly", checked === true)}
            />
            <Label htmlFor="instock">In stock only</Label>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Results count + sort info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {items.length} of {totalElements} products
            </span>
            <span>Page {page} of {totalPages || 1}</span>
          </div>

          {/* Product Grid */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {items.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <h3 className="font-medium leading-tight">{product.name}</h3>
                    </div>
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "In Stock" : "Sold Out"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-2 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-semibold">₹{product.price.toLocaleString()}</p>
                      {product.originalPrice > product.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-green-600 font-medium">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="w-8"
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

