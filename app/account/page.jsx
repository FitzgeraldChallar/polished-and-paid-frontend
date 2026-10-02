"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  LogOut,
  MapPin,
  Package,
  Plus,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";

import Header from "../../components/storefront/Header";
import Footer from "../../components/storefront/Footer";
import {
  createAddress,
  createCheckoutOrder,
  deleteAddress,
  getAddresses,
  getCustomerProfile,
  getOrders,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
} from "../../lib/storeApi";
import {
  clearCustomerSession,
  getCustomerToken,
  getStoredCustomer,
  setCustomerSession,
  setStoredCustomer,
} from "../../lib/auth";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function AccountPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("overview");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAddress, setShowAddress] = useState(false);

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState({
    label: "Home",
    first_name: "",
    last_name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
    phone: "",
    is_default: true,
  });

  useEffect(() => {
    const storedToken = getCustomerToken();
    setToken(storedToken);
    setUser(getStoredCustomer());

    if (storedToken) {
      loadAccount(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadAccount(authToken = token) {
    if (!authToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [profile, addressList, orderList] =
        await Promise.all([
          getCustomerProfile(authToken),
          getAddresses(authToken),
          getOrders(authToken),
        ]);

      setUser(profile);
      setStoredCustomer(profile);
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
      setAddresses(addressList);
      setOrders(orderList);
    } catch (requestError) {
      clearCustomerSession();
      setToken("");
      setUser(null);
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "Your session has expired."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const result =
        mode === "login"
          ? await loginCustomer(
              authForm.email,
              authForm.password
            )
          : await registerCustomer(authForm);

      const sessionToken =
        result?.token ||
        result?.key ||
        result?.access_token ||
        result?.access ||
        "";
      const sessionUser = result?.user || result?.customer || null;

      if (!sessionToken) {
        throw new Error(
          "The account service signed in but did not return a customer session token. Please check the Django auth response."
        );
      }

      setCustomerSession({ ...result, token: sessionToken, user: sessionUser });
      setToken(sessionToken);
      setUser(sessionUser);
      setNotice(
        mode === "login"
          ? "Welcome back."
          : "Your account has been created."
      );

      await loadAccount(sessionToken);
    } catch (requestError) {
      setError(
        requestError?.data?.email?.[0] ||
          requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't complete that request."
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const updated =
        await updateCustomerProfile(
          token,
          profileForm
        );

      setUser(updated);
      setStoredCustomer(updated);
      setNotice("Your profile has been updated.");
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't save your profile."
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const created = await createAddress(
        token,
        addressForm
      );

      setAddresses((current) => [
        created,
        ...current.map((item) => ({
          ...item,
          is_default: addressForm.is_default
            ? false
            : item.is_default,
        })),
      ]);

      setShowAddress(false);
      setNotice("Address saved.");
      setAddressForm({
        label: "Home",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "United States",
        phone: user?.phone || "",
        is_default: true,
      });
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't save that address."
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeAddress(id) {
    if (!window.confirm("Remove this address?")) {
      return;
    }

    try {
      await deleteAddress(token, id);
      setAddresses((current) =>
        current.filter((item) => item.id !== id)
      );
      setNotice("Address removed.");
    } catch (requestError) {
      setError(
        requestError?.data?.detail ||
          requestError?.message ||
          "We couldn't remove that address."
      );
    }
  }

  async function signOut() {
    try {
      await logoutCustomer(token);
    } catch {
      // The local session is still cleared even if the
      // remote token has already expired.
    }

    clearCustomerSession();
    setToken("");
    setUser(null);
    setAddresses([]);
    setOrders([]);
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="account-loading">
          <div />
          <div />
          <div />
        </main>
        <Footer />
        <style jsx>{accountStyles}</style>
      </>
    );
  }

  if (!token || !user) {
    return (
      <>
        <Header />

        <main className="account-auth">
          <div className="account-auth-art">
            <img src="/images/polish-pay-logo.png" alt="Polish & Pay" className="account-auth-logo" />
            <h1>
              Your beauty.
              <br />
              Your <em>account.</em>
            </h1>
            <p>
              Save your details, keep track of orders
              and make your next shopping moment easier.
            </p>
            <div className="account-auth-script">
              Come back
              <br />
              anytime.
            </div>
          </div>

          <div className="account-auth-panel">
            <div className="account-auth-card">
              <span className="account-kicker">
                {mode === "login"
                  ? "Welcome back"
                  : "Join Polish & Pay"}
              </span>

              <h2>
                {mode === "login"
                  ? "Sign in."
                  : "Create account."}
              </h2>

              <p>
                {mode === "login"
                  ? "Access your orders, addresses and saved details."
                  : "Create an account so your next visit feels effortless."}
              </p>

              <form
                className="account-form"
                onSubmit={submitAuth}
              >
                {mode === "register" && (
                  <div className="form-two">
                    <Field
                      label="First name"
                      value={authForm.first_name}
                      onChange={(value) =>
                        setAuthForm((current) => ({
                          ...current,
                          first_name: value,
                        }))
                      }
                      required
                    />

                    <Field
                      label="Last name"
                      value={authForm.last_name}
                      onChange={(value) =>
                        setAuthForm((current) => ({
                          ...current,
                          last_name: value,
                        }))
                      }
                      required
                    />
                  </div>
                )}

                <Field
                  label="Email"
                  type="email"
                  value={authForm.email}
                  onChange={(value) =>
                    setAuthForm((current) => ({
                      ...current,
                      email: value,
                    }))
                  }
                  required
                />

                <Field
                  label="Password"
                  type="password"
                  value={authForm.password}
                  onChange={(value) =>
                    setAuthForm((current) => ({
                      ...current,
                      password: value,
                    }))
                  }
                  required
                />

                {mode === "register" && (
                  <Field
                    label="Phone"
                    value={authForm.phone}
                    onChange={(value) =>
                      setAuthForm((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                  />
                )}

                {error && (
                  <div className="account-error">
                    <X size={15} />
                    {error}
                  </div>
                )}

                <button
                  className="account-submit"
                  disabled={busy}
                  type="submit"
                >
                  {busy
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="account-auth-divider">
                <span>OR</span>
              </div>

              <button
                type="button"
                className={
                  mode === "login"
                    ? "account-create-button"
                    : "account-switch"
                }
                onClick={() => {
                  setMode(
                    mode === "login"
                      ? "register"
                      : "login"
                  );
                  setError("");
                  setNotice("");
                }}
              >
                {mode === "login" ? (
                  <>
                    <UserPlus size={17} strokeWidth={1.8} />
                    <span>Create Your Account</span>
                    <ArrowRight size={15} strokeWidth={1.8} />
                  </>
                ) : (
                  "Already have an account? Sign in"
                )}
              </button>
            </div>
          </div>
        </main>

        <Footer />
        <style jsx>{accountStyles}</style>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="account-page">
        <section className="account-hero">
          <div className="account-hero-copy">
            <div className="account-hero-kicker-row">
              <span>My Polished &amp; Paid</span>
              <span className="account-hero-status">
                <i /> Member account
              </span>
            </div>

            <h1>
              Hello,
              <br />
              <em>
                {user.first_name ||
                  user.email?.split("@")[0] ||
                  "beautiful"}
                .
              </em>
            </h1>

            <p className="account-hero-lead">
              Your orders, saved details and delivery information — all in one beautiful place.
            </p>
          </div>

          <button
            type="button"
            className="account-signout"
            onClick={signOut}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </section>

        <section className="account-content">
          {notice && (
            <div className="account-notice">
              <Check size={15} />
              {notice}
            </div>
          )}

          {error && (
            <div className="account-error account-page-error">
              <X size={15} />
              {error}
            </div>
          )}

          <div className="account-layout">
            <aside className="account-sidebar">
              <button
                className={tab === "overview" ? "active" : ""}
                onClick={() => setTab("overview")}
              >
                <UserRound size={16} />
                Overview
              </button>
              <button
                className={tab === "orders" ? "active" : ""}
                onClick={() => setTab("orders")}
              >
                <Package size={16} />
                Orders
              </button>
              <button
                className={tab === "addresses" ? "active" : ""}
                onClick={() => setTab("addresses")}
              >
                <MapPin size={16} />
                Addresses
              </button>
              <button
                className={tab === "profile" ? "active" : ""}
                onClick={() => setTab("profile")}
              >
                <UserRound size={16} />
                Profile
              </button>
            </aside>

            <div className="account-panel">
              {tab === "overview" && (
                <Overview
                  user={user}
                  orders={orders}
                  setTab={setTab}
                />
              )}

              {tab === "orders" && (
                <Orders orders={orders} />
              )}

              {tab === "addresses" && (
                <Addresses
                  addresses={addresses}
                  setShowAddress={setShowAddress}
                  removeAddress={removeAddress}
                />
              )}

              {tab === "profile" && (
                <form
                  className="profile-form"
                  onSubmit={saveProfile}
                >
                  <PanelHeading
                    eyebrow="Your details"
                    title="Profile"
                  />

                  <div className="form-two">
                    <Field
                      label="First name"
                      value={
                        profileForm.first_name
                      }
                      onChange={(value) =>
                        setProfileForm((current) => ({
                          ...current,
                          first_name: value,
                        }))
                      }
                    />
                    <Field
                      label="Last name"
                      value={
                        profileForm.last_name
                      }
                      onChange={(value) =>
                        setProfileForm((current) => ({
                          ...current,
                          last_name: value,
                        }))
                      }
                    />
                  </div>

                  <Field
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                  />

                  <Field
                    label="Phone"
                    value={profileForm.phone}
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                  />

                  <button
                    className="account-submit profile-save"
                    type="submit"
                    disabled={busy}
                  >
                    Save Changes
                    <Check size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {showAddress && (
          <div className="modal-backdrop">
            <div className="address-modal">
              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowAddress(false)
                }
              >
                <X size={18} />
              </button>

              <span>New address</span>
              <h2>Where should we send it?</h2>

              <form
                className="account-form"
                onSubmit={saveAddress}
              >
                <Field
                  label="Label"
                  value={addressForm.label}
                  onChange={(value) =>
                    setAddressForm((current) => ({
                      ...current,
                      label: value,
                    }))
                  }
                  required
                />

                <div className="form-two">
                  <Field
                    label="First name"
                    value={
                      addressForm.first_name
                    }
                    onChange={(value) =>
                      setAddressForm((current) => ({
                        ...current,
                        first_name: value,
                      }))
                    }
                    required
                  />
                  <Field
                    label="Last name"
                    value={
                      addressForm.last_name
                    }
                    onChange={(value) =>
                      setAddressForm((current) => ({
                        ...current,
                        last_name: value,
                      }))
                    }
                    required
                  />
                </div>

                <Field
                  label="Address"
                  value={addressForm.line1}
                  onChange={(value) =>
                    setAddressForm((current) => ({
                      ...current,
                      line1: value,
                    }))
                  }
                  required
                />

                <Field
                  label="Apartment, suite, etc."
                  value={addressForm.line2}
                  onChange={(value) =>
                    setAddressForm((current) => ({
                      ...current,
                      line2: value,
                    }))
                  }
                />

                <div className="form-two">
                  <Field
                    label="City"
                    value={addressForm.city}
                    onChange={(value) =>
                      setAddressForm((current) => ({
                        ...current,
                        city: value,
                      }))
                    }
                    required
                  />
                  <Field
                    label="State"
                    value={addressForm.state}
                    onChange={(value) =>
                      setAddressForm((current) => ({
                        ...current,
                        state: value,
                      }))
                    }
                  />
                </div>

                <div className="form-two">
                  <Field
                    label="ZIP / Postal code"
                    value={
                      addressForm.postal_code
                    }
                    onChange={(value) =>
                      setAddressForm((current) => ({
                        ...current,
                        postal_code: value,
                      }))
                    }
                  />
                  <Field
                    label="Phone"
                    value={addressForm.phone}
                    onChange={(value) =>
                      setAddressForm((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                  />
                </div>

                <button
                  className="account-submit"
                  type="submit"
                  disabled={busy}
                >
                  Save Address
                  <Check size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <style jsx>{accountStyles}</style>
    </>
  );
}

function Overview({ user, orders, setTab }) {
  return (
    <>
      <PanelHeading
        eyebrow="Your space"
        title="Account overview"
      />

      <div className="overview-grid">
        <div>
          <span>Orders</span>
          <strong>{orders.length}</strong>
          <button onClick={() => setTab("orders")}>
            View orders <ArrowRight size={13} />
          </button>
        </div>

        <div>
          <span>Member</span>
          <strong>
            {user.first_name || "Polish"}
          </strong>
          <button onClick={() => setTab("profile")}>
            Edit profile <ArrowRight size={13} />
          </button>
        </div>

        <div>
          <span>Email</span>
          <strong className="small-value">
            {user.email}
          </strong>
          <button onClick={() => setTab("profile")}>
            Update details <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

function Orders({ orders }) {
  return (
    <>
      <PanelHeading
        eyebrow="Your history"
        title="Orders"
      />

      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <a
              href={`/account/orders/${order.id}`}
              className="order-row"
              key={order.id}
            >
              <div>
                <span>
                  {order.order_number}
                </span>
                <strong>
                  {new Date(
                    order.created_at
                  ).toLocaleDateString()}
                </strong>
              </div>
              <div>
                <span>{order.status}</span>
                <strong>
                  {money(order.total)}
                </strong>
              </div>
              <ArrowRight size={15} />
            </a>
          ))}
        </div>
      ) : (
        <div className="account-empty">
          <Package size={25} />
          <h3>No orders yet.</h3>
          <p>
            Once you place an order, your history
            will appear here.
          </p>
          <a href="/shop" className="store-button-dark">
            Start Shopping
            <ArrowRight size={15} />
          </a>
        </div>
      )}
    </>
  );
}

function Addresses({
  addresses,
  setShowAddress,
  removeAddress,
}) {
  return (
    <>
      <div className="panel-heading-row">
        <PanelHeading
          eyebrow="Delivery"
          title="Addresses"
        />
        <button
          type="button"
          className="small-dark-button"
          onClick={() => setShowAddress(true)}
        >
          <Plus size={14} />
          Add Address
        </button>
      </div>

      {addresses.length ? (
        <div className="address-grid">
          {addresses.map((address) => (
            <div
              className="address-card"
              key={address.id}
            >
              <div className="address-card-top">
                <span>{address.label}</span>
                {address.is_default && (
                  <b>Default</b>
                )}
              </div>
              <strong>
                {address.first_name}{" "}
                {address.last_name}
              </strong>
              <p>
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {address.city}
                {address.state
                  ? `, ${address.state}`
                  : ""}
                {address.postal_code
                  ? ` ${address.postal_code}`
                  : ""}
                <br />
                {address.country}
              </p>
              <button
                type="button"
                onClick={() =>
                  removeAddress(address.id)
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="account-empty">
          <MapPin size={25} />
          <h3>No saved addresses.</h3>
          <p>
            Add an address to make checkout faster.
          </p>
          <button
            type="button"
            className="store-button-dark"
            onClick={() => setShowAddress(true)}
          >
            Add Address
            <Plus size={15} />
          </button>
        </div>
      )}
    </>
  );
}

function PanelHeading({ eyebrow, title }) {
  return (
    <div className="panel-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
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
    <label className="account-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

const accountStyles = `
  .account-loading {
    min-height:620px;
    width:min(1180px,calc(100% - 48px));
    margin:0 auto;
    padding:70px 0;
    display:flex;
    flex-direction:column;
    gap:14px;
  }

  .account-loading div {
    width:100%;
    height:22px;
    background:linear-gradient(90deg,#eee2df,#fff8f6,#eee2df);
    background-size:200% 100%;
    animation:accountPulse 1.5s ease-in-out infinite;
  }

  .account-loading div:nth-child(2){width:65%;height:70px}
  .account-loading div:nth-child(3){width:42%}

  /* =========================================================
     AUTHENTICATION
  ========================================================= */
  .account-auth {
    min-height:760px;
    display:grid;
    grid-template-columns:1.02fr .98fr;
    background:#fffdfc;
  }

  .account-auth-art {
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    padding:8% 9%;
    background:
      radial-gradient(circle at 84% 18%,rgba(255,255,255,.72),transparent 25%),
      linear-gradient(135deg,#fae9e5,#f3d8d3 58%,#eac5c0);
  }

  .account-auth-art::before {
    content:"";
    position:absolute;
    width:560px;
    height:560px;
    border-radius:50%;
    right:-240px;
    top:-210px;
    border:1px solid rgba(255,255,255,.65);
    box-shadow:0 0 0 40px rgba(255,255,255,.16),0 0 0 80px rgba(255,255,255,.10);
  }

  .account-auth-art::after {
    content:"";
    position:absolute;
    width:420px;
    height:420px;
    border-radius:50%;
    left:-190px;
    bottom:-190px;
    background:rgba(255,255,255,.38);
    filter:blur(8px);
  }

  .account-auth-logo {
    position:relative;
    z-index:1;
    width:min(270px,72%);
    height:auto;
    object-fit:contain;
    object-position:left center;
    margin-bottom:auto;
    filter:drop-shadow(0 12px 28px rgba(90,45,51,.12));
  }

  .account-auth-art > span {
    position:relative;
    z-index:1;
    color:#a95868;
    font:700 11px/1 "DM Sans",sans-serif;
    letter-spacing:.22em;
    text-transform:uppercase;
  }

  .account-auth-art h1 {
    position:relative;
    z-index:1;
    max-width:650px;
    margin:18px 0 18px;
    font:500 clamp(58px,6vw,92px)/.86 "Playfair Display",Georgia,serif;
    letter-spacing:-.06em;
    color:#302427;
  }

  .account-auth-art h1 em {
    color:#f3a6b3 !important;
    font-style:italic;
  }

  .account-auth-art p {
    position:relative;
    z-index:1;
    max-width:470px;
    margin:0;
    color:#675457;
    font:400 15px/1.75 "DM Sans",sans-serif;
  }

  .account-auth-script {
    position:relative;
    z-index:1;
    margin-top:28px;
    color:#b86676;
    font:400 55px/.82 "Sacramento",cursive;
    transform:rotate(-4deg);
    text-shadow:0 5px 20px rgba(126,74,84,.10);
  }

  .account-auth-panel {
    display:flex;
    align-items:center;
    justify-content:center;
    padding:70px clamp(32px,7vw,96px);
    background:#fffdfc;
  }

  .account-auth-card {
    width:min(500px,100%);
    padding:4px 0;
  }

  .account-kicker,
  .panel-heading > span {
    color:#b86676;
    font:700 11px/1 "DM Sans",sans-serif;
    letter-spacing:.19em;
    text-transform:uppercase;
  }

  .account-auth-card h2 {
    margin:14px 0 12px;
    font:500 62px/.9 "Playfair Display",Georgia,serif;
    letter-spacing:-.055em;
    color:#211b1c;
  }

  .account-auth-card > p {
    max-width:500px;
    margin:0 0 32px;
    color:#75676a;
    font:400 14px/1.75 "DM Sans",sans-serif;
  }

  .account-form {
    display:grid;
    gap:19px;
  }

  .form-two {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:15px;
  }

  .account-field {
    display:grid;
    gap:9px;
  }

  .account-field > span {
    color:#5f5154;
    font:700 10px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .account-field input {
    width:100%;
    height:56px;
    padding:0 16px;
    border:1px solid #dfd0cd;
    outline:none;
    border-radius:0;
    background:#fff;
    color:#211b1c;
    font:400 14px "DM Sans",sans-serif;
    transition:border-color .2s ease,box-shadow .2s ease;
  }

  .account-field input::placeholder { color:#aaa0a1; }

  .account-field input:focus {
    border-color:#c9838c;
    box-shadow:0 0 0 4px rgba(201,131,140,.09);
  }

  .account-submit,
  .small-dark-button {
    min-height:58px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:11px;
    border:1px solid #211b1c;
    background:#211b1c;
    color:#fff;
    font:700 11px/1 "DM Sans",sans-serif;
    letter-spacing:.14em;
    text-transform:uppercase;
    cursor:pointer;
    transition:background .2s ease,border-color .2s ease,transform .2s ease,box-shadow .2s ease;
  }

  .account-submit:hover,
  .small-dark-button:hover {
    background:#b86676;
    border-color:#b86676;
    transform:translateY(-1px);
    box-shadow:0 9px 22px rgba(184,102,118,.16);
  }

  .account-submit:disabled { opacity:.55; cursor:wait; transform:none; }

  .account-auth-divider {
    display:flex;
    align-items:center;
    gap:14px;
    margin:7px 0 4px;
    color:#a49498;
    font:700 10px/1 "DM Sans",sans-serif;
    letter-spacing:.18em;
  }

  .account-auth-divider::before,
  .account-auth-divider::after {
    content:"";
    flex:1;
    height:1px;
    background:rgba(33,27,28,.10);
  }

  .account-create-button {
    width:100%;
    min-height:58px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:12px;
    padding:0 18px;
    border:1px solid #d89aa3;
    background:linear-gradient(135deg,#fff,#f8e2e5);
    color:#9f5967;
    box-shadow:0 12px 30px rgba(184,102,118,.10),inset 0 1px 0 rgba(255,255,255,.95);
    cursor:pointer;
    font:800 11px/1 "DM Sans",sans-serif;
    letter-spacing:.14em;
    text-transform:uppercase;
    transition:transform .22s ease,background .22s ease,border-color .22s ease,box-shadow .22s ease;
  }

  .account-create-button:hover {
    transform:translateY(-2px);
    border-color:#b86676;
    background:linear-gradient(135deg,#f9e5e7,#efc8ce);
    color:#8f4f5d;
    box-shadow:0 17px 34px rgba(184,102,118,.18),inset 0 1px 0 rgba(255,255,255,1);
  }

  .account-create-button span { flex:1; text-align:center; }

  .account-switch {
    width:100%;
    margin-top:17px;
    padding:0;
    border:0;
    background:transparent;
    color:#817174;
    font:700 12px/1.5 "DM Sans",sans-serif;
    letter-spacing:.02em;
    cursor:pointer;
  }

  .account-switch:hover { color:#b86676; }

  .account-error,
  .account-notice {
    display:flex;
    align-items:center;
    gap:10px;
    padding:13px 15px;
    font:500 12px/1.55 "DM Sans",sans-serif;
  }

  .account-error { background:#fae8e6; color:#8e4d59; }
  .account-notice { background:#f2ece8; color:#625457; }

  /* =========================================================
     CUSTOMER ACCOUNT — BRIGHT / CLEAR / PREMIUM
  ========================================================= */
  .account-page {
    min-height:100vh;
    background:#fffdfc;
    color:#211b1c;
  }

  .account-hero {
    position:relative;
    min-height:360px;
    overflow:hidden;
    padding:62px max(36px,calc((100% - 1240px)/2));
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:50px;
    background:
      radial-gradient(circle at 78% 20%,rgba(255,255,255,.12),transparent 28%),
      radial-gradient(circle at 96% 88%,rgba(255,255,255,.08),transparent 25%),
      linear-gradient(112deg,#5b3b46 0%,#875868 48%,#d49aaa 100%) !important;
    color:#fff !important;
    border-bottom:1px solid rgba(120,75,84,.10);
  }

  .account-hero::before {
    content:"";
    position:absolute;
    width:570px;
    height:570px;
    right:-180px;
    top:-300px;
    border:1px solid rgba(184,102,118,.15);
    border-radius:50%;
    box-shadow:0 0 0 38px rgba(184,102,118,.045),0 0 0 78px rgba(184,102,118,.025);
    pointer-events:none;
  }

  .account-hero::after {
    content:"";
    position:absolute;
    left:0;
    right:0;
    bottom:0;
    height:90px;
    background:linear-gradient(180deg,transparent,rgba(184,102,118,.045));
    pointer-events:none;
  }

  .account-hero-copy {
    position:relative;
    z-index:1;
    max-width:800px;
  }

  .account-hero-kicker-row {
    display:flex;
    align-items:center;
    gap:15px;
    flex-wrap:wrap;
  }

  .account-hero > div span {
    color:#f6d4da !important;
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.22em;
    text-transform:uppercase;
  }

  .account-hero-status {
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:8px 11px;
    border:1px solid rgba(255,255,255,.28);
    background:rgba(255,255,255,.10);
    color:#fff !important;
    font-size:9px !important;
    letter-spacing:.12em !important;
    box-shadow:0 5px 16px rgba(128,70,82,.05);
    backdrop-filter:blur(8px);
  }

  .account-hero-status i {
    width:7px;
    height:7px;
    border-radius:50%;
    background:#b86676;
    box-shadow:0 0 0 4px rgba(255,255,255,.12);
  }

  .account-hero h1 {
    margin:17px 0 0;
    color:#fff !important;
    text-shadow:0 2px 18px rgba(48,31,38,.14);
    font:500 clamp(58px,6vw,88px)/.86 "Playfair Display",Georgia,serif;
    letter-spacing:-.06em;
  }

  .account-hero h1 em {
    color:#b86676;
    font-style:italic;
  }

  .account-hero-lead {
    max-width:610px;
    margin:22px 0 0;
    color:rgba(255,255,255,.94) !important;
    opacity:1 !important;
    font:500 14px/1.75 "DM Sans",sans-serif;
  }

  /*
   * SIGN OUT
   *
   * Deliberately high-contrast and easy to find.
   * It is no longer hidden against the hero background.
   */
  .account-signout {
    position:relative;
    z-index:2;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:9px;
    min-width:128px;
    min-height:48px;
    padding:0 19px;
    border:1px solid #2b2325;
    border-radius:999px;
    background:#2b2325;
    color:#fff;
    box-shadow:0 10px 25px rgba(43,35,37,.16);
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.15em;
    text-transform:uppercase;
    cursor:pointer;
    transition:background .2s ease,border-color .2s ease,color .2s ease,transform .2s ease,box-shadow .2s ease;
  }

  .account-signout svg {
    flex-shrink:0;
    color:#f7d8dd;
  }

  .account-signout:hover {
    background:#b86676;
    border-color:#b86676;
    color:#fff;
    transform:translateY(-2px);
    box-shadow:0 14px 30px rgba(184,102,118,.24);
  }

  .account-signout:active {
    transform:translateY(0);
  }

  .account-content {
    width:min(1240px,calc(100% - 72px));
    margin:0 auto;
    padding:62px 0 120px;
  }

  .account-page-error,
  .account-notice {
    margin-bottom:20px;
  }

  .account-layout {
    display:grid;
    grid-template-columns:230px minmax(0,1fr);
    gap:58px;
    align-items:start;
  }

  .account-sidebar {
    position:sticky;
    top:105px;
    display:grid;
    padding:7px;
    border:1px solid rgba(33,27,28,.08);
    border-radius:2px;
    background:#fff;
    box-shadow:0 14px 35px rgba(64,37,42,.06);
  }

  .account-sidebar button {
    position:relative;
    display:flex;
    align-items:center;
    gap:12px;
    min-height:55px;
    padding:0 15px;
    border:0;
    border-bottom:1px solid rgba(33,27,28,.065);
    background:transparent;
    color:#716367;
    text-align:left;
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.13em;
    text-transform:uppercase;
    cursor:pointer;
    transition:background .18s ease,color .18s ease,padding .18s ease;
  }

  .account-sidebar button:last-child { border-bottom:0; }

  .account-sidebar button::before {
    content:"";
    position:absolute;
    left:0;
    top:13px;
    bottom:13px;
    width:3px;
    background:#b86676;
    transform:scaleY(0);
    transition:transform .18s ease;
  }

  .account-sidebar button.active,
  .account-sidebar button:hover {
    color:#a45465;
    background:#fff2f3;
  }

  .account-sidebar button.active::before { transform:scaleY(1); }

  .account-sidebar button svg {
    flex-shrink:0;
    color:#b86676;
  }

  .account-panel { min-width:0; }

  .panel-heading { margin-bottom:31px; }

  .panel-heading h2 {
    margin:11px 0 0;
    color:#211b1c;
    font:500 48px/.95 "Playfair Display",Georgia,serif;
    letter-spacing:-.05em;
  }

  .overview-grid {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:15px;
  }

  .overview-grid > div {
    position:relative;
    min-height:205px;
    display:flex;
    flex-direction:column;
    padding:27px;
    overflow:hidden;
    border:1px solid rgba(33,27,28,.06);
    background:linear-gradient(145deg,#f8e2df,#fffdfc 85%);
    box-shadow:0 12px 30px rgba(64,37,42,.055);
  }

  .overview-grid > div::after {
    content:"";
    position:absolute;
    width:120px;
    height:120px;
    right:-45px;
    top:-45px;
    border-radius:50%;
    background:rgba(255,255,255,.62);
  }

  .overview-grid span {
    position:relative;
    z-index:1;
    color:#b86676;
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.16em;
    text-transform:uppercase;
  }

  .overview-grid strong {
    position:relative;
    z-index:1;
    margin-top:24px;
    color:#211b1c;
    font:500 30px/.98 "Playfair Display",Georgia,serif;
    word-break:break-word;
  }

  .overview-grid .small-value {
    font:700 14px/1.4 "DM Sans",sans-serif;
  }

  .overview-grid button {
    position:relative;
    z-index:1;
    margin-top:auto;
    display:flex;
    align-items:center;
    gap:7px;
    padding:0;
    border:0;
    background:transparent;
    color:#655659;
    font:800 9px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
    cursor:pointer;
  }

  .overview-grid button:hover { color:#b86676; }

  .orders-list {
    border-top:1px solid rgba(33,27,28,.10);
    background:#fff;
  }

  .order-row {
    display:grid;
    grid-template-columns:1fr 180px auto;
    gap:24px;
    align-items:center;
    padding:23px 18px;
    border-bottom:1px solid rgba(33,27,28,.08);
    color:#211b1c;
    transition:background .18s ease,padding .18s ease;
  }

  .order-row:hover {
    background:#fff7f6;
    padding-left:22px;
  }

  .order-row div { display:grid; gap:7px; }
  .order-row div:last-of-type { text-align:right; }

  .order-row span {
    color:#b86676;
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .order-row strong { font:600 14px/1.35 "DM Sans",sans-serif; }
  .order-row > svg { color:#9c8b8e; }

  .panel-heading-row {
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:20px;
  }

  .small-dark-button {
    min-height:46px;
    padding:0 17px;
    white-space:nowrap;
  }

  .address-grid {
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:17px;
  }

  .address-card {
    padding:24px;
    border:1px solid rgba(33,27,28,.08);
    background:#fff;
    box-shadow:0 10px 25px rgba(64,37,42,.035);
  }

  .address-card-top {
    display:flex;
    justify-content:space-between;
    margin-bottom:18px;
  }

  .address-card-top span {
    color:#b86676;
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.14em;
    text-transform:uppercase;
  }

  .address-card-top b {
    color:#8e6a70;
    font:800 9px/1 "DM Sans",sans-serif;
    letter-spacing:.1em;
    text-transform:uppercase;
  }

  .address-card > strong {
    font:600 15px/1.2 "DM Sans",sans-serif;
  }

  .address-card p {
    margin:11px 0 20px;
    color:#76686b;
    font:400 13px/1.75 "DM Sans",sans-serif;
  }

  .address-card button {
    padding:0;
    border:0;
    background:transparent;
    color:#9b898d;
    font:800 9px/1 "DM Sans",sans-serif;
    letter-spacing:.12em;
    text-transform:uppercase;
    cursor:pointer;
  }

  .address-card button:hover { color:#b86676; }

  .profile-form {
    max-width:680px;
    display:grid;
    gap:20px;
  }

  .profile-save {
    width:max-content;
    padding:0 22px;
    margin-top:5px;
  }

  .account-empty {
    min-height:360px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:35px;
    background:linear-gradient(145deg,#f8e5e2,#fffdfc);
    border:1px solid rgba(33,27,28,.07);
  }

  .account-empty > svg { color:#b86676; }

  .account-empty h3 {
    margin:16px 0 0;
    color:#211b1c;
    font:500 36px/.95 "Playfair Display",Georgia,serif;
  }

  .account-empty p {
    max-width:400px;
    margin:12px 0 24px;
    color:#7e6f72;
    font:400 13px/1.75 "DM Sans",sans-serif;
  }

  .modal-backdrop {
    position:fixed;
    inset:0;
    z-index:3000;
    display:grid;
    place-items:center;
    padding:25px;
    background:rgba(33,27,28,.42);
    backdrop-filter:blur(5px);
  }

  .address-modal {
    position:relative;
    width:min(620px,100%);
    max-height:90vh;
    overflow:auto;
    padding:40px;
    background:#fffaf8;
    box-shadow:0 25px 80px rgba(33,27,28,.18);
  }

  .address-modal > span {
    color:#b86676;
    font:800 10px/1 "DM Sans",sans-serif;
    letter-spacing:.18em;
    text-transform:uppercase;
  }

  .address-modal h2 {
    margin:12px 0 30px;
    font:500 38px/.98 "Playfair Display",Georgia,serif;
    letter-spacing:-.045em;
  }

  .modal-close {
    position:absolute;
    top:17px;
    right:17px;
    width:38px;
    height:38px;
    display:grid;
    place-items:center;
    border:1px solid rgba(33,27,28,.08);
    background:#fff;
    color:#211b1c;
    cursor:pointer;
  }

  @keyframes accountPulse {
    0%,100%{opacity:.5}
    50%{opacity:1}
  }

  @media(max-width:1000px) {
    .account-auth { grid-template-columns:1fr; }
    .account-auth-art { min-height:500px; }
    .account-auth-panel { padding:65px 40px; }
    .account-layout { grid-template-columns:1fr; gap:32px; }
    .account-sidebar { position:static; grid-template-columns:repeat(4,1fr); padding:5px; }
    .account-sidebar button { justify-content:center; padding:0 8px; border:0; min-height:54px; }
    .account-sidebar button::before {
      top:auto;
      left:15%;
      right:15%;
      bottom:0;
      width:auto;
      height:2px;
      transform:scaleX(0);
    }
    .account-sidebar button.active::before { transform:scaleX(1); }
    .overview-grid { grid-template-columns:1fr; }
  }

  @media(max-width:700px) {
    .account-content { width:calc(100% - 32px); }

    .account-hero {
      min-height:390px;
      padding:48px 20px;
      align-items:flex-end;
    }

    .account-hero-kicker-row { gap:10px; }
    .account-hero-lead { font-size:13px; }

    .account-signout {
      position:absolute;
      top:22px;
      right:20px;
    }

    .account-auth-art {
      min-height:390px;
      padding:45px 30px;
    }

    .account-auth-art h1 { font-size:56px; }
    .account-auth-panel { padding:50px 22px; }
    .account-auth-card h2 { font-size:54px; }

    .form-two,
    .address-grid {
      grid-template-columns:1fr;
    }

    .account-sidebar button {
      font-size:9px;
      letter-spacing:.08em;
    }

    .order-row {
      grid-template-columns:1fr auto;
    }

    .order-row div:last-of-type { text-align:left; }
    .order-row > svg { display:none; }

    .panel-heading h2 {
      font-size:42px;
    }

    .panel-heading-row {
      align-items:flex-start;
    }

    .small-dark-button {
      min-height:42px;
      padding:0 12px;
      font-size:9px;
    }
  }
`;


