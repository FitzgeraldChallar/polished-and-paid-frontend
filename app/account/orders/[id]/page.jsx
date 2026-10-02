"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Package,
  Sparkles,
} from "lucide-react";
import Header from "../../../../components/storefront/Header";
import Footer from "../../../../components/storefront/Footer";
import { getOrder } from "../../../../lib/storeApi";
import { getCustomerToken } from "../../../../lib/auth";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function OrderDetailPage({ params }) {
  const [id, setId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.resolve(params).then((value) =>
      setId(String(value?.id || ""))
    );
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const token = getCustomerToken();

      if (!token) {
        window.location.href = "/account";
        return;
      }

      try {
        const data = await getOrder(token, id);
        setOrder(data);
      } catch (requestError) {
        setError(
          requestError?.message ||
            "We couldn't load this order."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="order-state">
          <LoaderCircle className="spin" size={24} />
          Loading order...
        </main>
        <Footer />
        <style jsx>{styles}</style>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="order-state">
          <Package size={25} />
          <h1>Order unavailable.</h1>
          <p>{error}</p>
          <a href="/account" className="store-button-dark">
            Back to Account
            <ArrowLeft size={15} />
          </a>
        </main>
        <Footer />
        <style jsx>{styles}</style>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="order-page">
        <div className="order-container">
          <a href="/account" className="back-link">
            <ArrowLeft size={14} />
            Account
          </a>

          <section className="order-hero">
            <div>
              <span>Your order</span>
              <h1>
                {order.order_number}
              </h1>
              <p>
                Placed{" "}
                {new Date(
                  order.created_at
                ).toLocaleDateString()}
              </p>
            </div>

            <div className="order-status">
              <Check size={16} />
              {order.status}
            </div>
          </section>

          <div className="order-layout">
            <section className="order-items">
              <div className="section-heading">
                <span>ITEMS</span>
                <h2>What you ordered.</h2>
              </div>

              {order.items?.map((item) => (
                <div
                  className="order-item"
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.product_name}
                    </strong>
                    <span>
                      {item.sku} · Qty{" "}
                      {item.quantity}
                    </span>
                  </div>
                  <strong>
                    {money(item.line_total)}
                  </strong>
                </div>
              ))}
            </section>

            <aside className="order-summary">
              <div className="summary-top">
                <Sparkles size={16} />
                <span>SUMMARY</span>
              </div>

              <div className="summary-line">
                <span>Subtotal</span>
                <strong>
                  {money(order.subtotal)}
                </strong>
              </div>

              <div className="summary-line">
                <span>Shipping</span>
                <strong>
                  {money(order.shipping_fee)}
                </strong>
              </div>

              <div className="summary-line">
                <span>Tax</span>
                <strong>
                  {money(order.tax)}
                </strong>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>
                  {money(order.total)}
                </strong>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{styles}</style>
    </>
  );
}

const styles = `
  .order-page {
    min-height:100vh;
    background:#fffaf8;
    padding:35px 0 110px;
    color:#211b1c;
  }

  .order-container {
    width:min(1100px,calc(100% - 72px));
    margin:0 auto;
  }

  .back-link {
    display:inline-flex;
    align-items:center;
    gap:7px;
    color:#716366;
    font:700 8px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .order-hero {
    margin-top:27px;
    padding:38px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:30px;
    background:linear-gradient(105deg,#f7e3df,#fdf3f0 54%,#ead1ca);
  }

  .order-hero span,
  .section-heading span {
    color:#b86676;
    font:700 8px/1 "DM Sans",sans-serif;
    letter-spacing:.18em;
    text-transform:uppercase;
  }

  .order-hero h1 {
    margin:12px 0 8px;
    font:500 clamp(38px,5vw,62px)/.95 "Playfair Display",Georgia,serif;
    letter-spacing:-.05em;
  }

  .order-hero p {
    margin:0;
    color:#77686b;
    font:400 10px/1 "DM Sans",sans-serif;
  }

  .order-status {
    display:flex;
    align-items:center;
    gap:8px;
    padding:11px 14px;
    background:#fff;
    color:#65575a;
    font:700 8px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .order-status svg { color:#8ca16f; }

  .order-layout {
    margin-top:50px;
    display:grid;
    grid-template-columns:minmax(0,1.45fr) 330px;
    gap:50px;
    align-items:start;
  }

  .section-heading h2 {
    margin:10px 0 25px;
    font:500 36px/.95 "Playfair Display",Georgia,serif;
    letter-spacing:-.045em;
  }

  .order-item {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:20px;
    padding:19px 0;
    border-top:1px solid rgba(33,27,28,.08);
  }

  .order-item div {
    display:grid;
    gap:7px;
  }

  .order-item strong {
    font:600 11px/1.35 "DM Sans",sans-serif;
  }

  .order-item span {
    color:#8b7a7d;
    font:400 8px/1 "DM Sans",sans-serif;
  }

  .order-summary {
    padding:27px;
    background:#f5e0dc;
  }

  .summary-top {
    display:flex;
    align-items:center;
    justify-content:space-between;
    color:#b86676;
    font:700 8px/1 "DM Sans",sans-serif;
    letter-spacing:.18em;
    text-transform:uppercase;
  }

  .summary-line,
  .summary-total {
    display:flex;
    justify-content:space-between;
    gap:15px;
    margin-top:20px;
    color:#645659;
    font:400 10px/1 "DM Sans",sans-serif;
  }

  .summary-total {
    padding-top:21px;
    border-top:1px solid rgba(33,27,28,.1);
    color:#211b1c;
    font-weight:700;
  }

  .summary-total strong {
    font:500 24px/1 "Playfair Display",Georgia,serif;
  }

  .order-state {
    min-height:620px;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-direction:column;
    gap:14px;
    background:#fffaf8;
    color:#756669;
    font:700 9px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .order-state h1 {
    margin:0;
    color:#211b1c;
    font:500 45px/.9 "Playfair Display",Georgia,serif;
    letter-spacing:-.05em;
  }

  .order-state p {
    max-width:400px;
    text-align:center;
    color:#857578;
    font:400 10px/1.6 "DM Sans",sans-serif;
  }

  .spin { animation:spin .8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  @media(max-width:750px) {
    .order-container { width:calc(100% - 32px); }
    .order-layout { grid-template-columns:1fr; }
    .order-hero { padding:27px; align-items:flex-start; flex-direction:column; }
  }
`;
