"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import Header from "../../components/storefront/Header";
import Footer from "../../components/storefront/Footer";
import {
  getProduct,
  getWishlist,
  removeFromWishlist,
} from "../../lib/storeApi";
import { getCustomerToken } from "../../lib/auth";

const KEY = "polishpay:wishlist";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function WishlistPage() {
  const [ids, setIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadWishlist() {
    const token = getCustomerToken();

    if (token) {
      try {
        const saved = await getWishlist(token);

        const slugs = saved
          .map((item) => item?.product_slug)
          .filter(Boolean);

        setIds(slugs);
        await loadProducts(slugs);
        return;
      } catch (error) {
        console.error("Wishlist account loading error:", error);
      }
    }

    try {
      const saved =
        JSON.parse(window.localStorage.getItem(KEY) || "[]") || [];

      const safeIds = Array.isArray(saved) ? saved : [];

      setIds(safeIds);
      await loadProducts(safeIds);
    } catch {
      setIds([]);
      setProducts([]);
      setLoading(false);
    }
  }

  async function loadProducts(slugs) {
    if (!slugs.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const results = await Promise.all(
      slugs.map(async (slug) => {
        try {
          return await getProduct(slug);
        } catch {
          return null;
        }
      })
    );

    setProducts(results.filter(Boolean));
    setLoading(false);
  }

  useEffect(() => {
    loadWishlist();

    function refresh() {
      loadWishlist();
    }

    window.addEventListener(
      "polishpay:wishlist-updated",
      refresh
    );

    window.addEventListener(
      "polishpay:auth-updated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "polishpay:wishlist-updated",
        refresh
      );

      window.removeEventListener(
        "polishpay:auth-updated",
        refresh
      );
    };
  }, []);

  async function remove(slug) {
    const product = products.find(
      (item) => item.slug === slug
    );

    const token = getCustomerToken();

    if (token && product?.id) {
      try {
        /*
         * IMPORTANT:
         * storeApi.js expects:
         *
         * removeFromWishlist(token, productId)
         *
         * The previous version accidentally reversed
         * these two arguments, causing the product ID to
         * be sent as the authentication token.
         */
        await removeFromWishlist(token, product.id);

        /*
         * Optimistically remove it from the current page.
         * The wishlist-updated event will also refresh
         * connected components such as the Header.
         */
        setIds((current) =>
          current.filter((id) => id !== slug)
        );

        setProducts((current) =>
          current.filter((item) => item.slug !== slug)
        );
      } catch (error) {
        console.error("Wishlist removal error:", error);
        return;
      }
    } else {
      const next = ids.filter((id) => id !== slug);

      window.localStorage.setItem(
        KEY,
        JSON.stringify(next)
      );

      setIds(next);

      setProducts((current) =>
        current.filter((item) => item.slug !== slug)
      );
    }
  }

  return (
    <>
      <Header />

      <main className="wishlist-page">
        <section className="wishlist-hero">
          <div>
            <span>Saved for later</span>

            <h1>
              Things you
              <br />
              <em>love.</em>
            </h1>
          </div>

          <div className="wishlist-script">
            Keep a little
            <br />
            list of lovely.
            <small>♡</small>
          </div>
        </section>

        <section className="wishlist-content">
          <div className="wishlist-heading">
            <div>
              <span>YOUR WISHLIST</span>

              <h2>
                {products.length} saved{" "}
                {products.length === 1 ? "find" : "finds"}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="wishlist-empty">
              Loading your saved finds...
            </div>
          ) : products.length ? (
            <div className="wishlist-grid">
              {products.map((product) => {
                const image =
                  product.image ||
                  product.images?.[0];

                return (
                  <article
                    className="wishlist-card"
                    key={product.id}
                  >
                    <a
                      href={`/product/${product.slug}`}
                      className="wishlist-image"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                        />
                      ) : (
                        <ShoppingBag size={28} />
                      )}
                    </a>

                    <div className="wishlist-copy">
                      <span>
                        {product.category_name ||
                          "Polish & Pay"}
                      </span>

                      <a
                        href={`/product/${product.slug}`}
                      >
                        {product.name}
                      </a>

                      <strong>
                        {money(
                          product.current_price ??
                            product.price
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          remove(product.slug)
                        }
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="wishlist-empty">
              <Heart size={27} />

              <span>Nothing saved yet</span>

              <h2>
                A little room for
                <br />
                your next <em>favorite.</em>
              </h2>

              <p>
                Use the heart on products you want to
                keep close.
              </p>

              <a
                href="/shop"
                className="store-button-dark"
              >
                Explore the Shop
                <ArrowRight size={16} />
              </a>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wishlist-page {
          min-height: 100vh;
          background: #fffaf8;
          color: #211b1c;
        }

        .wishlist-hero {
          min-height: 315px;
          padding: 55px
            max(36px, calc((100% - 1280px) / 2));
          display: flex;
          align-items: center;
          justify-content: space-between;
          background:
            linear-gradient(
              105deg,
              #f7e3df,
              #fdf3f0 54%,
              #ead1ca
            );
        }

        .wishlist-hero span,
        .wishlist-heading span {
          color: #b86676;
          font: 700 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .wishlist-hero h1 {
          margin: 14px 0 0;
          font: 500 clamp(56px, 6vw, 80px) /
            0.84 "Playfair Display", Georgia, serif;
          letter-spacing: -0.06em;
        }

        .wishlist-hero h1 em,
        .wishlist-empty h2 em {
          color: #b86676;
          font-style: italic;
        }

        .wishlist-script {
          margin-right: 70px;
          color: #fff;
          font: 400 46px/0.8 "Sacramento", cursive;
          text-align: center;
          transform: rotate(-4deg);
        }

        .wishlist-script small {
          display: block;
          margin-top: 14px;
          font: 400 22px/1 "DM Sans", sans-serif;
        }

        .wishlist-content {
          width: min(1180px, calc(100% - 72px));
          margin: 0 auto;
          padding: 60px 0 110px;
        }

        .wishlist-heading {
          padding-bottom: 22px;
          border-bottom: 1px solid
            rgba(33, 27, 28, 0.09);
        }

        .wishlist-heading h2 {
          margin: 10px 0 0;
          font: 500 38px/0.95
            "Playfair Display",
            Georgia,
            serif;
          letter-spacing: -0.045em;
        }

        .wishlist-grid {
          margin-top: 30px;
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 30px 22px;
        }

        .wishlist-image {
          display: block;
          aspect-ratio: 0.86;
          overflow: hidden;
          background: #f0e1dd;
        }

        .wishlist-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }

        .wishlist-image:hover img {
          transform: scale(1.035);
        }

        .wishlist-copy {
          padding-top: 13px;
          display: grid;
          gap: 7px;
        }

        .wishlist-copy > span {
          color: #b86676;
          font: 700 7px/1 "DM Sans",
            sans-serif;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .wishlist-copy > a {
          color: #211b1c;
          font: 500 18px/1.15
            "Playfair Display",
            Georgia,
            serif;
        }

        .wishlist-copy > strong {
          font: 700 10px/1 "DM Sans",
            sans-serif;
        }

        .wishlist-copy button {
          width: max-content;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          margin-top: 4px;
          border: 0;
          background: transparent;
          color: #938487;
          font: 700 7px/1 "DM Sans",
            sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .wishlist-copy button:hover {
          color: #b86676;
        }

        .wishlist-empty {
          min-height: 430px;
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background:
            linear-gradient(
              145deg,
              #f7e3df,
              #fffaf8
            );
          border: 1px solid
            rgba(33, 27, 28, 0.07);
          color: #b86676;
        }

        .wishlist-empty > .store-button-dark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          text-decoration: none;
        }

        .wishlist-empty > span {
          margin-top: 15px;
          font: 700 8px/1 "DM Sans",
            sans-serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .wishlist-empty h2 {
          margin: 13px 0 0;
          color: #211b1c;
          font: 500 46px/0.9
            "Playfair Display",
            Georgia,
            serif;
          letter-spacing: -0.05em;
        }

        .wishlist-empty p {
          margin: 15px 0 23px;
          color: #7d6e71;
          font: 400 10px/1.7 "DM Sans",
            sans-serif;
        }

        @media (max-width: 850px) {
          .wishlist-script {
            display: none;
          }

          .wishlist-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 600px) {
          .wishlist-content {
            width: calc(100% - 32px);
          }

          .wishlist-grid {
            gap: 27px 13px;
          }
        }
      `}</style>
    </>
  );
}
