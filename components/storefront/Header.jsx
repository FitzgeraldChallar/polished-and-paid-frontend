"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { getCart, getWishlist } from "../../lib/storeApi";
import { getStoredCustomer } from "../../lib/auth";

/*
|--------------------------------------------------------------------------
| CATEGORY DATA
|--------------------------------------------------------------------------
| IMPORTANT:
| The shop page filters using the actual category name.
| We therefore keep both the display name and the URL value aligned.
|--------------------------------------------------------------------------
*/

const shopCategories = [
  ["Beauty & Skincare", "Beauty & Skincare"],
  ["Fragrance", "Fragrance"],
  ["Jewelry & Beads", "Jewelry & Beads"],
  ["Hair Products", "Hair Products"],
  ["Self-Care", "Self-Care"],
  ["Health & Supplements", "Health & Supplements"],
  ["Household", "Household"],
  ["Digital Products", "Digital Products"],
  ["African Sponge Bath", "African Sponge Bath"],
  ["Men’s Care", "Men’s Care"],
  ["Wigs & Closures", "Wigs & Closures"],
  ["Nursing Heads", "Nursing Heads"],
];

const beautyCategories = [
  ["Beauty & Skincare", "Beauty & Skincare"],
  ["Hair Products", "Hair Products"],
  ["Wigs & Closures", "Wigs & Closures"],
  ["Nursing Heads", "Nursing Heads"],
];

/*
|--------------------------------------------------------------------------
| ANNOUNCEMENTS
|--------------------------------------------------------------------------
| DO NOT CHANGE THIS.
| The marquee animation is intentionally preserved.
|--------------------------------------------------------------------------
*/

