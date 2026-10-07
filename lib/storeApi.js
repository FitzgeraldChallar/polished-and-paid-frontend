import { getCustomerToken } from "./auth";

const CONFIGURED_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

const GUEST_CART_STORAGE_KEY =
  "polishpay_guest_cart_id";

/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

function getApiUrl() {
  let url =
    CONFIGURED_API_URL.replace(
      /\/+$/,
      ""
    );

  if (typeof window !== "undefined") {
    const host =
      window.location.hostname;

    /*
     * Local development:
     *
     * Keep frontend/API hostname consistent so
     * Django session/cookie behavior remains reliable.
     */
    if (
      (host === "localhost" &&
        url.includes("127.0.0.1")) ||
      (host === "127.0.0.1" &&
        url.includes("localhost"))
    ) {
      url = url
        .replace(
          "127.0.0.1",
          host
        )
        .replace(
          "localhost",
          host
        );
    }
  }

  return url;
}

const API_ORIGIN = () =>
  getApiUrl().replace(
    /\/api\/?$/,
    ""
  );

function buildUrl(path = "") {
  if (!path) {
    return getApiUrl();
  }

  if (
    /^https?:\/\//i.test(path)
  ) {
    return path;
  }

  return `${getApiUrl()}${
    path.startsWith("/")
      ? path
      : `/${path}`
  }`;
}

/*
|--------------------------------------------------------------------------
| MEDIA
|--------------------------------------------------------------------------
*/

