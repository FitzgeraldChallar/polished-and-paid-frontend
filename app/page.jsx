"use client";

import { useEffect, useState } from "react";

import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Heart,
  Headphones,
  Sparkles,
} from "lucide-react";

import Header from "../components/storefront/Header";
import Hero from "../components/storefront/Hero";
import CategoryGrid from "../components/storefront/CategoryGrid";
import ProductCard from "../components/storefront/ProductCard";
import Footer from "../components/storefront/Footer";
import SectionHeading from "../components/storefront/SectionHeading";

import {
  getNewArrivals,
  getFeaturedProducts,
  getBestSellers,
  getProducts,
  addToCart,
} from "../lib/storeApi";

/* =========================================================
   EMPTY PRODUCT STATE
========================================================= */

function EmptyProducts({ message }) {
  return (
    <div className="pp-empty-products">
      <Sparkles size={22} strokeWidth={1.1} />

      <p>{message}</p>
    </div>
  );
}

/* =========================================================
   PRODUCT SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="pp-product-skeleton">
      <div className="pp-skeleton-image" />

      <div className="pp-skeleton-small" />

      <div className="pp-skeleton-title" />

      <div className="pp-skeleton-price" />
    </div>
  );
}

/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({ icon, title, text }) {
  return (
    <div className="pp-trust-item">
      <div className="pp-trust-icon">{icon}</div>

      <div>
        <h3>{title}</h3>

        <p>{text}</p>
      </div>
    </div>
  );
}

/* =========================================================
   HOMEPAGE
========================================================= */