const announcements = [
  "Complimentary shipping on orders over $75",
  "New beauty finds have arrived — shop the latest edit",
  "Fresh self-care essentials, thoughtfully curated for you",
  "A little something beautiful is waiting for you",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function categoryHref(categoryName) {
  return `/shop?category=${encodeURIComponent(categoryName)}`;
}

function DropdownLink({ href, children, onClick }) {
  return (
    <Link
      href={href}
      className="pp-mega-link"
      onClick={onClick}
    >
      <span>{children}</span>

      <ChevronRight
        size={14}
        strokeWidth={1.35}
      />
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [beautyOpen, setBeautyOpen] = useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CART
  |--------------------------------------------------------------------------
  */

  async function refreshCart() {
    try {
      const cart = await getCart();

      setCartCount(
        Number(cart?.item_count || 0)
      );
    } catch (error) {
      console.error(
        "Header cart error:",
        error
      );
    } finally {
      setCartLoading(false);
    }
  }

  useEffect(() => {
    refreshCart();

    const handleCartUpdated = (event) => {
      const cart = event.detail;

      setCartCount(
        Number(cart?.item_count || 0)
      );

      setCartLoading(false);
    };

    window.addEventListener(
      "polishpay:cart-updated",
      handleCartUpdated
    );

    window.addEventListener(
      "focus",
      refreshCart
    );

    return () => {
      window.removeEventListener(
        "polishpay:cart-updated",
        handleCartUpdated
      );

      window.removeEventListener(
        "focus",
        refreshCart
      );
    };
  }, []);

    /*
  |--------------------------------------------------------------------------
  | WISHLIST
  |--------------------------------------------------------------------------
  */

  async function refreshWishlist() {
  const currentCustomer = getStoredCustomer();

  if (!currentCustomer) {
    setWishlistCount(0);
    setWishlistLoading(false);
    return;
  }

  try {
    const wishlist = await getWishlist();

    setWishlistCount(
      Array.isArray(wishlist)
        ? wishlist.length
        : 0
    );
  } catch (error) {
    console.error(
      "Header wishlist error:",
      error
    );

    /*
     * A stale/invalid customer token should never break
     * the header or wishlist UI.
     */
    if (
      error?.status === 401 ||
      String(error?.message || "").toLowerCase().includes("invalid token")
    ) {
      setWishlistCount(0);
    }
  } finally {
    setWishlistLoading(false);
  }
}

  useEffect(() => {
    refreshWishlist();

    const handleWishlistUpdated = () => {
      refreshWishlist();
    };

    const handleAuthUpdated = () => {
      refreshWishlist();
    };

    window.addEventListener(
      "polishpay:wishlist-updated",
      handleWishlistUpdated
    );

    window.addEventListener(
      "polishpay:auth-updated",
      handleAuthUpdated
    );

    window.addEventListener(
      "focus",
      refreshWishlist
    );

    return () => {
      window.removeEventListener(
        "polishpay:wishlist-updated",
        handleWishlistUpdated
      );

      window.removeEventListener(
        "polishpay:auth-updated",
        handleAuthUpdated
      );

      window.removeEventListener(
        "focus",
        refreshWishlist
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER SESSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const syncCustomer = () => {
      const nextCustomer = getStoredCustomer();
      setCustomer(nextCustomer);

      if (nextCustomer) {
        refreshCart();
      } else {
        // Logout clears the active customer bag in the UI. Do not fetch
        // another cart here, because that could rehydrate the previous
        // customer's saved bag through a lingering browser session.
        setCartCount(0);
        setCartLoading(false);
      }
    };
    syncCustomer();
    window.addEventListener("polishpay:auth-updated", syncCustomer);
    window.addEventListener("storage", syncCustomer);

    return () => {
      window.removeEventListener("polishpay:auth-updated", syncCustomer);
      window.removeEventListener("storage", syncCustomer);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | MOBILE BODY LOCK
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    document.body.style.overflow =
      menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | MENU HELPERS
  |--------------------------------------------------------------------------
  */

  function closeMenus() {
    setShopOpen(false);
    setBeautyOpen(false);
  }

  function closeEverything() {
    closeMenus();
    setMenuOpen(false);
  }

  function openShop() {
    setBeautyOpen(false);
    setShopOpen(true);
  }

  function openBeauty() {
    setShopOpen(false);
    setBeautyOpen(true);
  }

  return (
    <>
      {/* =========================================================
          ANNOUNCEMENT BAR
          KEEPING YOUR ROTATING BLACK BAR EXACTLY INTACT
      ========================================================= */}

      <div
        className="pp-announcement"
        aria-label="Store announcements"
      >
        <div className="pp-announcement-viewport">
          <div className="pp-announcement-track">
            {[...announcements, ...announcements].map(
              (announcement, index) => (
                <span
                  className="pp-announcement-item"
                  key={`${announcement}-${index}`}
                >
                  {announcement}

                  <span
                    className="pp-announcement-dot"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className={`pp-header ${headerScrolled ? "pp-header-scrolled" : ""}`}>
        <div className="pp-header-inner">

          {/* MOBILE MENU */}

          <button
            type="button"
            className="pp-mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu
              size={21}
              strokeWidth={1.45}
            />
          </button>

          {/* LOGO */}

          <Link
            href="/"
            className="pp-logo"
            aria-label="Polish & Pay home"
            onClick={closeEverything}
          >
            <img
              src="/images/polish-pay-logo.png"
              alt="Polish & Pay"
              className="pp-logo-image"
            />
          </Link>

          {/* =====================================================
              DESKTOP NAVIGATION
          ===================================================== */}

          <nav
            className="pp-nav"
            aria-label="Main navigation"
          >

            {/* SHOP */}

            <div
              className={`pp-nav-dropdown ${
                shopOpen
                  ? "pp-nav-dropdown-open"
                  : ""
              }`}
              onMouseEnter={openShop}
              onMouseLeave={() =>
                setShopOpen(false)
              }
            >
              <button
                type="button"
                className={`pp-nav-trigger ${
                  shopOpen
                    ? "is-open"
                    : ""
                }`}
                onClick={() => {
                  setBeautyOpen(false);
                  setShopOpen(
                    (open) => !open
                  );
                }}
                aria-expanded={shopOpen}
              >
                <span>Shop</span>

                <ChevronDown
                  size={12}
                  strokeWidth={1.5}
                  className={
                    shopOpen
                      ? "pp-chevron-open"
                      : ""
                  }
                />
              </button>

              {shopOpen && (
                <div className="pp-mega-menu">
                  <div className="pp-mega-inner">

                    {/* INTRO */}

                    <div className="pp-mega-intro">
                      <span className="pp-mega-eyebrow">
                        Shop the edit
                      </span>

                      <h3>
                        Find your
                        <br />
                        <em>favorites.</em>
                      </h3>

                      <p>
                        Explore our thoughtfully
                        selected beauty, wellness,
                        self-care and lifestyle
                        essentials.
                      </p>

                      <Link
                        href="/shop"
                        className="pp-mega-view-all"
                        onClick={
                          closeEverything
                        }
                      >
                        View all products

                        <ChevronRight
                          size={14}
                          strokeWidth={1.4}
                        />
                      </Link>
                    </div>

                    {/* CATEGORY COLUMNS */}

                    <div className="pp-mega-columns">

                      <div className="pp-mega-column">
                        {shopCategories
                          .slice(0, 4)
                          .map(
                            ([name, value]) => (
                              <DropdownLink
                                key={name}
                                href={categoryHref(
                                  value
                                )}
                                onClick={
                                  closeEverything
                                }
                              >
                                {name}
                              </DropdownLink>
                            )
                          )}
                      </div>

                      <div className="pp-mega-column">
                        {shopCategories
                          .slice(4, 8)
                          .map(
                            ([name, value]) => (
                              <DropdownLink
                                key={name}
                                href={categoryHref(
                                  value
                                )}
                                onClick={
                                  closeEverything
                                }
                              >
                                {name}
                              </DropdownLink>
                            )
                          )}
                      </div>

                      <div className="pp-mega-column">
                        {shopCategories
                          .slice(8)
                          .map(
                            ([name, value]) => (
                              <DropdownLink
                                key={name}
                                href={categoryHref(
                                  value
                                )}
                                onClick={
                                  closeEverything
                                }
                              >
                                {name}
                              </DropdownLink>
                            )
                          )}
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NEW IN */}

            <Link
              href="/shop?new=true"
              onClick={closeEverything}
            >
              New In
            </Link>

            {/* BEAUTY */}

            <div
              className={`pp-nav-dropdown ${
                beautyOpen
                  ? "pp-nav-dropdown-open"
                  : ""
              }`}
              onMouseEnter={openBeauty}
              onMouseLeave={() =>
                setBeautyOpen(false)
              }
            >
              <button
                type="button"
                className={`pp-nav-trigger ${
                  beautyOpen
                    ? "is-open"
                    : ""
                }`}
                onClick={() => {
                  setShopOpen(false);
                  setBeautyOpen(
                    (open) => !open
                  );
                }}
                aria-expanded={beautyOpen}
              >
                <span>Beauty</span>

                <ChevronDown
                  size={12}
                  strokeWidth={1.5}
                  className={
                    beautyOpen
                      ? "pp-chevron-open"
                      : ""
                  }
                />
              </button>

              {beautyOpen && (
                <div className="pp-small-dropdown">

                  <div className="pp-small-dropdown-title">
                    <Sparkles
                      size={14}
                      strokeWidth={1.25}
                    />

                    <span>
                      Beauty edit
                    </span>
                  </div>

                  {beautyCategories.map(
                    ([name, value]) => (
                      <DropdownLink
                        key={name}
                        href={categoryHref(
                          value
                        )}
                        onClick={
                          closeEverything
                        }
                      >
                        {name}
                      </DropdownLink>
                    )
                  )}

                </div>
              )}
            </div>

            {/* FRAGRANCE */}

            <Link
              href={categoryHref(
                "Fragrance"
              )}
              onClick={closeEverything}
            >
              Fragrance
            </Link>

            {/* SELF CARE */}

            <Link
              href={categoryHref(
                "Self-Care"
              )}
              onClick={closeEverything}
            >
              Self-Care
            </Link>

            {/* STORY */}

            <Link
              href="/about"
              onClick={closeEverything}
            >
              Our Story
            </Link>

          </nav>

          {/* =====================================================
    HEADER ACTIONS
===================================================== */}

<div
  className="pp-actions"
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "22px",
    minHeight: "72px",
    whiteSpace: "nowrap",
  }}
>
  {/* SEARCH */}
  <Link
    href="/search"
    aria-label="Search"
    className="pp-action"
    onClick={closeEverything}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "54px",
      padding: 0,
      color: "#1c1819",
      flexShrink: 0,
      transition: "transform 180ms ease, color 180ms ease",
    }}
  >
    <Search
      size={23}
      strokeWidth={1.45}
    />
  </Link>


  {/* CUSTOMER ACCOUNT */}
  <Link
    href="/account"
    aria-label={
      customer
        ? `Account for ${
            customer.first_name ||
            customer.email ||
            "customer"
          }`
        : "Account"
    }
    className="pp-account-action"
    onClick={closeEverything}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "9px",
      minWidth: "112px",
      height: "68px",
      padding: "3px 4px",
      color: "#1c1819",
      textDecoration: "none",
      flexShrink: 0,
      transition: "transform 180ms ease",
    }}
  >
    {/* PROFILE ICON */}
    <span
      className="pp-account-icon"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "42px",
        height: "42px",
        flexShrink: 0,
        borderRadius: "50%",
        background:
          "linear-gradient(145deg, #fffafb 0%, #f7e7ea 100%)",
        border: "1px solid #e5c1c8",
        color: "#a85d6d",
        boxShadow:
          "0 4px 12px rgba(139, 76, 91, 0.10)",
      }}
    >
      <UserRound
        size={20}
        strokeWidth={1.45}
      />
    </span>

    {/* CUSTOMER INFORMATION */}
    <span
      className="pp-account-meta"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        minWidth: 0,
        lineHeight: 1,
      }}
    >
      <span
        className="pp-account-name"
        style={{
          display: "block",
          maxWidth: "78px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "#30292b",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "11px",
          fontWeight: 800,
          lineHeight: "14px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {customer?.first_name || "Account"}
      </span>

      <span
        className="pp-account-label"
        style={{
          display: "block",
          marginTop: "4px",
          color: "#9a737b",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "7px",
          fontWeight: 700,
          lineHeight: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {customer ? "My Account" : "Sign In"}
      </span>
    </span>

    {/* ACCOUNT ARROW */}
    <ChevronRight
      className="pp-account-arrow"
      size={13}
      strokeWidth={1.35}
      style={{
        flexShrink: 0,
        marginLeft: "1px",
        color: "#a96a77",
      }}
    />
  </Link>


    {/* WISHLIST */}
  <Link
    href="/wishlist"
    aria-label={`Wishlist${
      wishlistLoading
        ? ""
        : `, ${wishlistCount} items`
    }`}
    className="pp-action pp-wishlist-action"
    onClick={closeEverything}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "54px",
      padding: 0,
      color: "#1c1819",
      flexShrink: 0,
      transition: "transform 180ms ease, color 180ms ease",
    }}
  >
    <span
      className="pp-wishlist-icon-wrap"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "34px",
      }}
    >
      <Heart
        size={23}
        strokeWidth={1.4}
      />

      {/* WISHLIST COUNT */}
      <span
        className={`pp-wishlist-badge ${
          wishlistLoading
            ? "pp-wishlist-badge-loading"
            : ""
        }`}
        style={{
          position: "absolute",
          top: "-5px",
          right: "-7px",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "19px",
          width: "19px",
          height: "19px",
          padding: 0,
          borderRadius: "50%",
          background: "#d8788a",
          border: "2px solid #fffafb",
          color: "#ffffff",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "8px",
          fontWeight: 800,
          lineHeight: 1,
          boxShadow:
            "0 3px 8px rgba(184, 102, 118, 0.28)",
        }}
      >
        {wishlistLoading
          ? ""
          : wishlistCount}
      </span>
    </span>
  </Link>


  {/* SHOPPING BAG */}
  <Link
    href="/cart"
    aria-label={`Shopping bag${
      cartLoading
        ? ""
        : `, ${cartCount} items`
    }`}
    className="pp-action pp-cart-action"
    onClick={closeEverything}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "54px",
      padding: 0,
      color: "#1c1819",
      flexShrink: 0,
    }}
  >
    <span
      className="pp-cart-icon-wrap"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "34px",
      }}
    >
      <ShoppingBag
        size={22}
        strokeWidth={1.45}
      />

      {/* CART COUNT */}
      <span
        className={`pp-cart-badge ${
          cartLoading
            ? "pp-cart-badge-loading"
            : ""
        }`}
        style={{
          position: "absolute",
          top: "-5px",
          right: "-7px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "19px",
          height: "19px",
          minWidth: "19px",
          padding: 0,
          borderRadius: "50%",
          background: "#d8788a",
          border: "2px solid #fffafb",
          color: "#ffffff",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "8px",
          fontWeight: 800,
          lineHeight: 1,
          boxShadow:
            "0 3px 8px rgba(184, 102, 118, 0.28)",
        }}
      >
        {cartLoading ? "" : cartCount}
      </span>
    </span>
  </Link>
