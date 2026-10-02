"use client";

import { useEffect, useState } from "react";
import { Heart, LoaderCircle, ShoppingBag } from "lucide-react";

import {
  addToWishlist,
  isProductInWishlist,
  removeFromWishlist,
} from "../../lib/storeApi";

import { getCustomerToken } from "../../lib/auth";

function getImage(product) {
  const candidate =
    product?.image_url ||
    product?.image ||
    product?.primary_image ||
    product?.images?.[0]?.image_url ||
    product?.images?.[0]?.image;

  if (!candidate) return "";

  if (candidate.startsWith("http")) {
    return candidate;
  }

  return `${(
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "")}${candidate.startsWith("/") ? "" : "/"}${candidate}`;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export default function ProductCard({
  product,
  onAddToCart,
}) {
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const image = getImage(product);

  const regular = Number(
    product?.price ||
      product?.selling_price ||
      0
  );

  const sale = Number(
    product?.sale_price || 0
  );

  const current =
    sale > 0 && sale < regular
      ? sale
      : regular;

  /*
  |--------------------------------------------------------------------------
  | LOAD WISHLIST STATE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    async function loadWishlistState() {
      const token = getCustomerToken();

      if (!token || !product?.id) {
        if (mounted) {
          setLiked(false);
        }

        return;
      }

      try {
        /*
         * IMPORTANT:
         *
         * storeApi signature:
         *
         * isProductInWishlist(token, productId)
         *
         * Token MUST come first.
         */
        const saved =
          await isProductInWishlist(
            token,
            product.id
          );

        if (mounted) {
          setLiked(saved);
        }
      } catch (error) {
        console.error(
          "Wishlist state error:",
          error
        );

        if (mounted) {
          setLiked(false);
        }
      }
    }

    loadWishlistState();

    function syncWishlist() {
      loadWishlistState();
    }

    window.addEventListener(
      "polishpay:wishlist-updated",
      syncWishlist
    );

    window.addEventListener(
      "polishpay:auth-updated",
      syncWishlist
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "polishpay:wishlist-updated",
        syncWishlist
      );

      window.removeEventListener(
        "polishpay:auth-updated",
        syncWishlist
      );
    };
  }, [product?.id]);

  /*
  |--------------------------------------------------------------------------
  | WISHLIST
  |--------------------------------------------------------------------------
  */

  async function handleWishlist(event) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !product?.id ||
      wishlistLoading
    ) {
      return;
    }

    const token =
      getCustomerToken();

    /*
     * Guests are sent to the account page.
     */
    if (!token) {
      window.location.href =
        "/account?wishlist=signin";

      return;
    }

    setWishlistLoading(true);

    try {
      if (liked) {
        /*
         * IMPORTANT:
         *
         * removeFromWishlist(token, productId)
         */
        await removeFromWishlist(
          token,
          product.id
        );

        setLiked(false);
      } else {
        /*
         * IMPORTANT:
         *
         * addToWishlist(token, productId)
         */
        await addToWishlist(
          token,
          product.id
        );

        setLiked(true);
      }
    } catch (error) {
      console.error(
        "Wishlist error:",
        error
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CART
  |--------------------------------------------------------------------------
  */

  async function handleAdd(event) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !onAddToCart ||
      loading ||
      !product?.id
    ) {
      return;
    }

    setLoading(true);

    try {
      await onAddToCart(product);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="pp-product-card">
      <div className="pp-product-media">
        <a
          href={`/product/${
            product?.slug ||
            product?.id
          }`}
          className="pp-product-image-link"
        >
          {image && !imageFailed ? (
            <img
              src={image}
              alt={
                product?.name ||
                "Product"
              }
              className="pp-product-image"
              onError={() =>
                setImageFailed(true)
              }
            />
          ) : (
            <div className="pp-product-image-fallback">
              <ShoppingBag
                size={34}
                strokeWidth={1}
              />
            </div>
          )}
        </a>

        {(product?.badge ||
          product?.is_new) && (
          <span className="pp-product-badge">
            {product?.badge ||
              "New"}
          </span>
        )}

        <button
          type="button"
          className={`pp-product-wishlist ${
            liked ? "liked" : ""
          }`}
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          aria-pressed={liked}
        >
          {wishlistLoading ? (
            <LoaderCircle
              size={17}
              className="pp-wishlist-spin"
            />
          ) : (
            <Heart
              size={19}
              strokeWidth={1.35}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />
          )}
        </button>

        <button
          type="button"
          className="pp-product-quick-add"
          onClick={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle
              size={16}
              className="pp-spin"
            />
          ) : (
            <ShoppingBag
              size={16}
              strokeWidth={1.4}
            />
          )}

          <span>
            {loading
              ? "Adding..."
              : "Add to Bag"}
          </span>
        </button>
      </div>

      <div className="pp-product-copy">
        <span className="pp-product-category">
          {product?.category_name ||
            product?.category?.name ||
            "Polish & Pay"}
        </span>

        <a
          href={`/product/${
            product?.slug ||
            product?.id
          }`}
          className="pp-product-name"
        >
          {product?.name}
        </a>

        <div className="pp-product-bottom">
          <div className="pp-product-price">
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

          {Number(
            product?.review_count ||
              product?.reviews ||
              0
          ) > 0 && (
            <span className="pp-product-reviews">
              ★{" "}
              {product.review_count ||
                product.reviews}
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .pp-product-card{
          min-width:0
        }

        .pp-product-media{
          position:relative;
          overflow:hidden;
          aspect-ratio:.86;
          background:#f1e3df
        }

        .pp-product-image-link{
          display:block;
          width:100%;
          height:100%
        }

        .pp-product-image,
        .pp-product-image-fallback{
          width:100%;
          height:100%;
          display:block;
          object-fit:cover
        }

        .pp-product-image{
          transition:
            transform .55s
            cubic-bezier(.22,1,.36,1)
        }

        .pp-product-media:hover
        .pp-product-image{
          transform:scale(1.045)
        }

        .pp-product-image-fallback{
          display:flex;
          align-items:center;
          justify-content:center;
          color:#c49da4;
          background:
            linear-gradient(
              145deg,
              #f5e4e0,
              #ead0ca
            )
        }

        .pp-product-badge{
          position:absolute;
          left:14px;
          top:14px;
          padding:8px 10px;
          background:#211b1c;
          color:#fff;
          font:
            700 8px/1
            "DM Sans",
            sans-serif;
          letter-spacing:.13em;
          text-transform:uppercase
        }

        .pp-product-wishlist{
          position:absolute;
          right:13px;
          top:13px;
          width:40px;
          height:40px;
          display:flex;
          align-items:center;
          justify-content:center;
          border:0;
          border-radius:50%;
          background:rgba(255,255,255,.94);
          color:#211b1c;
          cursor:pointer;
          transition:
            color .2s ease,
            transform .2s ease
        }

        .pp-product-wishlist:hover{
          transform:translateY(-1px)
        }

        .pp-product-wishlist:disabled{
          cursor:wait
        }

        .pp-product-wishlist.liked{
          color:#b86676
        }

        .pp-product-quick-add{
          position:absolute;
          left:13px;
          right:13px;
          bottom:13px;
          height:48px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          border:0;
          background:#211b1c;
          color:#fff;
          font:
            700 10px/1
            "DM Sans",
            sans-serif;
          letter-spacing:.12em;
          text-transform:uppercase;
          opacity:0;
          transform:translateY(8px);
          transition:
            opacity .2s ease,
            transform .2s ease,
            background .2s ease
        }

        .pp-product-media:hover
        .pp-product-quick-add,
        .pp-product-quick-add:focus-visible{
          opacity:1;
          transform:translateY(0)
        }

        .pp-product-quick-add:hover{
          background:#b86676
        }

        .pp-product-quick-add:disabled{
          opacity:.9;
          cursor:wait
        }

        .pp-product-copy{
          padding-top:16px
        }

        .pp-product-category{
          display:block;
          margin-bottom:7px;
          color:#b86676;
          font:
            700 9px/1
            "DM Sans",
            sans-serif;
          letter-spacing:.14em;
          text-transform:uppercase
        }

        .pp-product-name{
          display:block;
          color:#211b1c;
          font:
            500 20px/1.18
            "Playfair Display",
            Georgia,
            serif;
          letter-spacing:-.025em
        }

        .pp-product-bottom{
          margin-top:10px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px
        }

        .pp-product-price{
          display:flex;
          align-items:center;
          gap:9px
        }

        .pp-product-price strong{
          color:#211b1c;
          font:
            700 14px/1
            "DM Sans",
            sans-serif
        }

        .pp-product-price del{
          color:#9b8d90;
          font:
            400 12px/1
            "DM Sans",
            sans-serif
        }

        .pp-product-reviews{
          color:#9a898c;
          font:
            500 10px/1
            "DM Sans",
            sans-serif
        }

        .pp-spin,
        .pp-wishlist-spin{
          animation:
            ppSpin .8s linear infinite
        }

        @keyframes ppSpin{
          to{
            transform:rotate(360deg)
          }
        }

        @media(max-width:700px){
          .pp-product-quick-add{
            opacity:1;
            transform:none
          }

          .pp-product-name{
            font-size:17px
          }

          .pp-product-price strong{
            font-size:12px
          }
        }
      `}</style>
    </article>
  );
}