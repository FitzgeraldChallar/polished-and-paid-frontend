"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import Header from "../../components/storefront/Header";
import Footer from "../../components/storefront/Footer";
import {
  clearCart,
  getCart,
  removeCartItem,
  resolveMediaUrl,
  updateCartItem,
} from "../../lib/storeApi";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function itemImage(item) {
  return resolveMediaUrl(
    item?.image ||
      item?.image_url ||
      item?.product_image ||
      null
  );
}

function EmptyCart() {
  return (
    <section className="empty-cart">
      <div className="empty-cart-icon">
        <ShoppingBag size={27} strokeWidth={1.25} />
      </div>

      <span className="empty-cart-eyebrow">Your bag is waiting</span>

      <h2>
        Nothing here
        <br />
        <em>yet.</em>
      </h2>

      <p>
        Your favorite beauty, wellness and lifestyle finds will appear here
        once you add them to your bag.
      </p>

      <a href="/shop" className="cart-shop-button">
        <span>Continue Shopping</span>
        <ArrowRight size={16} strokeWidth={1.4} />
      </a>
    </section>
  );
}

function LoadingCart() {
  return (
    <div className="cart-loading">
      <div className="loading-heading" />

      {[1, 2, 3].map((item) => (
        <div className="loading-row" key={item}>
          <div className="loading-image" />

          <div className="loading-copy">
            <span />
            <strong />
            <i />
          </div>

          <div className="loading-price" />
        </div>
      ))}
    </div>
  );
}

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCart = useCallback(async () => {
    try {
      setError("");

      const data = await getCart();

      setCart(
        data || {
          items: [],
          subtotal: 0,
          item_count: 0,
        }
      );
    } catch (requestError) {
      console.error("Cart loading error:", requestError);

      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't load your bag."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();

    const onCartUpdate = (event) => {
      setCart(
        event.detail || {
          items: [],
          subtotal: 0,
          item_count: 0,
        }
      );

      setLoading(false);
    };

    const onAuthUpdate = () => {
      // Authentication changes already emit the correct cart snapshot.
      // Do not immediately call getCart() here: doing so on logout could
      // accidentally rehydrate the just-signed-out customer's bag.
      setCart((current) =>
        current || {
          items: [],
          subtotal: 0,
          item_count: 0,
        }
      );
    };

    window.addEventListener(
      "polishpay:cart-updated",
      onCartUpdate
    );

    window.addEventListener(
      "polishpay:auth-updated",
      onAuthUpdate
    );

    return () => {
      window.removeEventListener(
        "polishpay:cart-updated",
        onCartUpdate
      );

      window.removeEventListener(
        "polishpay:auth-updated",
        onAuthUpdate
      );
    };
  }, [loadCart]);

  const items = Array.isArray(cart?.items) ? cart.items : [];

  const subtotal = Number(cart?.subtotal || 0);

  const itemCount = Number(
    cart?.item_count ||
      items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      )
  );

  const totalLabel = useMemo(
    () => money(subtotal),
    [subtotal]
  );

  async function changeQuantity(item, quantity) {
    if (
      !item?.id ||
      quantity < 1 ||
      busyItem === item.id
    ) {
      return;
    }

    setBusyItem(item.id);
    setError("");

    try {
      const updated = await updateCartItem(
        item.id,
        quantity
      );

      setCart(updated);
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't update that item."
      );
    } finally {
      setBusyItem(null);
    }
  }

  async function removeItem(item) {
    if (!item?.id || busyItem === item.id) {
      return;
    }

    setBusyItem(item.id);
    setError("");

    try {
      const updated = await removeCartItem(item.id);

      setCart(updated);

      setNotice(
        `${item.name} was removed from your bag.`
      );

      window.setTimeout(
        () => setNotice(""),
        2600
      );
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't remove that item."
      );
    } finally {
      setBusyItem(null);
    }
  }

  async function handleClear() {
    if (!items.length || clearing) {
      return;
    }

    setClearing(true);
    setError("");

    try {
      const updated = await clearCart();

      setCart(updated);

      setNotice("Your bag has been cleared.");

      window.setTimeout(
        () => setNotice(""),
        2600
      );
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't clear your bag."
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <Header />

      <main className="cart-page">
        <section className="cart-hero">
          <div className="cart-container cart-hero-inner">
            <div>
              <span className="cart-eyebrow">
                Polish & Pay
              </span>

              <h1>
                Your
                <br />
                <em>shopping bag.</em>
              </h1>

              <p>
                Beautiful finds, thoughtfully chosen and
                almost yours.
              </p>
            </div>

            <div className="cart-script">
              A little
              <br />
              something lovely.
              <span>♡</span>
            </div>
          </div>
        </section>

        <section className="cart-content">
          <div className="cart-container">
            {error && (
              <div className="cart-message cart-error">
                <X size={15} />

                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    loadCart();
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {notice && (
              <div className="cart-message cart-success">
                <Check size={15} />

                <span>{notice}</span>
              </div>
            )}

            {loading ? (
              <LoadingCart />
            ) : !items.length ? (
              <EmptyCart />
            ) : (
              <div className="cart-grid">
                <section className="cart-products">
                  <div className="cart-products-heading">
                    <div>
                      <span>YOUR SELECTION</span>

                      <h2>
                        {itemCount}{" "}
                        {itemCount === 1
                          ? "item"
                          : "items"}
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="clear-button"
                      disabled={clearing}
                      onClick={handleClear}
                    >
                      {clearing ? (
                        <LoaderCircle
                          size={13}
                          className="spin"
                        />
                      ) : (
                        <Trash2 size={13} />
                      )}

                      Clear bag
                    </button>
                  </div>

                  <div className="cart-list">
                    {items.map((item) => {
                      const busy =
                        busyItem === item.id;

                      const image = itemImage(item);

                      return (
                        <article
                          className="cart-product"
                          key={item.id}
                        >
                          <a
                            href={`/product/${item.product_id}`}
                            className="cart-product-image-wrap"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={
                                  item.name ||
                                  "Product"
                                }
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    "none";

                                  const parent =
                                    event.currentTarget
                                      .parentElement;

                                  if (
                                    parent &&
                                    !parent.querySelector(
                                      ".cart-product-image-fallback"
                                    )
                                  ) {
                                    const fallback =
                                      document.createElement(
                                        "div"
                                      );

                                    fallback.className =
                                      "cart-product-placeholder cart-product-image-fallback";

                                    fallback.innerHTML =
                                      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l3 5v15H3V7l3-5Z"/><path d="M3 7h18"/><path d="M8 11a4 4 0 0 0 8 0"/></svg>';

                                    parent.appendChild(
                                      fallback
                                    );
                                  }
                                }}
                              />
                            ) : (
                              <div className="cart-product-placeholder">
                                <ShoppingBag
                                  size={26}
                                  strokeWidth={1.1}
                                />
                              </div>
                            )}

                            {busy && (
                              <div className="cart-product-busy">
                                <LoaderCircle
                                  size={20}
                                  className="spin"
                                />
                              </div>
                            )}
                          </a>

                          <div className="cart-product-details">
                            <span className="cart-product-category">
                              POLISH & PAY
                            </span>

                            <a
                              href={`/product/${item.product_id}`}
                              className="cart-product-name"
                            >
                              {item.name}
                            </a>

                            {item.sku && (
                              <span className="cart-product-sku">
                                SKU · {item.sku}
                              </span>
                            )}

                            <div className="cart-product-controls">
                              <div className="quantity-control">
                                <button
                                  type="button"
                                  disabled={
                                    busy ||
                                    Number(
                                      item.quantity
                                    ) <= 1
                                  }
                                  onClick={() =>
                                    changeQuantity(
                                      item,
                                      Number(
                                        item.quantity
                                      ) - 1
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} />
                                </button>

                                <span>
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    changeQuantity(
                                      item,
                                      Number(
                                        item.quantity
                                      ) + 1
                                    )
                                  }
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <button
                                type="button"
                                className="remove-button"
                                disabled={busy}
                                onClick={() =>
                                  removeItem(item)
                                }
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="cart-product-price">
                            <strong>
                              {money(item.line_total)}
                            </strong>

                            {Number(item.quantity) >
                              1 && (
                              <span>
                                {money(
                                  item.unit_price
                                )}{" "}
                                each
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <a
                    href="/shop"
                    className="continue-shopping"
                  >
                    <ArrowLeft size={15} />
                    Continue Shopping
                  </a>
                </section>

                <aside className="summary-wrap">
                  <div className="summary-card">
                    <div className="summary-topline">
                      <span>YOUR ORDER</span>
                      <Sparkles size={16} />
                    </div>

                    <h2>
                      Order
                      <br />
                      <em>summary.</em>
                    </h2>

                    <div className="summary-line">
                      <span>Subtotal</span>
                      <strong>{totalLabel}</strong>
                    </div>

                    <div className="summary-line">
                      <span>Shipping</span>
                      <small>
                        Calculated at checkout
                      </small>
                    </div>

                    <div className="summary-divider" />

                    <div className="summary-total">
                      <span>Estimated total</span>
                      <strong>{totalLabel}</strong>
                    </div>

                    <p className="summary-note">
                      Taxes and shipping will be
                      calculated during checkout.
                    </p>

                    <a
                      href="/checkout"
                      className="checkout-button"
                    >
                      Proceed to Checkout
                      <ArrowRight size={17} />
                    </a>

                    <div className="secure-note">
                      <Check size={14} />
                      Secure checkout powered by Stripe
                    </div>
                  </div>

                  <div className="curated-note">
                    <div>
                      <ShoppingBag
                        size={17}
                        strokeWidth={1.15}
                      />
                    </div>

                    <section>
                      <strong>
                        Curated with love
                      </strong>

                      <p>
                        Beautiful things,
                        thoughtfully chosen for your
                        everyday.
                      </p>
                    </section>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .cart-page {
          min-height: 100vh;
          background: #fffaf8;
          color: #211b1c;
        }

        .cart-container {
          width: min(1280px, calc(100% - 72px));
          margin: 0 auto;
        }

        .cart-hero {
          background: linear-gradient(
            105deg,
            #f7e3df,
            #fdf3f0 54%,
            #ead1ca
          );
          border-bottom: 1px solid rgba(33, 27, 28, 0.07);
        }

        .cart-hero-inner {
          min-height: 315px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 58px 0;
        }

        .cart-eyebrow {
          display: block;
          margin-bottom: 14px;
          color: #b86676;
          font: 700 9px/1 "DM Sans", sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .cart-hero h1 {
          margin: 0;
          font: 500 clamp(57px, 6vw, 84px) / 0.83
            "Playfair Display", Georgia, serif;
          letter-spacing: -0.065em;
        }

        .cart-hero h1 em {
          color: #b86676;
          font-style: italic;
        }

        .cart-hero p {
          margin: 20px 0 0;
          color: #746568;
          font: 400 12px/1.7 "DM Sans", sans-serif;
        }

        .cart-script {
          margin-right: 70px;
          color: #fff;
          font: 400 47px/0.8 "Sacramento", cursive;
          text-align: center;
          transform: rotate(-5deg);
        }

        .cart-script span {
          display: block;
          margin-top: 13px;
          font: 400 22px/1 "DM Sans", sans-serif;
        }

        .cart-content {
          padding: 64px 0 110px;
        }

        .cart-message {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 15px;
          margin-bottom: 22px;
          font: 500 10px/1.4 "DM Sans", sans-serif;
        }

        .cart-message span {
          flex: 1;
        }

        .cart-error {
          background: #fae7e4;
          color: #8e4d59;
          border: 1px solid rgba(184, 102, 118, 0.14);
        }

        .cart-success {
          background: #f4eee9;
          color: #65575a;
          border: 1px solid rgba(33, 27, 28, 0.06);
        }

        .cart-error button {
          border: 0;
          background: transparent;
          color: #8e4d59;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .cart-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 390px;
          gap: 62px;
          align-items: start;
        }

        .cart-products-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(33, 27, 28, 0.1);
        }

        .cart-products-heading span {
          display: block;
          margin-bottom: 7px;
          color: #b86676;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.18em;
        }

        .cart-products-heading h2 {
          margin: 0;
          font: 500 35px/1 "Playfair Display", Georgia, serif;
          letter-spacing: -0.045em;
        }

        .clear-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #8e7f82;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .clear-button:hover {
          color: #b86676;
        }

        .cart-list {
          border-bottom: 1px solid rgba(33, 27, 28, 0.1);
        }

        .cart-product {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr) 110px;
          gap: 23px;
          padding: 24px 0;
          border-bottom: 1px solid rgba(33, 27, 28, 0.07);
        }

        .cart-product:last-child {
          border-bottom: 0;
        }

        .cart-product-image-wrap {
          position: relative;
          width: 150px;
          height: 180px;
          display: block;
          overflow: hidden;
          background: #f0e2de;
        }

        .cart-product-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease;
        }

        .cart-product-image-wrap:hover img {
          transform: scale(1.035);
        }

        .cart-product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c49da4;
          background: linear-gradient(
            145deg,
            #f4e4e0,
            #ead1cb
          );
        }

        .cart-product-busy {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 250, 248, 0.65);
          color: #b86676;
        }

        .cart-product-details {
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding-top: 4px;
        }

        .cart-product-category {
          margin-bottom: 8px;
          color: #b86676;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.16em;
        }

        .cart-product-name {
          color: #211b1c;
          font: 500 24px/1.05 "Playfair Display",
            Georgia, serif;
          letter-spacing: -0.025em;
          text-decoration: none;
        }

        .cart-product-name:hover {
          color: #b86676;
        }

        .cart-product-sku {
          margin-top: 8px;
          color: #a39497;
          font: 400 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.08em;
        }

        .cart-product-controls {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: auto;
          padding-top: 20px;
        }

        .quantity-control {
          width: 102px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(33, 27, 28, 0.13);
          background: #fff;
        }

        .quantity-control button {
          width: 31px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #5e5153;
          cursor: pointer;
        }

        .quantity-control button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .quantity-control span {
          font: 700 10px/1 "DM Sans", sans-serif;
        }

        .remove-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #95878a;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .remove-button:hover {
          color: #b86676;
        }

        .cart-product-price {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding-top: 5px;
        }

        .cart-product-price strong {
          font: 700 12px/1 "DM Sans", sans-serif;
        }

        .cart-product-price span {
          margin-top: 6px;
          color: #a39497;
          font: 400 8px/1 "DM Sans", sans-serif;
        }

        .continue-shopping {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 24px;
          color: #211b1c;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .continue-shopping:hover {
          color: #b86676;
        }

        .summary-wrap {
          position: sticky;
          top: 102px;
        }

        .summary-card {
          padding: 32px;
          background: #f5e0dc;
        }

        .summary-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #b86676;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.18em;
        }

        .summary-card h2 {
          margin: 15px 0 30px;
          font: 500 43px/0.9 "Playfair Display",
            Georgia, serif;
          letter-spacing: -0.05em;
        }

        .summary-card h2 em {
          color: #b86676;
          font-style: italic;
        }

        .summary-line {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 15px;
          font: 400 10px/1.4 "DM Sans", sans-serif;
        }

        .summary-line strong {
          font-weight: 700;
        }

        .summary-line small {
          max-width: 145px;
          color: #9a8588;
          font-size: 8px;
          text-align: right;
        }

        .summary-divider {
          height: 1px;
          margin: 25px 0;
          background: rgba(33, 27, 28, 0.1);
        }

        .summary-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .summary-total span {
          font: 700 9px/1 "DM Sans", sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .summary-total strong {
          font: 500 27px/1 "Playfair Display",
            Georgia, serif;
        }

        .summary-note {
          margin: 12px 0 23px;
          color: #806f72;
          font: 400 8px/1.65 "DM Sans", sans-serif;
        }

        .checkout-button {
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 0 18px;
          background: #211b1c;
          color: #fff;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .checkout-button:hover {
          background: #b86676;
          transform: translateY(-1px);
        }

        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 16px;
          color: #8b777a;
          font: 400 8px/1 "DM Sans", sans-serif;
        }

        .secure-note svg {
          color: #b86676;
        }

        .curated-note {
          display: flex;
          gap: 13px;
          margin-top: 13px;
          padding: 17px;
          background: #fff;
          border: 1px solid rgba(33, 27, 28, 0.07);
        }

        .curated-note > div {
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5e1dd;
          color: #b86676;
        }

        .curated-note strong {
          display: block;
          margin-bottom: 5px;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .curated-note p {
          margin: 0;
          color: #8b7a7d;
          font: 400 8px/1.6 "DM Sans", sans-serif;
        }

        .empty-cart {
          min-height: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 25px;
          text-align: center;
          background: linear-gradient(
            145deg,
            #f7e3df,
            #fffaf8
          );
          border: 1px solid rgba(33, 27, 28, 0.07);
        }

        .empty-cart-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border-radius: 50%;
          background: #fff;
          color: #b86676;
          box-shadow: 0 12px 30px rgba(33, 27, 28, 0.07);
        }

        .empty-cart-eyebrow {
          color: #b86676;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .empty-cart h2 {
          margin: 13px 0 0;
          color: #211b1c;
          font: 500 55px/0.9 "Playfair Display",
            Georgia, serif;
          letter-spacing: -0.055em;
        }

        .empty-cart h2 em {
          color: #b86676;
          font-style: italic;
        }

        .empty-cart p {
          max-width: 420px;
          margin: 18px 0 27px;
          color: #78696c;
          font: 400 11px/1.7 "DM Sans", sans-serif;
        }

        .cart-shop-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-height: 51px;
          padding: 0 23px;
          background: #211b1c;
          color: #fff;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .cart-shop-button:hover {
          background: #b86676;
        }

        .cart-loading {
          width: 100%;
        }

        .loading-heading {
          width: 180px;
          height: 32px;
          margin-bottom: 25px;
          background: #eadbd7;
          animation: pulse 1.4s ease-in-out infinite;
        }

        .loading-row {
          display: grid;
          grid-template-columns: 150px 1fr 80px;
          gap: 23px;
          padding: 24px 0;
          border-bottom: 1px solid rgba(33, 27, 28, 0.07);
        }

        .loading-image {
          width: 150px;
          height: 180px;
          background: #eadbd7;
          animation: pulse 1.4s ease-in-out infinite;
        }

        .loading-copy {
          padding-top: 10px;
        }

        .loading-copy span,
        .loading-copy strong,
        .loading-copy i {
          display: block;
          height: 10px;
          margin-bottom: 14px;
          background: #eadbd7;
          animation: pulse 1.4s ease-in-out infinite;
        }

        .loading-copy span {
          width: 25%;
        }

        .loading-copy strong {
          width: 65%;
          height: 22px;
        }

        .loading-copy i {
          width: 38%;
        }

        .loading-price {
          width: 70px;
          height: 12px;
          margin-left: auto;
          background: #eadbd7;
          animation: pulse 1.4s ease-in-out infinite;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.45;
          }

          50% {
            opacity: 1;
          }
        }

        @media (max-width: 1050px) {
          .cart-grid {
            grid-template-columns: minmax(0, 1fr) 320px;
            gap: 32px;
          }

          .cart-product {
            grid-template-columns: 125px minmax(0, 1fr) 85px;
          }

          .cart-product-image-wrap,
          .loading-image {
            width: 125px;
            height: 155px;
          }

          .cart-script {
            margin-right: 15px;
          }
        }

        @media (max-width: 800px) {
          .cart-container {
            width: calc(100% - 32px);
          }

          .cart-hero-inner {
            min-height: 270px;
            padding: 45px 0;
          }

          .cart-script {
            display: none;
          }

          .cart-content {
            padding: 48px 0 80px;
          }

          .cart-grid {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .summary-wrap {
            position: static;
          }

          .cart-product {
            grid-template-columns: 105px minmax(0, 1fr);
            gap: 16px;
          }

          .cart-product-image-wrap {
            width: 105px;
            height: 135px;
          }

          .cart-product-price {
            display: none;
          }

          .cart-product-controls {
            margin-top: 18px;
            padding-top: 0;
          }

          .cart-product-name {
            font-size: 20px;
          }
        }

        @media (max-width: 520px) {
          .cart-hero h1 {
            font-size: 50px;
          }

          .cart-products-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 13px;
          }

          .cart-product {
            grid-template-columns: 88px minmax(0, 1fr);
            gap: 13px;
          }

          .cart-product-image-wrap {
            width: 88px;
            height: 115px;
          }

          .cart-product-name {
            font-size: 18px;
          }

          .remove-button span {
            display: none;
          }

          .summary-card {
            padding: 25px;
          }

          .empty-cart h2 {
            font-size: 43px;
          }
        }
      `}</style>
    </>
  );
}