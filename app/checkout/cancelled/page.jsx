"use client";

import { useEffect, useState } from "react";
import Header from "../../../components/storefront/Header";
import Footer from "../../../components/storefront/Footer";
import { ArrowLeft, ArrowRight, LoaderCircle, Sparkles, ShieldCheck } from "lucide-react";
import { createStripeCheckoutSession } from "../../../lib/storeApi";
import { getCustomerToken } from "../../../lib/auth";

export default function CheckoutCancelledPage() {
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get("order") || "");

    try {
      const stored = window.sessionStorage.getItem("polishpay:pending-checkout");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.order_id && parsed?.checkout_token) {
          setPendingCheckout(parsed);
          setOrderNumber(params.get("order") || parsed.order_number || "");
        }
      }
    } catch {
      // The cancellation page remains usable when browser storage is unavailable.
    }
  }, []);

  async function retryPayment() {
    if (!pendingCheckout?.order_id || !pendingCheckout?.checkout_token) {
      setError("We couldn't recover the secure payment reference in this browser. Please contact support and provide your order number.");
      return;
    }

    setRetrying(true);
    setError("");

    try {
      const session = await createStripeCheckoutSession(
        pendingCheckout.order_id,
        getCustomerToken() || "",
        pendingCheckout.checkout_token
      );

      if (!session?.checkout_url) {
        throw new Error("Stripe did not return a checkout link. Please try again.");
      }

      window.location.assign(session.checkout_url);
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't reopen secure checkout. Please try again."
      );
    } finally {
      setRetrying(false);
    }
  }

  return (
    <>
      <Header />
      <main className="payment-result">
        <div className="result-icon cancel"><Sparkles size={26} /></div>
        <span>Payment not completed</span>
        <h1>
          Your bag is
          <br />
          still <em>waiting.</em>
        </h1>
        <p>
          Checkout was cancelled or closed before payment was confirmed. Your order has been saved as pending and has not been marked paid.
          {orderNumber ? ` Order reference: ${orderNumber}.` : ""}
        </p>

        {error && (
          <div className="checkout-error" role="alert">
            <ShieldCheck size={16} />
            {error}
          </div>
        )}

        <div className="result-actions">
          {pendingCheckout?.checkout_token ? (
            <button
              type="button"
              className="store-button-dark"
              onClick={retryPayment}
              disabled={retrying}
            >
              {retrying ? (
                <>
                  <LoaderCircle size={16} className="spin" />
                  Reopening Checkout...
                </>
              ) : (
                <>
                  Retry Payment <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : (
            <a href="/shop" className="store-button-dark">
              Continue Shopping <ArrowRight size={16} />
            </a>
          )}
          <a href="/shop" className="store-button-light">
            Keep Shopping
          </a>
        </div>
        <a href="/account" className="cancel-account-link">
          <ArrowLeft size={14} /> My Account
        </a>
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
.checkout-error{display:flex;align-items:flex-start;gap:9px;max-width:560px;margin-top:18px;padding:13px 15px;background:#fff;border:1px solid rgba(184,102,118,.25);color:#8e3f51;font:500 10px/1.6 "DM Sans",sans-serif;text-align:left}
.checkout-error svg{flex:0 0 auto;margin-top:1px}
.result-actions{display:flex;gap:10px;margin-top:24px;align-items:center}
.result-actions button{cursor:pointer;border:0;font:700 9px/1 "DM Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:17px 20px;min-height:48px;display:flex;align-items:center;justify-content:center;gap:9px}
.result-actions button:disabled{opacity:.6;cursor:wait}
.cancel-account-link{display:flex;align-items:center;gap:7px;margin-top:20px;color:#77686b;font:700 8px/1 "DM Sans",sans-serif;letter-spacing:.12em;text-transform:uppercase}
.spin{animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:600px){.payment-result h1{font-size:47px}.result-actions{flex-direction:column;width:min(300px,100%)}.result-actions>*{width:100%}}
`;

