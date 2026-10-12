"use client";



import { useEffect, useState } from "react";

import {

  ArrowLeft,

  ArrowRight,

  Check,

  LoaderCircle,

  ShieldCheck,

  ShoppingBag,

  UserRound,

} from "lucide-react";



import Header from "../../components/storefront/Header";

import Footer from "../../components/storefront/Footer";

import {

  createCheckoutOrder,

  createStripeCheckoutSession,

  getCart,

} from "../../lib/storeApi";

import {

  getCustomerToken,

  getStoredCustomer,

} from "../../lib/auth";



function money(value) {

  return new Intl.NumberFormat("en-US", {

    style: "currency",

    currency: "USD",

  }).format(Number(value || 0));

}



export default function CheckoutPage() {

  const [cart, setCart] = useState(null);

  const [loading, setLoading] = useState(true);

  const [placing, setPlacing] = useState(false);

  const [error, setError] = useState("");

  const [order, setOrder] = useState(null);

  const [checkoutToken, setCheckoutToken] = useState("");



  const stored = getStoredCustomer();



  const [form, setForm] = useState({

    email: stored?.email || "",

    first_name: stored?.first_name || "",

    last_name: stored?.last_name || "",

    shipping_line1: "",

    shipping_line2: "",

    shipping_city: "",

    shipping_state: "",

    shipping_postal_code: "",

    shipping_country: "United States",

    shipping_phone: stored?.phone || "",

    shipping_fee: 0,

    tax: 0,

    notes: "",

  });



  useEffect(() => {

    async function load() {

      try {

        const data = await getCart();

        setCart(data);

      } catch (requestError) {

        setError(

          requestError?.message ||

            "We couldn't load your bag."

        );

      } finally {

        setLoading(false);

      }

    }



    load();

  }, []);



  function update(field, value) {

    setForm((current) => ({

      ...current,

      [field]: value,

    }));

  }



  async function redirectToStripe(orderToPay, token, customerToken) {

    if (!orderToPay?.id || !token) {

      throw new Error(

        "Your order was created, but its secure payment reference is missing. Please contact support before placing another order."

      );

    }



    const session = await createStripeCheckoutSession(

      orderToPay.id,

      customerToken,

      token

    );



    if (!session?.checkout_url) {

      throw new Error(

        "Stripe did not return a checkout link. Please try again."

      );

    }



    try {

      window.sessionStorage.setItem(

        "polishpay:pending-checkout",

        JSON.stringify({

          order_id: orderToPay.id,

          order_number: orderToPay.order_number,

          checkout_token: token,

          first_name: orderToPay.first_name || "",

          total: orderToPay.total,

        })

      );

    } catch {

      // Payment can continue even if browser storage is unavailable.

    }



    window.location.assign(session.checkout_url);

  }



  async function submit(event) {

    event.preventDefault();



    if (!cart?.items?.length) {

      setError("Your bag is empty.");

      return;

    }



    setPlacing(true);

    setError("");

    let createdOrder = null;

    const customerToken = getCustomerToken() || "";



    try {

      createdOrder = await createCheckoutOrder(

        form,

        customerToken

      );

      setOrder(createdOrder);

      setCheckoutToken(createdOrder.checkout_token || "");



      await redirectToStripe(

        createdOrder,

        createdOrder.checkout_token,

        customerToken

      );

    } catch (requestError) {

      if (createdOrder) {

        setOrder(createdOrder);

        setCheckoutToken(createdOrder.checkout_token || "");

        setError(

          requestError?.data?.detail ||

            requestError?.message ||

            "Your order was saved, but secure payment could not start. Retry payment below; you do not need to place the order again."

        );

      } else {

        setError(

          requestError?.data?.detail ||

            requestError?.message ||

            "We couldn't create your order."

        );

      }

    } finally {

      setPlacing(false);

    }

  }



  async function retryPayment() {

    if (!order?.id || !checkoutToken) {

      setError(

        "The secure payment reference is unavailable. Please contact support and provide your order number."

      );

      return;

    }



    setPlacing(true);

    setError("");



    try {

      await redirectToStripe(

        order,

        checkoutToken,

        getCustomerToken() || ""

      );

    } catch (requestError) {

      setError(

        requestError?.data?.detail ||

          requestError?.message ||

          "We couldn't reopen secure checkout. Please try again."

      );

    } finally {

      setPlacing(false);

    }

  }



  if (loading) {

    return (

      <>

        <Header />

        <main className="checkout-state">

          <LoaderCircle className="spin" />

          Loading checkout...

        </main>

        <Footer />

        <style jsx>{styles}</style>

      </>

    );

  }



  if (order) {

    return (

      <>

        <Header />

        <main className="checkout-success">

          <div className="checkout-success-icon">

            <Check size={25} />

          </div>



          <span>Order received</span>



          <h1>

            Thank you,

            <br />

            <em>{order.first_name || "beautiful"}.</em>

          </h1>



          <p>

            Your order{" "}

            <strong>{order.order_number}</strong>{" "}

            has been saved. Complete payment through Stripe's secure checkout to confirm your purchase.

          </p>



          {error && (

            <div className="checkout-error" role="alert">

              <ShieldCheck size={16} />

              {error}

            </div>

          )}



          <div className="checkout-success-card">

            <div>

              <span>Order total</span>

              <strong>{money(order.total)}</strong>

            </div>

            <div>

              <span>Status</span>

              <strong>{order.status}</strong>

            </div>

          </div>



          <div className="checkout-success-actions">

            <button

              type="button"

              className="place-order"

              onClick={retryPayment}

              disabled={placing || !checkoutToken}

            >

              {placing ? (

                <>

                  <LoaderCircle size={16} className="spin" />

                  Opening Secure Checkout...

                </>

              ) : (

                <>

                  Retry Payment

                  <ArrowRight size={17} />

                </>

              )}

            </button>



            {getCustomerToken() && (

              <a

                href={`/account/orders/${order.id}`}

                className="store-button-light"

              >

                View Order

              </a>

            )}

          </div>



          <a href="/shop" className="checkout-back">

            Continue Shopping

          </a>

        </main>

        <Footer />

        <style jsx>{styles}</style>

      </>

    );

  }



  const items = cart?.items || [];

  const subtotal = Number(cart?.subtotal || 0);



  return (

    <>

      <Header />



      <main className="checkout-page">

        <section className="checkout-hero">

          <div>

            <span>Polish &amp; Pay</span>

            <h1>

              Almost

              <br />

              <em>yours.</em>

            </h1>

          </div>



          <div className="checkout-hero-script">

            One last little detail.

            <br />

            <small>♡</small>

          </div>

        </section>



        <section className="checkout-content">

          <div className="checkout-container">

            {error && (

              <div className="checkout-error">

                <ShieldCheck size={16} />

                {error}

              </div>

            )}



            {!items.length ? (

              <div className="checkout-empty">

                <ShoppingBag size={28} />

                <h2>Your bag is empty.</h2>

                <p>

                  Add something beautiful before

                  continuing to checkout.

                </p>

                <a href="/shop" className="store-button-dark">

                  Shop the Edit

                  <ArrowRight size={16} />

                </a>

              </div>

            ) : (

              <form

                className="checkout-layout"

                onSubmit={submit}

              >

                <div className="checkout-form">

                  <div className="checkout-heading">

                    <span>01 · YOUR DETAILS</span>

                    <h2>Where should we send it?</h2>

                  </div>



                  <div className="checkout-section">

                    <div className="checkout-section-title">

                      <UserRound size={16} />

                      Contact

                    </div>



                    <div className="form-two">

                      <Field

                        label="First name"

                        value={form.first_name}

                        onChange={(value) =>

                          update(

                            "first_name",

                            value

                          )

                        }

                        required

                      />

                      <Field

                        label="Last name"

                        value={form.last_name}

                        onChange={(value) =>

                          update(

                            "last_name",

                            value

                          )

                        }

                        required

                      />

                    </div>



                    <Field

                      label="Email"

                      type="email"

                      value={form.email}

                      onChange={(value) =>

                        update("email", value)

                      }

                      required

                    />



                    <Field

                      label="Phone"

                      value={form.shipping_phone}

                      onChange={(value) =>

                        update(

                          "shipping_phone",

                          value

                        )

                      }

                    />

                  </div>



                  <div className="checkout-section">

                    <div className="checkout-section-title">

                      <ShoppingBag size={16} />

                      Shipping address

                    </div>



                    <Field

                      label="Address"

                      value={form.shipping_line1}

                      onChange={(value) =>

                        update(

                          "shipping_line1",

                          value

                        )

                      }

                      required

                    />



                    <Field

                      label="Apartment, suite, etc."

                      value={form.shipping_line2}

                      onChange={(value) =>

                        update(

                          "shipping_line2",

                          value

                        )

                      }

                    />



                    <div className="form-two">

                      <Field

                        label="City"

                        value={form.shipping_city}

                        onChange={(value) =>

                          update(

                            "shipping_city",

                            value

                          )

                        }

                        required

                      />

                      <Field

                        label="State"

                        value={form.shipping_state}

                        onChange={(value) =>

                          update(

                            "shipping_state",

                            value

                          )

                        }

                      />

                    </div>



                    <div className="form-two">

                      <Field

                        label="ZIP / Postal code"

                        value={

                          form.shipping_postal_code

                        }

                        onChange={(value) =>

                          update(

                            "shipping_postal_code",

                            value

                          )

                        }

                      />

                      <Field

                        label="Country"

                        value={

                          form.shipping_country

                        }

                        onChange={(value) =>

                          update(

                            "shipping_country",

                            value

                          )

                        }

                        required

                      />

                    </div>



                    <label className="checkout-field">

                      <span>Order notes</span>

                      <textarea

                        value={form.notes}

                        onChange={(event) =>

                          update(

                            "notes",

                            event.target.value

                          )

                        }

                        placeholder="Anything we should know?"

                        rows={4}

                      />

                    </label>

                  </div>



                  <button

                    className="place-order"

                    type="submit"

                    disabled={placing}

                  >

                    {placing ? (

                      <>

                        <LoaderCircle

                          size={16}

                          className="spin"

                        />

                        Connecting to Secure Checkout...

                      </>

                    ) : (

                      <>

                        Continue to Secure Payment

                        <ArrowRight size={17} />

                      </>

                    )}

                  </button>



                  <p className="payment-note">

                    Secure payment is processed by Stripe. Your card details are entered on Stripe's checkout page and are never stored by Polish &amp; Pay.

                  </p>

                </div>



                <aside className="checkout-summary">

                  <div className="checkout-summary-top">

                    <span>YOUR BAG</span>

                    <strong>

                      {items.length}{" "}

                      {items.length === 1

                        ? "item"

                        : "items"}

                    </strong>

                  </div>



                  <div className="checkout-items">

                    {items.map((item) => (

                      <div

                        className="checkout-item"

                        key={item.id}

                      >

                        <div>

                          <strong>

                            {item.name}

                          </strong>

                          <span>

                            Qty {item.quantity}

                          </span>

                        </div>

                        <b>

                          {money(item.line_total)}

                        </b>

                      </div>

                    ))}

                  </div>



                  <div className="checkout-total">

                    <span>Subtotal</span>

                    <strong>

                      {money(subtotal)}

                    </strong>

                  </div>



                  <div className="checkout-total muted">

                    <span>Shipping</span>

                    <span>Calculated next</span>

                  </div>



                  <div className="checkout-grand">

                    <span>Total</span>

                    <strong>{money(subtotal)}</strong>

                  </div>



                  <a href="/cart" className="checkout-back">

                    <ArrowLeft size={14} />

                    Back to bag

                  </a>

                </aside>

              </form>

            )}

          </div>

        </section>

      </main>



      <Footer />



      <style jsx>{styles}</style>

    </>

  );

}



