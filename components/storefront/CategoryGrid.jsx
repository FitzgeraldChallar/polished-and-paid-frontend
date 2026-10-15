"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Leaf } from "lucide-react";
import { getCategories } from "../../lib/storeApi";

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (mounted) {
          setCategories(Array.isArray(data) ? data : []);
          setLoadError(false);
        }
      } catch (error) {
        console.error("Unable to load categories:", error);
        if (mounted) {
          setCategories([]);
          setLoadError(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCategories();
    return () => { mounted = false; };
  }, []);

  // Do not invent or substitute categories: this section reflects backend data only.
  if (!loading && categories.length === 0 && !loadError) return null;

  return (
    <section className="pp-shop-category-section" aria-labelledby="pp-shop-category-heading">
      <div className="pp-category-container">
        <div className="pp-category-heading-row">
          <span className="pp-category-heading-rule" aria-hidden="true" />
          <h2 id="pp-shop-category-heading">Shop by Category</h2>
          <span className="pp-category-heading-rule" aria-hidden="true" />
        </div>

        {loading ? (
          <div className="pp-category-grid" aria-label="Loading categories">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="pp-category-skeleton" key={index}>
                <div className="pp-category-skeleton-image" />
                <div className="pp-category-skeleton-label" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <p className="pp-category-feedback" role="status">
            Categories are temporarily unavailable. Please try again shortly.
          </p>
        ) : (
          <div className="pp-category-grid">
            {categories.map((category) => (
              <a
                className="pp-category-card"
                key={category.id || category.slug}
                href={`/shop?category=${encodeURIComponent(category.slug || "")}`}
                aria-label={`Shop ${category.name}`}
              >
                <div className="pp-category-card-media">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.parentElement?.classList.add("is-image-missing");
                      }}
                    />
                  ) : (
                    <div className="pp-category-no-image" aria-hidden="true">
                      <Leaf size={28} strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="pp-category-card-shade" />
                  <div className="pp-category-card-copy">
                    <h3>{category.name}</h3>
                    <span className="pp-category-shop-link">
                      Shop Now <ArrowRight size={12} strokeWidth={1.7} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .pp-shop-category-section {
          width: 100%;
          padding: 24px 0 20px;
          background: #fffaf8;
        }
        .pp-category-container {
          width: min(1348px, calc(100% - 44px));
          margin: 0 auto;
        }
        .pp-category-heading-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          margin: 0 auto 18px;
        }
        .pp-category-heading-row h2 {
          flex: 0 0 auto;
          margin: 0;
          color: #24191b;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(17px, 1.55vw, 24px);
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: .22em;
          text-align: center;
          text-transform: uppercase;
        }
        .pp-category-heading-rule {
          width: clamp(34px, 8vw, 112px);
          height: 1px;
          background: #b9a3a1;
        }
        .pp-category-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 13px;
        }
        .pp-category-card {
          display: block;
          min-width: 0;
          color: inherit;
          text-decoration: none;
          border-radius: 5px;
          outline-offset: 4px;
        }
        .pp-category-card-media {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          aspect-ratio: 1.02 / 1;
          border-radius: 5px;
          background: linear-gradient(145deg, #f4deda, #d9b7ae 55%, #6e4543);
          box-shadow: 0 2px 8px rgba(44, 25, 26, .09);
        }
        .pp-category-card-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          transition: transform 450ms cubic-bezier(.2,.65,.3,1);
        }
        .pp-category-card:hover .pp-category-card-media img {
          transform: scale(1.055);
        }
        .pp-category-card-shade {
          position: absolute;
          inset: 30% 0 0;
          z-index: 1;
          background: linear-gradient(180deg, transparent 0%, rgba(30, 14, 17, .12) 23%, rgba(25, 12, 14, .76) 100%);
          pointer-events: none;
        }
        .pp-category-card-copy {
          position: absolute;
          z-index: 2;
          inset: auto 7px 9px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          text-align: center;
          color: #fff;
        }
        .pp-category-card-copy h3 {
          max-width: 100%;
          margin: 0;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(11px, .95vw, 15px);
          font-weight: 500;
          line-height: 1.25;
          text-shadow: 0 1px 5px rgba(0,0,0,.32);
          overflow-wrap: anywhere;
        }
        .pp-category-shop-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 23px;
          padding: 4px 12px;
          border-radius: 2px;
          background: #e7a0a5;
          color: #211719;
          font-family: "DM Sans", Arial, sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          transition: background 180ms ease, transform 180ms ease;
        }
        .pp-category-card:hover .pp-category-shop-link {
          background: #f4c4c5;
          transform: translateY(-1px);
        }
        .pp-category-no-image {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,.88);
          background: linear-gradient(145deg, #f0d5d1, #b77d7f 65%, #6d4548);
        }
        .pp-category-card-media.is-image-missing img { display: none; }
        .pp-category-feedback {
          margin: 0;
          padding: 28px 12px;
          color: #8a7375;
          text-align: center;
          font-size: 13px;
        }
        .pp-category-skeleton { min-width: 0; }
        .pp-category-skeleton-image {
          aspect-ratio: 1.02 / 1;
          border-radius: 5px;
          background: linear-gradient(90deg, #f0e5e1 25%, #f8efec 50%, #f0e5e1 75%);
          background-size: 200% 100%;
          animation: ppCategoryShimmer 1.4s linear infinite;
        }
        .pp-category-skeleton-label {
          width: 62%;
          height: 8px;
          margin: 9px auto 0;
          border-radius: 4px;
          background: #eee2df;
        }
        @keyframes ppCategoryShimmer {
          to { background-position: -200% 0; }
        }
        @media (min-width: 1500px) {
          .pp-category-card-media { aspect-ratio: 1.05 / 1; }
        }
        @media (max-width: 1050px) {
          .pp-category-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
          .pp-category-card-copy h3 { font-size: 13px; }
        }
        @media (max-width: 640px) {
          .pp-shop-category-section { padding: 22px 0 16px; }
          .pp-category-container { width: calc(100% - 28px); }
          .pp-category-heading-row { gap: 10px; margin-bottom: 14px; }
          .pp-category-heading-row h2 { font-size: 15px; letter-spacing: .13em; }
          .pp-category-heading-rule { width: 24px; }
          .pp-category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .pp-category-card-media { aspect-ratio: 1.08 / 1; }
          .pp-category-card-copy { inset: auto 6px 8px; gap: 6px; }
          .pp-category-card-copy h3 { font-size: 13px; }
          .pp-category-shop-link { min-height: 22px; padding: 4px 10px; font-size: 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pp-category-card-media img, .pp-category-shop-link { transition: none; }
          .pp-category-skeleton-image { animation: none; }
        }
      `}</style>
    </section>
  );
}
