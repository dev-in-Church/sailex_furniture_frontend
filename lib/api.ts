const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  token?: string;
  sessionId?: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, sessionId, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (sessionId) {
    headers["x-session-id"] = sessionId;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Products
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  stock_quantity: number;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  images: string[];
  specifications: Record<string, string>;
  featured: boolean;
  status: string;
  created_at: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleProductResponse {
  product: Product;
  relatedProducts: Product[];
}

export const getProducts = (params?: Record<string, string>) => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<ProductsResponse>(`/products${query}`);
};

export const getFeaturedProducts = (limit = 6) => {
  return fetchAPI<{ products: Product[] }>(`/products/featured?limit=${limit}`);
};

export const getProduct = (slug: string) => {
  return fetchAPI<SingleProductResponse>(`/products/${slug}`);
};

// Categories
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  parent_name: string | null;
  sort_order: number;
  product_count: number;
  children?: Category[];
}

export const getCategories = () => {
  return fetchAPI<{ categories: Category[]; all: Category[] }>("/categories");
};

export const getCategory = (slug: string) => {
  return fetchAPI<{ category: Category; subcategories: Category[] }>(
    `/categories/${slug}`,
  );
};

export const getCategoryProducts = (
  slug: string,
  params?: Record<string, string>,
) => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<ProductsResponse>(`/categories/${slug}/products${query}`);
};

// Cart
export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: string;
  quantity: number;
  images: string[];
  stock_quantity: number;
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export const getCart = (sessionId?: string, token?: string) => {
  return fetchAPI<CartResponse>("/cart", { sessionId, token });
};

export const addToCart = (
  productId: string,
  quantity: number,
  sessionId?: string,
  token?: string,
) => {
  return fetchAPI<{ item: CartItem; sessionId?: string }>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
    sessionId,
    token,
  });
};

export const updateCartItem = (
  itemId: string,
  quantity: number,
  sessionId?: string,
  token?: string,
) => {
  return fetchAPI<{ item: CartItem }>(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
    sessionId,
    token,
  });
};

export const removeCartItem = (
  itemId: string,
  sessionId?: string,
  token?: string,
) => {
  return fetchAPI<{ message: string }>(`/cart/items/${itemId}`, {
    method: "DELETE",
    sessionId,
    token,
  });
};

export const mergeCart = (sessionId: string, token: string) => {
  return fetchAPI<{ message: string }>("/cart/merge", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
    token,
  });
};

// Orders
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  county: string;
  postalCode?: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  email: string;
  phone: string | null;
  shipping_address: ShippingAddress;
  billing_address: ShippingAddress | null;
  subtotal: string;
  shipping_cost: string;
  tax: string;
  total: string;
  status: string;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  product_id: string | null;
  name: string;
  price: string;
  quantity: number;
  slug?: string;
  images?: string[];
}

export interface Payment {
  id: string;
  method: string;
  transaction_id: string | null;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

export const createOrder = (
  data: {
    email: string;
    phone?: string;
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress;
    paymentMethod: "mpesa" | "stripe";
    notes?: string;
  },
  sessionId?: string,
  token?: string,
) => {
  return fetchAPI<{ order: Order }>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
    sessionId,
    token,
  });
};

export const getOrders = (token: string, params?: Record<string, string>) => {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<{ orders: Order[]; pagination: any }>(`/orders${query}`, {
    token,
  });
};

export const getOrder = (identifier: string, token?: string) => {
  return fetchAPI<{ order: Order }>(`/orders/${identifier}`, { token });
};

// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const register = (data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) => {
  return fetchAPI<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const login = (email: string, password: string) => {
  return fetchAPI<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getMe = (token: string) => {
  return fetchAPI<{ user: User }>("/auth/me", { token });
};

// Payments
export const initiateMpesaPayment = (orderId: string, phoneNumber: string) => {
  return fetchAPI<{
    success: boolean;
    checkoutRequestId: string;
    message: string;
  }>("/payments/mpesa/stkpush", {
    method: "POST",
    body: JSON.stringify({ orderId, phoneNumber }),
  });
};

export const checkMpesaStatus = (orderId: string) => {
  return fetchAPI<{ status: string; transactionId: string | null }>(
    `/payments/mpesa/status/${orderId}`,
  );
};

export const createStripeSession = (orderId: string) => {
  return fetchAPI<{ sessionId: string; url: string }>(
    "/payments/stripe/create-session",
    {
      method: "POST",
      body: JSON.stringify({ orderId }),
    },
  );
};

// Admin API
export const admin = {
  getDashboardStats: (token: string) =>
    fetchAPI<any>("/admin/dashboard", { token }),

  getOrders: (token: string, params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ orders: any[]; pagination: any }>(
      `/admin/orders${query}`,
      { token },
    );
  },

  updateOrderStatus: (token: string, orderId: number, status: string) =>
    fetchAPI<any>(`/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      token,
    }),

  getCustomers: (token: string, params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ customers: any[]; pagination: any }>(
      `/admin/customers${query}`,
      { token },
    );
  },

  createProduct: (token: string, data: any) =>
    fetchAPI<{ product: any }>("/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  updateProduct: (token: string, id: number, data: any) =>
    fetchAPI<{ product: any }>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  deleteProduct: (token: string, id: number) =>
    fetchAPI<{ message: string }>(`/admin/products/${id}`, {
      method: "DELETE",
      token,
    }),

  createCategory: (token: string, data: any) =>
    fetchAPI<{ category: any }>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  updateCategory: (token: string, id: number, data: any) =>
    fetchAPI<{ category: any }>(`/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  deleteCategory: (token: string, id: number) =>
    fetchAPI<{ message: string }>(`/admin/categories/${id}`, {
      method: "DELETE",
      token,
    }),
};

// Namespaced API for cleaner imports
export const api = {
  products: {
    getAll: getProducts,
    getFeatured: getFeaturedProducts,
    getOne: getProduct,
  },
  categories: {
    getAll: async () => {
      const result = await getCategories();
      return result.all || result.categories || [];
    },
    getOne: getCategory,
    getProducts: getCategoryProducts,
  },
  cart: {
    get: getCart,
    addItem: addToCart,
    updateItem: updateCartItem,
    removeItem: removeCartItem,
    merge: mergeCart,
  },
  orders: {
    create: createOrder,
    getAll: getOrders,
    getOne: getOrder,
  },
  auth: {
    register,
    login,
    getMe,
  },
  payments: {
    mpesa: {
      initiate: initiateMpesaPayment,
      checkStatus: checkMpesaStatus,
    },
    stripe: {
      createSession: createStripeSession,
    },
  },
  admin,
};
