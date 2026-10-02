import Header from "../../../components/storefront/Header";
import Footer from "../../../components/storefront/Footer";
import { Check, ArrowRight, Sparkles } from "lucide-react";

export default async function CheckoutSuccessPage({ searchParams }) {
  const params = await searchParams;
  const order = params?.order || "";

  return (
    <>
      <Header />
      <main className="payment-result">
        <div className="result-icon"><Check size={28}/></div>
        <span>Payment confirmation</span>
        <h1>
          Thank you for
          <br />
          <em>shopping with us.</em>
        </h1>
        <p>
          Your payment flow has returned successfully.
          {order ? ` Order ${order} is associated with this checkout.` : ""}
        </p>
        <div className="result-note">
          <Sparkles size={16}/>
          <span>Your order status will be updated by the payment webhook.</span>
        </div>
        <div className="result-actions">
          <a href="/shop" className="store-button-dark">
            Continue Shopping <ArrowRight size={16}/>
          </a>
          <a href="/account" className="store-button-light">
            My Account
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
.result-icon{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#8ca271;box-shadow:0 14px 35px rgba(33,27,28,.08)}
.payment-result>span{margin-top:18px;color:#b86676;font:700 8px/1 "DM Sans",sans-serif;letter-spacing:.18em;text-transform:uppercase}
.payment-result h1{margin:14px 0;font:500 59px/.88 "Playfair Display",Georgia,serif;letter-spacing:-.055em}
.payment-result h1 em{color:#b86676;font-style:italic}
.payment-result>p{max-width:500px;color:#77686b;font:400 11px/1.7 "DM Sans",sans-serif}
.result-note{display:flex;align-items:center;gap:8px;margin-top:16px;padding:12px 15px;background:#fff;color:#76676a;font:500 9px/1.4 "DM Sans",sans-serif}
.result-note svg{color:#b86676}
.result-actions{display:flex;gap:10px;margin-top:24px}
@media(max-width:600px){.payment-result h1{font-size:47px}.result-actions{flex-direction:column;width:min(300px,100%)}}
`;
