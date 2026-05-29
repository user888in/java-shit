export interface Review {
  user: string
  rating: number
  comment: string
  date: string
}

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  originalPrice: number
  category: "electronics" | "clothing" | "books" | "home"
  brand: string
  rating: number
  reviewCount: number
  inStock: boolean
  tags: string[]
  reviews: Review[]
  specs: Record<string, string>   // key-value pairs, e.g. { "RAM": "16GB" }
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "MacBook Pro 14",
    slug: "macbook-pro-14",
    price: 149999,
    originalPrice: 179999,
    category: "electronics",
    brand: "Apple",
    rating: 4.8,
    reviewCount: 2341,
    inStock: true,
    tags: ["laptop", "apple", "professional"],
    specs: { RAM: "16GB", Storage: "512GB", Chip: "M3 Pro" },
    reviews: [
      { user: "Rahul K", rating: 5, comment: "Absolute beast of a machine.", date: "2024-11-01" },
      { user: "Priya M", rating: 4, comment: "Great but expensive.", date: "2024-10-15" },
    ],
  },
  {
    id: 2,
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    price: 24999,
    originalPrice: 29999,
    category: "electronics",
    brand: "Sony",
    rating: 4.7,
    reviewCount: 5892,
    inStock: true,
    tags: ["headphones", "noise-cancelling", "wireless"],
    specs: { "Battery Life": "30hrs", "Driver Size": "30mm", Connectivity: "Bluetooth 5.2" },
    reviews: [
      { user: "Amit S", rating: 5, comment: "Best ANC headphones period.", date: "2024-11-10" },
    ],
  },
  {
    id: 3,
    name: "The Pragmatic Programmer",
    slug: "pragmatic-programmer",
    price: 2499,
    originalPrice: 2999,
    category: "books",
    brand: "Addison-Wesley",
    rating: 4.9,
    reviewCount: 12004,
    inStock: true,
    tags: ["programming", "career", "software"],
    specs: { Pages: "352", Edition: "20th Anniversary", Format: "Hardcover" },
    reviews: [
      { user: "Dev R", rating: 5, comment: "Every developer must read this.", date: "2024-09-20" },
    ],
  },
  {
    id: 4,
    name: "Samsung 4K Monitor 32\"",
    slug: "samsung-4k-monitor-32",
    price: 34999,
    originalPrice: 42999,
    category: "electronics",
    brand: "Samsung",
    rating: 4.5,
    reviewCount: 876,
    inStock: false,
    tags: ["monitor", "4k", "display"],
    specs: { Resolution: "3840x2160", "Refresh Rate": "144Hz", Panel: "IPS" },
    reviews: [],
  },
  {
    id: 5,
    name: "Levi's 511 Slim Fit Jeans",
    slug: "levis-511-slim",
    price: 3499,
    originalPrice: 4999,
    category: "clothing",
    brand: "Levi's",
    rating: 4.3,
    reviewCount: 3201,
    inStock: true,
    tags: ["jeans", "casual", "slim"],
    specs: { Fit: "Slim", Material: "99% Cotton", Rise: "Mid" },
    reviews: [
      { user: "Neha T", rating: 4, comment: "Good fit, true to size.", date: "2024-10-05" },
    ],
  },
  {
    id: 6,
    name: "Dyson V15 Detect",
    slug: "dyson-v15-detect",
    price: 52999,
    originalPrice: 59999,
    category: "home",
    brand: "Dyson",
    rating: 4.6,
    reviewCount: 421,
    inStock: true,
    tags: ["vacuum", "cordless", "cleaning"],
    specs: { "Battery Life": "60mins", "Suction Power": "240 AW", Weight: "3.1kg" },
    reviews: [],
  },
  {
    id: 7,
    name: "iPad Air M2",
    slug: "ipad-air-m2",
    price: 59999,
    originalPrice: 64999,
    category: "electronics",
    brand: "Apple",
    rating: 4.7,
    reviewCount: 1893,
    inStock: true,
    tags: ["tablet", "apple", "portable"],
    specs: { Display: "11-inch Liquid Retina", Chip: "M2", Storage: "256GB" },
    reviews: [
      { user: "Karan L", rating: 5, comment: "Perfect for drawing and notes.", date: "2024-11-02" },
    ],
  },
  {
    id: 8,
    name: "Clean Code",
    slug: "clean-code",
    price: 1999,
    originalPrice: 2499,
    category: "books",
    brand: "Prentice Hall",
    rating: 4.6,
    reviewCount: 8732,
    inStock: false,
    tags: ["programming", "software", "best-practices"],
    specs: { Pages: "431", Edition: "1st", Format: "Paperback" },
    reviews: [],
  },
  {
    id: 9,
    name: "Nike Air Max 270",
    slug: "nike-air-max-270",
    price: 8999,
    originalPrice: 11999,
    category: "clothing",
    brand: "Nike",
    rating: 4.4,
    reviewCount: 6723,
    inStock: true,
    tags: ["shoes", "sneakers", "running"],
    specs: { Sole: "Air Max unit", Upper: "Mesh + Synthetic", Closure: "Lace-up" },
    reviews: [
      { user: "Sanya B", rating: 5, comment: "Super comfortable for all day wear.", date: "2024-10-28" },
    ],
  },
  {
    id: 10,
    name: "IKEA BEKANT Desk",
    slug: "ikea-bekant-desk",
    price: 12999,
    originalPrice: 12999,
    category: "home",
    brand: "IKEA",
    rating: 4.1,
    reviewCount: 2109,
    inStock: true,
    tags: ["desk", "office", "furniture"],
    specs: { Dimensions: "160x80cm", Material: "Melamine", Color: "White" },
    reviews: [],
  },
  {
    id: 11,
    name: "Logitech MX Master 3S",
    slug: "logitech-mx-master-3s",
    price: 8999,
    originalPrice: 10999,
    category: "electronics",
    brand: "Logitech",
    rating: 4.8,
    reviewCount: 4521,
    inStock: true,
    tags: ["mouse", "wireless", "productivity"],
    specs: { DPI: "200-8000", Battery: "70 days", Connectivity: "Bluetooth + USB" },
    reviews: [
      { user: "Vikram P", rating: 5, comment: "The best mouse I've ever used.", date: "2024-11-08" },
    ],
  },
  {
    id: 12,
    name: "Atomic Habits",
    slug: "atomic-habits",
    price: 499,
    originalPrice: 799,
    category: "books",
    brand: "Penguin",
    rating: 4.8,
    reviewCount: 45231,
    inStock: true,
    tags: ["self-help", "habits", "productivity"],
    specs: { Pages: "320", Edition: "1st", Format: "Paperback" },
    reviews: [
      { user: "Rhea G", rating: 5, comment: "Life changing read.", date: "2024-08-15" },
    ],
  },
]
