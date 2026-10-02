"use client";

import { ArrowRight } from "lucide-react";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  link = "/shop",
  align = "left",
}) {
  return (
    <div
      className={`pp-heading ${
        align === "center"
          ? "pp-heading-center"
          : ""
      }`}
    >
      <div className="pp-heading-main">
        {eyebrow && (
          <span className="pp-heading-eyebrow">
            {eyebrow}
          </span>
        )}

        <h2>{title}</h2>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {link && (
        <a
          href={link}
          className="pp-heading-link"
        >
          <span>View All</span>

          <ArrowRight
            size={15}
            strokeWidth={1.4}
          />
        </a>
      )}

      <style jsx>{`
        .pp-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 50px;
          width: 100%;
          margin: 0 0 42px;
        }

        .pp-heading-main {
          min-width: 0;
        }

        .pp-heading-eyebrow {
          display: block;
          margin: 0 0 9px;
          color: #b86676;
          font-family:
            "DM Sans",
            sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .pp-heading h2 {
          margin: 0;
          color: #211b1c;
          font-family:
            "Playfair Display",
            Georgia,
            serif;
          font-size: clamp(
            38px,
            4vw,
            56px
          );
          font-weight: 500;
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .pp-heading p {
          max-width: 570px;
          margin: 14px 0 0;
          color: #76686a;
          font-family:
            "DM Sans",
            Arial,
            sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 1.65;
          letter-spacing: 0;
        }

        .pp-heading-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex: 0 0 auto;
          min-height: 38px;
          padding: 0 0 7px;
          border-bottom: 1px solid
            rgba(33, 27, 28, 0.75);
          color: #211b1c;
          text-decoration: none;
          font-family:
            "DM Sans",
            Arial,
            sans-serif;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition:
            color 200ms ease,
            border-color 200ms ease,
            gap 200ms ease;
        }

        .pp-heading-link:hover {
          gap: 14px;
          color: #b86676;
          border-color: #b86676;
        }

        .pp-heading-center {
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .pp-heading-center
          .pp-heading-main {
          display: flex;
          align-items: center;
          flex-direction: column;
        }

        .pp-heading-center
          .pp-heading-link {
          position: absolute;
        }

        @media (max-width: 760px) {
          .pp-heading {
            display: block;
            margin-bottom: 30px;
          }

          .pp-heading h2 {
            font-size: 38px;
          }

          .pp-heading p {
            max-width: 500px;
            font-size: 11px;
          }

          .pp-heading-link {
            margin-top: 17px;
          }
        }

        @media (max-width: 480px) {
          .pp-heading h2 {
            font-size: 34px;
          }

          .pp-heading-eyebrow {
            font-size: 8px;
          }

          .pp-heading p {
            font-size: 10px;
            line-height: 1.6;
          }
        }
      `}</style>
    </div>
  );
}