"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  Sparkles,
  Gem,
  Scissors,
  Leaf,
  Pill,
  Home,
  FileText,
} from "lucide-react";

import { getCategories } from "../../lib/storeApi";

const fallbackCategories = [
  {
    name: "Beauty & Skincare",
    slug: "beauty-skincare",
    icon: Sparkles,
  },
  {
    name: "Fragrance",
    slug: "fragrance",
    icon: Sparkles,
  },
  {
    name: "Jewelry & Beads",
    slug: "jewelry-beads",
    icon: Gem,
  },
  {
    name: "Hair Products",
    slug: "hair-products",
    icon: Scissors,
  },
  {
    name: "Self-Care",
    slug: "self-care",
    icon: Heart,
  },
  {
    name: "Health & Supplements",
    slug: "health-supplements",
    icon: Pill,
  },
  {
    name: "Household",
    slug: "household",
    icon: Home,
  },
  {
    name: "Digital Products",
    slug: "digital-products",
    icon: FileText,
  },
];

function getIcon(category) {
  const name = (
    category.name || ""
  ).toLowerCase();

  if (
    name.includes("beauty") ||
    name.includes("skin")
  ) {
    return Sparkles;
  }

  if (name.includes("fragrance")) {
    return Sparkles;
  }

  if (
    name.includes("jewelry") ||
    name.includes("bead")
  ) {
    return Gem;
  }

  if (
    name.includes("hair") ||
    name.includes("wig")
  ) {
    return Scissors;
  }

  if (name.includes("self")) {
    return Heart;
  }

  if (
    name.includes("health") ||
    name.includes("supplement")
  ) {
    return Pill;
  }

  if (name.includes("house")) {
    return Home;
  }

  if (name.includes("digital")) {
    return FileText;
  }

  return Leaf;
}

export default function CategoryGrid() {
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const data = await getCategories();

        if (mounted) {
          setCategories(data);
        }
      } catch (error) {
        console.error(
          "Unable to load categories:",
          error
        );

        if (mounted) {
          setCategories(
            fallbackCategories
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleCategories =
    categories.length
      ? categories
      : fallbackCategories;

  return (
    <section className="category-strip">
      <div className="category-strip-inner">
        {visibleCategories.map(
          (category, index) => {
            const Icon = getIcon(category);

            return (
              <a
                key={
                  category.id ||
                  category.slug ||
                  index
                }
                href={`/shop?category=${encodeURIComponent(
                  category.slug || ""
                )}`}
                className="category-item"
              >
                <div className="category-icon">
                  <Icon
                    size={22}
                    strokeWidth={1.25}
                  />
                </div>

                <span>
                  {category.name}
                </span>
              </a>
            );
          }
        )}
      </div>

      <style jsx>{`
        .category-strip {
          width: 100%;
          background: #fdf0ec;
          border-top: 1px solid
            rgba(88, 52, 50, 0.07);
          border-bottom: 1px solid
            rgba(88, 52, 50, 0.08);
        }

        .category-strip-inner {
          display: grid;
          grid-template-columns: repeat(
            8,
            minmax(0, 1fr)
          );
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .category-item {
          display: flex;
          min-height: 94px;
          padding: 12px 8px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 7px;
          color: #292021;
          text-decoration: none;
          border-right: 1px solid
            rgba(88, 52, 50, 0.07);
          transition:
            background-color 180ms ease,
            color 180ms ease;
        }

        .category-item:first-child {
          border-left: 1px solid
            rgba(88, 52, 50, 0.07);
        }

        .category-item:hover {
          color: #b86676;
          background: #f9e3df;
        }

        .category-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 28px;
        }

        .category-item span {
          max-width: 115px;
          color: inherit;
          text-align: center;
          font-family: "DM Sans",
            sans-serif;
          font-size: 8px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        @media (max-width: 900px) {
          .category-strip-inner {
            grid-template-columns: repeat(
              4,
              1fr
            );
          }

          .category-item {
            border-bottom: 1px solid
              rgba(88, 52, 50, 0.07);
          }
        }

        @media (max-width: 520px) {
          .category-item {
            min-height: 78px;
          }

          .category-item span {
            font-size: 7px;
          }

          .category-icon {
            transform: scale(0.9);
          }
        }
      `}</style>
    </section>
  );
}