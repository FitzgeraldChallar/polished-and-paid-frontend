"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import Header from "../../../components/storefront/Header";
import Footer from "../../../components/storefront/Footer";
import ProductCard from "../../../components/storefront/ProductCard";
import {
  addToCart,
  getProduct,
  getProducts,
} from "../../../lib/storeApi";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function imageUrl(value) {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const base = (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api"
  ).replace(/\/api\/?$/, "");

  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
}

export default function ProductPage({ params }) {
  const [slug, setSlug] = useState("");
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.resolve(params).then((value) => {
      setSlug(value?.slug || "");
    });
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setRelated([]);
        setActiveImage(0);
        setQuantity(1);

        const item = await getProduct(slug);

        const products = await getProducts({
          category: item?.category?.slug || undefined,
        });

        if (!mounted) return;

        setProduct(item);

        setRelated(
          products
            .filter((entry) => entry.id !== item.id)
            .slice(0, 4)
        );
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError?.data?.detail ||
              requestError?.message ||
              "We couldn't find that product."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  async function handleAdd() {
    if (!product || adding) return;

    setAdding(true);
    setMessage("");

    try {
      await addToCart(product.id, quantity);

      setMessage(
        `${product.name} was added to your bag.`
      );
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't add this item."
      );
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />

        <main className="product-page product-loading-page">
          <div className="product-skeleton-media" />

          <div className="product-skeleton-copy">
            <span />
            <h1 />
            <p />
            <p />
          </div>
        </main>

        <Footer />

        <style jsx>{productStyles}</style>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />

        <main className="product-error-page">
          <Sparkles size={25} />

          <span>Product unavailable</span>

          <h1>
            We couldn't find
            <br />
            that <em>beauty.</em>
          </h1>

          <p>
            {error ||
              "This product is no longer available."}
          </p>

          <a
            href="/shop"
            className="store-button-dark"
          >
            Back to Shop
            <ArrowRight size={16} />
          </a>
        </main>

        <Footer />

        <style jsx>{productStyles}</style>
      </>
    );
  }

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const fallback = imageUrl(product.image);

  const active =
    images[activeImage] || fallback;

  const regular = Number(product.price || 0);
  const sale = Number(product.sale_price || 0);

  const current =
    sale > 0 && sale < regular
      ? sale
      : regular;

  const maxStock = Number(
    product.stock_quantity || 0
  );

  return (
    <>
      <Header />

      <main className="product-page">
        <div className="product-breadcrumb">
          <a href="/shop">
            <ArrowLeft size={13} />
            Shop
          </a>

          <span>/</span>

          <span>{product.name}</span>
        </div>

        <section className="product-main">
          <div className="product-gallery">
            <div className="product-thumbs">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={
                    activeImage === index
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveImage(index)
                  }
                >
                  <img
                    src={image}
                    alt=""
                  />
                </button>
              ))}
            </div>

            <div className="product-main-image">
              {active ? (
                <img
                  src={active}
                  alt={product.name}
                />
              ) : (
                <div className="product-no-image">
                  <ShoppingBag size={40} />
                </div>
              )}

              {(product.is_new ||
                product.bestseller ||
                product.featured) && (
                <span className="product-badge">
                  {product.bestseller
                    ? "Best Seller"
                    : product.is_new
                      ? "New"
                      : "Featured"}
                </span>
              )}
            </div>
          </div>

          <div className="product-copy">
            <span className="product-category">
              {product.category_name ||
                "Polish & Pay"}
            </span>

            <h1>{product.name}</h1>

            <div className="product-price">
              <strong>
                {money(current)}
              </strong>

              {sale > 0 &&
                sale < regular && (
                  <del>
                    {money(regular)}
                  </del>
                )}
            </div>

            {product.short_description && (
              <p className="product-lead">
                {product.short_description}
              </p>
            )}

            {product.description && (
              <p className="product-description">
                {product.description}
              </p>
            )}

            <div className="product-rule" />

            <div className="product-stock">
              <span
                className={
                  maxStock > 0
                    ? "stock-dot"
                    : "stock-dot out"
                }
              />

              {maxStock > 0
                ? `${maxStock} available`
                : "Currently out of stock"}
            </div>

            <div className="product-actions">
              <div className="product-quantity">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() =>
                    setQuantity((value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                    )
                  }
                >
                  <Minus size={14} />
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  disabled={
                    maxStock > 0 &&
                    quantity >= maxStock
                  }
                  onClick={() =>
                    setQuantity((value) =>
                      maxStock
                        ? Math.min(
                            maxStock,
                            value + 1
                          )
                        : value + 1
                    )
                  }
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                className="product-add"
                onClick={handleAdd}
                disabled={
                  adding || maxStock <= 0
                }
              >
                {adding ? (
                  <LoaderCircle
                    size={16}
                    className="product-spin"
                  />
                ) : (
                  <ShoppingBag size={16} />
                )}

                {adding
                  ? "Adding..."
                  : "Add to Bag"}
              </button>

              <button
                type="button"
                className={`product-like ${
                  liked ? "liked" : ""
                }`}
                onClick={() =>
                  setLiked((value) =>
                    !value
                  )
                }
                aria-label="Wishlist"
              >
                <Heart
                  size={18}
                  fill={
                    liked
                      ? "currentColor"
                      : "none"
                  }
                />
              </button>
            </div>

            {message && (
              <div className="product-message">
                <Check size={15} />

                {message}

                <a href="/cart">
                  View bag
                </a>
              </div>
            )}

            <div className="product-details">
              <div>
                <span>SKU</span>

                <strong>
                  {product.sku}
                </strong>
              </div>

              <div>
                <span>Shipping</span>

                <strong>
                  Complimentary over $75
                </strong>
              </div>

              <div>
                <span>Returns</span>

                <strong>
                  See our store policy
                </strong>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="related-products">
            <div className="related-heading">
              <span>
                YOU MAY ALSO LOVE
              </span>

              <h2>
                More from the
                <em> collection.</em>
              </h2>
            </div>

            <div className="related-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onAddToCart={async (entry) => {
                    await addToCart(
                      entry.id,
                      1
                    );
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{productStyles}</style>
    </>
  );
}

