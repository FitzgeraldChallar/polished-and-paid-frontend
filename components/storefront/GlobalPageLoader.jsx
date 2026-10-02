/* ================================================================
   POLISH & PAY — GLOBAL PAGE LOADER
   ----------------------------------------------------------------
   Mount this component once in app/layout.jsx.

   It handles:
   - Internal Next.js <Link> navigation
   - Normal internal <a> navigation
   - Browser back / forward navigation
   - Programmatic navigation through the custom events below
   - A graceful fallback timeout so the loader can never remain stuck
   - Reduced-motion accessibility
   - External links, downloads, mailto/tel, new tabs, and modifier
     clicks are intentionally ignored
================================================================ */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const LOADER_TIMEOUT = 5000;
const MINIMUM_DISPLAY_TIME = 280;

function isModifiedClick(event) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function isInternalNavigation(anchor) {
  if (!anchor) {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (!href) {
    return false;
  }

  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  if (anchor.hasAttribute("download")) {
    return false;
  }

  if (anchor.target && anchor.target !== "_self") {
    return false;
  }

  try {
    const destination = new URL(
      href,
      window.location.origin
    );

    return destination.origin === window.location.origin;
  } catch {
    return false;
  }
}

function getNavigationAnchor(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest("a[href]");
}

export default function GlobalPageLoader() {
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);

  const startedAtRef = useRef(0);
  const timeoutRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const previousPathnameRef = useRef(pathname);

  function clearTimers() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }

  function stopLoading(immediate = false) {
    clearTimers();

    if (immediate) {
      setLoading(false);
      return;
    }

    const elapsed =
      Date.now() - startedAtRef.current;

    const remaining = Math.max(
      0,
      MINIMUM_DISPLAY_TIME - elapsed
    );

    if (remaining === 0) {
      setLoading(false);
      return;
    }

    finishTimeoutRef.current =
      window.setTimeout(() => {
        setLoading(false);
        finishTimeoutRef.current = null;
      }, remaining);
  }

  function startLoading() {
    clearTimers();

    startedAtRef.current = Date.now();

    setLoading(true);

    timeoutRef.current =
      window.setTimeout(() => {
        setLoading(false);
        timeoutRef.current = null;
      }, LOADER_TIMEOUT);
  }

  useEffect(() => {
    const handleDocumentPointerDown = (event) => {
      if (isModifiedClick(event)) {
        return;
      }

      const anchor = getNavigationAnchor(
        event.target
      );

      if (!isInternalNavigation(anchor)) {
        return;
      }

      const href =
        anchor.getAttribute("href");

      if (!href) {
        return;
      }

      try {
        const destination = new URL(
          href,
          window.location.origin
        );

        const current = new URL(
          window.location.href
        );

        /*
         * Do not show the full-page loader when the
         * user clicks the exact page they are already on.
         */
        if (
          destination.pathname === current.pathname &&
          destination.search === current.search &&
          destination.hash === current.hash
        ) {
          return;
        }

        startLoading();
      } catch {
        // Ignore malformed URLs.
      }
    };

    const handlePopState = () => {
      startLoading();
    };

    const handleManualStart = () => {
      startLoading();
    };

    const handleManualStop = () => {
      stopLoading();
    };

    /*
     * Capture phase means this fires before Next.js
     * receives the click and starts its navigation.
     */
    document.addEventListener(
      "pointerdown",
      handleDocumentPointerDown,
      true
    );

    window.addEventListener(
      "popstate",
      handlePopState
    );

    window.addEventListener(
      "polishpay:loading:start",
      handleManualStart
    );

    window.addEventListener(
      "polishpay:loading:stop",
      handleManualStop
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true
      );

      window.removeEventListener(
        "popstate",
        handlePopState
      );

      window.removeEventListener(
        "polishpay:loading:start",
        handleManualStart
      );

      window.removeEventListener(
        "polishpay:loading:stop",
        handleManualStop
      );

      clearTimers();
    };
  }, []);

  /*
   * When Next.js completes a pathname change, gracefully
   * remove the global navigation loader.
   */
  useEffect(() => {
    if (
      previousPathnameRef.current !== pathname
    ) {
      previousPathnameRef.current = pathname;
      stopLoading();
    }
  }, [pathname]);

  /*
   * Public escape hatch for API actions or components
   * that need to participate in the global loading state.
   */
  useEffect(() => {
    window.polishPayLoading = {
      start: startLoading,
      stop: stopLoading,
    };

    return () => {
      delete window.polishPayLoading;
    };
  }, []);

  if (!loading) {
    return null;
  }

  return (
    <div
      className="pp-global-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="pp-global-loader-backdrop"
      />

      <div
        className="pp-global-loader-card"
      >
        <div
          className="pp-global-loader-mark"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>

        <div
          className="pp-global-loader-brand"
        >
          POLISH <i>&amp;</i> PAID
        </div>

        <div
          className="pp-global-loader-line"
          aria-hidden="true"
        >
          <span />
        </div>

        <p>
          Preparing something beautiful…
        </p>
      </div>

      <style jsx>{`
        .pp-global-loader {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .pp-global-loader-backdrop {
          position: absolute;
          inset: 0;
          background:
            rgba(255, 250, 248, 0.72);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          animation:
            ppLoaderFadeIn 180ms ease both;
        }

        .pp-global-loader-card {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: min(270px, calc(100vw - 48px));
          min-height: 190px;
          padding: 30px 28px;
          border: 1px solid
            rgba(184, 102, 118, 0.16);
          border-radius: 18px;
          background:
            rgba(255, 253, 252, 0.96);
          box-shadow:
            0 28px 80px
            rgba(53, 31, 35, 0.15),
            0 8px 25px
            rgba(184, 102, 118, 0.08);
          animation:
            ppLoaderCardIn 260ms
            cubic-bezier(.22,.61,.36,1)
            both;
        }

        .pp-global-loader-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          height: 28px;
          margin-bottom: 16px;
        }

        .pp-global-loader-mark span {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c87885;
          animation:
            ppLoaderDot 900ms
            ease-in-out infinite;
        }

        .pp-global-loader-mark span:nth-child(2) {
          animation-delay: 120ms;
        }

        .pp-global-loader-mark span:nth-child(3) {
          animation-delay: 240ms;
        }

        .pp-global-loader-brand {
          color: #2c2426;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.18em;
        }

        .pp-global-loader-brand i {
          color: #c87885;
          font-family:
            "Playfair Display",
            Georgia,
            serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .pp-global-loader-line {
          position: relative;
          width: 78px;
          height: 1px;
          margin-top: 15px;
          overflow: hidden;
          background:
            rgba(184, 102, 118, 0.14);
        }

        .pp-global-loader-line span {
          position: absolute;
          top: 0;
          left: -35%;
          width: 35%;
          height: 100%;
          background: #c87885;
          animation:
            ppLoaderLine 900ms
            ease-in-out infinite;
        }

        .pp-global-loader-card p {
          margin: 14px 0 0;
          color: #8b797d;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 8px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        @keyframes ppLoaderFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes ppLoaderCardIn {
          from {
            opacity: 0;
            transform:
              translateY(8px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes ppLoaderDot {
          0%,
          100% {
            opacity: 0.28;
            transform: scale(0.75);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes ppLoaderLine {
          0% {
            left: -35%;
          }

          50% {
            left: 100%;
          }

          100% {
            left: 100%;
          }
        }

        @media (max-width: 520px) {
          .pp-global-loader-card {
            width: min(
              240px,
              calc(100vw - 40px)
            );
            min-height: 175px;
            padding: 26px 22px;
          }

          .pp-global-loader-brand {
            font-size: 10px;
          }

          .pp-global-loader-card p {
            font-size: 7px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pp-global-loader-backdrop,
          .pp-global-loader-card,
          .pp-global-loader-mark span,
          .pp-global-loader-line span {
            animation: none;
          }

          .pp-global-loader-backdrop {
            opacity: 1;
          }

          .pp-global-loader-card {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