</div>
        </div>
      </header>

      {/* =========================================================
          MOBILE DRAWER
      ========================================================= */}

      {menuOpen && (
        <div className="pp-drawer-wrap">

          <button
            type="button"
            className="pp-drawer-backdrop"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-label="Close menu"
          />

          <aside className="pp-drawer">

            <div className="pp-drawer-top">

              <Link
                href="/"
                className="pp-logo"
                onClick={
                  closeEverything
                }
              >
                <img
                  src="/images/polish-pay-logo.png"
                  alt="Polish & Pay"
                  className="pp-logo-image"
                />
              </Link>

              <button
                type="button"
                onClick={() =>
                  setMenuOpen(false)
                }
                aria-label="Close menu"
              >
                <X
                  size={22}
                  strokeWidth={1.4}
                />
              </button>

            </div>

            <nav className="pp-drawer-nav">

              <Link
                href="/shop"
                onClick={closeEverything}
              >
                Shop
              </Link>

              <Link
                href="/shop?new=true"
                onClick={closeEverything}
              >
                New In
              </Link>

              <Link
                href={categoryHref(
                  "Beauty & Skincare"
                )}
                onClick={closeEverything}
              >
                Beauty
              </Link>

              <Link
                href={categoryHref(
                  "Fragrance"
                )}
                onClick={closeEverything}
              >
                Fragrance
              </Link>

              <Link
                href={categoryHref(
                  "Self-Care"
                )}
                onClick={closeEverything}
              >
                Self-Care
              </Link>

              <Link
                href="/about"
                onClick={closeEverything}
              >
                Our Story
              </Link>

              <Link
                href="/account"
                onClick={closeEverything}
              >
                My Account
              </Link>

            </nav>

            <div className="pp-drawer-feature">

              <img
                src="/images/polish-pay-logo.png"
                alt="Polish & Pay"
                className="pp-drawer-logo"
              />

              <strong>
                Look good.
                <br />
                Feel good.
              </strong>

            </div>

          </aside>
        </div>
      )}

      {/* =========================================================
          STYLES
      ========================================================= */}

      <style jsx>{`

        /* =======================================================
           ANNOUNCEMENT BAR
           DO NOT ALTER
        ======================================================= */

        .pp-announcement {
          position: relative;
          z-index: 1200;
          height: 34px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: #1c1718;
          color: #fff8f6;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font: 600 8px/1 "DM Sans", sans-serif;
          letter-spacing: 0.19em;
          text-transform: uppercase;
        }

        .pp-announcement::before,
        .pp-announcement::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          width: 140px;
          z-index: 2;
          pointer-events: none;
        }

        .pp-announcement::before {
          left: 0;
          background: linear-gradient(
            90deg,
            #1c1718 8%,
            rgba(28, 23, 24, 0)
          );
        }

        .pp-announcement::after {
          right: 0;
          background: linear-gradient(
            270deg,
            #1c1718 8%,
            rgba(28, 23, 24, 0)
          );
        }

        .pp-announcement-viewport {
          width: 100%;
          overflow: hidden;
        }

        .pp-announcement-track {
          width: max-content;
          display: flex;
          align-items: center;
          will-change: transform;
          animation:
            ppAnnouncementMarquee
            34s
            linear
            infinite;
        }

        .pp-announcement-item {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          padding: 0 28px;
        }

        .pp-announcement-dot {
          display: inline-flex;
          margin-left: 28px;
          color: #d98d98;
          font-size: 9px;
          transform: translateY(-1px);
        }

        @keyframes ppAnnouncementMarquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        /* =======================================================
           HEADER
        ======================================================= */

        .pp-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(
            255,
            250,
            248,
            0.97
          );
          border-bottom: 1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );
          box-shadow:
            0 8px 30px
            rgba(
              33,
              27,
              28,
              0.035
            );
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .pp-header-inner {
          width: min(
            1440px,
            calc(100% - 64px)
          );
          min-height: 82px;
          margin: 0 auto;

          display: grid;
          grid-template-columns:
            220px
            minmax(0, 1fr)
            220px;

          align-items: center;
          column-gap: 24px;
        }

        /* =======================================================
           LOGO
        ======================================================= */

        .pp-logo {
          position: relative;

          justify-self: start;

          display: inline-flex;
          align-items: center;

          gap: 5px;

          width: max-content;

          color: #211b1c;

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 15px;
          font-weight: 800;

          line-height: 1;

          letter-spacing: 0.16em;

          text-decoration: none;
        }

        .pp-logo::after {
          content: "";

          position: absolute;

          left: 0;
          bottom: -8px;

          width: 18px;
          height: 1px;

          background: #d98d98;

          transform-origin: left;

          transition:
            width 220ms ease;
        }

        .pp-logo-image {
          display: block;
          width: 132px;
          height: 66px;
          object-fit: contain;
          object-position: center;
          filter: drop-shadow(0 7px 18px rgba(190, 120, 132, 0.14));
          transition: transform 220ms ease, filter 220ms ease;
        }

        .pp-logo:hover .pp-logo-image {
          transform: translateY(-1px) scale(1.015);
          filter: drop-shadow(0 9px 22px rgba(190, 120, 132, 0.24));
        }

.pp-logo:hover::after {
          width: 42px;
        }

        .pp-logo i {
          color: #b86676;

          font:
            400
            20px/1
            "Playfair Display",
            Georgia,
            serif;
        }

        /* =======================================================
           NAVIGATION
        ======================================================= */

        .pp-nav {
          min-width: 0;

          height: 82px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap:
            clamp(
              24px,
              2.8vw,
              40px
            );
        }

        .pp-nav > a,
        .pp-nav-trigger,
        .pp-drawer-nav a {
          position: relative;

          display: inline-flex;
          align-items: center;

          color: #493e40;

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 10px;
          font-weight: 700;

          line-height: 1;

          letter-spacing: 0.16em;

          text-transform: uppercase;

          text-decoration: none;

          white-space: nowrap;

          transition:
            color 180ms ease;
        }

        .pp-nav > a::after,
        .pp-nav-trigger::after {
          content: "";

          position: absolute;

          left: 0;
          right: 0;
          bottom: -10px;

          height: 1px;

          background: #c87885;

          transform:
            scaleX(0);

          transform-origin: center;

          transition:
            transform 180ms ease;
        }

        .pp-nav > a:hover::after,
        .pp-nav-trigger:hover::after,
        .pp-nav-trigger.is-open::after {
          transform:
            scaleX(1);
        }

        .pp-nav > a:hover,
        .pp-nav-trigger:hover,
        .pp-nav-trigger.is-open,
        .pp-drawer-nav a:hover {
          color: #b86676;
        }

        /* =======================================================
           DROPDOWN WRAPPER
        ======================================================= */

        .pp-nav-dropdown {
          position: relative;

          height: 82px;

          display: flex;
          align-items: center;
        }

        .pp-nav-trigger {
          justify-content: center;

          gap: 7px;

          height: 100%;

          padding: 0;

          border: 0;

          background:
            transparent;

          cursor: pointer;
        }

        .pp-nav-trigger svg {
          flex-shrink: 0;

          transition:
            transform 180ms ease;
        }

        .pp-chevron-open {
          transform:
            rotate(180deg);
        }

        /* =======================================================
           SHOP MEGA MENU
        ======================================================= */

        .pp-mega-menu {
          position: absolute;

          top: calc(100% - 1px);

          left: 50%;

          transform:
            translateX(-50%);

          width:
            min(
              1080px,
              90vw
            );

          padding-top: 10px;

          z-index: 1100;
        }

        .pp-mega-inner {
          position: relative;

          display: grid;

          grid-template-columns:
            275px
            minmax(0, 1fr);

          gap: 42px;

          padding:
            34px
            38px
            38px;

          background:
            rgba(
              255,
              250,
              248,
              0.985
            );

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );

          box-shadow:
            0 28px 70px
            rgba(
              33,
              27,
              28,
              0.16
            );

          animation:
            ppDropdownIn
            180ms
            ease
            both;
        }

        .pp-mega-inner::before {
          content: "";

          position: absolute;

          top: -1px;

          left: 38px;
          right: 38px;

          height: 2px;

          background:
            linear-gradient(
              90deg,
              #d98d98,
              #b86676,
              #d98d98
            );
        }

        @keyframes ppDropdownIn {
          from {
            opacity: 0;
            transform:
              translateY(-6px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        /* =======================================================
           MEGA INTRO
        ======================================================= */

        .pp-mega-intro {
          padding:
            8px
            32px
            4px
            0;

          border-right:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );
        }

        .pp-mega-eyebrow {
          display: block;

          margin-bottom: 12px;

          color: #b86676;

          font:
            700
            8px/1
            "DM Sans",
            sans-serif;

          letter-spacing: 0.2em;

          text-transform:
            uppercase;
        }

        .pp-mega-intro h3 {
          margin: 0;

          color: #211b1c;

          font:
            500
            38px/1.01
            "Playfair Display",
            Georgia,
            serif;

          letter-spacing:
            -0.045em;
        }

        .pp-mega-intro h3 em {
          color: #b86676;
          font-style: italic;
        }

        .pp-mega-intro p {
          max-width: 220px;

          margin:
            17px
            0
            24px;

          color: #796b6e;

          font:
            400
            10px/1.8
            "DM Sans",
            sans-serif;
        }

        .pp-mega-view-all {
          display: inline-flex;

          align-items: center;

          gap: 8px;

          color: #211b1c;

          font:
            700
            8px/1
            "DM Sans",
            sans-serif;

          letter-spacing: 0.14em;

          text-transform:
            uppercase;

          text-decoration: none;

          transition:
            gap 180ms ease,
            color 180ms ease;
        }

        .pp-mega-view-all:hover {
          gap: 12px;
          color: #b86676;
        }

        /* =======================================================
           CATEGORY COLUMNS
        ======================================================= */

        .pp-mega-columns {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 20px;
        }

        .pp-mega-column {
          display: flex;

          flex-direction:
            column;

          gap: 3px;
        }

        .pp-mega-link {
          min-height: 48px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 10px;

          padding:
            0
            12px;

          color: #5e5154;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.055
            );

          font:
            500
            10px/1.2
            "DM Sans",
            sans-serif;

          text-decoration: none;

          transition:
            color 160ms ease,
            padding 160ms ease,
            background 160ms ease;
        }

        .pp-mega-link svg {
          flex-shrink: 0;

          opacity: 0.45;

          transition:
            transform 160ms ease,
            opacity 160ms ease;
        }

        .pp-mega-link:hover {
          padding-left: 16px;

          color: #b86676;

          background:
            #fff1f1;
        }

        .pp-mega-link:hover svg {
          opacity: 1;

          transform:
            translateX(2px);
        }

        /* =======================================================
           BEAUTY DROPDOWN
        ======================================================= */

        .pp-small-dropdown {
          position: absolute;

          top: calc(100% - 1px);

          left: 50%;

          transform:
            translateX(-50%);

          width: 270px;

          padding: 16px;

          background:
            rgba(
              255,
              250,
              248,
              0.985
            );

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );

          box-shadow:
            0 25px 55px
            rgba(
              33,
              27,
              28,
              0.15
            );

          z-index: 1100;

          animation:
            ppDropdownIn
            180ms
            ease
            both;
        }

        .pp-small-dropdown-title {
          display: flex;

          align-items: center;

          gap: 8px;

          padding:
            8px
            9px
            13px;

          color: #b86676;

          font:
            700
            8px/1
            "DM Sans",
            sans-serif;

          letter-spacing: 0.17em;

          text-transform:
            uppercase;
        }

        .pp-small-dropdown
        .pp-mega-link {
          min-height: 44px;
        }

        /* =======================================================
           ACTIONS
        ======================================================= */

        .pp-actions {
          display: flex;

          align-items: center;

          justify-content:
            flex-end;

          gap: 17px;
        }

        .pp-action {
          position: relative;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          flex:
            0 0 34px;

          width: 34px;
          height: 42px;

          padding: 0;

          color: #211b1c;

          text-decoration: none;

          transition:
            color 180ms ease,
            transform 180ms ease;
        }

        .pp-action:hover {
          color: #b86676;

          transform:
            translateY(-1px);
        }

        .pp-account-action {
          flex: 0 0 auto;
          width: auto;
          min-width: 34px;
          gap: 7px;
          padding: 0 5px;
        }

        .pp-account-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(184, 102, 118, 0.18);
          border-radius: 50%;
          background: linear-gradient(145deg, #fff, #f5e2e4);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 7px 18px rgba(100,45,55,.08);
        }

        .pp-account-name {
          max-width: 92px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #3f3335;
          font: 700 9px/1 "DM Sans", sans-serif;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        
                .pp-wishlist-action {
          margin-left: 2px;
        }

        .pp-wishlist-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 34px;
        }

        .pp-wishlist-badge {
          position: absolute;
          top: -5px;
          right: -7px;
          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 19px;
          min-width: 19px;
          height: 19px;

          padding: 0;

          border: 2px solid #fffaf8;
          border-radius: 50%;

          background: #d98d98;
          color: #fff;

          box-shadow:
            0 3px 8px
            rgba(184, 102, 118, 0.28);

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 8px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0;
        }

        .pp-wishlist-badge-loading {
          width: 7px;
          min-width: 7px;
          height: 7px;

          top: -4px;
          right: -4px;

          padding: 0;

          border: 0;

          background: #d98d98;
        }

.pp-cart-action {
          margin-left: 2px;
        }

        .pp-cart-icon-wrap {
          position: relative;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          width: 25px;
          height: 25px;
        }

        .pp-cart-badge {
          position: absolute;

          top: -9px;

          left: 50%;

          z-index: 2;

          min-width: 18px;

          height: 18px;

          padding:
            0
            4px;

          display: flex;

          align-items: center;

          justify-content: center;

          border:
            2px solid
            #fffaf8;

          border-radius:
            999px;

          background:
            #d98d98;

          color: #fff;

          box-shadow:
            0 2px 7px
            rgba(
              185,
              102,
              118,
              0.28
            );

          font-family:
            "DM Sans",
            sans-serif;

          font-size: 7px;

          font-weight: 800;

          line-height: 1;

          letter-spacing: 0;

          transform:
            translateX(-50%);
        }

        .pp-cart-badge-loading {
          min-width: 7px;

          width: 7px;

          height: 7px;

          top: -4px;

          padding: 0;

          border: 0;

          transform:
            translateX(-50%);
        }

        /* =======================================================
           MOBILE MENU BUTTON
        ======================================================= */

        .pp-mobile-menu {
          display: none;

          align-items: center;

          justify-content: center;

          width: 38px;
          height: 38px;

          padding: 0;

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.1
            );

          border-radius:
            50%;

          background:
            rgba(
              255,
              250,
              248,
              0.75
            );

          color: #211b1c;
        }

        /* =======================================================
           MOBILE DRAWER
        ======================================================= */

        .pp-drawer-wrap {
          position: fixed;

          inset: 0;

          z-index: 2000;
        }

        .pp-drawer-backdrop {
          position: absolute;

          inset: 0;

          border: 0;

          background:
            rgba(
              33,
              27,
              28,
              0.42
            );

          backdrop-filter:
            blur(3px);
        }

        .pp-drawer {
          position: relative;

          z-index: 1;

          width:
            min(
              390px,
              90vw
            );

          height: 100%;

          padding: 27px;

          background:
            #fffaf8;

          box-shadow:
            20px 0 60px
            rgba(
              33,
              27,
              28,
              0.18
            );

          animation:
            ppDrawerIn
            240ms
            cubic-bezier(
              .22,
              .61,
              .36,
              1
            )
            both;
        }

        @keyframes ppDrawerIn {
          from {
            opacity: 0;

            transform:
              translateX(-100%);
          }

          to {
            opacity: 1;

            transform:
              translateX(0);
          }
        }

        .pp-drawer-top {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding-bottom: 25px;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.08
            );
        }

        .pp-drawer-top button {
          display: flex;

          align-items: center;

          justify-content: center;

          width: 38px;
          height: 38px;

          border:
            1px solid
            rgba(
              33,
              27,
              28,
              0.1
            );

          border-radius:
            50%;

          background:
            transparent;

          color: #211b1c;

          cursor: pointer;
        }

        .pp-drawer-nav {
          display: flex;

          flex-direction:
            column;

          gap: 0;

          padding-top: 22px;
        }

        .pp-drawer-nav a {
          display: flex;

          align-items: center;

          min-height: 55px;

          border-bottom:
            1px solid
            rgba(
              33,
              27,
              28,
              0.07
            );

          font-size: 10px;
        }

        .pp-drawer-feature {
          position: absolute;

          left: 27px;
          right: 27px;
          bottom: 30px;

          padding: 23px;

          background:
            linear-gradient(
              135deg,
              #f8e8e9,
              #f5dfe1
            );

          border:
            1px solid
            rgba(
              184,
              102,
              118,
              0.12
            );
        }

        .pp-drawer-feature span {
          display: block;

          margin-bottom: 7px;

          color: #b86676;

          font:
            700
            8px/1
            "DM Sans",
            sans-serif;

          letter-spacing:
            0.17em;

          text-transform:
            uppercase;
        }

        .pp-drawer-feature strong {
          color: #211b1c;

          font:
            500
            23px/1.15
            "Playfair Display",
            Georgia,
            serif;
        }

        /* =======================================================
           TABLET
        ======================================================= */

        @media (max-width: 1180px) {
          .pp-header-inner {
            width:
              min(
                calc(100% - 40px),
                1200px
              );

            grid-template-columns:
              175px
              minmax(0, 1fr)
              175px;

            column-gap: 18px;
          }

          .pp-nav {
            gap: 20px;
          }

          .pp-actions {
            gap: 10px;
          }

          .pp-mega-menu {
            width:
              min(
                1000px,
                92vw
              );
          }
        }

        /* =======================================================
           MOBILE
        ======================================================= */

        @media (max-width: 900px) {
          .pp-header-inner {
            width:
              min(
                calc(100% - 32px),
                680px
              );

            min-height: 72px;

            display: flex;

            justify-content:
              space-between;

            gap: 12px;
          }

          .pp-mobile-menu {
            display: inline-flex;
          }

          .pp-nav {
            display: none;
          }

          .pp-actions {
            gap: 7px;
          }

          .pp-action {
            flex-basis: 30px;
            width: 30px;
          }
        }

        /* =======================================================
           SMALL MOBILE
        ======================================================= */

        @media (max-width: 520px) {
          .pp-announcement {
            height: 30px;

            font-size: 7px;

            letter-spacing:
              0.14em;
          }

          .pp-announcement::before,
          .pp-announcement::after {
            width: 60px;
          }

          .pp-announcement-item {
            padding:
              0
              20px;
          }

          .pp-announcement-dot {
            margin-left: 20px;
          }

          .pp-header-inner {
            width:
              calc(100% - 24px);

            min-height: 66px;
          }

          .pp-logo {
            font-size: 12px;
          }

          .pp-logo i {
            font-size: 16px;
          }

          .pp-actions {
            gap: 3px;
          }

          .pp-action {
            flex-basis: 28px;
            width: 28px;
          }

          .pp-mobile-menu {
            width: 35px;
            height: 35px;
          }

          .pp-drawer {
            width:
              min(
                350px,
                91vw
              );

            padding: 22px;
          }

          .pp-drawer-feature {
            left: 22px;
            right: 22px;
          }
        }

        @media (max-width: 900px) {
          .pp-logo-image { width: 116px; height: 60px; }
          .pp-account-name { display: none; }
          .pp-account-action { width: 30px; min-width: 30px; padding: 0; }
        }

        /* =======================================================
           REDUCED MOTION
        ======================================================= */

        @media (prefers-reduced-motion: reduce) {
          .pp-announcement-track,
          .pp-mega-inner,
          .pp-small-dropdown,
          .pp-drawer {
            animation: none;
          }

          .pp-action,
          .pp-mega-link,
          .pp-mega-view-all,
          .pp-nav-trigger,
          .pp-nav > a {
            transition: none;
          }
        }



        /* =======================================================
           FINAL HEADER ALIGNMENT + LUXURY ACCOUNT PASS
           This block is intentionally last so it wins over earlier
           responsive/header rules without changing component behavior.
        ======================================================= */

        .pp-header-inner {
          width: min(1440px, calc(100% - 64px));
          min-height: 86px;
          grid-template-columns: 190px minmax(0, 1fr) 310px;
          column-gap: 20px;
        }

        .pp-logo {
          justify-self: start;
        }

        .pp-nav {
          justify-content: center;
          gap: clamp(26px, 2.5vw, 38px);
        }

        .pp-nav > a,
        .pp-nav-trigger {
          font-size: 12px;
          letter-spacing: .12em;
        }

        /* The mega menu is centered against the viewport, never against SHOP. */
        .pp-mega-menu {
          position: fixed !important;
          top: 116px !important;
          left: 50% !important;
          right: auto !important;
          width: min(1240px, calc(100vw - 48px)) !important;
          max-width: calc(100vw - 48px) !important;
          padding-top: 12px !important;
          transform: translateX(-50%) !important;
          z-index: 1200 !important;
        }

        .pp-mega-inner {
          width: 100%;
          grid-template-columns: 300px minmax(0, 1fr) !important;
          gap: 50px !important;
          padding: 38px 46px 42px !important;
          border-radius: 0 0 4px 4px;
        }

        .pp-mega-intro {
          padding-right: 38px;
        }

        .pp-mega-intro h3 {
          font-size: 42px;
        }

        .pp-mega-intro p {
          max-width: 260px;
          font-size: 13px !important;
          line-height: 1.75 !important;
        }

        .pp-mega-columns {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 26px !important;
          align-items: start !important;
        }

        .pp-mega-column {
          display: flex !important;
          flex-direction: column !important;
          gap: 5px !important;
          min-width: 0 !important;
        }

        .pp-mega-link {
          min-height: 52px !important;
          padding: 0 14px !important;
          justify-content: space-between !important;
          gap: 12px !important;
          font-size: 15px !important;
          line-height: 1.35 !important;
          letter-spacing: 0 !important;
          text-transform: none !important;
          border-radius: 7px;
        }

        .pp-mega-link span {
          white-space: nowrap;
        }

        .pp-mega-link:hover {
          padding-left: 18px !important;
        }

        /* Premium customer identity control. */
        .pp-actions {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
        }

        .pp-action {
          flex: 0 0 40px;
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: transform 180ms ease, background 180ms ease;
        }

        .pp-action:hover {
          transform: translateY(-1px);
          background: rgba(217,141,152,.09);
        }

        .pp-account-action {
          flex: 0 0 184px !important;
          width: 184px !important;
          min-width: 184px !important;
          height: 54px !important;
          padding: 6px 12px 6px 7px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          gap: 11px !important;
          border: 1px solid rgba(184,102,118,.22) !important;
          border-radius: 999px !important;
          background: linear-gradient(135deg, rgba(255,255,255,.98), rgba(247,230,235,.96)) !important;
          box-shadow:
            0 9px 26px rgba(72,35,45,.09),
            inset 0 1px 0 rgba(255,255,255,.95);
        }

        .pp-account-action:hover {
          background: linear-gradient(135deg, #fff, #f4dbe1) !important;
          border-color: rgba(184,102,118,.34) !important;
          box-shadow:
            0 13px 30px rgba(72,35,45,.13),
            inset 0 1px 0 rgba(255,255,255,1);
          transform: translateY(-2px);
        }

        .pp-account-icon {
          flex: 0 0 40px !important;
          width: 40px !important;
          height: 40px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 1px solid rgba(184,102,118,.28) !important;
          border-radius: 50% !important;
          color: #a14f67 !important;
          background: linear-gradient(145deg, #fff, #f1d3da) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.96),
            0 5px 14px rgba(100,45,55,.09);
        }

        .pp-account-meta {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: center !important;
          gap: 5px !important;
        }

        .pp-account-name {
          display: block !important;
          max-width: 105px !important;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #2c2327 !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          letter-spacing: .11em !important;
          text-transform: uppercase;
        }

        .pp-account-label {
          display: block !important;
          color: #a06d79 !important;
          font-size: 8px !important;
          font-weight: 700 !important;
          line-height: 1 !important;
          letter-spacing: .16em !important;
          text-transform: uppercase !important;
          white-space: nowrap;
        }

        .pp-account-arrow {
          flex: 0 0 auto !important;
          color: #a45369 !important;
        }

        .pp-header-scrolled .pp-mega-menu {
          top: 116px !important;
        }

        @media (max-width: 1180px) {
          .pp-header-inner {
            width: min(calc(100% - 40px), 1200px);
            grid-template-columns: 160px minmax(0, 1fr) 280px;
            column-gap: 14px;
          }

          .pp-nav {
            gap: 18px;
          }

          .pp-nav > a,
          .pp-nav-trigger {
            font-size: 11px;
          }

          .pp-account-action {
            flex-basis: 170px !important;
            width: 170px !important;
            min-width: 170px !important;
          }

          .pp-mega-menu {
            width: min(1160px, calc(100vw - 32px)) !important;
            max-width: calc(100vw - 32px) !important;
          }

          .pp-mega-inner {
            grid-template-columns: 250px minmax(0,1fr) !important;
            gap: 30px !important;
            padding-inline: 30px !important;
          }
        }

        @media (max-width: 900px) {
          .pp-header-inner {
            width: min(calc(100% - 32px), 680px);
            min-height: 72px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .pp-mega-menu {
            display: none !important;
          }

          .pp-actions {
            gap: 5px;
          }

          .pp-action {
            flex-basis: 38px;
            width: 38px;
          }

          .pp-account-action {
            flex: 0 0 42px !important;
            width: 42px !important;
            min-width: 42px !important;
            height: 42px !important;
            padding: 3px !important;
            border-radius: 50% !important;
          }

          .pp-account-icon {
            width: 36px !important;
            height: 36px !important;
            flex-basis: 36px !important;
          }

          .pp-account-meta,
          .pp-account-arrow {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
