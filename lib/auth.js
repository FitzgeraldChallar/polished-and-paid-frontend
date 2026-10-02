const TOKEN_KEY = "polishpay_customer_token";
const USER_KEY = "polishpay_customer_user";

export function getCustomerToken() {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setCustomerSession(result) {
  if (typeof window === "undefined") return;

  const token =
    result?.token ||
    result?.key ||
    result?.access_token ||
    result?.access ||
    "";

  const user =
    result?.user ||
    result?.customer ||
    null;

  if (token) {
    window.localStorage.setItem(
      TOKEN_KEY,
      token
    );
  }

  if (user) {
    window.localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  }

  window.dispatchEvent(
    new Event("polishpay:auth-updated")
  );
}

export function getStoredCustomer() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value =
      window.localStorage.getItem(USER_KEY);

    return value
      ? JSON.parse(value)
      : null;
  } catch {
    return null;
  }
}

export function clearCustomerSession() {
  if (typeof window === "undefined") {
    return;
  }

  /*
   * IMPORTANT
   *
   * We intentionally DO NOT delete the customer's
   * server-side cart here.
   *
   * The customer's saved cart belongs to their account
   * and must still be available when they log back in.
   *
   * We only remove the authentication credentials and
   * tell the currently mounted storefront that there is
   * no longer an authenticated cart to display.
   */

  window.localStorage.removeItem(
    TOKEN_KEY
  );

  window.localStorage.removeItem(
    USER_KEY
  );

  /*
   * Immediately clear the ACTIVE cart displayed by
   * Header / Cart / other mounted components.
   *
   * This prevents the previous customer's products from
   * remaining visible after logout.
   *
   * The actual saved customer cart remains untouched
   * on the Django backend.
   */
  window.dispatchEvent(
    new CustomEvent(
      "polishpay:cart-updated",
      {
        detail: {
          items: [],
          subtotal: 0,
          item_count: 0,
        },
      }
    )
  );

  /*
   * Tell all authenticated UI components that the
   * customer session has changed.
   */
  window.dispatchEvent(
    new Event("polishpay:auth-updated")
  );
}

export function setStoredCustomer(user) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(
      USER_KEY
    );
  } else {
    window.localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  }

  window.dispatchEvent(
    new Event("polishpay:auth-updated")
  );
}