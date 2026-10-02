"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import Header from "../../components/storefront/Header";
import Footer from "../../components/storefront/Footer";
import ProductCard from "../../components/storefront/ProductCard";
import { getProducts } from "../../lib/storeApi";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const value =
      new URLSearchParams(window.location.search).get("q") || "";
    setQuery(value);

    if (value) {
      runSearch(value);
    }
  }, []);

  async function runSearch(value = query) {
    const clean = String(value || "").trim();

    if (!clean) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const data = await getProducts({
        search: clean,
      });
      setProducts(data);
      window.history.replaceState(
        {},
        "",
        `/search?q=${encodeURIComponent(clean)}`
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Search is temporarily unavailable."
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="search-page">
        <section className="search-hero">
          <div>
            <span>Polish &amp; Pay Search</span>
            <h1>
              Find something
              <br />
              <em>lovely.</em>
            </h1>
          </div>

          <div className="search-script">
            Search the edit.
            <br />
            <small>♡</small>
          </div>
        </section>

        <section className="search-content">
          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
          >
            <Search size={20} strokeWidth={1.3} />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search beauty, fragrance, self-care..."
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setProducts([]);
                  setSearched(false);
                  window.history.replaceState(
                    {},
                    "",
                    "/search"
                  );
                }}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

            <button
              type="submit"
              className="search-submit"
              disabled={loading}
            >
              Search
              <ArrowRight size={16} />
            </button>
          </form>

          {error && (
            <div className="search-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="search-state">
              <Sparkles className="search-spin" />
              <span>Looking through the edit...</span>
            </div>
          ) : searched ? (
            products.length ? (
              <>
                <div className="search-heading">
                  <div>
                    <span>RESULTS</span>
                    <h2>
                      {products.length}{" "}
                      {products.length === 1
                        ? "find"
                        : "finds"}{" "}
                      for <em>“{query}”</em>
                    </h2>
                  </div>
                </div>

                <div className="search-grid">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={async (item) => {
                        const { addToCart } =
                          await import("../../lib/storeApi");
                        await addToCart(item.id, 1);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="search-empty">
                <Sparkles size={25} />
                <span>No matches yet</span>
                <h2>
                  Let's try
                  <br />
                  something else.
                </h2>
                <p>
                  We couldn't find anything matching
                  your search. Try a different product,
                  category or beauty essential.
                </p>
                <a href="/shop" className="store-button-dark">
                  Browse Everything
                  <ArrowRight size={16} />
                </a>
              </div>
            )
          ) : (
            <div className="search-empty search-empty-start">
              <Sparkles size={25} />
              <span>Take your time</span>
              <h2>
                What are you
                <br />
                looking <em>for?</em>
              </h2>
              <p>
                Search our beauty, wellness, fragrance
                and lifestyle edit.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .search-page {
          min-height: 100vh;
          background: #fffaf8;
          color: #211b1c;
        }

        .search-hero {
          min-height: 320px;
          padding: 55px max(36px, calc((100% - 1280px) / 2));
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(105deg,#f7e3df,#fdf3f0 54%,#ead1ca);
        }

        .search-hero > div:first-child span {
          color: #b86676;
          font: 700 8px/1 "DM Sans",sans-serif;
          letter-spacing:.2em;
          text-transform:uppercase;
        }

        .search-hero h1 {
          margin: 14px 0 0;
          font: 500 clamp(56px,6vw,82px)/.84 "Playfair Display",Georgia,serif;
          letter-spacing:-.06em;
        }

        .search-hero h1 em {
          color:#b86676;
          font-style:italic;
        }

        .search-script {
          margin-right: 70px;
          color:#fff;
          font:400 48px/.8 "Sacramento",cursive;
          text-align:center;
          transform:rotate(-5deg);
        }

        .search-script small {
          display:block;
          margin-top:13px;
          font:400 22px/1 "DM Sans",sans-serif;
        }

        .search-content {
          width:min(1280px,calc(100% - 72px));
          margin:0 auto;
          padding:60px 0 110px;
        }

        .search-form {
          min-height:62px;
          display:grid;
          grid-template-columns:auto 1fr auto auto;
          align-items:center;
          gap:14px;
          padding:0 16px;
          border:1px solid rgba(33,27,28,.13);
          background:#fff;
          box-shadow:0 14px 40px rgba(33,27,28,.04);
        }

        .search-form > svg {
          color:#b86676;
        }

        .search-form input {
          width:100%;
          min-width:0;
          border:0;
          outline:0;
          color:#211b1c;
          background:transparent;
          font:400 13px "DM Sans",sans-serif;
        }

        .search-form > button:not(.search-submit) {
          border:0;
          background:transparent;
          color:#8d7c80;
        }

        .search-submit {
          min-height:44px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          padding:0 19px;
          border:0;
          background:#211b1c;
          color:#fff;
          font:700 8px/1 "DM Sans",sans-serif;
          letter-spacing:.14em;
          text-transform:uppercase;
        }

        .search-heading {
          margin-top:55px;
          margin-bottom:28px;
        }

        .search-heading span {
          color:#b86676;
          font:700 8px/1 "DM Sans",sans-serif;
          letter-spacing:.18em;
        }

        .search-heading h2 {
          margin:11px 0 0;
          font:500 37px/.98 "Playfair Display",Georgia,serif;
          letter-spacing:-.045em;
        }

        .search-heading em {
          color:#b86676;
        }

        .search-grid {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:40px 22px;
        }

        .search-state,
        .search-empty {
          min-height:430px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          text-align:center;
          border:1px solid rgba(33,27,28,.07);
          background:linear-gradient(145deg,#f7e3df,#fffaf8);
        }

        .search-state {
          margin-top:35px;
          color:#b86676;
          gap:13px;
          font:700 8px/1 "DM Sans",sans-serif;
          letter-spacing:.16em;
          text-transform:uppercase;
        }

        .search-empty > svg {
          color:#b86676;
        }

        .search-empty > span {
          margin-top:15px;
          color:#b86676;
          font:700 8px/1 "DM Sans",sans-serif;
          letter-spacing:.18em;
          text-transform:uppercase;
        }

        .search-empty h2 {
          margin:12px 0 0;
          font:500 49px/.9 "Playfair Display",Georgia,serif;
          letter-spacing:-.05em;
        }

        .search-empty h2 em {
          color:#b86676;
          font-style:italic;
        }

        .search-empty p {
          max-width:390px;
          margin:16px 0 25px;
          color:#7d6e71;
          font:400 10px/1.7 "DM Sans",sans-serif;
        }

        .search-spin {
          animation:searchSpin 1s linear infinite;
        }

        @keyframes searchSpin {
          to { transform:rotate(360deg); }
        }

        @media(max-width:850px) {
          .search-hero { padding:45px 32px; }
          .search-script { display:none; }
          .search-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }

        @media(max-width:600px) {
          .search-content { width:calc(100% - 32px); padding-top:35px; }
          .search-form { grid-template-columns:auto 1fr auto; }
          .search-submit { grid-column:1 / -1; }
          .search-grid { grid-template-columns:1fr 1fr; gap:28px 13px; }
        }
      `}</style>
    </>
  );
}