export default function HomePage() {
  const [newArrivals, setNewArrivals] = useState([]);

  const [featuredProducts, setFeaturedProducts] = useState([]);

  const [bestSellers, setBestSellers] = useState([]);

  const [selfCareProducts, setSelfCareProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [cartMessage, setCartMessage] = useState("");

  /* =======================================================
     LOAD STOREFRONT DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadStorefront() {
      try {
        const [
          newProducts,
          featured,
          bestsellers,
          allProducts,
        ] = await Promise.all([
          getNewArrivals(),
          getFeaturedProducts(),
          getBestSellers(),
          getProducts(),
        ]);

        if (!mounted) {
          return;
        }

        setNewArrivals(
          Array.isArray(newProducts)
            ? newProducts.slice(0, 4)
            : []
        );

        setFeaturedProducts(
          Array.isArray(featured)
            ? featured.slice(0, 4)
            : []
        );

        setBestSellers(
          Array.isArray(bestsellers)
            ? bestsellers.slice(0, 4)
            : []
        );

        const selfCare =
          Array.isArray(allProducts)
            ? allProducts.filter(
                (product) =>
                  (
                    product.category_name ||
                    product.category?.name ||
                    ""
                  )
                    .toLowerCase()
                    .includes("self")
              )
            : [];

        setSelfCareProducts(selfCare.slice(0, 4));
      } catch (error) {
        console.error(
          "Polish & Pay storefront error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStorefront();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     ADD TO CART
  ======================================================= */

  async function handleAddToCart(product) {
    try {
      await addToCart(product.id, 1);

      setCartMessage(
        `${product.name} has been added to your bag.`
      );

      window.setTimeout(() => {
        setCartMessage("");
      }, 2800);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setCartMessage(
        error?.data?.detail ||
          error?.response?.data?.detail ||
          "We couldn't add that item to your bag."
      );

      window.setTimeout(() => {
        setCartMessage("");
      }, 3000);
    }
  }

  return (
    <>
      <Header />

      <main className="pp-homepage">

        {/* =================================================
            HERO
        ================================================= */}

        <Hero />

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <CategoryGrid />

        {/* =================================================
            NEW ARRIVALS
        ================================================= */}

        <section className="pp-products-section">
          <div className="pp-section-container">

            <SectionHeading
              eyebrow="Just In"
              title="New Arrivals"
              description="Fresh beauty, wellness and lifestyle finds selected just for you."
              link="/shop?new=true"
            />

            {loading ? (
              <div className="pp-product-grid">
                {[1, 2, 3, 4].map((item) => (
                  <ProductSkeleton key={item} />
                ))}
              </div>
            ) : newArrivals.length ? (
              <div className="pp-product-grid">
                {newArrivals.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <EmptyProducts
                message="New arrivals will appear here as products are added from the admin portal."
              />
            )}

          </div>
        </section>

        {/* =================================================
            EDITORIAL FEATURE
        ================================================= */}

        <section className="pp-editorial">
          <div className="pp-editorial-inner">

            <div className="pp-editorial-image">
              <img
                src="https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1200&q=85"
                alt="Beauty and skincare products"
              />

              <div className="pp-editorial-image-overlay">
                <span>
                  Polish & Pay
                </span>
              </div>
            </div>

            <div className="pp-editorial-copy">

              <span className="pp-script">
                Beauty, your way.
              </span>

              <h2>
                Everything you need
                <br />
                to feel beautifully
                <br />
                <em>you.</em>
              </h2>

              <p>
                From beauty and fragrance
                to self-care and lifestyle
                essentials, discover pieces
                chosen to make everyday
                moments feel a little more
                special.
              </p>

              <a
                href="/shop"
                className="store-button-dark"
              >
                <span>
                  Shop the Collection
                </span>

                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                />
              </a>

            </div>

          </div>
        </section>

        {/* =================================================
            FEATURED PRODUCTS
        ================================================= */}

        <section className="pp-products-section pp-featured-section">
          <div className="pp-section-container">

            <SectionHeading
              eyebrow="Curated For You"
              title="Featured Favorites"
              description="A closer look at the products we're loving right now."
              link="/shop?featured=true"
            />

            {featuredProducts.length ? (
              <div className="pp-product-grid">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <EmptyProducts
                message="Featured products will appear here when the client marks products as featured."
              />
            )}

          </div>
        </section>

        {/* =================================================
            SELF CARE
        ================================================= */}

        <section className="pp-selfcare">
          <div className="pp-selfcare-inner">

            <div className="pp-selfcare-copy">

              <span className="pp-section-eyebrow">
                Take Care
              </span>

              <span className="pp-script">
                A little time for you.
              </span>

              <h2>
                Self-care
                <br />
                essentials
              </h2>

              <p>
                Small rituals. Beautiful
                moments. Products made
                for your everyday.
              </p>

              <a
                href="/shop?category=self-care"
                className="pp-outline-button"
              >
                <span>
                  Explore Self-Care
                </span>

                <ArrowRight
                  size={15}
                  strokeWidth={1.5}
                />
              </a>

            </div>

            {/* =================================================
                SELF CARE IMAGE
            ================================================= */}

            <div className="pp-selfcare-image">
              <img
                src="/images/self-care-banner.jpg"
                alt="Self-care essentials"
                loading="lazy"
                decoding="async"
                className="pp-selfcare-image-element"
              />

              <div className="pp-selfcare-image-overlay">
                <span>
                  Take a moment.
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* =================================================
            BEST SELLERS
        ================================================= */}

        <section className="pp-products-section">
          <div className="pp-section-container">

            <SectionHeading
              eyebrow="Customer Favorites"
              title="Best Sellers"
              description="The products our shoppers keep coming back for."
              link="/shop?bestseller=true"
            />

            {bestSellers.length ? (
              <div className="pp-product-grid">
                {bestSellers.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <EmptyProducts
                message="Best sellers will appear here when products are marked as bestsellers."
              />
            )}

          </div>
        </section>

        {/* =================================================
            TRUST STRIP
        ================================================= */}

        <section className="pp-trust">

          <div className="pp-trust-inner">

            <TrustItem
              icon={
                <Truck
                  size={23}
                  strokeWidth={1.25}
                />
              }
              title="Fast Shipping"
              text="Carefully packed and shipped to you."
            />

            <TrustItem
              icon={
                <ShieldCheck
                  size={23}
                  strokeWidth={1.25}
                />
              }
              title="Secure Checkout"
              text="Your payment information stays protected."
            />

            <TrustItem
              icon={
                <Heart
                  size={23}
                  strokeWidth={1.25}
                />
              }
              title="Curated With Love"
              text="Beauty and lifestyle products selected for you."
            />

            <TrustItem
              icon={
                <Headphones
                  size={23}
                  strokeWidth={1.25}
                />
              }
              title="We're Here to Help"
              text="Our team is ready when you need us."
            />

          </div>

        </section>

        {/* =================================================
            BRAND STORY
        ================================================= */}

        <section className="pp-story">

          <div className="pp-story-inner">

            <div className="pp-story-image">

              <img
                src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=85"
                alt="Polish and Pay beauty lifestyle"
              />

              <div className="pp-story-frame">
                <span>
                  Polish & Pay
                </span>
              </div>

            </div>

            <div className="pp-story-copy">

              <span className="pp-section-eyebrow">
                A Little More
              </span>

              <h2>
                Your beauty.
                <br />
                Your lifestyle.
                <br />
                <em>Your way.</em>
              </h2>

              <p>
                Polish & Pay brings
                beauty, self-care,
                fragrance, fashion,
                wellness and lifestyle
                essentials together in
                one thoughtfully curated
                destination.
              </p>

              <a
                href="/about"
                className="store-button-light"
              >
                <span>
                  Discover Our Story
                </span>

                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                />
              </a>

            </div>

          </div>

        </section>

      </main>

      {/* ===================================================
          CART TOAST
      =================================================== */}

      {cartMessage && (
        <div className="pp-cart-toast">

          <div className="pp-toast-icon">
            <ShoppingBagIcon />
          </div>

          <div>
            <strong>
              Added to your bag
            </strong>

            <span>
              {cartMessage}
            </span>
          </div>

        </div>
      )}

      <Footer />

      {/* ===================================================
          HOMEPAGE STYLES
      =================================================== */}

      <style jsx>{`

        /* =================================================
           HOMEPAGE BASE
        ================================================= */

        .pp-homepage {
          background: #fffaf8;
          color: #1d1819;
        }


        /* =================================================
           SECTION CONTAINER
        ================================================= */

        .pp-section-container {
          width: min(
            1280px,
            calc(100% - 72px)
          );
          margin: 0 auto;
        }

        .pp-products-section {
          padding: 100px 0;
          background: #fffaf8;
        }

        .pp-featured-section {
          background: #fdf2ef;
        }


        /* =================================================
           EMPTY PRODUCTS
        ================================================= */

        .pp-empty-products {
          min-height: 210px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 13px;
          padding: 30px;
          border: 1px solid
            rgba(28, 24, 25, 0.08);
          background: rgba(
            255,
            255,
            255,
            0.5
          );
          color: #a08386;
          text-align: center;
        }

        .pp-empty-products p {
          max-width: 460px;
          margin: 0;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 11px;
          line-height: 1.6;
        }


        /* =================================================
           PRODUCT GRID
        ================================================= */

        .pp-product-grid {
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 27px;
        }


        /* =================================================
           PRODUCT SKELETON
        ================================================= */

        .pp-product-skeleton {
          min-width: 0;
        }

        .pp-skeleton-image {
          aspect-ratio: 0.84;
          background: #f1e7e3;
          animation:
            ppPulse 1.5s
            ease-in-out infinite;
        }

        .pp-skeleton-small,
        .pp-skeleton-title,
        .pp-skeleton-price {
          height: 9px;
          margin-top: 14px;
          background: #eee1dd;
          animation:
            ppPulse 1.5s
            ease-in-out infinite;
        }

        .pp-skeleton-small {
          width: 27%;
        }

        .pp-skeleton-title {
          width: 72%;
        }

        .pp-skeleton-price {
          width: 25%;
        }

        @keyframes ppPulse {
          0%,
          100% {
            opacity: 0.5;
          }

          50% {
            opacity: 1;
          }
        }


        /* =================================================
           SCRIPT FONT
        ================================================= */

        .pp-script {
          display: block;
          margin-bottom: 7px;
          color: #a55e69;
          font-family:
            "Sacramento",
            cursive;
          font-size: 46px;
          line-height: 0.9;
        }


        /* =================================================
           EDITORIAL FEATURE
        ================================================= */

        .pp-editorial {
          padding: 100px 0;
          background:
            radial-gradient(
              circle at 20% 50%,
              rgba(
                255,
                255,
                255,
                0.65
              ),
              transparent 35%
            ),
            #ead6cf;
        }

        .pp-editorial-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 75px;
          width: min(
            1220px,
            calc(100% - 72px)
          );
          margin: 0 auto;
        }

        .pp-editorial-image {
          position: relative;
          height: 550px;
          overflow: hidden;
          background: #d9b9af;
        }

        .pp-editorial-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.85);
          transition:
            transform 700ms
            cubic-bezier(
              0.2,
              0.65,
              0.25,
              1
            );
        }

        .pp-editorial-image:hover img {
          transform: scale(1.025);
        }

        .pp-editorial-image-overlay {
          position: absolute;
          inset: 22px;
          display: flex;
          align-items: flex-end;
          padding: 30px;
          border: 1px solid
            rgba(255, 255, 255, 0.65);
          pointer-events: none;
        }

        .pp-editorial-image-overlay span {
          color: #ffffff;
          font-family:
            "Sacramento",
            cursive;
          font-size: 53px;
        }

        .pp-editorial-copy h2 {
          margin: 0;
          color: #20191a;
          font-family:
            "Playfair Display",
            serif;
          font-size: clamp(
            44px,
            4.8vw,
            68px
          );
          font-weight: 500;
          letter-spacing: -0.055em;
          line-height: 0.94;
        }

        .pp-editorial-copy h2 em,
        .pp-story-copy h2 em {
          color: #b86676;
          font-style: italic;
        }

        .pp-editorial-copy > p {
          max-width: 470px;
          margin: 23px 0 29px;
          color: #5e5052;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 13px;
          line-height: 1.7;
        }


        /* =================================================
           SELF CARE
        ================================================= */

        .pp-selfcare {
          padding: 100px 0;
          background: #f8e9e5;
        }

        .pp-selfcare-inner {
          display: grid;
          grid-template-columns:
            0.82fr
            1.18fr;
          align-items: center;
          gap: 70px;
          width: min(
            1220px,
            calc(100% - 72px)
          );
          margin: 0 auto;
        }

        .pp-selfcare-copy h2 {
          margin: 0;
          color: #21191a;
          font-family:
            "Playfair Display",
            serif;
          font-size: clamp(
            48px,
            5vw,
            70px
          );
          font-weight: 500;
          letter-spacing: -0.055em;
          line-height: 0.9;
        }

        .pp-selfcare-copy > p {
          max-width: 400px;
          margin: 20px 0 27px;
          color: #67595b;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 13px;
          line-height: 1.7;
        }

        .pp-outline-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-height: 50px;
          padding: 0 22px;
          border: 1px solid #1d1819;
          color: #1d1819;
          text-decoration: none;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          transition:
            background-color 180ms ease,
            color 180ms ease,
            border-color 180ms ease;
        }

        .pp-outline-button:hover {
          background: #1d1819;
          border-color: #1d1819;
          color: #ffffff;
        }


        /* =================================================
           SELF CARE IMAGE
        ================================================= */

        .pp-selfcare-image {
          position: relative;
          width: 100%;
          height: 430px;
          overflow: hidden;
          background: #ead7d2;
        }

        .pp-selfcare-image-element {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition:
            transform 800ms
            cubic-bezier(
              0.2,
              0.65,
              0.25,
              1
            );
        }

        .pp-selfcare-image:hover
          .pp-selfcare-image-element {
          transform: scale(1.025);
        }

        .pp-selfcare-image-overlay {
          position: absolute;
          inset: 22px;
          display: flex;
          align-items: flex-end;
          padding: 30px;
          border: 1px solid
            rgba(255, 255, 255, 0.65);
          pointer-events: none;
          z-index: 2;
        }

        .pp-selfcare-image-overlay span {
          color: #ffffff;
          font-family:
            "Sacramento",
            cursive;
          font-size: 48px;
          line-height: 1;
          text-shadow:
            0 2px 18px
              rgba(0, 0, 0, 0.18);
        }


        /* =================================================
           TRUST STRIP
        ================================================= */

        .pp-trust {
          background: #1d191a;
        }

        .pp-trust-inner {
          display: grid;
          grid-template-columns: repeat(
            4,
            1fr
          );
          width: min(
            1280px,
            calc(100% - 72px)
          );
          margin: 0 auto;
        }

        .pp-trust-item {
          display: flex;
          align-items: center;
          gap: 15px;
          min-height: 108px;
          padding: 20px;
          border-right: 1px solid
            rgba(255, 255, 255, 0.09);
        }

        .pp-trust-item:last-child {
          border-right: 0;
        }

        .pp-trust-icon {
          flex: 0 0 auto;
          color: #e3a4ab;
        }

        .pp-trust-item h3 {
          margin: 0 0 5px;
          color: #ffffff;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .pp-trust-item p {
          margin: 0;
          color: #a99fa1;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 9px;
          line-height: 1.5;
        }


        /* =================================================
           BRAND STORY
        ================================================= */

        .pp-story {
          padding: 105px 0;
          background: #fffaf8;
        }

        .pp-story-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 510px;
          width: min(
            1200px,
            calc(100% - 72px)
          );
          margin: 0 auto;
          background: #f5dfda;
        }

        .pp-story-image {
          position: relative;
          overflow: hidden;
          min-height: 510px;
          background: #d7b4aa;
        }

        .pp-story-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(0.72);
          transition:
            transform 700ms
            cubic-bezier(
              0.2,
              0.65,
              0.25,
              1
            );
        }

        .pp-story-image:hover img {
          transform: scale(1.025);
        }

        .pp-story-frame {
          position: absolute;
          inset: 25px;
          display: flex;
          align-items: flex-end;
          padding: 30px;
          border: 1px solid
            rgba(255, 255, 255, 0.55);
          pointer-events: none;
        }

        .pp-story-frame span {
          color: #ffffff;
          font-family:
            "Sacramento",
            cursive;
          font-size: 53px;
        }

        .pp-story-copy {
          display: flex;
          justify-content: center;
          flex-direction: column;
          padding: 70px;
        }

        .pp-story-copy h2 {
          margin: 0;
          color: #20191a;
          font-family:
            "Playfair Display",
            serif;
          font-size: clamp(
            43px,
            4.6vw,
            65px
          );
          font-weight: 500;
          letter-spacing: -0.05em;
          line-height: 0.95;
        }

        .pp-story-copy > p {
          max-width: 470px;
          margin: 22px 0 29px;
          color: #645658;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 13px;
          line-height: 1.7;
        }


        /* =================================================
           CART TOAST
        ================================================= */

        .pp-cart-toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 300px;
          max-width: 380px;
          padding: 15px 18px;
          background: #1d191a;
          color: #ffffff;
          box-shadow:
            0 18px 45px
              rgba(
                28,
                24,
                25,
                0.25
              );
          animation:
            ppToastIn 280ms ease;
        }

        @keyframes ppToastIn {
          from {
            opacity: 0;
            transform:
              translateY(10px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        .pp-toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          color: #e3a4ab;
          border: 1px solid
            rgba(255, 255, 255, 0.12);
        }

        .pp-cart-toast strong {
          display: block;
          margin-bottom: 3px;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .pp-cart-toast span {
          display: block;
          color: #b8adaf;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 10px;
          line-height: 1.4;
        }


        /* =================================================
           RESPONSIVE — TABLET
        ================================================= */

        @media (max-width: 1050px) {

          .pp-section-container,
          .pp-editorial-inner,
          .pp-selfcare-inner,
          .pp-trust-inner,
          .pp-story-inner {
            width: min(
              calc(100% - 48px),
              1280px
            );
          }

          .pp-product-grid {
            gap: 20px;
          }

          .pp-editorial-inner,
          .pp-selfcare-inner {
            gap: 45px;
          }

          .pp-editorial-image,
          .pp-story-image,
          .pp-story-inner {
            min-height: 450px;
          }

          .pp-story-inner {
            min-height: 450px;
          }

          .pp-selfcare-image {
            min-height: 450px;
          }

          .pp-selfcare-image-element {
            min-height: 450px;
          }
        }


        /* =================================================
           RESPONSIVE — MOBILE TABLET
        ================================================= */

        @media (max-width: 800px) {

          .pp-products-section {
            padding: 75px 0;
          }

          .pp-product-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
            gap: 20px 16px;
          }

          .pp-editorial-inner,
          .pp-selfcare-inner,
          .pp-story-inner {
            grid-template-columns: 1fr;
          }

          .pp-editorial-image {
            height: 430px;
          }

          .pp-editorial-copy {
            padding: 10px 0 30px;
          }

          .pp-selfcare-copy {
            text-align: center;
          }

          .pp-selfcare-copy > p {
            margin-left: auto;
            margin-right: auto;
          }

          .pp-selfcare-image {
            min-height: 460px;
          }

          .pp-selfcare-image-element {
            min-height: 460px;
          }

          .pp-trust-inner {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .pp-trust-item:nth-child(2) {
            border-right: 0;
          }

          .pp-trust-item:nth-child(-n + 2) {
            border-bottom: 1px solid
              rgba(255, 255, 255, 0.09);
          }

          .pp-story-image {
            min-height: 390px;
          }

          .pp-story-copy {
            padding: 55px 35px;
          }
        }


        /* =================================================
           RESPONSIVE — MOBILE
        ================================================= */

        @media (max-width: 520px) {

          .pp-section-container,
          .pp-editorial-inner,
          .pp-selfcare-inner,
          .pp-trust-inner,
          .pp-story-inner {
            width: calc(100% - 32px);
          }

          .pp-products-section {
            padding: 60px 0;
          }

          .pp-product-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
            gap: 24px 12px;
          }

          .pp-editorial {
            padding: 65px 0;
          }

          .pp-editorial-image {
            height: 350px;
          }

          .pp-editorial-copy h2 {
            font-size: 43px;
          }

          .pp-selfcare {
            padding: 65px 0;
          }

          .pp-selfcare-image {
            min-height: 380px;
          }

          .pp-selfcare-image-element {
            min-height: 380px;
          }

          .pp-selfcare-image-overlay {
            inset: 15px;
            padding: 20px;
          }

          .pp-selfcare-image-overlay span {
            font-size: 38px;
          }

          .pp-trust-inner {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .pp-trust-item,
          .pp-trust-item:nth-child(2) {
            min-height: 86px;
            border-right: 0;
            border-bottom: 1px solid
              rgba(255, 255, 255, 0.09);
          }

          .pp-trust-item:last-child {
            border-bottom: 0;
          }

          .pp-story {
            padding: 65px 0;
          }

          .pp-story-image {
            min-height: 330px;
          }

          .pp-story-copy {
            padding: 45px 25px;
          }

          .pp-story-copy h2 {
            font-size: 42px;
          }

          .pp-cart-toast {
            right: 12px;
            bottom: 12px;
            left: 12px;
            min-width: 0;
            max-width: none;
          }
        }

      `}</style>
    </>
  );
}


/* =========================================================
   SHOPPING BAG ICON
========================================================= */

function ShoppingBagIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}