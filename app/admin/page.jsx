"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  CreditCard,
} from "lucide-react";
import {
  adminApi,
  clearAdminToken,
  getAdminToken,
  mediaUrl,
} from "../../lib/adminApi";

const nav = [
  ["dashboard", "Overview", LayoutDashboard],
  ["products", "Products", Package],
  ["categories", "Categories", FolderTree],
  ["orders", "Orders", ClipboardList],
  ["inventory", "Inventory", Boxes],
  ["customers", "Customers", Users],
  ["payments", "Payments", CircleDollarSign],
];

const statuses = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function useAdminData(section) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(query = "") {
    setLoading(true);
    setError("");

    try {
      const result = await adminApi[section](query);
      setData(result?.results ?? result ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { data, setData, loading, error, load };
}

export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const loadingRef = useRef(false);

  const loadAll = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const me = await adminApi.me();
      setUser(me);

      const results = await Promise.allSettled([
        adminApi.dashboard(),
        adminApi.products("?page_size=100"),
        adminApi.categories("?page_size=100"),
        adminApi.orders("?page_size=100"),
        adminApi.inventory("?page_size=100"),
        adminApi.customers("?page_size=100"),
        adminApi.payments("?page_size=100"),
      ]);

      const [
        dashboardResult,
        productsResult,
        categoriesResult,
        ordersResult,
        inventoryResult,
        customersResult,
        paymentsResult,
      ] = results;

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      }

      if (productsResult.status === "fulfilled") {
        const value = productsResult.value;
        setProducts(value?.results ?? value ?? []);
      }

      if (categoriesResult.status === "fulfilled") {
        const value = categoriesResult.value;
        setCategories(value?.results ?? value ?? []);
      }

      if (ordersResult.status === "fulfilled") {
        const value = ordersResult.value;
        setOrders(value?.results ?? value ?? []);
      }

      if (inventoryResult.status === "fulfilled") {
        const value = inventoryResult.value;
        setInventory(value?.results ?? value ?? []);
      }

      if (customersResult.status === "fulfilled") {
        const value = customersResult.value;
        setCustomers(value?.results ?? value ?? []);
      }

      if (paymentsResult.status === "fulfilled") {
        const value = paymentsResult.value;
        setPayments(value?.results ?? value ?? []);
      }

      const failed = results
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message)
        .filter(Boolean);

      if (failed.length) {
        setError(
          `Some store data could not be refreshed: ${failed[0]}`
        );
      }

      setLastUpdated(new Date());
    } catch (e) {
      if (e?.status === 401 || e?.status === 403) {
        clearAdminToken();
        router.replace("/admin/login");
      } else {
        setError(
          e?.message ||
            "The admin workspace could not be loaded."
        );
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }

    loadAll();

    const interval = window.setInterval(() => {
      loadAll();
    }, 30000);

    return () => window.clearInterval(interval);
    // loadAll intentionally represents the stable page-level refresh action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function logout() {
    try {
      await adminApi.logout();
    } catch {}

    clearAdminToken();
    router.replace("/admin/login");
  }

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2800);
  }

  async function saveProduct(form) {
    try {
      const payload = {
        name: form.name,
        category: Number(form.category),
        description: form.description,
        short_description: form.short_description,
        price: form.price,
        sale_price: form.sale_price || null,
        stock_quantity: Number(form.stock_quantity || 0),
        low_stock_threshold: Number(
          form.low_stock_threshold || 5
        ),
        featured: !!form.featured,
        is_new: !!form.is_new,
        bestseller: !!form.bestseller,
        is_active: !!form.is_active,
        weight: form.weight || null,
      };

      const result = form.id
        ? await adminApi.updateProduct(form.id, payload)
        : await adminApi.createProduct(payload);

      if (form.image) {
        const fd = new FormData();
        fd.append("image", form.image);
        fd.append("alt_text", form.name);
        fd.append("is_primary", "true");
        await adminApi.uploadProductImage(result.id, fd);
      }

      await loadAll();
      setModal(null);
      flash(
        form.id ? "Product updated." : "Product created."
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeProduct(id) {
    if (!confirm("Delete this product? This cannot be undone."))
      return;

    try {
      await adminApi.deleteProduct(id);
      await loadAll();
      flash("Product deleted.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveCategory(form) {
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image_url: form.image_url,
        icon: form.icon,
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
      };

      if (form.id) {
        await adminApi.updateCategory(form.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }

      await loadAll();
      setModal(null);
      flash(
        form.id ? "Category updated." : "Category created."
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeCategory(id) {
    if (!confirm("Delete this category?")) return;

    try {
      await adminApi.deleteCategory(id);
      await loadAll();
      flash("Category deleted.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await adminApi.updateOrderStatus(id, status);
      await loadAll();
      flash("Order status updated.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function adjustInventory(form) {
    try {
      await adminApi.adjustInventory({
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        transaction_type: form.transaction_type,
        note: form.note,
      });

      await loadAll();
      setModal(null);
      flash("Inventory updated.");
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading && !user) {
    return (
      <div className="pp-admin-loading">
        <Sparkles size={20} />
        Loading your store...
      </div>
    );
  }

  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku} ${p.category_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter((o) =>
    `${o.order_number} ${o.email} ${o.first_name} ${o.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    `${c.email} ${c.first_name} ${c.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="pp-admin-app">
      <style jsx global>
        {adminStyles}
      </style>

      <aside
        className={`pp-admin-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="pp-admin-brand">
          <img
            src="/images/polish-pay-logo.png"
            alt="Polish & Pay"
            className="pp-admin-logo"
          />
          <div>
            <span>Store Manager</span>
          </div>
        </div>

        <nav>
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={
                section === key ? "active" : ""
              }
              onClick={() => {
                setSection(key);
                setSidebarOpen(false);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => setSection("settings")}>
            <Settings size={17} />
            Settings
          </button>

          <button onClick={logout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="pp-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="pp-admin-main">
        <header className="pp-admin-topbar">
          <button
            className="mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div>
            <div className="top-kicker">
              Polish &amp; Pay / {section}
            </div>
            <h1>{sectionTitle(section)}</h1>
          </div>

          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={loadAll}
              title="Refresh store data"
            >
              <RefreshCw
                size={17}
                className={loading ? "admin-spin" : ""}
              />
            </button>

            <div className="admin-user">
              <span>
                {user?.first_name ||
                  user?.email
                    ?.slice(0, 1)
                    ?.toUpperCase() ||
                  "A"}
              </span>

              <div>
                <b>
                  {user?.first_name ||
                    "Administrator"}
                </b>
                <small>Store Admin</small>
              </div>
            </div>
          </div>
        </header>

        {notice && (
          <div className="pp-toast success">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        {error && (
          <div className="pp-toast error">
            <AlertTriangle size={17} />
            {error}
            <button onClick={() => setError("")}>
              <X size={14} />
            </button>
          </div>
        )}

        {section === "dashboard" && (
          <Dashboard
            data={dashboard}
            orders={orders}
            products={products}
            customers={customers}
            setSection={setSection}
            lastUpdated={lastUpdated}
          />
        )}

        {section === "products" && (
          <Products
            products={filteredProducts}
            categories={categories}
            search={search}
            setSearch={setSearch}
            onAdd={() =>
              setModal({ type: "product" })
            }
            onEdit={(p) =>
              setModal({
                type: "product",
                item: p,
              })
            }
            onDelete={removeProduct}
          />
        )}

        {section === "categories" && (
          <Categories
            categories={categories}
            onAdd={() =>
              setModal({ type: "category" })
            }
            onEdit={(c) =>
              setModal({
                type: "category",
                item: c,
              })
            }
            onDelete={removeCategory}
          />
        )}

        {section === "orders" && (
          <Orders
            orders={filteredOrders}
            search={search}
            setSearch={setSearch}
            onStatus={updateStatus}
          />
        )}

        {section === "inventory" && (
          <Inventory
            products={products}
            inventory={inventory}
            onAdjust={() =>
              setModal({ type: "inventory" })
            }
          />
        )}

        {section === "customers" && (
          <Customers
            customers={filteredCustomers}
            search={search}
            setSearch={setSearch}
          />
        )}

        {section === "payments" && (
          <Payments payments={payments} />
        )}

        {section === "settings" && (
          <SettingsPanel user={user} />
        )}
      </main>

      {modal?.type === "product" && (
        <ProductModal
          item={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={saveProduct}
        />
      )}

      {modal?.type === "category" && (
        <CategoryModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={saveCategory}
        />
      )}

      {modal?.type === "inventory" && (
        <InventoryModal
          products={products}
          onClose={() => setModal(null)}
          onSave={adjustInventory}
        />
      )}
    </div>
  );
}

function sectionTitle(section) {
  return (
    {
      dashboard: "Store Overview",
      products: "Products",
      categories: "Categories",
      orders: "Orders",
      inventory: "Inventory",
      customers: "Customers",
      payments: "Payments",
      settings: "Settings",
    }[section] || "Store Overview"
  );
}

function Dashboard({
  data,
  orders,
  products,
  customers,
  setSection,
  lastUpdated,
}) {
  const recent = orders.slice(0, 5);

  const chartData = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      days.push({
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        shortDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        revenue: 0,
        orders: 0,
      });
    }

    const lookup = new Map(
      days.map((day) => [day.key, day])
    );

    orders.forEach((order) => {
      if (!order?.created_at) return;

      const date = new Date(order.created_at);
      if (Number.isNaN(date.getTime())) return;

      const key = date.toISOString().slice(0, 10);
      const day = lookup.get(key);
      if (!day) return;

      day.orders += 1;

      const status = String(
        order.status || ""
      ).toLowerCase();

      if (
        status !== "cancelled" &&
        status !== "refunded"
      ) {
        day.revenue += Number(order.total || 0);
      }
    });

    return days;
  }, [orders]);

  const statusData = useMemo(() => {
    const counts = statuses.map((status) => ({
      status,
      count: orders.filter(
        (order) =>
          String(order?.status || "").toLowerCase() ===
          status
      ).length,
    }));

    const total = counts.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return {
      counts,
      total,
    };
  }, [orders]);

  const chartRevenue = chartData.map(
    (item) => item.revenue
  );
  const maxRevenue = Math.max(
    ...chartRevenue,
    1
  );

  return (
    <div className="pp-page">
      <div className="hero-row">
        <div>
          <p className="page-lead">
            Here is what is happening across your
            store.
          </p>

          {lastUpdated && (
            <div className="dashboard-live">
              <span />
              Live data · Updated{" "}
              {lastUpdated.toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}
              {" · "}auto-refreshes every 30 seconds
            </div>
          )}
        </div>

        <button
          className="primary"
          onClick={() => setSection("products")}
        >
          <Plus size={16} />
          Add product
        </button>
      </div>

      <div className="stat-grid">
        <Stat
          icon={CircleDollarSign}
          label="Total revenue"
          value={money(data?.revenue)}
        />
        <Stat
          icon={ShoppingBag}
          label="Orders"
          value={data?.orders || 0}
        />
        <Stat
          icon={Package}
          label="Active products"
          value={data?.active_products || 0}
        />
        <Stat
          icon={Users}
          label="Customers"
          value={data?.customers || 0}
        />
      </div>

      <div className="analytics-grid">
        <RevenueChart
          data={chartData}
          maxRevenue={maxRevenue}
          orderTotal={orders.length}
        />

        <StatusDonut
          data={statusData}
        />
      </div>

      <div className="dashboard-grid">
        <div className="panel large">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Recent activity
              </span>
              <h2>Latest orders</h2>
            </div>

            <button
              className="text-btn"
              onClick={() => setSection("orders")}
            >
              View all <ChevronRight size={15} />
            </button>
          </div>

          {recent.length ? (
            <OrderMini orders={recent} />
          ) : (
            <Empty
              icon={ClipboardList}
              text="No orders yet. Your first order will appear here."
            />
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">
                Inventory
              </span>
              <h2>Stock health</h2>
            </div>

            <button
              className="text-btn"
              onClick={() => setSection("inventory")}
            >
              Manage <ChevronRight size={15} />
            </button>
          </div>

          <div className="health">
            <div>
              <span>Products</span>
              <b>{data?.products || products.length || 0}</b>
            </div>

            <div>
              <span>Low stock</span>
              <b
                className={
                  data?.low_stock_products
                    ? "danger"
                    : "good"
                }
              >
                {data?.low_stock_products || 0}
              </b>
            </div>

            <div>
              <span>Pending orders</span>
              <b>
                {data?.pending_orders ||
                  orders.filter(
                    (order) =>
                      String(order.status).toLowerCase() ===
                      "pending"
                  ).length ||
                  0}
              </b>
            </div>

            <div>
              <span>Customer accounts</span>
              <b>
                {data?.customers ||
                  customers.length ||
                  0}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueChart({
  data,
  maxRevenue,
  orderTotal,
}) {
  const width = 760;
  const height = 285;
  const padding = {
    top: 25,
    right: 25,
    bottom: 43,
    left: 56,
  };

  const innerWidth =
    width - padding.left - padding.right;
  const innerHeight =
    height - padding.top - padding.bottom;

  const points = data.map((item, index) => {
    const x =
      padding.left +
      (index / Math.max(data.length - 1, 1)) *
        innerWidth;

    const y =
      padding.top +
      innerHeight -
      (item.revenue / maxRevenue) *
        innerHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(
          2
        )} ${point.y.toFixed(2)}`
    )
    .join(" ");

  const areaPath = `${linePath} L ${(
    padding.left + innerWidth
  ).toFixed(2)} ${(
    padding.top + innerHeight
  ).toFixed(2)} L ${padding.left.toFixed(
    2
  )} ${(padding.top + innerHeight).toFixed(
    2
  )} Z`;

  const gridValues = [0.25, 0.5, 0.75, 1];

  return (
    <div className="panel analytics-panel revenue-panel">
      <div className="analytics-head">
        <div>
          <span className="eyebrow">
            Store performance
          </span>
          <h2>Revenue overview</h2>
          <p>
            Daily revenue and order activity for the
            last 7 days.
          </p>
        </div>

        <div className="analytics-summary">
          <strong>{orderTotal}</strong>
          <span>recent orders</span>
        </div>
      </div>

      <div className="chart-wrap">
        <svg
          className="revenue-chart"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Seven day revenue chart"
        >
          <defs>
            <linearGradient
              id="revenueArea"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#d98597"
                stopOpacity="0.24"
              />
              <stop
                offset="100%"
                stopColor="#d98597"
                stopOpacity="0.02"
              />
            </linearGradient>

            <linearGradient
              id="revenueLine"
              x1="0"
              x2="1"
              y1="0"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="#9d5369"
              />
              <stop
                offset="100%"
                stopColor="#e294a8"
              />
            </linearGradient>
          </defs>

          {gridValues.map((value) => {
            const y =
              padding.top +
              innerHeight -
              value * innerHeight;

            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  x2={padding.left + innerWidth}
                  y1={y}
                  y2={y}
                  className="chart-grid-line"
                />

                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="chart-y-label"
                >
                  {money(
                    maxRevenue * value
                  ).replace(".00", "")}
                </text>
              </g>
            );
          })}

          <path
            d={areaPath}
            fill="url(#revenueArea)"
            className="chart-area"
          />

          <path
            d={linePath}
            fill="none"
            stroke="url(#revenueLine)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                className="chart-point-ring"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                className="chart-point"
              />

              <text
                x={point.x}
                y={height - 16}
                textAnchor="middle"
                className="chart-x-label"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="chart-footer">
        {data.map((item) => (
          <div key={item.key}>
            <span>{item.shortDate}</span>
            <strong>
              {money(item.revenue)}
            </strong>
            <small>
              {item.orders} order
              {item.orders === 1 ? "" : "s"}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDonut({ data }) {
  const colors = {
    pending: "#d5a06d",
    paid: "#76a987",
    processing: "#8795bd",
    shipped: "#a789b4",
    delivered: "#4e8b68",
    cancelled: "#bf6b72",
    refunded: "#d38a8e",
  };

  let current = 0;
  const segments = data.counts
    .filter((item) => item.count > 0)
    .map((item) => {
      const start = current;
      const percentage =
        data.total > 0
          ? (item.count / data.total) * 100
          : 0;

      current += percentage;

      return {
        ...item,
        start,
        percentage,
        color: colors[item.status],
      };
    });

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map(
            (segment) =>
              `${segment.color} ${segment.start}% ${
                segment.start + segment.percentage
              }%`
          )
          .join(", ")})`
      : "conic-gradient(#eadfdd 0 100%)";

  return (
    <div className="panel analytics-panel status-panel">
      <div className="analytics-head">
        <div>
          <span className="eyebrow">
            Order health
          </span>
          <h2>Order status</h2>
          <p>
            A live view of the current order
            pipeline.
          </p>
        </div>

        <div className="donut-total">
          <strong>{data.total}</strong>
          <span>orders</span>
        </div>
      </div>

      <div className="donut-area">
        <div
          className="status-donut"
          style={{ background: gradient }}
        >
          <div>
            <strong>
              {data.total}
            </strong>
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="status-legend">
        {data.counts.map((item) => {
          const color =
            colors[item.status] ||
            "#b8acad";

          const percentage =
            data.total > 0
              ? Math.round(
                  (item.count / data.total) * 100
                )
              : 0;

          return (
            <div
              className="status-legend-item"
              key={item.status}
            >
              <span
                className="legend-dot"
                style={{
                  backgroundColor: color,
                }}
              />

              <span className="legend-name">
                {item.status}
              </span>

              <b>{item.count}</b>

              <small>{percentage}%</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat">
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderMini({ orders }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b>{o.order_number}</b>
                <small>
                  {new Date(
                    o.created_at
                  ).toLocaleDateString()}
                </small>
              </td>

              <td>
                {o.first_name} {o.last_name}
              </td>

              <td>
                <Status value={o.status} />
              </td>

              <td>
                <b>
                  {money(
                    o.total,
                    o.currency || "USD"
                  )}
                </b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Products({
  products,
  categories,
  search,
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="pp-page">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search products..."
          />
        </div>

        <button className="primary" onClick={onAdd}>
          <Plus size={16} />
          Add product
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      {p.images?.[0] && (
                        <img
                          src={mediaUrl(
                            p.images[0].image ||
                              p.images[0].image_url
                          )}
                          alt=""
                        />
                      )}

                      <div>
                        <b>{p.name}</b>
                        <small>
                          {p.is_active
                            ? "Active"
                            : "Inactive"}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>{p.sku}</td>
                  <td>{p.category_name}</td>

                  <td>
                    <b>
                      {money(p.current_price)}
                    </b>
                    {p.sale_price && (
                      <del>
                        {money(p.price)}
                      </del>
                    )}
                  </td>

                  <td>
                    <span
                      className={
                        p.stock_quantity <=
                        p.low_stock_threshold
                          ? "stock low"
                          : "stock"
                      }
                    >
                      {p.stock_quantity}
                    </span>
                  </td>

                  <td>
                    <div className="tags">
                      {p.featured && (
                        <i>Featured</i>
                      )}
                      {p.is_new && <i>New</i>}
                      {p.bestseller && (
                        <i>Best</i>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="row-actions">
                      <button
                        onClick={() => onEdit(p)}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() =>
                          onDelete(p.id)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!products.length && (
            <Empty
              icon={Package}
              text="No products match your search."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Categories({
  categories,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="pp-page">
      <div className="toolbar">
        <div className="page-lead">
          Organize the storefront into clear
          shopping collections.
        </div>

        <button className="primary" onClick={onAdd}>
          <Plus size={16} />
          Add category
        </button>
      </div>

      <div className="category-grid">
        {categories.map((c) => (
          <div
            className="category-card"
            key={c.id}
          >
            <div className="category-icon">
              {c.icon || "✦"}
            </div>

            <div>
              <h3>{c.name}</h3>
              <p>
                {c.product_count || 0} products
              </p>
            </div>

            <div className="row-actions">
              <button
                onClick={() => onEdit(c)}
              >
                <Pencil size={15} />
              </button>

              <button
                onClick={() =>
                  onDelete(c.id)
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Orders({
  orders,
  search,
  setSearch,
  onStatus,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  function openOrder(order) {
    setSelectedOrder(order);
  }

  function handleRowKeyDown(event, order) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openOrder(order);
    }
  }

  return (
    <div className="pp-page">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search orders or customers..."
          />
        </div>

        <div className="orders-list-hint">
          <span className="orders-list-hint-dot" />
          Click any order to view full details
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th aria-label="View details" />
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="order-row-clickable"
                  onClick={() => openOrder(o)}
                  onKeyDown={(event) =>
                    handleRowKeyDown(event, o)
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for order ${o.order_number}`}
                >
                  <td>
                    <b>{o.order_number}</b>
                    <small>
                      {o.items?.length || 0} items
                    </small>
                  </td>

                  <td>
                    {o.first_name} {o.last_name}
                    <small>{o.email}</small>
                  </td>

                  <td>
                    {new Date(
                      o.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <b>
                      {money(
                        o.total,
                        o.currency || "USD"
                      )}
                    </b>
                  </td>

                  <td>
                    <Status
                      value={o.payment_status}
                    />
                  </td>

                  <td>
                    <select
                      className="status-select"
                      value={o.status}
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      onChange={(e) =>
                        onStatus(
                          o.id,
                          e.target.value
                        )
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="order-view-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openOrder(o);
                      }}
                      aria-label={`View ${o.order_number}`}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!orders.length && (
            <Empty
              icon={ClipboardList}
              text="No orders found."
            />
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatus={async (id, status) => {
            await onStatus(id, status);
            setSelectedOrder((current) =>
              current
                ? { ...current, status }
                : current
            );
          }}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onStatus,
}) {
  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const currency = order.currency || "USD";

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const addressLines = [
    order.shipping_line1,
    order.shipping_line2,
    [
      order.shipping_city,
      order.shipping_state,
      order.shipping_postal_code,
    ]
      .filter(Boolean)
      .join(", "),
    order.shipping_country,
  ].filter(Boolean);

  return (
    <div
      className="order-detail-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="order-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
      >
        <div className="order-detail-head">
          <div>
            <span className="eyebrow">
              Order details
            </span>
            <div className="order-detail-title-row">
              <h2 id="order-detail-title">
                {order.order_number}
              </h2>
              <span className={`status ${String(order.status).toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <div className="order-detail-date">
              <CalendarDays size={13} />
              {formatDateTime(order.created_at)}
            </div>
          </div>

          <button
            type="button"
            className="order-detail-close"
            onClick={onClose}
            aria-label="Close order details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="order-detail-body">
          <div className="order-detail-status-bar">
            <div>
              <span>Order status</span>
              <strong>
                {String(order.status).replace(
                  /^./,
                  (letter) => letter.toUpperCase()
                )}
              </strong>
            </div>
            <div>
              <span>Payment status</span>
              <Status value={order.payment_status} />
            </div>
            <label>
              <span>Update status</span>
              <select
                className="order-detail-status-select"
                value={order.status}
                onChange={(event) =>
                  onStatus(
                    order.id,
                    event.target.value
                  )
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="order-detail-info-grid">
            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <div className="order-detail-icon">
                  <Mail size={15} />
                </div>
                <div>
                  <span className="eyebrow">
                    Customer
                  </span>
                  <h3>Contact information</h3>
                </div>
              </div>

              <div className="order-contact-name">
                {order.first_name} {order.last_name}
              </div>
              <a
                className="order-contact-line"
                href={`mailto:${order.email}`}
              >
                <Mail size={13} />
                {order.email || "No email provided"}
              </a>
              <div className="order-contact-line">
                <Phone size={13} />
                {order.shipping_phone ||
                  "No phone provided"}
              </div>
            </section>

            <section className="order-detail-card">
              <div className="order-detail-card-heading">
                <div className="order-detail-icon">
                  <MapPin size={15} />
                </div>
                <div>
                  <span className="eyebrow">
                    Delivery
                  </span>
                  <h3>Shipping address</h3>
                </div>
              </div>

              {addressLines.length ? (
                <address className="order-address">
                  {addressLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {line}
                    </span>
                  ))}
                </address>
              ) : (
                <div className="order-detail-muted">
                  No shipping address provided.
                </div>
              )}
            </section>
          </div>

          <section className="order-items-card">
            <div className="order-detail-section-head">
              <div>
                <span className="eyebrow">
                  Purchase
                </span>
                <h3>Items in this order</h3>
              </div>
              <span className="order-items-count">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            {items.length ? (
              <div className="order-items-table-wrap">
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <b>{item.product_name}</b>
                        </td>
                        <td>{item.sku || "—"}</td>
                        <td>{item.quantity}</td>
                        <td>
                          {money(item.unit_price, currency)}
                        </td>
                        <td>
                          <b>
                            {money(item.line_total, currency)}
                          </b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="order-detail-muted order-items-empty">
                No line items were returned for this order.
              </div>
            )}
          </section>

          <div className="order-detail-bottom-grid">
            <section className="order-detail-card order-notes-card">
              <div className="order-detail-card-heading">
                <div className="order-detail-icon">
                  <ClipboardList size={15} />
                </div>
                <div>
                  <span className="eyebrow">
                    Customer note
                  </span>
                  <h3>Order notes</h3>
                </div>
              </div>
              <p className={order.notes ? "" : "muted"}>
                {order.notes ||
                  "No special instructions were provided with this order."}
              </p>
            </section>

            <section className="order-summary-card">
              <div className="order-summary-heading">
                <div className="order-detail-icon">
                  <CreditCard size={15} />
                </div>
                <div>
                  <span className="eyebrow">
                    Payment summary
                  </span>
                  <h3>Order total</h3>
                </div>
              </div>

              <div className="order-summary-line">
                <span>Subtotal</span>
                <strong>{money(order.subtotal, currency)}</strong>
              </div>
              <div className="order-summary-line">
                <span>Shipping</span>
                <strong>{money(order.shipping_fee, currency)}</strong>
              </div>
              <div className="order-summary-line">
                <span>Tax</span>
                <strong>{money(order.tax, currency)}</strong>
              </div>
              <div className="order-summary-total">
                <span>Total</span>
                <strong>{money(order.total, currency)}</strong>
              </div>
            </section>
          </div>
        </div>

        <div className="order-detail-footer">
          <span>
            Order placed by {order.first_name || "customer"}
          </span>
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Close details
          </button>
        </div>
      </div>
    </div>
  );
}

function Inventory({
  products,
  inventory,
  onAdjust,
}) {
  return (
    <div className="pp-page">
      <div className="toolbar">
        <div className="page-lead">
          Track stock levels and record inventory
          movements.
        </div>

        <button
          className="primary"
          onClick={onAdjust}
        >
          <Plus size={16} />
          Adjust stock
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current stock</th>
                <th>Threshold</th>
                <th>Health</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.name}</b>
                  </td>
                  <td>{p.sku}</td>
                  <td>
                    <b>{p.stock_quantity}</b>
                  </td>
                  <td>
                    {p.low_stock_threshold}
                  </td>
                  <td>
                    {p.stock_quantity <=
                    p.low_stock_threshold ? (
                      <span className="health-badge low">
                        <AlertTriangle size={13} />
                        Low stock
                      </span>
                    ) : (
                      <span className="health-badge good">
                        <CheckCircle2 size={13} />
                        Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">
              Movement history
            </span>
            <h2>Recent inventory activity</h2>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {inventory.slice(0, 20).map((x) => (
                <tr key={x.id}>
                  <td>{x.product_name}</td>
                  <td>{x.transaction_type}</td>
                  <td
                    className={
                      x.quantity < 0
                        ? "danger"
                        : "good"
                    }
                  >
                    {x.quantity > 0
                      ? `+${x.quantity}`
                      : x.quantity}
                  </td>
                  <td>{x.note || "—"}</td>
                  <td>
                    {new Date(
                      x.created_at
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Customers({
  customers,
  search,
  setSearch,
}) {
  return (
    <div className="pp-page">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search customers..."
          />
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Joined</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>
                      {c.first_name || ""}{" "}
                      {c.last_name || ""}
                    </b>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.order_count || 0}</td>
                  <td>
                    <b>
                      {money(
                        c.total_spent || 0
                      )}
                    </b>
                  </td>
                  <td>
                    {new Date(
                      c.date_joined
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Payments({ payments }) {
  return (
    <div className="pp-page">
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.order_number}</b>
                  </td>
                  <td>{p.customer_email}</td>
                  <td>{p.provider}</td>
                  <td>
                    <b>
                      {money(
                        p.amount,
                        p.currency || "USD"
                      )}
                    </b>
                  </td>
                  <td>
                    <Status value={p.status} />
                  </td>
                  <td>
                    {new Date(
                      p.created_at
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!payments.length && (
            <Empty
              icon={CircleDollarSign}
              text="No payments yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ user }) {
  return (
    <div className="pp-page">
      <div className="panel settings-panel">
        <span className="eyebrow">
          Administrator
        </span>

        <h2>
          {user?.first_name ||
            "Store administrator"}
        </h2>

        <p>{user?.email}</p>

        <div className="settings-note">
          <Settings size={18} />

          <div>
            <b>Store settings</b>
            <span>
              Business settings, shipping rules and
              additional configuration can be added
              here as the store requirements grow.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Status({ value }) {
  return (
    <span
      className={`status ${String(
        value
      ).toLowerCase()}`}
    >
      {value}
    </span>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="empty">
      <Icon size={24} />
      <span>{text}</span>
    </div>
  );
}

function ProductModal({
  item,
  categories,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category:
      item?.category ||
      categories[0]?.id ||
      "",
    description: item?.description || "",
    short_description:
      item?.short_description || "",
    price: item?.price || "",
    sale_price: item?.sale_price || "",
    stock_quantity:
      item?.stock_quantity || 0,
    low_stock_threshold:
      item?.low_stock_threshold || 5,
    featured: item?.featured ?? false,
    is_new: item?.is_new ?? true,
    bestseller: item?.bestseller ?? false,
    is_active: item?.is_active ?? true,
    weight: item?.weight || "",
    image: null,
  });

  const set = (k, v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  return (
    <Modal
      title={
        item ? "Edit product" : "Add product"
      }
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            id: item?.id,
          });
        }}
      >
        <div className="form-grid">
          <Field
            label="Product name"
            value={form.name}
            onChange={(v) =>
              set("name", v)
            }
            required
          />

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) =>
                set(
                  "category",
                  e.target.value
                )
              }
            >
              {categories.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="generated-sku-field">
            <div className="generated-sku-label">
              <span>SKU</span>
              <small>Generated automatically</small>
            </div>
            <div className="generated-sku-value">
              {item?.sku || "Generated when product is created"}
            </div>
          </div>

          <Field
            label="Price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(v) =>
              set("price", v)
            }
            required
          />

          <Field
            label="Sale price"
            type="number"
            step="0.01"
            value={form.sale_price}
            onChange={(v) =>
              set("sale_price", v)
            }
          />

          <Field
            label="Stock quantity"
            type="number"
            value={form.stock_quantity}
            onChange={(v) =>
              set(
                "stock_quantity",
                v
              )
            }
          />

          <Field
            label="Low stock threshold"
            type="number"
            value={
              form.low_stock_threshold
            }
            onChange={(v) =>
              set(
                "low_stock_threshold",
                v
              )
            }
          />

          <Field
            label="Weight"
            type="number"
            step="0.01"
            value={form.weight}
            onChange={(v) =>
              set("weight", v)
            }
          />
        </div>

        <label>
          Short description
          <input
            value={form.short_description}
            onChange={(e) =>
              set(
                "short_description",
                e.target.value
              )
            }
          />
        </label>

        <label>
          Description
          <textarea
            rows="5"
            value={form.description}
            onChange={(e) =>
              set(
                "description",
                e.target.value
              )
            }
          />
        </label>

        <label>
          Primary product image
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              set(
                "image",
                e.target.files?.[0] ||
                  null
              )
            }
          />
        </label>

        <div className="checks">
          {[
            ["featured", "Featured"],
            ["is_new", "New arrival"],
            ["bestseller", "Bestseller"],
            ["is_active", "Active"],
          ].map(([k, l]) => (
            <label
              key={k}
              className="check"
            >
              <input
                type="checkbox"
                checked={form[k]}
                onChange={(e) =>
                  set(
                    k,
                    e.target.checked
                  )
                }
              />
              <span>{l}</span>
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="primary">
            {item
              ? "Save changes"
              : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryModal({
  item,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description:
      item?.description || "",
    image_url:
      item?.image_url || "",
    icon: item?.icon || "✦",
    sort_order:
      item?.sort_order || 0,
    is_active:
      item?.is_active ?? true,
  });

  const set = (k, v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  return (
    <Modal
      title={
        item
          ? "Edit category"
          : "Add category"
      }
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            id: item?.id,
          });
        }}
      >
        <Field
          label="Category name"
          value={form.name}
          onChange={(v) =>
            set("name", v)
          }
          required
        />

        <label>
          Description
          <textarea
            rows="4"
            value={form.description}
            onChange={(e) =>
              set(
                "description",
                e.target.value
              )
            }
          />
        </label>

        <div className="form-grid">
          <Field
            label="Icon"
            value={form.icon}
            onChange={(v) =>
              set("icon", v)
            }
          />

          <Field
            label="Sort order"
            type="number"
            value={form.sort_order}
            onChange={(v) =>
              set("sort_order", v)
            }
          />
        </div>

        <Field
          label="Image URL"
          value={form.image_url}
          onChange={(v) =>
            set("image_url", v)
          }
        />

        <label className="check">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              set(
                "is_active",
                e.target.checked
              )
            }
          />
          <span>Active</span>
        </label>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="primary">
            {item
              ? "Save changes"
              : "Create category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function InventoryModal({
  products,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    product_id:
      products[0]?.id || "",
    quantity: 1,
    transaction_type:
      "restock",
    note: "",
  });

  const set = (k, v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  return (
    <Modal
      title="Adjust inventory"
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <label>
          Product
          <select
            value={form.product_id}
            onChange={(e) =>
              set(
                "product_id",
                e.target.value
              )
            }
          >
            {products.map((p) => (
              <option
                key={p.id}
                value={p.id}
              >
                {p.name} —{" "}
                {p.stock_quantity} in stock
              </option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <Field
            label="Quantity"
            type="number"
            value={form.quantity}
            onChange={(v) =>
              set("quantity", v)
            }
          />

          <label>
            Movement
            <select
              value={
                form.transaction_type
              }
              onChange={(e) =>
                set(
                  "transaction_type",
                  e.target.value
                )
              }
            >
              <option value="restock">
                Restock
              </option>
              <option value="return">
                Return
              </option>
              <option value="sale">
                Sale
              </option>
              <option value="adjustment">
                Adjustment
              </option>
            </select>
          </label>
        </div>

        <Field
          label="Note"
          value={form.note}
          onChange={(v) =>
            set("note", v)
          }
        />

        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button className="primary">
            Update stock
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        {...props}
      />
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) =>
        e.target === e.currentTarget &&
        onClose()
      }
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              Polish &amp; Pay
            </span>
            <h2>{title}</h2>
          </div>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

const adminStyles = `
.pp-admin-app{
  min-height:100vh;
  display:flex;
  background:#f9f5f3;
  color:#211a1c;
  font-family:"DM Sans",sans-serif
}

.pp-admin-sidebar{
  position:fixed;
  inset:0 auto 0 0;
  width:245px;
  padding:25px 15px;
  background:#211a1c;
  color:#fff;
  display:flex;
  flex-direction:column;
  z-index:50
}

.pp-admin-brand{
  display:flex;
  align-items:center;
  gap:11px;
  padding:0 12px 27px
}

.pp-admin-brand strong{
  display:block;
  font:500 22px/1 "Playfair Display",serif;
  letter-spacing:-.03em
}

.pp-admin-brand span{
  display:block;
  margin-top:5px;
  color:#c8b7b8;
  font-size:9px;
  font-weight:700;
  letter-spacing:.13em;
  text-transform:uppercase
}

.pp-admin-sidebar nav{
  display:grid;
  gap:4px
}

.pp-admin-sidebar button{
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  height:45px;
  padding:0 13px;
  border:0;
  background:transparent;
  color:#bfb2b3;
  cursor:pointer;
  text-align:left;
  font:600 12px "DM Sans",sans-serif
}

.pp-admin-sidebar button:hover,
.pp-admin-sidebar button.active{
  background:#332a2c;
  color:#fff
}

.pp-admin-sidebar button.active{
  box-shadow:inset 3px 0 #d88991
}

.sidebar-bottom{
  margin-top:auto;
  border-top:1px solid #3a3032;
  padding-top:13px
}

.pp-admin-main{
  width:calc(100% - 245px);
  margin-left:245px;
  min-height:100vh
}

.pp-admin-topbar{
  height:94px;
  padding:0 4%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  background:#fff;
  border-bottom:1px solid #ece2df
}

.top-kicker{
  font-size:9px;
  font-weight:800;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#ad8d91
}

.pp-admin-topbar h1{
  margin:5px 0 0;
  font:500 30px/1 "Playfair Display",serif;
  letter-spacing:-.04em
}

.top-actions{
  display:flex;
  align-items:center;
  gap:16px
}

.icon-btn{
  width:39px;
  height:39px;
  border:1px solid #eadfdd;
  background:#fff;
  display:grid;
  place-items:center;
  cursor:pointer;
  color:#6d6163
}

.admin-spin{
  animation:adminSpin .75s linear infinite
}

@keyframes adminSpin{
  to{transform:rotate(360deg)}
}

.admin-user{
  display:flex;
  align-items:center;
  gap:9px
}

.admin-user>span{
  width:34px;
  height:34px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:#f2d8d5;
  color:#9f5962;
  font-weight:800;
  font-size:12px
}

.admin-user b,
.admin-user small{
  display:block
}

.admin-user b{
  font-size:11px
}

.admin-user small{
  margin-top:2px;
  color:#94898b;
  font-size:9px
}

.mobile-menu{
  display:none
}

.pp-page{
  padding:30px 4% 60px
}

.hero-row,
.toolbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  margin-bottom:23px
}

.page-lead{
  margin:0;
  color:#786d70;
  font-size:13px
}

.dashboard-live{
  display:flex;
  align-items:center;
  gap:7px;
  margin-top:9px;
  color:#8d7d81;
  font-size:9px;
  letter-spacing:.03em
}

.dashboard-live>span{
  width:7px;
  height:7px;
  border-radius:50%;
  background:#67a67e;
  box-shadow:0 0 0 4px rgba(103,166,126,.12);
  animation:livePulse 1.8s ease-in-out infinite
}

@keyframes livePulse{
  0%,100%{opacity:.55;transform:scale(.9)}
  50%{opacity:1;transform:scale(1)}
}

.primary,
.secondary,
.text-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  height:43px;
  padding:0 15px;
  border:0;
  cursor:pointer;
  font:700 9px "DM Sans",sans-serif;
  letter-spacing:.12em;
  text-transform:uppercase
}

.primary{
  background:#211a1c;
  color:#fff
}

.primary:hover{
  background:#b86676
}

.secondary{
  background:#f3eae7;
  color:#3c3032
}

.text-btn{
  height:auto;
  padding:5px;
  background:transparent;
  color:#ad6871
}

.stat-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;
  margin-bottom:18px
}

.stat{
  min-height:135px;
  padding:19px;
  background:#fff;
  border:1px solid #ece2df
}

.stat-icon{
  width:34px;
  height:34px;
  display:grid;
  place-items:center;
  background:#f7e7e4;
  color:#b86676;
  margin-bottom:15px
}

.stat span{
  display:block;
  color:#827679;
  font-size:10px;
  text-transform:uppercase;
  letter-spacing:.1em
}

.stat strong{
  display:block;
  margin-top:6px;
  font:500 27px "Playfair Display",serif
}

/* =========================================================
   LIVE DASHBOARD ANALYTICS
========================================================= */

.analytics-grid{
  display:grid;
  grid-template-columns:minmax(0,1.55fr) minmax(330px,.75fr);
  gap:18px;
  margin-bottom:18px
}

.analytics-panel{
  min-width:0;
  overflow:hidden;
  margin-bottom:0
}

.analytics-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  padding:21px 22px 14px
}

.analytics-head h2{
  margin:4px 0 0;
  font:500 23px "Playfair Display",serif;
  letter-spacing:-.03em
}

.analytics-head p{
  margin:6px 0 0;
  color:#96898c;
  font-size:10px;
  line-height:1.55
}

.analytics-summary{
  min-width:95px;
  padding:10px 12px;
  border:1px solid #eee3e0;
  background:#fcf8f6;
  text-align:right
}

.analytics-summary strong{
  display:block;
  font:500 21px "Playfair Display",serif;
  color:#392c30
}

.analytics-summary span{
  display:block;
  margin-top:2px;
  color:#a09395;
  font-size:8px;
  font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase
}

.chart-wrap{
  width:100%;
  padding:0 12px 0 8px
}

.revenue-chart{
  display:block;
  width:100%;
  height:285px
}

.chart-grid-line{
  stroke:#eee5e2;
  stroke-width:1;
  stroke-dasharray:3 5
}

.chart-y-label,
.chart-x-label{
  fill:#a39799;
  font-family:"DM Sans",sans-serif;
  font-size:9px
}

.chart-area{
  transition:opacity .25s ease
}

.chart-point-ring{
  fill:#fff;
  stroke:#d98597;
  stroke-width:2;
  transition:r .2s ease
}

.chart-point{
  fill:#a95d72;
  transition:r .2s ease
}

.chart-point:hover{
  r:5
}

.chart-footer{
  display:grid;
  grid-template-columns:repeat(7,1fr);
  gap:5px;
  padding:0 22px 20px;
  border-top:1px solid #f0e8e5
}

.chart-footer>div{
  padding-top:12px;
  text-align:center;
  min-width:0
}

.chart-footer span,
.chart-footer small{
  display:block;
  color:#9a8d90;
  font-size:8px
}

.chart-footer strong{
  display:block;
  margin:4px 0 2px;
  color:#382c2f;
  font-size:10px;
  font-weight:800
}

.status-panel{
  display:flex;
  flex-direction:column
}

.donut-total{
  text-align:right
}

.donut-total strong{
  display:block;
  font:500 21px "Playfair Display",serif
}

.donut-total span{
  color:#a09395;
  font-size:8px;
  font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase
}

.donut-area{
  display:flex;
  align-items:center;
  justify-content:center;
  padding:12px 20px 20px
}

.status-donut{
  position:relative;
  width:190px;
  height:190px;
  border-radius:50%;
  display:grid;
  place-items:center;
  box-shadow:0 14px 35px rgba(74,43,53,.08)
}

.status-donut::before{
  content:"";
  position:absolute;
  inset:20px;
  border-radius:50%;
  background:#fff;
  box-shadow:inset 0 0 0 1px #f1e8e5
}

.status-donut>div{
  position:relative;
  z-index:1;
  text-align:center
}

.status-donut strong{
  display:block;
  font:500 31px "Playfair Display",serif;
  color:#33272a
}

.status-donut span{
  display:block;
  margin-top:2px;
  color:#9c9092;
  font-size:8px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase
}

.status-legend{
  display:grid;
  gap:0;
  margin:0 22px 21px;
  border-top:1px solid #eee5e2
}

.status-legend-item{
  display:grid;
  grid-template-columns:10px minmax(0,1fr) 30px 35px;
  align-items:center;
  gap:8px;
  min-height:30px;
  border-bottom:1px solid #f2eae7;
  font-size:9px
}

.legend-dot{
  width:7px;
  height:7px;
  border-radius:50%
}

.legend-name{
  color:#66595c;
  text-transform:capitalize
}

.status-legend-item b{
  text-align:right;
  color:#302628;
  font-size:10px
}

.status-legend-item small{
  text-align:right;
  color:#a19496;
  font-size:8px
}

/* =========================================================
   EXISTING DASHBOARD
========================================================= */

.dashboard-grid{
  display:grid;
  grid-template-columns:1.45fr .75fr;
  gap:18px
}

.panel{
  background:#fff;
  border:1px solid #ece2df;
  margin-bottom:18px
}

.panel.large{
  min-width:0
}

.panel-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:21px 22px;
  border-bottom:1px solid #eee5e2
}

.panel h2{
  margin:4px 0 0;
  font:500 23px "Playfair Display",serif;
  letter-spacing:-.03em
}

.table-wrap{
  overflow:auto
}

table{
  width:100%;
  border-collapse:collapse;
  min-width:720px
}

th{
  padding:12px 18px;
  background:#fcf8f6;
  color:#95898a;
  text-align:left;
  font-size:8px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase
}

td{
  padding:14px 18px;
  border-top:1px solid #f0e8e5;
  color:#514749;
  font-size:11px;
  vertical-align:middle
}

td b{
  display:block;
  color:#282022;
  font-weight:700
}

td small{
  display:block;
  margin-top:4px;
  color:#998e90;
  font-size:9px
}

.status{
  display:inline-flex;
  padding:5px 8px;
  border-radius:99px;
  background:#f2eceb;
  color:#75696b;
  font-size:8px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase
}

.status.paid,
.status.delivered{
  background:#e8f3ec;
  color:#47735b
}

.status.processing,
.status.shipped{
  background:#edf0f8;
  color:#58668a
}

.status.pending{
  background:#f9eee2;
  color:#9a7148
}

.status.cancelled,
.status.failed,
.status.refunded{
  background:#fae9e9;
  color:#a65b5b
}

.health{
  padding:7px 22px
}

.health>div{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:16px 0;
  border-bottom:1px solid #f1e9e7;
  font-size:11px
}

.health>div:last-child{
  border:0
}

.health span{
  color:#827679
}

.health b{
  font-size:15px
}

.good{
  color:#4b8060!important
}

.danger{
  color:#b45e65!important
}

.search{
  display:flex;
  align-items:center;
  gap:9px;
  width:min(410px,100%);
  height:43px;
  padding:0 13px;
  background:#fff;
  border:1px solid #e8ddda;
  color:#978b8d
}

.search input{
  width:100%;
  border:0;
  outline:0;
  background:transparent;
  font:400 12px "DM Sans",sans-serif;
  color:#292122
}

.product-cell{
  display:flex;
  align-items:center;
  gap:10px
}

.product-cell img{
  width:42px;
  height:48px;
  object-fit:cover;
  background:#f5e8e4
}

.product-cell small{
  color:#4c8061
}

.product-cell b{
  max-width:230px
}

.product-cell del{
  display:block;
  color:#aaa;
  margin-top:3px;
  font-size:9px
}

.stock{
  font-weight:800;
  color:#4b8060
}

.stock.low{
  color:#b45e65
}

.tags{
  display:flex;
  gap:4px;
  flex-wrap:wrap
}

.tags i{
  padding:4px 6px;
  background:#f6e9e6;
  color:#a6636c;
  font-style:normal;
  font-size:7px;
  font-weight:800;
  text-transform:uppercase
}

.row-actions{
  display:flex;
  gap:5px;
  justify-content:flex-end
}

.row-actions button{
  width:30px;
  height:30px;
  border:1px solid #eee4e1;
  background:#fff;
  color:#7d7173;
  cursor:pointer;
  display:grid;
  place-items:center
}

.row-actions button:hover{
  background:#f8e8e5;
  color:#a55f68
}

.category-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:13px
}

.category-card{
  display:flex;
  align-items:center;
  gap:13px;
  padding:17px;
  background:#fff;
  border:1px solid #ece2df
}

.category-icon{
  width:43px;
  height:43px;
  display:grid;
  place-items:center;
  background:#f6e5e2;
  color:#b86676;
  font-size:20px
}

.category-card h3{
  margin:0;
  font:500 17px "Playfair Display",serif
}

.category-card p{
  margin:4px 0 0;
  color:#95898a;
  font-size:9px
}

.category-card .row-actions{
  margin-left:auto
}

.status-select{
  height:32px;
  border:1px solid #e8ddda;
  background:#fff;
  padding:0 7px;
  font:700 9px "DM Sans",sans-serif;
  text-transform:uppercase;
  color:#514749
}

.health-badge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:6px 8px;
  font-size:8px;
  font-weight:800;
  text-transform:uppercase
}

.health-badge.low{
  background:#fae9e9;
  color:#a65b5b
}

.health-badge.good{
  background:#e8f3ec;
  color:#47735b
}

.settings-panel{
  padding:30px
}

.settings-panel h2{
  font-size:32px
}

.settings-panel>p{
  color:#85797b;
  font-size:13px
}

.settings-note{
  display:flex;
  gap:12px;
  margin-top:28px;
  padding:18px;
  background:#fcf5f3;
  color:#786d70
}

.settings-note b,
.settings-note span{
  display:block
}

.settings-note b{
  font-size:11px;
  color:#302729
}

.settings-note span{
  margin-top:5px;
  font-size:11px;
  line-height:1.6
}

.pp-toast{
  position:fixed;
  right:25px;
  top:20px;
  z-index:100;
  display:flex;
  align-items:center;
  gap:9px;
  padding:12px 14px;
  box-shadow:0 15px 35px rgba(31,20,20,.12);
  font-size:11px
}

.pp-toast.success{
  background:#e8f3ec;
  color:#47735b
}

.pp-toast.error{
  background:#fae9e9;
  color:#a65b5b
}

.pp-toast button{
  border:0;
  background:transparent;
  color:inherit;
  cursor:pointer
}

.pp-admin-loading{
  min-height:100vh;
  display:grid;
  place-items:center;
  gap:10px;
  background:#fff9f7;
  color:#b86676;
  font:600 12px "DM Sans",sans-serif
}

.empty{
  min-height:170px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:10px;
  color:#a09597;
  font-size:11px;
  text-align:center
}

.modal-backdrop{
  position:fixed;
  inset:0;
  z-index:200;
  background:rgba(31,23,24,.44);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px
}

.modal{
  width:min(700px,100%);
  max-height:90vh;
  overflow:auto;
  background:#fff;
  color:#211a1c;
  box-shadow:0 30px 80px rgba(20,10,10,.25)
}

.modal-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:22px 25px;
  border-bottom:1px solid #eee4e1
}

.modal-head h2{
  margin:4px 0 0;
  font:500 27px "Playfair Display",serif
}

.modal-head>button{
  width:34px;
  height:34px;
  border:1px solid #eadfdd;
  background:#fff;
  display:grid;
  place-items:center;
  cursor:pointer
}

.modal-form{
  display:grid;
  gap:16px;
  padding:25px
}

.modal-form label{
  display:grid;
  gap:7px;
  color:#665b5d;
  font-size:9px;
  font-weight:800;
  letter-spacing:.1em;
  text-transform:uppercase
}

.modal-form input,
.modal-form textarea,
.modal-form select{
  width:100%;
  border:1px solid #e6dcd9;
  background:#fff;
  color:#2a2224;
  padding:11px 12px;
  outline:0;
  font:400 12px "DM Sans",sans-serif;
  text-transform:none;
  letter-spacing:0
}

.modal-form input:focus,
.modal-form textarea:focus,
.modal-form select:focus{
  border-color:#c9838c
}

.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:15px
}

.checks{
  display:flex;
  gap:14px;
  flex-wrap:wrap
}

.check{
  display:flex!important;
  grid-template-columns:auto 1fr!important;
  align-items:center;
  gap:7px!important;
  font-size:9px!important
}

.check input{
  width:auto
}

.modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  padding-top:6px;
  border-top:1px solid #eee5e2
}

.pp-sidebar-backdrop{
  display:none
}


/* =========================================================
   ORDERS — PREMIUM DETAIL EXPERIENCE
========================================================= */
.orders-list-hint{
  display:flex;
  align-items:center;
  gap:8px;
  color:#9b8f91;
  font-size:9px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase
}
.orders-list-hint-dot{
  width:7px;
  height:7px;
  border-radius:50%;
  background:#d88991;
  box-shadow:0 0 0 4px rgba(216,137,145,.12)
}
.order-row-clickable{
  cursor:pointer;
  transition:background .18s ease, box-shadow .18s ease
}
.order-row-clickable:hover td{
  background:#fff9f8
}
.order-row-clickable:hover td:first-child{
  box-shadow:inset 3px 0 #d88991
}
.order-row-clickable:focus-visible td{
  background:#fff8f7;
  outline:2px solid rgba(200,131,140,.45);
  outline-offset:-2px
}
.order-view-button{
  width:32px;
  height:32px;
  display:grid;
  place-items:center;
  border:1px solid #eadfdd;
  background:#fff;
  color:#9b6b73;
  cursor:pointer;
  transition:all .18s ease
}
.order-row-clickable:hover .order-view-button{
  background:#f6e2e0;
  border-color:#dca1a8;
  color:#9f5962;
  transform:translateX(2px)
}

.order-detail-backdrop{
  position:fixed;
  inset:0;
  z-index:300;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  background:rgba(31,23,24,.62);
  backdrop-filter:blur(7px);
  -webkit-backdrop-filter:blur(7px);
  animation:orderModalFade .18s ease
}
@keyframes orderModalFade{
  from{opacity:0}
  to{opacity:1}
}
.order-detail-modal{
  width:min(980px,100%);
  max-height:min(900px,92vh);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#fffdfc;
  color:#211a1c;
  border:1px solid rgba(255,255,255,.7);
  box-shadow:0 35px 100px rgba(20,10,10,.34);
  animation:orderModalIn .22s cubic-bezier(.2,.8,.2,1)
}
@keyframes orderModalIn{
  from{opacity:0;transform:translateY(14px) scale(.985)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.order-detail-head{
  flex:0 0 auto;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  padding:25px 28px 21px;
  background:linear-gradient(135deg,#fffdfc 0%,#fff8f7 100%);
  border-bottom:1px solid #eee3e0
}
.order-detail-title-row{
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  gap:10px;
  margin-top:4px
}
.order-detail-title-row h2{
  margin:0;
  font:500 30px/1 "Playfair Display",serif;
  letter-spacing:-.04em;
  color:#2a2022
}
.order-detail-date{
  display:flex;
  align-items:center;
  gap:6px;
  margin-top:9px;
  color:#9a8d90;
  font-size:10px
}
.order-detail-close{
  flex:0 0 auto;
  width:38px;
  height:38px;
  display:grid;
  place-items:center;
  border:1px solid #e8ddda;
  background:#fff;
  color:#6d6063;
  cursor:pointer;
  transition:all .18s ease
}
.order-detail-close:hover{
  background:#f5e4e2;
  border-color:#d99aa2;
  color:#9f5962;
  transform:rotate(3deg)
}
.order-detail-body{
  flex:1 1 auto;
  min-height:0;
  overflow:auto;
  padding:22px 28px 26px;
  scrollbar-width:thin;
  scrollbar-color:#d8c5c4 transparent
}
.order-detail-body::-webkit-scrollbar{width:7px}
.order-detail-body::-webkit-scrollbar-track{background:transparent}
.order-detail-body::-webkit-scrollbar-thumb{background:#d8c5c4;border-radius:99px}
.order-detail-status-bar{
  display:grid;
  grid-template-columns:1fr 1fr 1.1fr;
  gap:1px;
  margin-bottom:18px;
  overflow:hidden;
  border:1px solid #eadfdd;
  background:#eadfdd
}
.order-detail-status-bar>div,
.order-detail-status-bar>label{
  min-height:72px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  gap:6px;
  padding:13px 16px;
  background:#fff
}
.order-detail-status-bar>div>span,
.order-detail-status-bar>label>span{
  color:#9b8e90;
  font-size:8px;
  font-weight:800;
  letter-spacing:.12em;
  text-transform:uppercase
}
.order-detail-status-bar strong{
  color:#302528;
  font-size:13px
}
.order-detail-status-select{
  width:100%;
  height:34px;
  padding:0 9px;
  border:1px solid #e5d8d5;
  outline:0;
  background:#fffaf9;
  color:#3c3032;
  font:700 9px "DM Sans",sans-serif;
  letter-spacing:.06em;
  text-transform:uppercase;
  cursor:pointer
}
.order-detail-status-select:focus{border-color:#c9838c}
.order-detail-info-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  margin-bottom:14px
}
.order-detail-card,
.order-items-card,
.order-summary-card{
  background:#fff;
  border:1px solid #ece2df
}
.order-detail-card{
  padding:19px 20px
}
.order-detail-card-heading,
.order-summary-heading{
  display:flex;
  align-items:center;
  gap:11px;
  margin-bottom:17px
}
.order-detail-icon{
  width:34px;
  height:34px;
  flex:0 0 34px;
  display:grid;
  place-items:center;
  background:#f6e4e1;
  color:#b86676
}
.order-detail-card-heading h3,
.order-summary-heading h3,
.order-detail-section-head h3{
  margin:4px 0 0;
  color:#302628;
  font:500 18px/1.1 "Playfair Display",serif;
  letter-spacing:-.025em
}
.order-contact-name{
  margin-bottom:11px;
  color:#302528;
  font-size:13px;
  font-weight:800
}
.order-contact-line{
  display:flex;
  align-items:center;
  gap:8px;
  min-height:26px;
  color:#75696b;
  font-size:10px;
  text-decoration:none
}
a.order-contact-line:hover{color:#a55f68}
.order-contact-line svg{color:#b86676;flex:0 0 auto}
.order-address{
  display:grid;
  gap:5px;
  margin:0;
  color:#5f5356;
  font-size:11px;
  line-height:1.55;
  font-style:normal
}
.order-address span:first-child{
  color:#302528;
  font-weight:700
}
.order-detail-muted{
  color:#a09395;
  font-size:10px;
  line-height:1.6
}
.order-items-card{
  margin-bottom:14px;
  overflow:hidden
}
.order-detail-section-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  padding:19px 20px;
  border-bottom:1px solid #eee5e2
}
.order-items-count{
  padding:6px 9px;
  background:#f8eeec;
  color:#a35f68;
  font-size:8px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase
}
.order-items-table-wrap{overflow:auto}
.order-items-table{
  width:100%;
  min-width:650px;
  border-collapse:collapse
}
.order-items-table th{
  padding:10px 16px;
  background:#fcf8f6
}
.order-items-table td{
  padding:13px 16px;
  background:#fff;
  font-size:10px
}
.order-items-table td:first-child{min-width:210px}
.order-items-table td b{font-size:10px}
.order-items-empty{padding:28px 20px}
.order-detail-bottom-grid{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);
  gap:14px
}
.order-notes-card p{
  margin:0;
  color:#5f5356;
  font-size:11px;
  line-height:1.7
}
.order-notes-card p.muted{color:#a09395}
.order-summary-card{
  padding:19px 20px
}
.order-summary-heading{margin-bottom:12px}
.order-summary-line{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  min-height:31px;
  border-bottom:1px solid #f2eae7;
  color:#817477;
  font-size:10px
}
.order-summary-line strong{color:#4b4042;font-size:10px}
.order-summary-total{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:15px;
  margin-top:12px;
  padding-top:13px;
  border-top:1px solid #ded2cf
}
.order-summary-total span{
  color:#6e6163;
  font-size:10px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase
}
.order-summary-total strong{
  color:#2c2224;
  font:500 25px "Playfair Display",serif
}
.order-detail-footer{
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  padding:15px 28px;
  background:#fcf8f6;
  border-top:1px solid #eee3e0;
  color:#9b8f91;
  font-size:9px
}
.order-detail-footer .secondary{
  min-width:126px;
  height:38px;
  background:#211a1c;
  color:#fff
}
.order-detail-footer .secondary:hover{background:#b86676}

/* =========================================================
   RESPONSIVE
========================================================= */

@media(max-width:1050px){
  .pp-admin-sidebar{
    width:215px
  }

  .pp-admin-main{
    width:calc(100% - 215px);
    margin-left:215px
  }

  .stat-grid{
    grid-template-columns:repeat(2,1fr)
  }

  .analytics-grid{
    grid-template-columns:1fr
  }

  .dashboard-grid{
    grid-template-columns:1fr
  }

  .category-grid{
    grid-template-columns:repeat(2,1fr)
  }
}

@media(max-width:760px){
  .pp-admin-sidebar{
    transform:translateX(-100%);
    transition:transform .2s ease;
    width:245px
  }

  .pp-admin-sidebar.open{
    transform:translateX(0)
  }

  .pp-sidebar-backdrop{
    display:block;
    position:fixed;
    inset:0;
    z-index:45;
    background:rgba(0,0,0,.35);
    border:0
  }

  .pp-admin-main{
    width:100%;
    margin-left:0
  }

  .mobile-menu{
    display:grid;
    place-items:center;
    width:38px;
    height:38px;
    border:1px solid #eadfdd;
    background:#fff;
    color:#655a5c
  }

  .pp-admin-topbar{
    padding:0 20px;
    height:82px
  }

  .pp-admin-topbar h1{
    font-size:24px
  }

  .top-kicker{
    display:none
  }

  .admin-user div{
    display:none
  }

  .pp-page{
    padding:22px 20px 50px
  }

  .stat-grid{
    grid-template-columns:1fr 1fr
  }

  .category-grid{
    grid-template-columns:1fr
  }

  .toolbar,
  .hero-row{
    align-items:stretch;
    flex-direction:column
  }

  .search{
    width:100%
  }

  .modal{
    max-height:94vh
  }

  .form-grid{
    grid-template-columns:1fr
  }

  .analytics-head{
    padding:19px 18px 10px
  }

  .chart-wrap{
    padding:0 4px
  }

  .chart-footer{
    padding-inline:12px
  }

  .status-donut{
    width:170px;
    height:170px
  }
}


@media(max-width:760px){
  .orders-list-hint{display:none}
  .order-detail-backdrop{padding:10px;align-items:flex-end}
  .order-detail-modal{max-height:95vh;border-radius:0;}
  .order-detail-head{padding:20px 18px 17px}
  .order-detail-title-row h2{font-size:25px}
  .order-detail-body{padding:16px 16px 22px}
  .order-detail-status-bar{grid-template-columns:1fr 1fr}
  .order-detail-status-bar>label{grid-column:1/-1}
  .order-detail-info-grid,
  .order-detail-bottom-grid{grid-template-columns:1fr}
  .order-detail-footer{padding:13px 16px}
}

@media(max-width:430px){
  .stat-grid{
    grid-template-columns:1fr
  }

  .stat{
    min-height:115px
  }

  .pp-admin-topbar .icon-btn{
    display:none
  }

  .pp-admin-topbar h1{
    font-size:21px
  }

  .analytics-head{
    gap:10px
  }

  .analytics-summary{
    display:none
  }

  .chart-footer{
    grid-template-columns:repeat(7,minmax(55px,1fr));
    overflow-x:auto
  }

  .chart-footer>div{
    min-width:55px
  }
}
`;