export function resolveMediaUrl(value) {
  if (!value) {
    return null;
  }

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN()}${value}`;
  }

  return `${API_ORIGIN()}/${value}`;
}

/*
|--------------------------------------------------------------------------
| GUEST CART ID
|--------------------------------------------------------------------------
|
| Production uses Cloudflare for the storefront and Railway for the API.
| Because those are different sites, a guest cart should not depend on
| Django's cross-site session cookie.
|
| Instead, every anonymous browser receives its own persistent cart ID.
|
|--------------------------------------------------------------------------
*/

function createGuestCartId() {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  if (
    typeof window.crypto !==
      "undefined" &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {
    return window.crypto.randomUUID();
  }

  /*
   * Fallback for older browsers/environments.
   */
  return (
    "guest-" +
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 12)
  );
}

function getGuestCartId() {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  let guestCartId =
    window.localStorage.getItem(
      GUEST_CART_STORAGE_KEY
    );

  if (!guestCartId) {
    guestCartId =
      createGuestCartId();

    if (guestCartId) {
      window.localStorage.setItem(
        GUEST_CART_STORAGE_KEY,
        guestCartId
      );
    }
  }

  return guestCartId || "";
}

/*
|--------------------------------------------------------------------------
| REQUEST
|--------------------------------------------------------------------------
*/

async function request(
  path,
  {
    method = "GET",
    body,
    token,
    headers = {},
    credentials = "include",
    signal,
  } = {}
) {
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (
    body !== undefined &&
    !(body instanceof FormData)
  ) {
    requestHeaders[
      "Content-Type"
    ] = "application/json";
  }

  /*
   * VERY IMPORTANT CART OWNERSHIP RULE
   *
   * token === undefined
   *   → use the currently logged-in customer token.
   *
   * token === ""
   *   → explicitly make an anonymous/guest request.
   *
   * token === "abc..."
   *   → explicitly use that customer's token.
   *
   * This distinction allows us to have a real guest cart
   * without accidentally attaching it to the logged-in
   * customer's account.
   */
  const effectiveToken =
    token !== undefined
      ? token
      : typeof window !== "undefined"
        ? getCustomerToken()
        : "";

  if (effectiveToken) {
    requestHeaders.Authorization =
      `Token ${effectiveToken}`;
  } else {
    /*
     * Anonymous/guest request.
     *
     * Send the persistent browser cart identifier instead
     * of relying on a cross-site Django session cookie.
     */
    const guestCartId =
      getGuestCartId();

    if (guestCartId) {
      requestHeaders[
        "X-Guest-Cart"
      ] = guestCartId;
    }
  }

  const response = await fetch(
    buildUrl(path),
    {
      method,
      headers: requestHeaders,
      credentials,
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
      signal,
      cache: "no-store",
    }
  );

  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    data =
      await response.json();
  } else {
    const text =
      await response.text();

    data = text || null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      Object.values(data || {})
        .flat()
        .find(
          (value) =>
            typeof value ===
            "string"
        ) ||
      `Request failed with status ${response.status}.`;

    const error =
      new Error(message);

    error.status =
      response.status;

    error.data = data;

    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| CART EVENTS
|--------------------------------------------------------------------------
*/

function emitCartUpdated(cart) {
  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "polishpay:cart-updated",
        {
          detail: cart,
        }
      )
    );
  }

  return cart;
}

/*
|--------------------------------------------------------------------------
| LIST HELPERS
|--------------------------------------------------------------------------
*/

export function unwrapList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.results
    )
  ) {
    return data.results;
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| PAGINATED API
|--------------------------------------------------------------------------
*/

async function requestAllPages(
  path,
  { signal } = {}
) {
  const all = [];

  let next = path;
  let safety = 0;

  while (
    next &&
    safety < 100
  ) {
    const data =
      await request(
        next,
        { signal }
      );

    all.push(
      ...unwrapList(data)
    );

    next =
      data?.next ||
      null;

    safety += 1;
  }

  return all;
}

/*
|--------------------------------------------------------------------------
| NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeImage(
  image
) {
  if (!image) {
    return null;
  }

  return resolveMediaUrl(
    image.image_url ||
      image.image ||
      null
  );
}

function normalizeCategory(
  category
) {
  return {
    ...category,

    image:
      resolveMediaUrl(
        category?.image_url ||
          category?.image ||
          null
      ),
  };
}

export function normalizeProduct(
  product
) {
  const images =
    Array.isArray(
      product?.images
    )
      ? product.images
          .map(
            normalizeImage
          )
          .filter(Boolean)
      : [];

  return {
    ...product,

    currentPrice:
      product?.current_price ??
      product?.sale_price ??
      product?.price ??
      0,

    current_price:
      product?.current_price ??
      product?.sale_price ??
      product?.price ??
      0,

    images,

    image:
      images[0] || null,
  };
}

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

export async function getCategories({
  signal,
} = {}) {
  const data =
    await requestAllPages(
      "/categories/",
      { signal }
    );

  return data.map(
    normalizeCategory
  );
}

export async function getCategory(
  slug,
  { signal } = {}
) {
  const data =
    await request(
      `/categories/${encodeURIComponent(
        slug
      )}/`,
      { signal }
    );

  return normalizeCategory(
    data
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

export async function getProducts({
  category,
  search,
  featured,
  isNew,
  bestseller,
  ordering,
  signal,
} = {}) {
  const params =
    new URLSearchParams();

  if (category) {
    params.set(
      "category",
      category
    );
  }

  if (search) {
    params.set(
      "search",
      search
    );
  }

  if (featured) {
    params.set(
      "featured",
      "true"
    );
  }

  if (isNew) {
    params.set(
      "new",
      "true"
    );
  }

  if (bestseller) {
    params.set(
      "bestseller",
      "true"
    );
  }

  if (ordering) {
    params.set(
      "ordering",
      ordering
    );
  }

  const query =
    params.toString();

  const data =
    await requestAllPages(
      `/products/${
        query
          ? `?${query}`
          : ""
      }`,
      { signal }
    );

  return data.map(
    normalizeProduct
  );
}

export async function getProduct(
  slug,
  { signal } = {}
) {
  const data =
    await request(
      `/products/${encodeURIComponent(
        slug
      )}/`,
      { signal }
    );

  return normalizeProduct(
    data
  );
}

export async function searchProducts(
  search,
  options = {}
) {
  return getProducts({
    ...options,
    search,
  });
}

export async function getFeaturedProducts(
  options = {}
) {
  return getProducts({
    ...options,
    featured: true,
  });
}

export async function getNewArrivals(
  options = {}
) {
  return getProducts({
    ...options,
    isNew: true,
  });
}

export async function getBestSellers(
  options = {}
) {
  return getProducts({
    ...options,
    bestseller: true,
  });
}

/*
|--------------------------------------------------------------------------
| CART
|--------------------------------------------------------------------------
|
| Guest:
|   The browser automatically supplies X-Guest-Cart.
|
| Logged-in customer:
|   The customer token identifies their persistent cart.
|
| Current authenticated customer:
|   getCart() automatically uses the customer token.
|
|--------------------------------------------------------------------------
*/

export async function getCart({
  token,
  signal,
} = {}) {
  return request(
    "/cart/",
    {
      token,
      signal,
    }
  );
}

export async function clearCart({
  token,
} = {}) {
  const cart =
    await request(
      "/cart/",
      {
        method: "DELETE",
        token,
      }
    );

  return emitCartUpdated(
    cart
  );
}

export async function addToCart(
  productId,
  quantity = 1,
  { token } = {}
) {
  const cart =
    await request(
      "/cart/items/",
      {
        method: "POST",
        token,

        body: {
          product_id:
            Number(productId),

          quantity:
            Number(quantity),
        },
      }
    );

  return emitCartUpdated(
    cart
  );
}

export async function updateCartItem(
  itemId,
  quantity,
  { token } = {}
) {
  const cart =
    await request(
      "/cart/items/",
      {
        method: "PATCH",
        token,

        body: {
          item_id:
            Number(itemId),

          quantity:
            Number(quantity),
        },
      }
    );

  return emitCartUpdated(
    cart
  );
}

export async function removeCartItem(
  itemId,
  { token } = {}
) {
  const cart =
    await request(
      "/cart/items/",
      {
        method: "DELETE",
        token,

        body: {
          item_id:
            Number(itemId),
        },
      }
    );

  return emitCartUpdated(
    cart
  );
}

/*
|--------------------------------------------------------------------------
| MERGE GUEST CART → CUSTOMER CART
|--------------------------------------------------------------------------
|
| This is used immediately after successful login/registration.
|
| Example:
|
| Guest:
|   Lip Gloss × 2
|   Body Oil × 1
|
| Customer already has:
|   Lip Gloss × 1
|
| Result:
|   Lip Gloss × 3
|   Body Oil × 1
|
|--------------------------------------------------------------------------
*/

export async function mergeGuestCartIntoCustomerCart(
  guestCart,
  customerToken
) {
  if (!customerToken) {
    return (
      guestCart || {
        items: [],
        subtotal: 0,
        item_count: 0,
      }
    );
  }

  const guestItems =
    Array.isArray(
      guestCart?.items
    )
      ? guestCart.items
      : [];

  /*
   * First retrieve the customer's
   * existing saved cart.
   */
  let customerCart =
    await getCart({
      token:
        customerToken,
    });

  /*
   * Merge every guest item into
   * the customer's existing cart.
   */
  for (
    const guestItem of guestItems
  ) {
    const productId =
      Number(
        guestItem?.product_id
      );

    const guestQuantity =
      Number(
        guestItem?.quantity ||
          0
      );

    if (
      !productId ||
      guestQuantity < 1
    ) {
      continue;
    }

    const existingItem =
      Array.isArray(
        customerCart?.items
      )
        ? customerCart.items.find(
            (item) =>
              Number(
                item?.product_id
              ) === productId
          )
        : null;

    if (
      existingItem?.id
    ) {
      customerCart =
        await updateCartItem(
          existingItem.id,

          Number(
            existingItem.quantity ||
              0
          ) + guestQuantity,

          {
            token:
              customerToken,
          }
        );
    } else {
      customerCart =
        await addToCart(
          productId,
          guestQuantity,
          {
            token:
              customerToken,
          }
        );
    }
  }

  /*
   * Clear ONLY the guest cart.
   *
   * Explicit token: ""
   *
   * This makes request() use the same persistent
   * browser guest-cart ID instead of the customer token.
   */
  if (guestItems.length) {
    await clearCart({
      token: "",
    });
  }

  /*
   * Retrieve the final saved customer cart.
   */
  const finalCart =
    await getCart({
      token:
        customerToken,
    });

  return emitCartUpdated(
    finalCart
  );
}

/*
|--------------------------------------------------------------------------
| WISHLIST
|--------------------------------------------------------------------------
|
| Guest:
|   The guest wishlist is handled by the storefront's localStorage flow.
|
| Logged-in customer:
|   The wishlist is persisted in Django against the customer's account.
|
|--------------------------------------------------------------------------
*/

function emitWishlistUpdated(
  wishlist
) {
  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent(
        "polishpay:wishlist-updated",
        {
          detail: wishlist,
        }
      )
    );
  }

  return wishlist;
}

export async function getWishlist(
  token
) {
  const data =
    await request(
      "/wishlist/",
      {
        token,
      }
    );

  /*
   * IMPORTANT:
   *
   * Do NOT emit "polishpay:wishlist-updated"
   * from a read operation.
   *
   * ProductCard listens for that event and reloads
   * the wishlist. Emitting it here would create:
   *
   * getWishlist()
   *   → emitWishlistUpdated()
   *   → ProductCard reload
   *   → getWishlist()
   *   → emitWishlistUpdated()
   *   → ...
   *
   * Mutation functions below are responsible for
   * notifying the rest of the storefront.
   */
  return unwrapList(data);
}

export async function isProductInWishlist(
  token,
  productId
) {
  if (!productId) {
    return false;
  }

  const wishlist =
    await getWishlist(token);

  return wishlist.some(
    (item) =>
      Number(
        item?.product_id
      ) === Number(productId)
  );
}

export async function addToWishlist(
  token,
  productId
) {
  const data =
    await request(
      "/wishlist/",
      {
        method: "POST",

        token,

        body: {
          product_id:
            Number(productId),
        },
      }
    );

  return emitWishlistUpdated(
    data
  );
}

export async function removeFromWishlist(
  token,
  productId
) {
  const data =
    await request(
      `/wishlist/${Number(
        productId
      )}/`,
      {
        method: "DELETE",

        token,
      }
    );

  return emitWishlistUpdated(
    data
  );
}

export async function toggleWishlist(
  token,
  productId,
  liked
) {
  if (liked) {
    return removeFromWishlist(
      token,
      productId
    );
  }

  return addToWishlist(
    token,
    productId
  );
}

/*
|--------------------------------------------------------------------------
| CUSTOMER AUTHENTICATION
|--------------------------------------------------------------------------
*/

export async function registerCustomer(
  payload
) {
  try {
    return await request(
      "/auth/register/",
      {
        method: "POST",
        body: payload,
      }
    );
  } catch (error) {
    /*
     * Some Django customer serializers
     * require username.
     *
     * Keep the public storefront form email-based
     * while supporting those serializers.
     */
    if (
      error?.status === 400 &&
      payload?.email &&
      !payload?.username
    ) {
      return request(
        "/auth/register/",
        {
          method: "POST",

          body: {
            ...payload,
            username:
              payload.email,
          },
        }
      );
    }

    throw error;
  }
}

export async function loginCustomer(
  email,
  password
) {
  const cleanEmail =
    String(
      email || ""
    )
      .trim()
      .toLowerCase();

  const cleanPassword =
    String(
      password || ""
    );

  try {
    return await request(
      "/auth/login/",
      {
        method: "POST",

        body: {
          email:
            cleanEmail,

          password:
            cleanPassword,
        },
      }
    );
  } catch (error) {
    /*
     * Support Django implementations
     * that authenticate with username.
     */
    if (
      error?.status === 400
    ) {
      return request(
        "/auth/login/",
        {
          method: "POST",

          body: {
            username:
              cleanEmail,

            password:
              cleanPassword,
          },
        }
      );
    }

    throw error;
  }
}

export async function logoutCustomer(
  token
) {
  return request(
    "/auth/logout/",
    {
      method: "POST",
      token,
    }
  );
}

export async function getCustomerProfile(
  token
) {
  return request(
    "/auth/profile/",
    {
      token,
    }
  );
}

export async function updateCustomerProfile(
  token,
  payload
) {
  return request(
    "/auth/profile/",
    {
      method: "PATCH",
      token,
      body: payload,
    }
  );
}

/*
|--------------------------------------------------------------------------
| ADDRESSES
|--------------------------------------------------------------------------
*/

export async function getAddresses(
  token
) {
  return unwrapList(
    await request(
      "/addresses/",
      {
        token,
      }
    )
  );
}

export async function createAddress(
  token,
  payload
) {
  return request(
    "/addresses/",
    {
      method: "POST",
      token,
      body: payload,
    }
  );
}

export async function updateAddress(
  token,
  id,
  payload
) {
  return request(
    `/addresses/${id}/`,
    {
      method: "PATCH",
      token,
      body: payload,
    }
  );
}

export async function deleteAddress(
  token,
  id
) {
  return request(
    `/addresses/${id}/`,
    {
      method: "DELETE",
      token,
    }
  );
}

/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
*/

export async function getOrders(
  token
) {
  return unwrapList(
    await request(
      "/orders/",
      {
        token,
      }
    )
  );
}

export async function getOrder(
  token,
  id
) {
  return request(
    `/orders/${id}/`,
    {
      token,
    }
  );
}

/*
|--------------------------------------------------------------------------
| CHECKOUT
|--------------------------------------------------------------------------
|
| Account checkout:
|   token = customer's token
|
| Guest checkout:
|   token = ""
|
| This allows a visitor to purchase without
| creating an account.
|--------------------------------------------------------------------------
*/

export async function createCheckoutOrder(
  payload,
  token
) {
  const order =
    await request(
      "/checkout/",
      {
        method: "POST",
        token,
        body: payload,
      }
    );

  /*
   * Checkout successfully consumed the active cart.
   */
  emitCartUpdated({
    id: null,

    items: [],

    subtotal: 0,

    item_count: 0,
  });

  return order;
}

/*
|--------------------------------------------------------------------------
| STRIPE
|--------------------------------------------------------------------------
*/

export async function createStripeCheckoutSession(
  orderId,
  token
) {
  return request(
    "/payments/stripe/create-checkout-session/",
    {
      method: "POST",

      token,

      body: {
        order_id:
          orderId,
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const storeApi = {
  getCategories,
  getCategory,

  getProducts,
  getProduct,
  searchProducts,

  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,

  getCart,
  clearCart,

  addToCart,
  updateCartItem,
  removeCartItem,

  mergeGuestCartIntoCustomerCart,

  getWishlist,
  isProductInWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,

  registerCustomer,
  loginCustomer,
  logoutCustomer,

  getCustomerProfile,
  updateCustomerProfile,

  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,

  getOrders,
  getOrder,

  createCheckoutOrder,

  createStripeCheckoutSession,
};

export default storeApi;