function Field({

  label,

  value,

  onChange,

  type = "text",

  required = false,

}) {

  return (

    <label className="checkout-field">

      <span>{label}</span>

      <input

        type={type}

        value={value}

        onChange={(event) =>

          onChange(event.target.value)

        }

        required={required}

      />

    </label>

  );

}



const styles = `

  .checkout-page {

    min-height:100vh;

    background:#fffaf8;

    color:#211b1c;

  }



  .checkout-hero {

    min-height:285px;

    padding:52px max(36px,calc((100% - 1280px)/2));

    display:flex;

    align-items:center;

    justify-content:space-between;

    background:linear-gradient(105deg,#f7e3df,#fdf3f0 54%,#ead1ca);

  }



  .checkout-hero > div:first-child span {

    color:#b86676;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.2em;

    text-transform:uppercase;

  }



  .checkout-hero h1 {

    margin:13px 0 0;

    font:500 clamp(55px,6vw,80px)/.84 "Playfair Display",Georgia,serif;

    letter-spacing:-.06em;

  }



  .checkout-hero h1 em { color:#b86676;font-style:italic; }



  .checkout-hero-script {

    margin-right:70px;

    color:#fff;

    font:400 45px/.8 "Sacramento",cursive;

    text-align:center;

    transform:rotate(-4deg);

  }



  .checkout-hero-script small {

    display:block;

    margin-top:14px;

    font:400 22px/1 "DM Sans",sans-serif;

  }



  .checkout-content {

    padding:58px 0 110px;

  }



  .checkout-container {

    width:min(1180px,calc(100% - 72px));

    margin:0 auto;

  }



  .checkout-error {

    display:flex;

    align-items:center;

    gap:10px;

    padding:13px 15px;

    margin-bottom:22px;

    background:#fae8e6;

    color:#8e4d59;

    font:500 13px/1.5 "DM Sans",sans-serif;

  }



  .checkout-layout {

    display:grid;

    grid-template-columns:minmax(0,1.4fr) 380px;

    gap:60px;

    align-items:start;

  }



  .checkout-heading span {

    color:#b86676;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.18em;

  }



  .checkout-heading h2 {

    margin:10px 0 32px;

    font:500 39px/.95 "Playfair Display",Georgia,serif;

    letter-spacing:-.045em;

  }



  .checkout-section {

    margin-bottom:35px;

    padding-bottom:30px;

    border-bottom:1px solid rgba(33,27,28,.09);

    display:grid;

    gap:15px;

  }



  .checkout-section-title {

    display:flex;

    align-items:center;

    gap:8px;

    margin-bottom:2px;

    color:#3e3335;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.14em;

    text-transform:uppercase;

  }



  .checkout-section-title svg {

    color:#b86676;

  }



  .form-two {

    display:grid;

    grid-template-columns:1fr 1fr;

    gap:14px;

  }



  .checkout-field {

    display:grid;

    gap:8px;

  }



  .checkout-field span {

    color:#655659;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.12em;

    text-transform:uppercase;

  }



  .checkout-field input,

  .checkout-field textarea {

    width:100%;

    border:1px solid #e5d8d5;

    outline:0;

    background:#fff;

    color:#211b1c;

    padding:13px;

    font:400 15px/1.4 "DM Sans",sans-serif;

    resize:vertical;

  }



  .checkout-field input { height:49px; }

  .checkout-field input:focus,

  .checkout-field textarea:focus {

    border-color:#c9838c;

    box-shadow:0 0 0 3px rgba(201,131,140,.08);

  }



  .place-order {

    width:100%;

    min-height:57px;

    display:flex;

    align-items:center;

    justify-content:center;

    gap:10px;

    border:0;

    background:#211b1c;

    color:#fff;

    font:700 13px/1 "DM Sans",sans-serif;

    letter-spacing:.14em;

    text-transform:uppercase;

  }



  .place-order:hover:not(:disabled) {

    background:#b86676;

  }



  .place-order:disabled {

    opacity:.55;

    cursor:wait;

  }



  .payment-note {

    margin:14px 0 0;

    color:#918184;

    font:400 11px/1.65 "DM Sans",sans-serif;

    text-align:center;

  }



  .checkout-summary {

    position:sticky;

    top:102px;

    padding:28px;

    background:#f5e0dc;

  }



  .checkout-summary-top {

    display:flex;

    align-items:center;

    justify-content:space-between;

    padding-bottom:18px;

    border-bottom:1px solid rgba(33,27,28,.1);

  }



  .checkout-summary-top span {

    color:#b86676;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.18em;

  }



  .checkout-summary-top strong {

    font:700 13px/1 "DM Sans",sans-serif;

  }



  .checkout-items {

    padding:5px 0;

  }



  .checkout-item {

    display:flex;

    align-items:flex-start;

    justify-content:space-between;

    gap:15px;

    padding:15px 0;

    border-bottom:1px solid rgba(33,27,28,.07);

  }



  .checkout-item div {

    display:grid;

    gap:6px;

  }



  .checkout-item strong {

    font:600 14px/1.3 "DM Sans",sans-serif;

  }



  .checkout-item span {

    color:#8b7a7d;

    font:400 11px/1 "DM Sans",sans-serif;

  }



  .checkout-item b {

    font:700 13px/1 "DM Sans",sans-serif;

  }



  .checkout-total,

  .checkout-grand {

    display:flex;

    justify-content:space-between;

    gap:15px;

    padding-top:16px;

    color:#655659;

    font:400 13px/1 "DM Sans",sans-serif;

  }



  .checkout-total strong {

    font-weight:700;

  }



  .checkout-total.muted {

    color:#918083;

  }



  .checkout-grand {

    margin-top:18px;

    padding-top:20px;

    border-top:1px solid rgba(33,27,28,.1);

    color:#211b1c;

    font-weight:700;

  }



  .checkout-grand strong {

    font:500 26px/1 "Playfair Display",Georgia,serif;

  }



  .checkout-back {

    display:flex;

    align-items:center;

    gap:7px;

    margin-top:23px;

    color:#746568;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.12em;

    text-transform:uppercase;

  }



  .checkout-empty {

    min-height:430px;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    text-align:center;

    background:linear-gradient(145deg,#f7e3df,#fffaf8);

    border:1px solid rgba(33,27,28,.07);

  }



  .checkout-empty svg { color:#b86676; }

  .checkout-empty h2 {

    margin:14px 0 8px;

    font:500 42px/.95 "Playfair Display",Georgia,serif;

    letter-spacing:-.05em;

  }



  .checkout-empty p {

    margin:0 0 22px;

    color:#7e6f72;

    font:400 14px/1.6 "DM Sans",sans-serif;

  }



  .checkout-state {

    min-height:620px;

    display:flex;

    align-items:center;

    justify-content:center;

    gap:12px;

    color:#756669;

    font:700 13px/1 "DM Sans",sans-serif;

    letter-spacing:.12em;

    text-transform:uppercase;

  }



  .spin { animation:spin .8s linear infinite; }

  @keyframes spin { to { transform:rotate(360deg); } }



  .checkout-success {

    min-height:700px;

    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:center;

    text-align:center;

    padding:70px 24px;

    background:linear-gradient(145deg,#f7e3df,#fffaf8);

  }



  .checkout-success-icon {

    width:60px;

    height:60px;

    display:grid;

    place-items:center;

    border-radius:50%;

    background:#fff;

    color:#8da271;

    box-shadow:0 12px 30px rgba(33,27,28,.07);

  }



  .checkout-success > span {

    margin-top:18px;

    color:#b86676;

    font:700 11px/1 "DM Sans",sans-serif;

    letter-spacing:.18em;

    text-transform:uppercase;

  }



  .checkout-success h1 {

    margin:13px 0 13px;

    font:500 61px/.88 "Playfair Display",Georgia,serif;

    letter-spacing:-.055em;

  }



  .checkout-success h1 em { color:#b86676; }



  .checkout-success > p {

    max-width:500px;

    margin:0;

    color:#786a6d;

    font:400 15px/1.7 "DM Sans",sans-serif;

  }



  .checkout-success-card {

    display:flex;

    gap:40px;

    margin-top:27px;

    padding:18px 25px;

    background:#fff;

    border:1px solid rgba(33,27,28,.07);

  }



  .checkout-success-card div {

    display:grid;

    gap:6px;

  }



  .checkout-success-card span {

    color:#a08f92;

    font:700 10px/1 "DM Sans",sans-serif;

    letter-spacing:.12em;

    text-transform:uppercase;

  }



  .checkout-success-card strong {

    font:600 15px/1 "DM Sans",sans-serif;

  }



  .checkout-success-actions {

    display:flex;

    flex-direction:column;

    align-items:center;

    gap:10px;

    width:min(360px,100%);

    margin-top:23px;

  }



  .checkout-success-actions .place-order {

    width:100%;

    cursor:pointer;

  }



  .checkout-success-actions .place-order:disabled {

    cursor:wait;

  }



  .checkout-success .checkout-error {

    max-width:560px;

    margin-top:20px;

    text-align:left;

  }



  @media(max-width:850px) {

    .checkout-layout { grid-template-columns:1fr; }

    .checkout-summary { position:static; }

    .checkout-hero-script { display:none; }

  }



  @media(max-width:600px) {

    .checkout-container { width:calc(100% - 32px); }

    .form-two { grid-template-columns:1fr; }

    .checkout-success h1 { font-size:50px; }

    .checkout-success-actions { flex-direction:column; width:min(300px,100%); }

  }

`;
