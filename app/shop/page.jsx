"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Check,
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import Header from "../../components/storefront/Header";
import Footer from "../../components/storefront/Footer";
import ProductCard from "../../components/storefront/ProductCard";

import {
  getProducts,
  addToCart,
} from "../../lib/storeApi";


/* =========================================================
   CATEGORY NAME
========================================================= */

function categoryName(product) {
  return (
    product?.category_name ||
    product?.category?.name ||
    product?.category?.title ||
    "Uncategorized"
  );
}


const categorySlugMap = {
  "beauty-skincare": "Beauty & Skincare",
  fragrance: "Fragrance",
  "jewelry-beads": "Jewelry & Beads",
  "hair-products": "Hair Products",
  "self-care": "Self-Care",
  "health-supplements": "Health & Supplements",
  household: "Household",
  "digital-products": "Digital Products",
  "african-sponge-bath": "African Sponge Bath",
  "mens-care": "Men’s Care",
  "men-s-care": "Men’s Care",
  "wigs-closures": "Wigs & Closures",
  "nursing-heads": "Nursing Heads",
};

function normalizeCategory(value) {
  if (!value) return "All";

  const raw = decodeURIComponent(
    String(value)
  ).trim();

  if (!raw) return "All";

  const slug = raw
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[’']/g, "")
    .replace(/\s+/g, "-");

  return categorySlugMap[slug] || raw;
}


/* =========================================================
   PRICE
========================================================= */

function price(product) {
  const regular = Number(
    product?.price ??
      product?.selling_price ??
      0
  );

  const sale = Number(
    product?.sale_price ??
      0
  );

  return {
    regular,

    sale:
      sale > 0 &&
      sale < regular
        ? sale
        : null,
  };
}


/* =========================================================
   PRODUCT SEARCH TEXT
========================================================= */

function productText(product) {
  return [
    product?.name,
    product?.description,
    product?.short_description,
    product?.sku,
    categoryName(product),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


/* =========================================================
   CATEGORY ROW
========================================================= */

function CategoryRow({
  name,
  count,
  active,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const rowStyle = {
    position: "relative",

    display: "grid",

    gridTemplateColumns:
      "16px minmax(0, 1fr) auto",

    alignItems: "center",

    width: "100%",

    minWidth: 0,

    minHeight: "48px",

    margin: 0,

    padding:
      "0 10px 0 6px",

    border:
      active
        ? "1px solid #c47b8a"
        : isHovered
          ? "1px solid #d9a0aa"
          : "1px solid transparent",

    borderRadius: "10px",

    boxSizing: "border-box",

    background:
      active
        ? "linear-gradient(105deg, #f7e0e3 0%, #edc6cc 100%)"
        : isHovered
          ? "linear-gradient(105deg, #fff8f9 0%, #f5e0e3 100%)"
          : "transparent",

    color:
      active
        ? "#8f4558"
        : isHovered
          ? "#9a5363"
          : "#4b4547",

    boxShadow:
      active
        ? "0 8px 20px rgba(112, 57, 70, 0.14)"
        : isHovered
          ? "0 6px 18px rgba(112, 57, 70, 0.09)"
          : "none",

    transform:
      isPressed
        ? "translate3d(4px, 0, 0) scale(0.985)"
        : isHovered || active
          ? "translate3d(5px, 0, 0)"
          : "translate3d(0, 0, 0)",

    transition:
      "background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease",

    cursor: "pointer",

    textAlign: "left",

    outline: "none",

    appearance: "none",

    WebkitAppearance: "none",

    fontFamily:
      "inherit",
  };

  return (
    <button
      type="button"
      className="shop-category-row"
      style={rowStyle}
      onMouseEnter={() =>
        setIsHovered(true)
      }
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onFocus={() =>
        setIsHovered(true)
      }
      onBlur={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() =>
        setIsPressed(true)
      }
      onMouseUp={() =>
        setIsPressed(false)
      }
      onTouchStart={() =>
        setIsPressed(true)
      }
      onTouchEnd={() =>
        setIsPressed(false)
      }
      onClick={onClick}
      aria-pressed={active}
    >
      {/* Indicator */}
      <span
        aria-hidden="true"
        style={{
          width: "7px",

          height: "7px",

          borderRadius: "50%",

          background:
            active ||
            isHovered
              ? "#b86676"
              : "#d8c8cb",

          boxShadow:
            active ||
            isHovered
              ? "0 0 0 4px rgba(184, 102, 118, 0.10)"
              : "none",

          transform:
            active ||
            isHovered
              ? "scale(1)"
              : "scale(0.8)",

          transition:
            "background 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        }}
      />

      {/* Category name */}
      <span
        style={{
          minWidth: 0,

          overflow: "hidden",

          textOverflow:
            "ellipsis",

          whiteSpace:
            "nowrap",

          fontFamily:
            '"DM Sans", sans-serif',

          fontSize:
            "12px",

          fontWeight:
            active
              ? 700
              : 500,

          lineHeight: 1.2,

          letterSpacing:
            "0.01em",

          color:
            active
              ? "#8f4558"
              : isHovered
                ? "#9a5363"
                : "#4b4547",

          transition:
            "color 180ms ease, font-weight 180ms ease",
        }}
      >
        {name}
      </span>

      {/* Product count */}
      <span
        style={{
          minWidth:
            "24px",

          padding:
            "3px 6px",

          borderRadius:
            "999px",

          background:
            active
              ? "rgba(255, 255, 255, 0.72)"
              : isHovered
                ? "rgba(255, 255, 255, 0.82)"
                : "rgba(247, 238, 239, 0.78)",

          color:
            active
              ? "#9a5363"
              : isHovered
                ? "#a15b6b"
                : "#9b8a8e",

          fontFamily:
            '"DM Sans", sans-serif',

          fontSize:
            "10px",

          fontWeight: 700,

          lineHeight: 1,

          letterSpacing:
            "0.03em",

          textAlign:
            "center",

          transition:
            "background 180ms ease, color 180ms ease",
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* =========================================================
   SKELETON CARD
========================================================= */

function SkeletonCard() {
  return (
    <div className="shop-skeleton-card">
      <div className="shop-skeleton-image" />

      <div className="shop-skeleton-category" />

      <div className="shop-skeleton-title" />

      <div className="shop-skeleton-price" />
    </div>
  );
}


/* =========================================================
   SHOP HERO SLIDES
========================================================= */

const shopHeroSlides = [
  {
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1800&q=88",
    eyebrow: "THE BEAUTY EDIT",
    title: "Beauty,",
    emphasis: "beautifully.",
    copy: "Discover skincare, makeup and beauty essentials selected to make every ritual feel a little more luxurious.",
    tag: "Beauty essentials",
  },
  {
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1800&q=88",
    eyebrow: "THE SELF-CARE EDIT",
    title: "Make time,",
    emphasis: "for you.",
    copy: "Beautiful self-care essentials for slower mornings, softer evenings and everything in between.",
    tag: "Self-care rituals",
  },
  {
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=88",
    eyebrow: "THE WELLNESS EDIT",
    title: "Feel good,",
    emphasis: "every day.",
    copy: "Thoughtfully selected wellness and lifestyle finds designed to complement the way you live.",
    tag: "Wellness & lifestyle",
  },
  {
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1800&q=88",
    eyebrow: "THE GLOW EDIT",
    title: "Find your,",
    emphasis: "glow.",
    copy: "From everyday favorites to something wonderfully new, find pieces that make your routine shine.",
    tag: "Curated favorites",
  },
];


/* =========================================================
   SHOP PAGE
========================================================= */

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("All");

  const [
    sort,
    setSort,
  ] = useState("all");

  const [
    mobileFilters,
    setMobileFilters,
  ] = useState(false);

  const [
    cartMessage,
    setCartMessage,
  ] = useState("");


  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((current) =>
        (current + 1) % shopHeroSlides.length
      );
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);


  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response =
          await getProducts();

        if (!mounted) {
          return;
        }

        const data =
          Array.isArray(response)
            ? response
            : response?.results ||
              response?.data ||
              response?.products ||
              [];

        setProducts(data);
      } catch (error) {
        console.error(
          "Shop loading error:",
          error
        );

        setProducts([]);
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
  }, []);


  /* =======================================================
     URL FILTERS

     Next.js updates the URL client-side when a Header link
     is clicked. React must therefore listen to the query
     string instead of reading window.location only once.
  ======================================================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        searchParamsString
      );

    const q = params.get("q") || "";
    const cat = params.get("category");
    const isNew =
      params.get("new") === "true";
    const isFeatured =
      params.get("featured") === "true";
    const isBest =
      params.get("bestseller") === "true";

    setSearch(q);
    setCategory(
      cat
        ? normalizeCategory(cat)
        : "All"
    );

    if (isNew) {
      setSort("newest");
    } else if (isFeatured) {
      setSort("featured");
    } else if (isBest) {
      setSort("bestseller");
    } else {
      setSort("all");
    }
  }, [searchParamsString]);


  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories =
    useMemo(() => {
      const counts = {};

      products.forEach(
        (product) => {
          const name =
            categoryName(product);

          counts[name] =
            (counts[name] || 0) + 1;
        }
      );

      return Object.entries(
        counts
      ).sort(
        ([a], [b]) =>
          a.localeCompare(b)
      );
    }, [products]);


  /* =======================================================
     FILTERED PRODUCTS
  ======================================================= */

  const filtered =
    useMemo(() => {
      let result =
        [...products];


      /* SEARCH */

      if (search.trim()) {
        const query =
          search
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (product) =>
              productText(
                product
              ).includes(query)
          );
      }


      /* CATEGORY */

      if (
        category !== "All"
      ) {
        result =
          result.filter(
            (product) =>
              categoryName(
                product
              ).toLowerCase() ===
              category.toLowerCase()
          );
      }


      /* FEATURED */

      if (
        sort === "featured"
      ) {
        result =
          result.filter(
            (product) =>
              Boolean(
                product?.is_featured ??
                  product?.featured
              )
          );
      }


      /* BEST SELLERS */

      if (
        sort === "bestseller"
      ) {
        result =
          result.filter(
            (product) =>
              Boolean(
                product?.is_bestseller ??
                  product?.bestseller
              )
          );
      }


      /* NEWEST */

      if (
        sort === "newest"
      ) {
        result.sort(
          (a, b) =>
            new Date(
              b?.created_at ||
                b?.createdAt ||
                0
            ) -
            new Date(
              a?.created_at ||
                a?.createdAt ||
                0
            )
        );
      }


      /* PRICE LOW */

      if (
        sort === "price-low"
      ) {
        result.sort(
          (a, b) =>
            (
              price(a).sale ??
              price(a).regular
            ) -
            (
              price(b).sale ??
              price(b).regular
            )
        );
      }


      /* PRICE HIGH */

      if (
        sort === "price-high"
      ) {
        result.sort(
          (a, b) =>
            (
              price(b).sale ??
              price(b).regular
            ) -
            (
              price(a).sale ??
              price(a).regular
            )
        );
      }


      /* NAME */

      if (
        sort === "name"
      ) {
        result.sort(
          (a, b) =>
            String(
              a?.name || ""
            ).localeCompare(
              String(
                b?.name || ""
              )
            )
        );
      }


      return result;
    }, [
      products,
      search,
      category,
      sort,
    ]);


  /* =======================================================
     ADD TO CART
  ======================================================= */

  async function handleAddToCart(
    product
  ) {
    try {
      await addToCart(
        product.id,
        1
      );

      setCartMessage(
        `${product.name} was added to your bag.`
      );

      window.setTimeout(
        () =>
          setCartMessage(""),
        2800
      );
    } catch (error) {
      console.error(
        "Cart error:",
        error
      );

      setCartMessage(
        error?.data?.detail ||
          error?.response?.data?.detail ||
          "We couldn't add that item to your bag."
      );

      window.setTimeout(
        () =>
          setCartMessage(""),
        3000
      );
    }
  }


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setSort("all");

    router.replace("/shop");
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />


      <main className="shop-page">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="shop-hero" aria-label="Polish & Pay featured collections">

          <div className="shop-hero-slides" aria-hidden="true">
            {shopHeroSlides.map((slide, index) => (
              <div
                key={slide.image}
                className={`shop-hero-slide ${index === heroSlide ? "is-active" : ""}`}
              >
                <img
                  src={slide.image}
                  alt=""
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <div className="shop-hero-overlay" />
          <div className="shop-hero-glow" />
          <div className="shop-hero-grain" />

          <div className="shop-container shop-hero-inner">

            <div className="shop-hero-copy">
              <div className="shop-hero-kicker">
                <span className="shop-eyebrow">
                  {shopHeroSlides[heroSlide].eyebrow}
                </span>
                <span className="shop-hero-rule" />
                <span className="shop-hero-index">
                  0{heroSlide + 1} / 0{shopHeroSlides.length}
                </span>
              </div>

              <div className="shop-hero-heading-wrap">
                <h1 key={`title-${heroSlide}`}>
                  {shopHeroSlides[heroSlide].title}
                  <br />
                  <em>{shopHeroSlides[heroSlide].emphasis}</em>
                </h1>
              </div>

              <p key={`copy-${heroSlide}`}>
                {shopHeroSlides[heroSlide].copy}
              </p>

              <div className="shop-hero-actions">
                <a href="#shop-products" className="shop-hero-button">
                  <span>Explore the edit</span>
                  <ChevronDown size={15} strokeWidth={1.5} />
                </a>

                <span className="shop-hero-tag">
                  {shopHeroSlides[heroSlide].tag}
                </span>
              </div>
            </div>

            <div className="shop-hero-art">
              <div className="shop-hero-art-frame">
                <span className="shop-hero-art-word">POLISH &amp; PAY</span>
                <span className="shop-hero-art-script">
                  Look good.
                  <br />
                  Feel good.
                </span>
                <span className="shop-hero-art-heart">♡</span>
              </div>
            </div>

            <div className="shop-hero-controls">
              <div className="shop-hero-dots" role="tablist" aria-label="Featured shop slides">
                {shopHeroSlides.map((slide, index) => (
                  <button
                    key={slide.tag}
                    type="button"
                    role="tab"
                    aria-selected={index === heroSlide}
                    aria-label={`Show ${slide.tag}`}
                    className={index === heroSlide ? "is-active" : ""}
                    onClick={() => setHeroSlide(index)}
                  >
                    <span />
                  </button>
                ))}
              </div>

              <div className="shop-hero-progress">
                <span
                  key={heroSlide}
                  className="is-running"
                />
              </div>
            </div>

          </div>

        </section>


        {/* =================================================
            SHOP CONTENT
        ================================================= */}

        <section id="shop-products" className="shop-section">

          <div className="shop-container">

            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="shop-toolbar">

              <form
                className="shop-search"
                onSubmit={(event) =>
                  event.preventDefault()
                }
              >

                <Search
                  size={17}
                  strokeWidth={1.4}
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products..."
                  type="search"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}

              </form>


              <button
                type="button"
                className="shop-mobile-filter"
                onClick={() =>
                  setMobileFilters(
                    true
                  )
                }
              >
                <SlidersHorizontal
                  size={15}
                />

                <span>
                  Filters
                </span>
              </button>


              <div className="shop-sort-control">

                <span>
                  Sort
                </span>

                <div>

                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(
                        event.target.value
                      )
                    }
                  >

                    <option value="all">
                      All Products
                    </option>

                    <option value="newest">
                      Newest
                    </option>

                    <option value="featured">
                      Featured
                    </option>

                    <option value="bestseller">
                      Best Sellers
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>

                    <option value="name">
                      Name
                    </option>

                  </select>

                  <ChevronDown
                    size={14}
                  />

                </div>

              </div>

            </div>


            {/* =================================================
                MAIN LAYOUT
            ================================================= */}

            <div className="shop-layout">

              {/* =================================================
                  SIDEBAR
              ================================================= */}

              <aside className="shop-sidebar">

                <div className="shop-sidebar-title">

                  <div>
                    <span>
                      Shop by
                    </span>

                    <strong>
                      Category
                    </strong>
                  </div>

                  <Filter
                    size={16}
                    strokeWidth={1.25}
                  />

                </div>


                <div className="shop-categories">

                  <CategoryRow
                    name="All Products"
                    count={
                      products.length
                    }
                    active={
                      category === "All"
                    }
                    onClick={() =>
                      setCategory(
                        "All"
                      )
                    }
                  />


                  {categories.map(
                    ([name, count]) => (
                      <CategoryRow
                        key={name}
                        name={name}
                        count={count}
                        active={
                          category.toLowerCase() ===
                          name.toLowerCase()
                        }
                        onClick={() =>
                          setCategory(
                            name
                          )
                        }
                      />
                    )
                  )}

                </div>


                <div className="shop-sidebar-divider" />


                <div className="shop-sidebar-note">

                  <div className="shop-sidebar-note-icon">

                    <Sparkles
                      size={17}
                      strokeWidth={1.15}
                    />

                  </div>

                  <span>
                    The Polish & Pay Edit
                  </span>

                  <p>
                    Beautiful things,
                    thoughtfully chosen
                    for your everyday.
                  </p>

                </div>

              </aside>


              {/* =================================================
                  PRODUCTS
              ================================================= */}

              <div className="shop-products">

                <div className="shop-products-heading">

                  <div>

                    <span>
                      Collection
                    </span>

                    <h2>
                      {category === "All"
                        ? "All Products"
                        : category}
                    </h2>

                  </div>

                  <p>
                    {loading
                      ? "Loading..."
                      : `${filtered.length} ${
                          filtered.length === 1
                            ? "product"
                            : "products"
                        }`}
                  </p>

                </div>


                {loading ? (

                  <div className="shop-product-grid">

                    {Array.from(
                      {
                        length: 8,
                      }
                    ).map(
                      (_, index) => (
                        <SkeletonCard
                          key={index}
                        />
                      )
                    )}

                  </div>

                ) : filtered.length ? (

                  <div className="shop-product-grid">

                    {filtered.map(
                      (product) => (
                        <ProductCard
                          key={
                            product.id
                          }
                          product={
                            product
                          }
                          onAddToCart={
                            handleAddToCart
                          }
                        />
                      )
                    )}

                  </div>

                ) : (

                  <div className="shop-empty">

                    <Sparkles
                      size={26}
                      strokeWidth={1}
                    />

                    <span>
                      Nothing found
                    </span>

                    <h2>
                      Let's try
                      <br />
                      something else.
                    </h2>

                    <p>
                      We couldn't find
                      products matching
                      your current filters.
                    </p>

                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                    >
                      Clear Filters
                    </button>

                  </div>

                )}

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            MOBILE FILTER DRAWER
        ================================================= */}

        {mobileFilters && (

          <div className="shop-mobile-panel">

            <button
              type="button"
              className="shop-mobile-backdrop"
              onClick={() =>
                setMobileFilters(
                  false
                )
              }
              aria-label="Close filters"
            />


            <aside className="shop-mobile-drawer">

              <div className="shop-mobile-header">

                <div>

                  <span>
                    Refine
                  </span>

                  <h2>
                    Filters
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMobileFilters(
                      false
                    )
                  }
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>

              </div>


              <div className="shop-mobile-body">

                <span className="shop-mobile-label">
                  Shop by Category
                </span>


                <div className="shop-mobile-categories">

                  <CategoryRow
                    name="All Products"
                    count={
                      products.length
                    }
                    active={
                      category === "All"
                    }
                    onClick={() =>
                      setCategory(
                        "All"
                      )
                    }
                  />


                  {categories.map(
                    ([name, count]) => (
                      <CategoryRow
                        key={name}
                        name={name}
                        count={count}
                        active={
                          category.toLowerCase() ===
                          name.toLowerCase()
                        }
                        onClick={() =>
                          setCategory(
                            name
                          )
                        }
                      />
                    )
                  )}

                </div>

              </div>


              <div className="shop-mobile-footer">

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="shop-mobile-clear"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMobileFilters(
                      false
                    )
                  }
                  className="shop-mobile-show"
                >
                  Show{" "}
                  {filtered.length}{" "}
                  {filtered.length === 1
                    ? "Product"
                    : "Products"}
                </button>

              </div>

            </aside>

          </div>

        )}

      </main>


      {/* =================================================
          CART TOAST
      ================================================= */}

      {cartMessage && (

        <div className="shop-toast">

          <div>
            <Check size={16} />
          </div>

          <span>
            {cartMessage}
          </span>

        </div>

      )}


      <Footer />


      {/* =================================================
          STYLES
      ================================================= */}

      <style jsx>{`

        /* =================================================
           BASE
        ================================================= */

        .shop-page {
          min-height: 100vh;
          background: #fffaf8;
          color: #211b1c;
          overflow-x: hidden;
        }

        .shop-container {
          width: min(
            1320px,
            calc(100% - 72px)
          );
          margin: 0 auto;
        }


        /* =================================================
           HERO
        ================================================= */

        .shop-hero {
          position: relative;
          min-height: 510px;
          overflow: hidden;
          isolation: isolate;
          color: #fff;
          background: #33272a;
          border-bottom: 1px solid rgba(33, 27, 28, 0.1);
        }

        .shop-hero-slides,
        .shop-hero-slide,
        .shop-hero-slide img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .shop-hero-slides {
          z-index: -4;
        }

        .shop-hero-slide {
          opacity: 0;
          transform: scale(1.035);
          transition: opacity 900ms ease, transform 6000ms ease;
        }

        .shop-hero-slide.is-active {
          opacity: 1;
          transform: scale(1);
        }

        .shop-hero-slide img {
          object-fit: cover;
          object-position: center;
          filter: saturate(0.82) contrast(1.04);
        }

        .shop-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: -3;
          background:
            linear-gradient(90deg, rgba(34, 25, 27, 0.91) 0%, rgba(50, 35, 39, 0.75) 38%, rgba(68, 43, 49, 0.26) 72%, rgba(30, 23, 25, 0.3) 100%),
            linear-gradient(180deg, rgba(24, 18, 20, 0.08), rgba(24, 18, 20, 0.42));
        }

        .shop-hero-glow {
          position: absolute;
          z-index: -2;
          width: 560px;
          height: 560px;
          right: 7%;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(242, 170, 183, 0.35), rgba(242, 170, 183, 0) 68%);
          filter: blur(5px);
          pointer-events: none;
        }

        .shop-hero-grain {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.17;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E");
          mix-blend-mode: soft-light;
        }

        .shop-hero-inner {
          position: relative;
          min-height: 510px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 0.8fr);
          align-items: center;
          gap: 50px;
          padding-top: 65px;
          padding-bottom: 65px;
        }

        .shop-hero-copy {
          position: relative;
          z-index: 2;
          max-width: 690px;
          padding-bottom: 18px;
        }

        .shop-hero-kicker {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
        }

        .shop-hero .shop-eyebrow {
          margin: 0;
          color: #f3b6c0;
          font-size: 10px;
          letter-spacing: 0.22em;
        }

        .shop-hero-rule {
          width: 45px;
          height: 1px;
          background: rgba(255, 255, 255, 0.42);
        }

        .shop-hero-index {
          color: rgba(255, 255, 255, 0.64);
          font: 700 9px/1 "DM Sans", sans-serif;
          letter-spacing: 0.12em;
        }

        .shop-hero h1 {
          margin: 0;
          color: #fff;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(68px, 7.2vw, 108px);
          font-weight: 500;
          letter-spacing: -0.07em;
          line-height: 0.8;
          text-shadow: 0 12px 35px rgba(20, 13, 15, 0.18);
          animation: shopHeroTextIn 700ms cubic-bezier(0.2, 0.75, 0.25, 1);
        }

        .shop-hero h1 em {
          color: #f0a6b2;
          font-style: italic;
        }

        .shop-hero p {
          max-width: 545px;
          margin: 28px 0 0;
          color: rgba(255, 255, 255, 0.78);
          font-family: "DM Sans", sans-serif;
          font-size: 14px;
          line-height: 1.75;
          animation: shopHeroTextIn 850ms 80ms both cubic-bezier(0.2, 0.75, 0.25, 1);
        }

        .shop-hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 30px;
        }

        .shop-hero-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 49px;
          padding: 0 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.46);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(242, 166, 178, 0.32));
          color: #fff;
          box-shadow: 0 14px 30px rgba(22, 14, 17, 0.18), inset 0 1px 0 rgba(255,255,255,.32);
          backdrop-filter: blur(12px);
          font: 800 9px/1 "DM Sans", sans-serif;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 220ms ease, background 220ms ease;
        }

        .shop-hero-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,.4) 48%, transparent 72%);
          transform: translateX(-120%);
          transition: transform 650ms ease;
        }

        .shop-hero-button:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, rgba(255,255,255,.27), rgba(242,166,178,.45));
        }

        .shop-hero-button:hover::before {
          transform: translateX(120%);
        }

        .shop-hero-button span,
        .shop-hero-button svg {
          position: relative;
          z-index: 1;
        }

        .shop-hero-tag {
          color: rgba(255, 255, 255, 0.63);
          font: 500 11px/1 "DM Sans", sans-serif;
        }

        .shop-hero-art {
          position: relative;
          height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shop-hero-art-frame {
          position: relative;
          width: min(380px, 100%);
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.24);
          background: linear-gradient(145deg, rgba(255,255,255,.13), rgba(245,175,187,.06));
          box-shadow: 0 35px 80px rgba(20,12,15,.26), inset 0 1px 0 rgba(255,255,255,.26);
          backdrop-filter: blur(3px);
          transform: rotate(2.5deg);
        }

        .shop-hero-art-frame::before,
        .shop-hero-art-frame::after {
          content: "";
          position: absolute;
          border: 1px solid rgba(255,255,255,.18);
          pointer-events: none;
        }

        .shop-hero-art-frame::before {
          inset: 16px;
        }

        .shop-hero-art-frame::after {
          inset: 28px;
          border-color: rgba(240,166,178,.2);
        }

        .shop-hero-art-word {
          position: absolute;
          top: 30px;
          left: 32px;
          color: rgba(255,255,255,.68);
          font: 800 8px/1 "DM Sans", sans-serif;
          letter-spacing: .28em;
        }

        .shop-hero-art-script {
          color: #fff;
          font: 400 clamp(50px, 5vw, 73px)/.72 "Sacramento", cursive;
          text-align: center;
          text-shadow: 0 10px 30px rgba(20,10,13,.22);
        }

        .shop-hero-art-heart {
          position: absolute;
          right: 34px;
          bottom: 25px;
          color: #f3b4bf;
          font: 400 30px/1 "DM Sans", sans-serif;
        }

        .shop-hero-controls {
          position: absolute;
          left: 50%;
          bottom: 24px;
          z-index: 4;
          width: min(1320px, calc(100% - 72px));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          transform: translateX(-50%);
        }

        .shop-hero-dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shop-hero-dots button {
          width: 30px;
          height: 20px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .shop-hero-dots button span {
          display: block;
          width: 100%;
          height: 2px;
          background: rgba(255,255,255,.28);
          transition: background 220ms ease, transform 220ms ease;
        }

        .shop-hero-dots button.is-active span {
          background: #f2a8b5;
          transform: scaleY(1.7);
        }

        .shop-hero-progress {
          width: 110px;
          height: 1px;
          overflow: hidden;
          background: rgba(255,255,255,.2);
        }

        .shop-hero-progress span {
          display: block;
          width: 100%;
          height: 100%;
          background: #f2a8b5;
          transform-origin: left;
        }

        .shop-hero-progress .is-running {
          animation: shopHeroProgress 5.2s linear;
        }

        @keyframes shopHeroProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes shopHeroTextIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* =================================================
           SECTION
        ================================================= */

        .shop-section {
          padding:
            52px 0 110px;
        }


        /* =================================================
           TOOLBAR
        ================================================= */

        .shop-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 25px;

          padding-bottom: 25px;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.09
            );
        }

        .shop-search {
          display: flex;
          align-items: center;

          gap: 12px;

          width: 420px;
          height: 48px;

          padding:
            0 15px;

          border:
            1px solid
            rgba(
              184,
              102,
              118,
              0.4
            );

          background:
            #ffffff;

          color:
            #756568;
        }

        .shop-search input {
          flex: 1;
          min-width: 0;

          border: 0;
          outline: 0;

          background:
            transparent;

          color:
            #211b1c;

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 11px;
        }

        .shop-search input::placeholder {
          color:
            #aa9b9d;
        }

        .shop-search button {
          display: flex;

          border: 0;

          background:
            transparent;

          color:
            #76696b;

          cursor:
            pointer;
        }

        .shop-sort-control {
          display: flex;
          align-items: center;

          gap: 11px;

          color:
            #817376;

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 8px;
          font-weight: 700;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;
        }

        .shop-sort-control > div {
          position: relative;
        }

        .shop-sort-control select {
          appearance: none;

          min-width: 170px;
          height: 42px;

          padding:
            0 34px 0 13px;

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.11
            );

          outline: 0;

          background:
            #ffffff;

          color:
            #211b1c;

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 8px;
          font-weight: 700;

          letter-spacing:
            0.1em;

          text-transform:
            uppercase;

          cursor:
            pointer;
        }

        .shop-sort-control svg {
          position: absolute;

          right: 11px;
          top: 50%;

          transform:
            translateY(-50%);

          pointer-events:
            none;
        }

        .shop-mobile-filter {
          display: none;
        }


        /* =================================================
           LAYOUT
        ================================================= */

        .shop-layout {
          display: grid;

          grid-template-columns:
            235px
            minmax(0, 1fr);

          gap: 55px;

          padding-top: 42px;
        }


        /* =================================================
           SIDEBAR
        ================================================= */

        .shop-sidebar {
          align-self: start;

          position: sticky;

          top: 110px;

          min-width: 0;
        }


        /* =================================================
           SIDEBAR HEADER
        ================================================= */

        .shop-sidebar-title {
          display: flex;

          align-items: center;
          justify-content:
            space-between;

          padding:
            0 0 17px;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.09
            );

          color:
            #211b1c;
        }

        .shop-sidebar-title > div {
          display: flex;

          align-items:
            baseline;

          gap: 7px;
        }

        .shop-sidebar-title span {
          color:
            #b86676;

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 8px;

          font-weight: 700;

          letter-spacing:
            0.18em;

          text-transform:
            uppercase;
        }

        .shop-sidebar-title strong {
          color:
            #211b1c;

          font-family:
            "Playfair Display",
            Georgia,
            serif;

          font-size: 20px;

          font-weight: 500;

          letter-spacing:
            -0.03em;

          line-height:
            1;
        }

        .shop-sidebar-title svg {
          color:
            #786a6c;

          opacity:
            0.8;
        }


        /* =================================================
           CATEGORY LIST
        ================================================= */

        .shop-categories {
          display: flex;

          flex-direction:
            column;

          width: 100%;

          padding-top:
            10px;
        }


        /* =================================================
           CATEGORY ROW
        ================================================= */

        .shop-category-row {
          position: relative;

          appearance: none;

          display: grid;

          grid-template-columns:
            14px
            minmax(0, 1fr)
            auto;

          align-items:
            center;

          width: 100%;

          min-height:
            45px;

          padding:
            0 10px 0 5px;

          border:
            0;

          border-radius:
            6px;

          background:
            transparent;

          color:
            #6f6264;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            10px;

          font-weight:
            500;

          line-height:
            1;

          text-align:
            left !important;

          cursor:
            pointer;

          transition:
            background-color 180ms ease,
            color 180ms ease,
            transform 180ms ease;
        }


        /* =================================================
           CATEGORY INDICATOR
        ================================================= */

        .shop-category-indicator {
          display: flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            14px;

          height:
            14px;
        }

        .shop-category-indicator span {
          display: block;

          width:
            4px;

          height:
            4px;

          border-radius:
            50%;

          background:
            #d9ccce;

          opacity:
            0;

          transform:
            scale(0.6);

          transition:
            opacity 180ms ease,
            transform 180ms ease,
            background-color 180ms ease;
        }


        /* =================================================
           CATEGORY NAME
        ================================================= */

        .shop-category-name {
          min-width:
            0;

          overflow:
            hidden;

          padding-left:
            5px;

          color:
            inherit;

          text-align:
            left !important;

          white-space:
            nowrap;

          text-overflow:
            ellipsis;

          transition:
            color 180ms ease;
        }


        /* =================================================
           CATEGORY NUMBER
        ================================================= */

        .shop-category-number {
          display: inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-width:
            26px;

          height:
            22px;

          padding:
            0 7px;

          border-radius:
            999px;

          background:
            #f4ecea;

          color:
            #9b898c;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            600;

          line-height:
            1;

          transition:
            background-color 180ms ease,
            color 180ms ease;
        }


        /* =================================================
           HOVER
        ================================================= */

        .shop-category-row:hover {
          background:
            rgba(
              247,
              227,
              223,
              0.58
            );

          color:
            #b86676;

          transform:
            translateX(2px);
        }

        .shop-category-row:hover
        .shop-category-indicator span {
          opacity:
            1;

          transform:
            scale(1);

          background:
            #d39aa2;
        }


        /* =================================================
           ACTIVE
        ================================================= */

        .shop-category-row-active {
          background:
            #f6e3df;

          color:
            #211b1c;

          font-weight:
            700;
        }

        .shop-category-row-active
        .shop-category-indicator span {
          width:
            6px;

          height:
            6px;

          opacity:
            1;

          transform:
            scale(1);

          background:
            #b86676;
        }

        .shop-category-row-active
        .shop-category-name {
          color:
            #211b1c;
        }

        .shop-category-row-active
        .shop-category-number {
          background:
            #ffffff;

          color:
            #b86676;
        }


        /* =================================================
           ALL PRODUCTS
        ================================================= */

        .shop-categories
        .shop-category-row:first-child {
          margin-bottom:
            7px;

          padding-bottom:
            8px;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.055
            );

          border-radius:
            0;
        }

        .shop-categories
        .shop-category-row:first-child
        .shop-category-number {
          background:
            #211b1c;

          color:
            #ffffff;
        }

        .shop-categories
        .shop-category-row:first-child
        .shop-category-row-active {
          background:
            #f6e3df;
        }

        .shop-categories
        .shop-category-row:first-child
        .shop-category-row-active
        .shop-category-number {
          background:
            #ffffff;

          color:
            #b86676;
        }


        /* =================================================
           SIDEBAR DIVIDER
        ================================================= */

        .shop-sidebar-divider {
          height:
            1px;

          margin:
            25px 0;

          background:
            rgba(
              33,
              27,
              28,
              0.08
            );
        }


        /* =================================================
           SIDEBAR NOTE
        ================================================= */

        .shop-sidebar-note {
          position:
            relative;

          overflow:
            hidden;

          padding:
            20px 18px;

          background:
            linear-gradient(
              145deg,
              #f6e3df,
              #f1d9d5
            );

          border-radius:
            2px;

          color:
            #b86676;
        }

        .shop-sidebar-note::after {
          content:
            "";

          position:
            absolute;

          width:
            90px;

          height:
            90px;

          right:
            -40px;

          bottom:
            -40px;

          border:
            1px solid
            rgba(
              184,
              102,
              118,
              0.12
            );

          border-radius:
            50%;
        }

        .shop-sidebar-note-icon {
          position:
            relative;

          z-index:
            1;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            31px;

          height:
            31px;

          border:
            1px solid
            rgba(
              184,
              102,
              118,
              0.2
            );

          background:
            rgba(
              255,
              255,
              255,
              0.35
            );

          color:
            #b86676;
        }

        .shop-sidebar-note > span {
          position:
            relative;

          z-index:
            1;

          display:
            block;

          margin-top:
            14px;

          color:
            #8e5962;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;
        }

        .shop-sidebar-note p {
          position:
            relative;

          z-index:
            1;

          max-width:
            180px;

          margin:
            8px 0 0;

          color:
            #766163;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            9px;

          line-height:
            1.7;
        }


        /* =================================================
           PRODUCT AREA
        ================================================= */

        .shop-products {
          min-width:
            0;
        }

        .shop-products-heading {
          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap:
            20px;

          margin-bottom:
            27px;
        }

        .shop-products-heading span {
          display:
            block;

          margin-bottom:
            7px;

          color:
            #b86676;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.18em;

          text-transform:
            uppercase;
        }

        .shop-products-heading h2 {
          margin:
            0;

          font-family:
            "Playfair Display",
            Georgia,
            serif;

          font-size:
            35px;

          font-weight:
            500;

          letter-spacing:
            -0.045em;

          line-height:
            1;
        }

        .shop-products-heading p {
          margin:
            0 0 2px;

          color:
            #9b8e90;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.11em;

          text-transform:
            uppercase;
        }


        /* =================================================
           PRODUCT GRID
        ================================================= */

        .shop-product-grid {
          display:
            grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );

          gap:
            40px 22px;
        }


        /* =================================================
           SKELETON
        ================================================= */

        .shop-skeleton-card {
          min-width:
            0;
        }

        .shop-skeleton-image {
          aspect-ratio:
            0.88;

          background:
            #f0e4e1;

          animation:
            shopPulse
            1.4s
            ease-in-out
            infinite;
        }

        .shop-skeleton-category,
        .shop-skeleton-title,
        .shop-skeleton-price {
          height:
            8px;

          margin-top:
            14px;

          background:
            #eadcd9;

          animation:
            shopPulse
            1.4s
            ease-in-out
            infinite;
        }

        .shop-skeleton-category {
          width:
            27%;
        }

        .shop-skeleton-title {
          width:
            72%;
        }

        .shop-skeleton-price {
          width:
            25%;
        }

        @keyframes shopPulse {
          0%,
          100% {
            opacity:
              0.45;
          }

          50% {
            opacity:
              1;
          }
        }


        /* =================================================
           EMPTY
        ================================================= */

        .shop-empty {
          min-height:
            470px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-direction:
            column;

          padding:
            40px;

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );

          background:
            #fffdfc;

          color:
            #b86676;

          text-align:
            center;
        }

        .shop-empty > span {
          margin-top:
            15px;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.18em;

          text-transform:
            uppercase;
        }

        .shop-empty h2 {
          margin:
            11px 0 0;

          color:
            #211b1c;

          font-family:
            "Playfair Display",
            Georgia,
            serif;

          font-size:
            39px;

          font-weight:
            500;

          letter-spacing:
            -0.045em;

          line-height:
            0.98;
        }

        .shop-empty p {
          max-width:
            350px;

          margin:
            15px 0 22px;

          color:
            #806f72;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            10px;

          line-height:
            1.7;
        }

        .shop-empty button {
          height:
            45px;

          padding:
            0 20px;

          border:
            0;

          background:
            #211b1c;

          color:
            #ffffff;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.14em;

          text-transform:
            uppercase;

          cursor:
            pointer;
        }


        /* =================================================
           TOAST
        ================================================= */

        .shop-toast {
          position:
            fixed;

          right:
            24px;

          bottom:
            24px;

          z-index:
            9999;

          display:
            flex;

          align-items:
            center;

          gap:
            12px;

          max-width:
            380px;

          padding:
            14px 17px;

          background:
            #211b1c;

          color:
            #ffffff;

          box-shadow:
            0 18px 50px
            rgba(
              33,
              27,
              28,
              0.2
            );
        }

        .shop-toast > div {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            31px;

          height:
            31px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );

          color:
            #e5a7ae;
        }

        .shop-toast span {
          color:
            #ddd1d3;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            10px;
        }


        /* =================================================
           MOBILE FILTER
        ================================================= */

        .shop-mobile-panel {
          position:
            fixed;

          inset:
            0;

          z-index:
            10000;
        }

        .shop-mobile-backdrop {
          position:
            absolute;

          inset:
            0;

          width:
            100%;

          height:
            100%;

          border:
            0;

          background:
            rgba(
              20,
              16,
              17,
              0.42
            );
        }

        .shop-mobile-drawer {
          position:
            absolute;

          top:
            0;

          right:
            0;

          bottom:
            0;

          width:
            min(
              390px,
              92vw
            );

          display:
            flex;

          flex-direction:
            column;

          background:
            #fffaf8;

          box-shadow:
            -20px 0 50px
            rgba(
              20,
              16,
              17,
              0.15
            );
        }

        .shop-mobile-header {
          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          padding:
            24px;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );
        }

        .shop-mobile-header span,
        .shop-mobile-label {
          color:
            #b86676;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.18em;

          text-transform:
            uppercase;
        }

        .shop-mobile-header h2 {
          margin:
            5px 0 0;

          font-family:
            "Playfair Display",
            Georgia,
            serif;

          font-size:
            30px;

          font-weight:
            500;
        }

        .shop-mobile-header button {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          width:
            35px;

          height:
            35px;

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.1
            );

          background:
            #ffffff;

          cursor:
            pointer;
        }

        .shop-mobile-body {
          flex:
            1;

          overflow-y:
            auto;

          padding:
            24px;
        }

        .shop-mobile-label {
          display:
            block;

          margin-bottom:
            12px;
        }

        .shop-mobile-categories {
          padding-top:
            4px;
        }

        .shop-mobile-categories
        .shop-category-row {
          min-height:
            50px;
        }

        .shop-mobile-footer {
          display:
            flex;

          gap:
            10px;

          padding:
            18px 24px;

          border-top:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );
        }

        .shop-mobile-clear,
        .shop-mobile-show {
          height:
            47px;

          border:
            1px solid
            #211b1c;

          font-family:
            "DM Sans",
            sans-serif;

          font-size:
            8px;

          font-weight:
            700;

          letter-spacing:
            0.13em;

          text-transform:
            uppercase;

          cursor:
            pointer;
        }

        .shop-mobile-clear {
          width:
            90px;

          background:
            transparent;

          color:
            #211b1c;
        }

        .shop-mobile-show {
          flex:
            1;

          background:
            #211b1c;

          color:
            #ffffff;
        }


        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 1100px) {

          .shop-container {
            width:
              calc(100% - 48px);
          }

          .shop-layout {
            grid-template-columns:
              210px
              minmax(0, 1fr);

            gap:
              35px;
          }

          .shop-product-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
          }

          .shop-script {
            margin-right:
              15px;
          }
        }


        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 800px) {

          .shop-hero {
            min-height: 590px;
          }

          .shop-hero-inner {
            min-height: 590px;
            grid-template-columns: 1fr;
            align-content: center;
            padding: 65px 0 85px;
          }

          .shop-hero-art {
            position: absolute;
            right: -50px;
            bottom: 55px;
            width: 330px;
            height: 250px;
            opacity: .42;
          }

          .shop-hero-art-frame {
            width: 300px;
            height: 225px;
          }

          .shop-hero-copy {
            max-width: 100%;
          }

          .shop-hero h1 {
            font-size: clamp(62px, 16vw, 82px);
          }

          .shop-hero p {
            max-width: 420px;
            font-size: 13px;
          }

          .shop-hero-controls {
            width: calc(100% - 32px);
          }

          .shop-container {
            width:
              calc(100% - 32px);
          }

          .shop-hero-inner {
            min-height:
              300px;

            padding:
              48px 0;
          }

          .shop-script {
            display:
              none;
          }

          .shop-toolbar {
            flex-wrap:
              wrap;
          }

          .shop-search {
            width:
              100%;
          }

          .shop-mobile-filter {
            display:
              inline-flex;

            align-items:
              center;

            justify-content:
              center;

            gap:
              8px;

            height:
              42px;

            padding:
              0 15px;

            border:
              1px solid
              rgba(
                33,
                27,
                28,
                0.11
              );

            background:
              #ffffff;

            color:
              #211b1c;

            font-family:
              "DM Sans",
              sans-serif;

            font-size:
              8px;

            font-weight:
              700;

            letter-spacing:
              0.12em;

            text-transform:
              uppercase;

            cursor:
              pointer;
          }

          .shop-sort-control {
            margin-left:
              auto;
          }

          .shop-sort-control > span {
            display:
              none;
          }

          .shop-layout {
            display:
              block;
          }

          .shop-sidebar {
            display:
              none;
          }

          .shop-product-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap:
              30px 13px;
          }

          .shop-products-heading h2 {
            font-size:
              30px;
          }
        }


        /* =================================================
           SMALL MOBILE
        ================================================= */

        @media (max-width: 520px) {

          .shop-hero {
            min-height: 560px;
          }

          .shop-hero-inner {
            min-height: 560px;
          }

          .shop-hero-kicker {
            gap: 9px;
          }

          .shop-hero-rule {
            width: 28px;
          }

          .shop-hero-tag {
            display: none;
          }

          .shop-hero-art {
            right: -85px;
            bottom: 45px;
            opacity: .3;
          }

          .shop-hero h1 {
            font-size:
              57px;
          }

          .shop-hero p {
            max-width:
              320px;

            font-size:
              11px;
          }

          .shop-sort-control select {
            min-width:
              150px;
          }

          .shop-toast {
            right:
              12px;

            bottom:
              12px;

            left:
              12px;
          }

          .shop-mobile-drawer {
            width:
              94vw;
          }

          .shop-mobile-body {
            padding:
              20px;
          }

          .shop-mobile-footer {
            padding:
              16px 20px;
          }

        }

      `}</style>

    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}
