"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { adminApi, setAdminToken, getAdminToken } from "../../../lib/adminApi";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getAdminToken()) router.replace("/admin");
  }, [router]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminApi.login({ email, password });
      setAdminToken(result.token);
      router.replace("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pp-admin-login">
      <div className="pp-login-art">
        <div className="pp-login-art-glow" />
        <img src="/images/polish-pay-logo.png" alt="Polish & Pay" className="pp-login-logo" />
        <div className="pp-login-script">Beauty. Wellness. Lifestyle.</div>
      </div>

      <div className="pp-login-panel">
        <div className="pp-login-card">
          <div className="pp-admin-mark"><img src="/images/polish-pay-logo.png" alt="Polish & Pay" /></div>
          <div className="pp-login-kicker">Store Administration</div>
          <h1>Welcome back.</h1>
          <p>Manage products, orders, inventory and customers from one place.</p>

          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@polishandpay.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {error && <div className="pp-admin-error">{error}</div>}

            <button type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Enter Dashboard"}
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="pp-login-security">
            <LockKeyhole size={14} /> Administrator access only
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pp-admin-login { min-height: 100vh; display: grid; grid-template-columns: 1.05fr .95fr; background:#fff9f7; color:#211a1c; font-family:"DM Sans",sans-serif; }
        .pp-login-art { position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; padding:8%; background:linear-gradient(135deg,#f8ddd7,#edd0c3 55%,#e7bfb3); }
        .pp-login-art-glow { position:absolute; width:500px; height:500px; right:-170px; top:-150px; border-radius:50%; background:rgba(255,255,255,.5); filter:blur(20px); }
        .pp-login-logo { position:relative; width:min(360px,80%); height:auto; object-fit:contain; object-position:left center; filter:drop-shadow(0 16px 30px rgba(0,0,0,.25)); }
        .pp-login-script { position:relative; margin-top:18px; font:400 clamp(34px,4vw,58px)/1 "Sacramento",cursive; }
        .pp-login-panel { display:flex; align-items:center; justify-content:center; padding:7%; background:#fffaf8; }
        .pp-login-card { width:min(460px,100%); }
        .pp-admin-mark { width:62px; height:62px; display:grid; place-items:center; border-radius:50%; overflow:hidden; background:linear-gradient(145deg,#3a242c,#120d10); box-shadow:0 10px 26px rgba(53,27,36,.16); } .pp-admin-mark img { width:88px; height:88px; object-fit:contain; }
        .pp-login-kicker { margin-top:25px; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#b86676; }
        .pp-login-card h1 { margin:8px 0 8px; font:500 clamp(42px,4vw,60px)/1 "Playfair Display",serif; letter-spacing:-.05em; }
        .pp-login-card > p { margin:0 0 30px; color:#71676a; font-size:14px; line-height:1.7; }
        .pp-login-card form { display:grid; gap:19px; }
        .pp-login-card label { display:grid; gap:8px; font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
        .pp-login-card input { width:100%; height:52px; padding:0 15px; border:1px solid #e6d9d6; background:#fff; color:#211a1c; outline:none; font:400 14px "DM Sans",sans-serif; }
        .pp-login-card input:focus { border-color:#c9838c; box-shadow:0 0 0 3px rgba(201,131,140,.1); }
        .pp-login-card button { display:flex; align-items:center; justify-content:center; gap:12px; height:54px; border:0; background:#1d1819; color:#fff; cursor:pointer; font:700 10px "DM Sans",sans-serif; letter-spacing:.14em; text-transform:uppercase; }
        .pp-login-card button:hover { background:#b86676; }
        .pp-login-card button:disabled { opacity:.6; cursor:wait; }
        .pp-admin-error { padding:12px 14px; border:1px solid #edc1c1; background:#fff1f1; color:#a34545; font-size:12px; line-height:1.5; }
        .pp-login-security { display:flex; align-items:center; gap:8px; margin-top:22px; color:#8c8183; font-size:11px; }
        @media(max-width:800px){ .pp-admin-login{grid-template-columns:1fr;} .pp-login-art{min-height:250px;padding:32px;} .pp-login-panel{padding:36px 24px;} }
      `}</style>
    </main>
  );
}
