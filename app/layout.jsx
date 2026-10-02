import "./globals.css";
import GlobalPageLoader from "../components/storefront/GlobalPageLoader";
import ShopScrollController from "../components/storefront/ShopScrollController";

export const metadata = {
  title: "Polished & Paid | Beauty, Wellness & More",
  description:
    "Discover beauty, fragrance, hair care, wellness, self-care and lifestyle essentials curated for you.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <GlobalPageLoader />
        <ShopScrollController />
        {children}
      </body>
    </html>
  );
}