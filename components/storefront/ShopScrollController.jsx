"use client";

import {
  Suspense,
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";


function forceScrollToTop() {
  const html = document.documentElement;

  const previousBehavior =
    html.style.getPropertyValue(
      "scroll-behavior"
    );

  const previousPriority =
    html.style.getPropertyPriority(
      "scroll-behavior"
    );

  html.style.setProperty(
    "scroll-behavior",
    "auto",
    "important"
  );

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });

  window.setTimeout(() => {
    if (previousBehavior) {
      html.style.setProperty(
        "scroll-behavior",
        previousBehavior,
        previousPriority
      );
    } else {
      html.style.removeProperty(
        "scroll-behavior"
      );
    }
  }, 50);
}


function forceScrollToShopProducts() {
  const target =
    document.querySelector(
      "#shop-products"
    );

  if (!target) return false;

  const html =
    document.documentElement;

  const previousBehavior =
    html.style.getPropertyValue(
      "scroll-behavior"
    );

  const previousPriority =
    html.style.getPropertyPriority(
      "scroll-behavior"
    );

  html.style.setProperty(
    "scroll-behavior",
    "auto",
    "important"
  );

  const rect =
    target.getBoundingClientRect();

  const top =
    window.scrollY + rect.top;

  window.scrollTo({
    top: Math.max(0, top),
    left: 0,
    behavior: "auto",
  });

  window.setTimeout(() => {
    if (previousBehavior) {
      html.style.setProperty(
        "scroll-behavior",
        previousBehavior,
        previousPriority
      );
    } else {
      html.style.removeProperty(
        "scroll-behavior"
      );
    }
  }, 50);

  return true;
}


function ShopScrollControllerContent() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const firstRender =
    useRef(true);

  const navigationKey =
    `${pathname}?${searchParams.toString()}`;


  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (
      (pathname === "/shop" ||
        pathname === "/shop/") &&
      searchParams.has("category")
    ) {
      let cancelled = false;
      let attempts = 0;

      const maxAttempts = 30;

      const attemptScroll = () => {
        if (cancelled) return;

        if (
          forceScrollToShopProducts()
        ) {
          return;
        }

        attempts += 1;

        if (
          attempts >= maxAttempts
        ) {
          return;
        }

        window.setTimeout(
          attemptScroll,
          50
        );
      };

      const frame =
        window.requestAnimationFrame(
          () => {
            attemptScroll();
          }
        );

      return () => {
        cancelled = true;

        window.cancelAnimationFrame(
          frame
        );
      };
    }

    /* Product detail pages intentionally start at the top. */
    if (
      pathname.startsWith("/shop/") &&
      pathname !== "/shop/"
    ) {
      forceScrollToTop();
      return;
    }

    forceScrollToTop();
  }, [
    navigationKey,
    pathname,
    searchParams,
  ]);

  return null;
}


export default function ShopScrollController() {
  return (
    <Suspense fallback={null}>
      <ShopScrollControllerContent />
    </Suspense>
  );
}