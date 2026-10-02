import Header from "../../../components/storefront/Header";
import Footer from "../../../components/storefront/Footer";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export default async function CheckoutCancelledPage({ searchParams }) {
  const params = await searchParams;
  const order = params?.order || "";

  return (
    <>
      <Header />
      <main className="payment-result">
        <div className="result-icon cancel"><Sparkles size={26}/></div>
        <span>Checkout paused</span>
        <h1>
          Your bag is
          <br />
          still <em>waiting.</em>
        </h1>
        <p>
          The payment step was cancelled or closed. Your
          order has not been marked paid.
          {order ? ` Reference: ${order}.` : ""}
        </p>
        <div className="result-actions">
          <a href="/cart" className="store-button-dark">
            Back to Bag <ArrowLeft size={16}/>
          </a>
          <a href="/shop" className="store-button-light">
            Keep Shopping <ArrowRight size={16}/>
          </a>
        </div>
      </main>
      <Footer />
      <style jsx>{styles}</style>
    </>
  );
}

const styles = `
.payment-result{min-height:680px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:70px 24px;background:linear-gradient(145deg,#f7e3df,#fffaf8);color:#211b1c}
.result-icon{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#b86676;box-shadow:0 14px 35px rgba(33,27,28,.08)}
.result-icon.cancel{background:#f4e0dc}
.payment-result>span{margin-top:18px;color:#b86676;font:700 8px/1 "DM Sans",sans-serif;letter-spacing:.18em;text-transform:uppercase}
.payment-result h1{margin:14px 0;font:500 59px/.88 "Playfair Display",Georgia,serif;letter-spacing:-.055em}
.payment-result h1 em{color:#b86676;font-style:italic}
.payment-result>p{max-width:500px;color:#77686b;font:400 11px/1.7 "DM Sans",sans-serif}
.result-actions{display:flex;gap:10px;margin-top:24px}
@media(max-width:600px){.payment-result h1{font-size:47px}.result-actions{flex-direction:column;width:min(300px,100%)}}
`;
