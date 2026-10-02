"use client";

const columns = [
  {
    title: "Shop",
    links: [
      "Beauty",
      "Fragrance",
      "Hair",
      "Jewelry",
      "Self-Care",
      "Wellness",
    ],
  },
  {
    title: "Help",
    links: [
      "Contact Us",
      "Shipping",
      "Returns",
      "FAQ",
      "Track Order",
      "Privacy",
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1c1819] text-white">
      <div className="container-store py-16 lg:py-20">

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-12 lg:gap-20">

          {/* BRAND */}
          <div>
            <img
              src="/images/polish-pay-logo.png"
              alt="Polish & Paid"
              className="h-24 w-40 object-contain object-left drop-shadow-[0_10px_24px_rgba(216,117,140,0.2)]"
            />

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/55">
              Beauty, wellness and lifestyle essentials curated to help you
              look good, feel good and live beautifully.
            </p>

            {/* SOCIAL LINKS */}
            <div className="flex items-center gap-3 mt-7">

              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-[12px] font-semibold hover:bg-[#d98d98] hover:border-[#d98d98] transition-all"
              >
                IG
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-[15px] font-bold hover:bg-[#d98d98] hover:border-[#d98d98] transition-all"
              >
                f
              </a>

              <a
                href="#"
                aria-label="YouTube"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-[11px] font-semibold hover:bg-[#d98d98] hover:border-[#d98d98] transition-all"
              >
                YT
              </a>

              <a
                href="#"
                aria-label="TikTok"
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-[11px] font-semibold hover:bg-[#d98d98] hover:border-[#d98d98] transition-all"
              >
                TT
              </a>

            </div>
          </div>

          {/* NAVIGATION */}
          {columns.map((column) => (
            <div key={column.title}>
              <p className="eyebrow text-white/40 mb-6">
                {column.title}
              </p>

              <div className="space-y-4">
                {column.links.map((link) => (
                  <a
                    href="#"
                    key={link}
                    className="block text-sm text-white/65 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* NEWSLETTER */}
          <div>
            <p className="eyebrow text-white/40 mb-6">
              Stay in the know
            </p>

            <h3 className="font-display text-2xl leading-tight">
              A little beauty in your inbox.
            </h3>

            <p className="text-sm text-white/55 mt-3 leading-6">
              Get 10% off your first order, plus new arrivals and exclusive
              offers.
            </p>

            <div className="mt-5 flex border-b border-white/20 pb-3">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-transparent outline-none flex-1 text-sm placeholder:text-white/35"
              />

              <button
                type="button"
                className="text-xs font-bold uppercase tracking-[0.12em] hover:text-[#d98d98] transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-16 pt-7 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5">

          <p className="text-[11px] text-white/40">
            © 2026 Polished & Paid. All rights reserved.
          </p>

          <p className="text-[11px] text-white/40">
            Beauty · Fragrance · Wellness · More
          </p>

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/60 hover:text-white transition-colors"
          >
            Back to top ↑
          </button>

        </div>
      </div>
    </footer>
  );
}