"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const LOADER_TIMEOUT = 5000;
const MINIMUM_DISPLAY_TIME = 220;

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
  if (!anchor) return false;

  const href = anchor.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    anchor.hasAttribute("download") ||
    (anchor.target && anchor.target !== "_self")
  ) {
    return false;
  }

  try {
    return (
      new URL(href, window.location.origin).origin ===
      window.location.origin
    );
  } catch {
    return false;
  }
}

function getNavigationAnchor(target) {
  if (!(target instanceof Element)) return null;
  return target.closest("a[href]");
}

export default function GlobalPageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const startedAtRef = useRef(0);
  const timeoutRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const previousPathnameRef = useRef(pathname);
  const loadingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(
    (immediate = false) => {
      clearTimers();

      if (immediate) {
        loadingRef.current = false;
        setLoading(false);
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(
        0,
        MINIMUM_DISPLAY_TIME - elapsed
      );

      if (remaining === 0) {
        loadingRef.current = false;
        setLoading(false);
        return;
      }

      finishTimeoutRef.current = window.setTimeout(() => {
        loadingRef.current = false;
        setLoading(false);
        finishTimeoutRef.current = null;
      }, remaining);
    },
    [clearTimers]
  );

  const startLoading = useCallback(() => {
    clearTimers();

    startedAtRef.current = Date.now();
    loadingRef.current = true;
    setLoading(true);

    timeoutRef.current = window.setTimeout(() => {
      loadingRef.current = false;
      setLoading(false);
      timeoutRef.current = null;
    }, LOADER_TIMEOUT);
  }, [clearTimers]);

  useEffect(() => {
    /*
     * Listen for completed clicks rather than pointerdown.
     * This avoids starting the loader when users swipe or scroll
     * on mobile without actually activating a link.
     */
    const handleDocumentClick = (event) => {
      if (isModifiedClick(event)) return;

      const anchor = getNavigationAnchor(event.target);

      if (!isInternalNavigation(anchor)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      try {
        const destination = new URL(
          href,
          window.location.origin
        );
        const current = new URL(window.location.href);

        // Ignore same-page and hash-only navigation.
        if (
          destination.pathname === current.pathname &&
          destination.search === current.search
        ) {
          return;
        }

        startLoading();
      } catch {
        // Ignore malformed URLs.
      }
    };

    const handlePopState = () => startLoading();
    const handleManualStart = () => startLoading();
    const handleManualStop = () => stopLoading();

    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("popstate", handlePopState);
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
        "click",
        handleDocumentClick
      );
      window.removeEventListener("popstate", handlePopState);
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
  }, [startLoading, stopLoading, clearTimers]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;

      if (loadingRef.current) {
        stopLoading();
      }
    }
  }, [pathname, stopLoading]);

  useEffect(() => {
    window.polishPayLoading = {
      start: startLoading,
      stop: stopLoading,
    };

    return () => {
      delete window.polishPayLoading;
    };
  }, [startLoading, stopLoading]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  if (!loading) return null;

  return (
    <div
      className="pp-global-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="pp-global-loader-backdrop" />

      <div className="pp-loader-content">
        <div
          className="pp-loader-spinner"
          aria-hidden="true"
        >
          <span className="pp-spinner-halo" />
          <span className="pp-spinner-track" />
          <span className="pp-spinner-ring" />
          <span className="pp-spinner-highlight" />
          <span className="pp-spinner-core" />
        </div>

        <p className="pp-loader-brand">
          POLISHED <span>&amp;</span> PAID
        </p>

        <p className="pp-loader-caption">
          A little moment of beauty
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
          background: rgba(255, 250, 249, 0.72);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: ppLoaderFade 180ms ease-out both;
        }

        /* Transparent wrapper: no card, box, border or shadow. */
        .pp-loader-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          animation: ppLoaderEnter 240ms
            cubic-bezier(0.2, 0.7, 0.25, 1) both;
        }

        .pp-loader-spinner {
          position: relative;
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
          margin-bottom: 23px;
          isolation: isolate;
        }

        .pp-spinner-halo {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: rgba(215, 157, 159, 0.13);
          filter: blur(8px);
          animation: ppSpinnerPulse 1.8s ease-in-out infinite;
        }

        .pp-spinner-track,
        .pp-spinner-ring,
        .pp-spinner-highlight {
          position: absolute;
          border-radius: 50%;
        }

        .pp-spinner-track {
          inset: 7px;
          border: 2px solid #f0dfdc;
        }

        .pp-spinner-ring {
          inset: 7px;
          border: 2.5px solid transparent;
          border-top-color: #bd7c86;
          border-right-color: #d69ca0;
          border-bottom-color: #e8c2bc;
          animation: ppSpinnerRotate 1.05s
            cubic-bezier(0.55, 0.15, 0.35, 0.85) infinite;
        }

        .pp-spinner-highlight {
          inset: 14px;
          border: 1px solid rgba(211, 166, 154, 0.52);
          border-left-color: transparent;
          border-bottom-color: transparent;
          animation: ppSpinnerRotateReverse 1.7s linear infinite;
        }

        .pp-spinner-core {
          position: relative;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #f0c9c2 0%,
            #d49ba0 48%,
            #b97883 100%
          );
          box-shadow:
            0 0 0 5px rgba(201, 140, 146, 0.1),
            0 0 16px rgba(201, 140, 146, 0.22);
          animation: ppCoreBreathe 1.8s ease-in-out infinite;
        }

        .pp-loader-brand {
          margin: 0;
          color: #302426;
          font-family: "DM Sans", Arial, sans-serif;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.5;
          letter-spacing: 0.2em;
        }

        .pp-loader-brand span {
          color: #c98c92;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .pp-loader-caption {
          margin: 7px 0 0;
          color: #9b8588;
          font-family: "DM Sans", Arial, sans-serif;
          font-size: 10px;
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: 0.035em;
        }

        @keyframes ppSpinnerRotate {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ppSpinnerRotateReverse {
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes ppSpinnerPulse {
          0%, 100% {
            opacity: 0.45;
            transform: scale(0.88);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }

        @keyframes ppCoreBreathe {
          0%, 100% {
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.12);
          }
        }

        @keyframes ppLoaderFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ppLoaderEnter {
          from {
            opacity: 0;
            transform: translateY(5px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 520px) {
          .pp-loader-spinner {
            width: 68px;
            height: 68px;
            margin-bottom: 20px;
          }

          .pp-loader-brand {
            font-size: 10px;
          }

          .pp-loader-caption {
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pp-global-loader-backdrop,
          .pp-loader-content,
          .pp-spinner-ring,
          .pp-spinner-highlight,
          .pp-spinner-halo,
          .pp-spinner-core {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