const productStyles = `
  .product-page {
    min-height: 100vh;
    background: #fffaf8;
    color: #211b1c;
    padding: 28px 0 100px;
  }

  .product-breadcrumb {
    width: min(1280px, calc(100% - 72px));
    margin: 0 auto 35px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: #9a8b8e;
    font: 700 8px/1 "DM Sans", sans-serif;
    letter-spacing: .11em;
    text-transform: uppercase;
  }

  .product-breadcrumb a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #211b1c;
  }

  .product-main {
    width: min(1280px, calc(100% - 72px));
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(390px, .9fr);
    gap: 72px;
    align-items: start;
  }

  .product-gallery {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 14px;
  }

  .product-thumbs {
    display: grid;
    gap: 10px;
    align-content: start;
  }

  .product-thumbs button {
    width: 76px;
    height: 90px;
    padding: 0;
    border: 1px solid rgba(33,27,28,.09);
    background: #f3e5e1;
    overflow: hidden;
    cursor: pointer;
  }

  .product-thumbs button.active {
    border-color: #b86676;
  }

  .product-thumbs img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-main-image {
    position: relative;
    aspect-ratio: .86;
    max-height: 690px;
    overflow: hidden;
    background: #f2e4e0;
  }

  .product-main-image > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-no-image {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #b86676;
  }

  .product-badge {
    position: absolute;
    left: 17px;
    top: 17px;
    padding: 8px 10px;
    background: #211b1c;
    color: #fff;
    font: 700 7px/1 "DM Sans", sans-serif;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .product-copy {
    padding-top: 17px;
  }

  .product-category {
    color: #b86676;
    font: 700 8px/1 "DM Sans", sans-serif;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  .product-copy h1 {
    max-width: 560px;
    margin: 13px 0 16px;
    font: 500 clamp(43px, 5vw, 70px)/.93 "Playfair Display", Georgia, serif;
    letter-spacing: -.055em;
  }

  .product-price {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .product-price strong {
    font: 600 19px/1 "DM Sans", sans-serif;
  }

  .product-price del {
    color: #9e8d90;
    font: 400 12px/1 "DM Sans", sans-serif;
  }

  .product-lead {
    max-width: 520px;
    margin: 25px 0 0;
    color: #55494b;
    font: 500 13px/1.75 "DM Sans", sans-serif;
  }

  .product-description {
    max-width: 520px;
    margin: 13px 0 0;
    color: #847477;
    font: 400 11px/1.75 "DM Sans", sans-serif;
  }

  .product-rule {
    width: 100%;
    height: 1px;
    margin: 30px 0 20px;
    background: rgba(33,27,28,.09);
  }

  .product-stock {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #67595c;
    font: 700 8px/1 "DM Sans", sans-serif;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .stock-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #86a66e;
  }

  .stock-dot.out {
    background: #b86676;
  }

  .product-actions {
    display: grid;
    grid-template-columns: 106px minmax(0,1fr) 48px;
    gap: 10px;
    margin-top: 21px;
  }

  .product-quantity {
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(33,27,28,.13);
    background: #fff;
  }

  .product-quantity button {
    width: 32px;
    height: 100%;
    border: 0;
    background: transparent;
    color: #5f5254;
  }

  .product-quantity button:disabled {
    opacity: .3;
    cursor: not-allowed;
  }

  .product-quantity span {
    font: 700 10px/1 "DM Sans", sans-serif;
  }

  .product-add {
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 0;
    background: #211b1c;
    color: #fff;
    font: 700 9px/1 "DM Sans", sans-serif;
    letter-spacing: .14em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .product-add:hover:not(:disabled) {
    background: #b86676;
  }

  .product-add:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  .product-like {
    height: 54px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(33,27,28,.13);
    background: #fff;
    color: #211b1c;
    cursor: pointer;
  }

  .product-like.liked {
    color: #b86676;
  }

  .product-message {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 15px;
    padding: 12px 13px;
    background: #f4e8e5;
    color: #625457;
    font: 500 9px/1.4 "DM Sans", sans-serif;
  }

  .product-message svg {
    color: #b86676;
  }

  .product-message a {
    margin-left: auto;
    color: #b86676;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .1em;
  }

  .product-details {
    margin-top: 31px;
    border-top: 1px solid rgba(33,27,28,.09);
  }

  .product-details > div {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 15px 0;
    border-bottom: 1px solid rgba(33,27,28,.07);
  }

  .product-details span {
    color: #a09093;
    font: 700 7px/1 "DM Sans", sans-serif;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .product-details strong {
    max-width: 65%;
    color: #514548;
    text-align: right;
    font: 500 9px/1.4 "DM Sans", sans-serif;
  }

  .related-products {
    width: min(1280px, calc(100% - 72px));
    margin: 110px auto 0;
  }

  .related-heading span {
    color: #b86676;
    font: 700 8px/1 "DM Sans", sans-serif;
    letter-spacing: .18em;
  }

  .related-heading h2 {
    margin: 11px 0 29px;
    font: 500 43px/.95 "Playfair Display", Georgia, serif;
    letter-spacing: -.045em;
  }

  .related-heading em {
    color: #b86676;
    font-style: italic;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 22px;
  }

  .product-loading-page {
    width: min(1280px, calc(100% - 72px));
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.1fr .9fr;
    gap: 72px;
    padding-top: 50px;
  }

  .product-skeleton-media {
    aspect-ratio: .86;
    background: #eadbd7;
    animation: ppulse 1.4s ease-in-out infinite;
  }

  .product-skeleton-copy {
    padding-top: 50px;
  }

  .product-skeleton-copy span,
  .product-skeleton-copy h1,
  .product-skeleton-copy p {
    display: block;
    background: #eadbd7;
    animation: ppulse 1.4s ease-in-out infinite;
  }

  .product-skeleton-copy span {
    width: 90px;
    height: 9px;
  }

  .product-skeleton-copy h1 {
    width: 75%;
    height: 70px;
    margin: 20px 0;
  }

  .product-skeleton-copy p {
    width: 90%;
    height: 12px;
    margin: 15px 0;
  }

  .product-error-page {
    min-height: 620px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 60px 24px;
    background: #fffaf8;
    color: #211b1c;
  }

  .product-error-page > svg {
    color: #b86676;
  }

  .product-error-page > span {
    margin-top: 17px;
    color: #b86676;
    font: 700 8px/1 "DM Sans", sans-serif;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  .product-error-page h1 {
    margin: 12px 0 15px;
    font: 500 57px/.9 "Playfair Display", Georgia, serif;
    letter-spacing: -.055em;
  }

  .product-error-page h1 em {
    color: #b86676;
  }

  .product-error-page p {
    max-width: 420px;
    margin: 0 0 25px;
    color: #817376;
    font: 400 11px/1.7 "DM Sans", sans-serif;
  }

  .product-spin {
    animation: productSpin .8s linear infinite;
  }

  @keyframes productSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ppulse {
    0%,100% {
      opacity: .45;
    }

    50% {
      opacity: 1;
    }
  }

  @media (max-width: 900px) {
    .product-main,
    .product-loading-page {
      grid-template-columns: 1fr;
      gap: 42px;
    }

    .product-copy {
      padding-top: 0;
    }

    .related-grid {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }
  }

  @media (max-width: 620px) {
    .product-page {
      padding-top: 18px;
    }

    .product-breadcrumb,
    .product-main,
    .related-products {
      width: calc(100% - 32px);
    }

    .product-gallery {
      grid-template-columns: 56px minmax(0,1fr);
    }

    .product-thumbs button {
      width: 56px;
      height: 70px;
    }

    .product-copy h1 {
      font-size: 44px;
    }

    .product-actions {
      grid-template-columns: 92px minmax(0,1fr);
    }

    .product-like {
      grid-column: 1 / -1;
    }

    .related-grid {
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
  }
`;
