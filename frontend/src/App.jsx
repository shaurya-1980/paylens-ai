import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Login from "./pages/Login";
import Register from "./pages/Register";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Database,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  X,
  Zap,
  Eye,
  Filter,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  const [authPage, setAuthPage] = useState("login");

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("paylens_token")
  );

  const handleLogin = (data) => {
    if (data?.access_token) {
      localStorage.setItem(
        "paylens_token",
        data.access_token
      );
    }

    if (data?.user) {
      localStorage.setItem(
        "paylens_user",
        JSON.stringify(data.user)
      );
    }

    setIsAuthenticated(true);
    setAuthPage("login");
  };

  const handleLogout = () => {
    localStorage.removeItem("paylens_token");
    localStorage.removeItem("paylens_user");
    localStorage.removeItem("paylens_active_page");

    setIsAuthenticated(false);
    setAuthPage("login");
  };

  const handleRegister = () => {
    setAuthPage("login");
  };

  /* =========================================================
     DASHBOARD STATE
  ========================================================= */

  const [analytics, setAnalytics] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");

  const [mobileMenu, setMobileMenu] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* =========================================================
     ACTIVE PAGE
     
     Saves the current page in localStorage so browser
     refresh keeps the user on the same page.
  ========================================================= */

  const [activePage, setActivePage] = useState(
    localStorage.getItem("paylens_active_page") ||
      "dashboard"
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  /* =========================================================
     DASHBOARD API
  ========================================================= */

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("paylens_token");

      const response = await axios.get(
        `${API_URL}/analytics`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      setAnalytics(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Analytics error:", err);

      setError(
        "Unable to connect to the payment analytics service. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     AI API
  ========================================================= */

  const fetchAIInsight = async () => {
    try {
      setAiLoading(true);

      const token = localStorage.getItem("paylens_token");

      const response = await axios.get(
        `${API_URL}/ai-insight`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      setAiInsight(response.data);
    } catch (err) {
      console.error("AI insight error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  /* =========================================================
     TRANSACTIONS API
  ========================================================= */

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      setTransactionError("");

      const params = {};

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (methodFilter) {
        params.payment_method = methodFilter;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const token = localStorage.getItem("paylens_token");

      const response = await axios.get(
        `${API_URL}/transactions`,
        {
          params,
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      setTransactions(response.data);
    } catch (err) {
      console.error("Transactions error:", err);

      setTransactionError(
        "Unable to load transactions. Please make sure the backend is running."
      );
    } finally {
      setTransactionsLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDashboard();
    fetchAIInsight();
    fetchTransactions();
  }, [isAuthenticated]);

  /* =========================================================
     TRANSACTION FILTER
  ========================================================= */

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activePage !== "transactions") return;

    const timer = setTimeout(() => {
      fetchTransactions();
    }, 350);

    return () => clearTimeout(timer);
  }, [
    search,
    statusFilter,
    methodFilter,
    activePage,
    isAuthenticated,
  ]);

  /* =========================================================
     REFRESH
  ========================================================= */

  const refreshDashboard = async () => {
    await fetchDashboard();
    await fetchAIInsight();

    if (activePage === "transactions") {
      await fetchTransactions();
    }
  };

  /* =========================================================
     PAGE NAVIGATION
     
     Saves active page to localStorage.
  ========================================================= */

  const openPage = (page) => {
    setActivePage(page);

    localStorage.setItem(
      "paylens_active_page",
      page
    );

    setMobileMenu(false);

    if (page === "transactions") {
      fetchTransactions();
    }

    if (page === "analytics") {
      fetchDashboard();
    }

    if (page === "ai") {
      fetchAIInsight();
    }

    if (page === "failure") {
      fetchDashboard();
    }

    if (page === "recovery") {
      fetchDashboard();
      fetchTransactions();
    }
  };

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    if (!analytics) {
      return {
        transactions: 0,
        revenue: 0,
        successful: 0,
        successRate: 0,
        failures: 0,
      };
    }

    return {
      transactions: analytics.total_transactions || 0,
      revenue: analytics.total_revenue || 0,
      successful: analytics.successful_payments || 0,
      successRate: analytics.success_rate || 0,
      failures: analytics.failed_payments || 0,
    };
  }, [analytics]);

  /* =========================================================
     CHART DATA
  ========================================================= */

  const methodData = useMemo(() => {
    if (!analytics?.payments_by_method) return [];

    return Object.entries(
      analytics.payments_by_method
    ).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analytics]);

  const failureData = useMemo(() => {
    if (!analytics?.failures_by_reason) return [];

    return Object.entries(
      analytics.failures_by_reason
    ).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analytics]);

  const revenueData = useMemo(() => {
    if (!analytics?.revenue_by_day) return [];

    return Object.entries(
      analytics.revenue_by_day
    ).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }, [analytics]);

  /* =========================================================
     CURRENCY
  ========================================================= */

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  /* =========================================================
     DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return date;
    }
  };

  /* =========================================================
     PAYMENT METHODS
  ========================================================= */

  const paymentMethods = useMemo(() => {
    const methods = transactions
      .map(
        (transaction) =>
          transaction.payment_method
      )
      .filter(Boolean);

    return [...new Set(methods)];
  }, [transactions]);

  /* =========================================================
     LOGIN / REGISTER
  ========================================================= */

  if (!isAuthenticated) {
    if (authPage === "register") {
      return (
        <Register
          onRegister={handleRegister}
          onBackToLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() =>
          setAuthPage("register")
        }
      />
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="app-shell">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          mobileMenu ? "mobile-open" : ""
        }`}
      >

        <div className="brand">

          <div className="brand-icon">
            <Zap size={20} fill="currentColor" />
          </div>

          <div>
            <h2>PayLens</h2>
            <span>AI Payment Intelligence</span>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setMobileMenu(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        <div className="workspace">

          <span className="workspace-label">
            WORKSPACE
          </span>

          <div className="workspace-card">

            <div className="workspace-avatar">
              P
            </div>

            <div>
              <strong>PayLens Demo</strong>
              <span>Production</span>
            </div>

            <ChevronDown size={16} />

          </div>

        </div>

        <nav>

          <span className="nav-label">
            OVERVIEW
          </span>

          <button
            className={`nav-item ${
              activePage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openPage("dashboard")
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "transactions"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openPage("transactions")
            }
          >
            <Activity size={18} />
            Transactions
          </button>

          <button
            className={`nav-item ${
              activePage === "analytics"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openPage("analytics")
            }
          >
            <BarChart3 size={18} />
            Analytics
          </button>

          <span className="nav-label second">
            INTELLIGENCE
          </span>

          <button
            className={`nav-item ${
              activePage === "ai"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openPage("ai")
            }
          >
            <BrainCircuit size={18} />
            AI Insights

            <span className="nav-badge">
              AI
            </span>
          </button>

          <button
            className={`nav-item ${
              activePage === "failure"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openPage("failure")
            }
          >
            <AlertTriangle size={18} />
            Failure Analysis
          </button>

          <button
            className={`nav-item ${
              activePage === "recovery"
                ? "active"
                : ""
            }`}
            onClick={() =>
              openPage("recovery")
            }
          >
            <WalletCards size={18} />
            Revenue Recovery
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="security-card">

            <ShieldCheck size={18} />

            <div>
              <strong>System secure</strong>
              <span>All services operational</span>
            </div>

            <span className="online-dot"></span>

          </div>

          <div className="profile">

            <div className="profile-avatar">
              S
            </div>

            <div>
              <strong>Admin</strong>
              <span>Payment Operations</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                marginLeft: "auto",
                padding: "6px 10px",
                border:
                  "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                background: "transparent",
                color: "#aaa",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Logout
            </button>

          </div>

        </div>

      </aside>

      {/* MOBILE OVERLAY */}

      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main-content">

        {/* =====================================================
            TOPBAR
        ===================================================== */}

        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() =>
              setMobileMenu(true)
            }
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">

            <span>Workspace</span>

            <span>/</span>

            <strong>
              {getPageTitle(activePage)}
            </strong>

          </div>

          <div className="top-actions">

            <div className="live-status">
              <span></span>
              Live
            </div>

            <button
              className="refresh-btn"
              onClick={refreshDashboard}
              disabled={
                loading ||
                transactionsLoading ||
                aiLoading
              }
            >
              <RefreshCw
                size={16}
                className={
                  loading ||
                  transactionsLoading ||
                  aiLoading
                    ? "spin"
                    : ""
                }
              />

              Refresh
            </button>

            <div
              className="top-avatar"
              onClick={handleLogout}
              title="Logout"
              style={{
                cursor: "pointer",
              }}
            >
              S
            </div>

          </div>

        </header>

        {/* =====================================================
            DASHBOARD PAGE
        ===================================================== */}

        {activePage === "dashboard" && (

          <section className="dashboard">

            <div className="hero">

              <div>

                <div className="eyebrow">

                  <Sparkles size={15} />

                  AI-POWERED PAYMENT INTELLIGENCE

                </div>

                <h1>
                  Payment performance,
                  <br />
                  <span>made intelligent.</span>
                </h1>

                <p>
                  Monitor payment health, identify
                  revenue leakage, and turn transaction
                  data into actionable decisions.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-icon">
                  <Activity size={22} />
                </div>

                <div>

                  <span>
                    PAYMENT HEALTH
                  </span>

                  <strong>
                    {stats.successRate >= 90
                      ? "Excellent"
                      : stats.successRate >= 75
                      ? "Healthy"
                      : "Needs attention"}
                  </strong>

                </div>

              </div>

            </div>

            {error && (

              <div className="error-banner">

                <AlertTriangle size={18} />

                <div>

                  <strong>
                    Backend connection unavailable
                  </strong>

                  <p>{error}</p>

                </div>

                <button
                  onClick={refreshDashboard}
                >
                  Retry
                </button>

              </div>

            )}

            <div className="stats-grid">

              <StatCard
                title="Total Transactions"
                value={stats.transactions.toLocaleString(
                  "en-IN"
                )}
                icon={<Activity size={20} />}
                trend="+12.8%"
                positive
              />

              <StatCard
                title="Total Revenue"
                value={formatCurrency(
                  stats.revenue
                )}
                icon={
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: "600",
                    }}
                  >
                    ₹
                  </span>
                }
                trend="+8.4%"
                positive
              />

              <StatCard
                title="Successful Payments"
                value={stats.successful.toLocaleString(
                  "en-IN"
                )}
                icon={
                  <CheckCircle2 size={20} />
                }
                trend={`${stats.successRate}% success`}
                positive
              />

              <StatCard
                title="Failed Payments"
                value={stats.failures.toLocaleString(
                  "en-IN"
                )}
                icon={
                  <AlertTriangle size={20} />
                }
                trend="Requires attention"
                warning
              />

            </div>

            <div className="main-grid">

              <div className="panel revenue-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-kicker">
                      PERFORMANCE
                    </span>

                    <h2>
                      Revenue overview
                    </h2>

                    <p>
                      Transaction revenue performance
                      over time
                    </p>

                  </div>

                  <div className="chart-pill">

                    <TrendingUp size={15} />

                    Revenue

                  </div>

                </div>

                <div className="chart-container">

                  {revenueData.length > 0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <AreaChart
                        data={revenueData}
                      >

                        <defs>

                          <linearGradient
                            id="revenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >

                            <stop
                              offset="0%"
                              stopOpacity={0.3}
                            />

                            <stop
                              offset="100%"
                              stopOpacity={0}
                            />

                          </linearGradient>

                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            `₹${Math.round(
                              value / 1000
                            )}k`
                          }
                        />

                        <Tooltip
                          formatter={(value) =>
                            formatCurrency(value)
                          }
                        />

                        <Area
                          type="monotone"
                          dataKey="revenue"
                          strokeWidth={3}
                          fill="url(#revenueGradient)"
                        />

                      </AreaChart>

                    </ResponsiveContainer>

                  ) : (

                    <EmptyChart
                      loading={loading}
                      text="Revenue trend data will appear here"
                    />

                  )}

                </div>

              </div>

              <div className="panel ai-panel">

                <div className="ai-glow"></div>

                <div className="panel-header ai-header">

                  <div className="ai-title">

                    <div className="ai-icon">
                      <BrainCircuit size={21} />
                    </div>

                    <div>

                      <span className="panel-kicker">
                        PAYLENS AI
                      </span>

                      <h2>
                        Payment Intelligence
                      </h2>

                    </div>

                  </div>

                  <span className="ai-live">
                    <span></span>
                    LIVE
                  </span>

                </div>

                {aiLoading ? (

                  <div className="ai-loading">

                    <div className="loading-orb">
                      <BrainCircuit size={24} />
                    </div>

                    <strong>
                      Analyzing payment data...
                    </strong>

                    <span>
                      PayLens AI is identifying
                      important patterns.
                    </span>

                  </div>

                ) : aiInsight ? (

                  <div className="ai-content">

                    <div
                      className={`severity ${aiInsight.severity}`}
                    >

                      <AlertTriangle size={15} />

                      {aiInsight.severity?.toUpperCase()}

                    </div>

                    <h3>
                      {aiInsight.title}
                    </h3>

                    <p className="ai-insight">
                      {aiInsight.insight}
                    </p>

                    <div className="recommendation">

                      <div className="recommendation-icon">
                        <Zap size={16} />
                      </div>

                      <div>

                        <span>
                          RECOMMENDED ACTION
                        </span>

                        <p>
                          {aiInsight.recommendation}
                        </p>

                      </div>

                    </div>

                  </div>

                ) : (

                  <div className="ai-loading">

                    <div className="loading-orb">
                      <BrainCircuit size={24} />
                    </div>

                    <strong>
                      AI insight unavailable
                    </strong>

                    <span>
                      Refresh to try again.
                    </span>

                  </div>

                )}

              </div>

            </div>

            <div className="three-grid">

              <div className="panel">

                <div className="panel-header compact">

                  <div>

                    <span className="panel-kicker">
                      BREAKDOWN
                    </span>

                    <h2>
                      Payment methods
                    </h2>

                  </div>

                  <CreditCard size={20} />

                </div>

                <div className="method-chart">

                  {methodData.length > 0 ? (

                    <>

                      <ResponsiveContainer
                        width={170}
                        height={170}
                        className="payment-pie-chart"
                      >

                        <PieChart>

                          <Pie
                            data={methodData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={64}
                            paddingAngle={3}
                          >

                            {methodData.map(
                              (_, index) => (
                                <Cell
                                  key={index}
                                />
                              )
                            )}

                          </Pie>

                          <Tooltip />

                        </PieChart>

                      </ResponsiveContainer>

                      <div className="legend">

                        {methodData.map(
                          (item, index) => (

                            <div
                              className="legend-row"
                              key={item.name}
                            >

                              <span className="legend-left">

                                <i
                                  className={`dot dot-${index}`}
                                />

                                {item.name}

                              </span>

                              <strong>
                                {item.value}
                              </strong>

                            </div>

                          )
                        )}

                      </div>

                    </>

                  ) : (

                    <EmptyChart
                      loading={loading}
                      text="No payment method data"
                    />

                  )}

                </div>

              </div>

              <div className="panel">

                <div className="panel-header compact">

                  <div>

                    <span className="panel-kicker">
                      RISK SIGNALS
                    </span>

                    <h2>
                      Failure reasons
                    </h2>

                  </div>

                  <AlertTriangle size={20} />

                </div>

                <div className="failure-list">

                  {failureData.length > 0 ? (

                    failureData.map(
                      (item, index) => {

                        const maxValue =
                          Math.max(
                            ...failureData.map(
                              (x) => x.value
                            )
                          );

                        const percentage =
                          maxValue > 0
                            ? (item.value /
                                maxValue) *
                              100
                            : 0;

                        return (

                          <div
                            className="failure-item"
                            key={item.name}
                          >

                            <div className="failure-meta">

                              <span>
                                {item.name}
                              </span>

                              <strong>
                                {item.value}
                              </strong>

                            </div>

                            <div className="progress">

                              <div
                                className={`progress-fill fill-${index}`}
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                          </div>

                        );

                      }
                    )

                  ) : (

                    <EmptyChart
                      loading={loading}
                      text="No failure data"
                    />

                  )}

                </div>

              </div>

              <div className="panel health-panel">

                <div className="panel-header compact">

                  <div>

                    <span className="panel-kicker">
                      SYSTEM
                    </span>

                    <h2>
                      Payment health
                    </h2>

                  </div>

                  <ShieldCheck size={20} />

                </div>

                <div className="health-score">

                  <div className="score-ring">

                    <div>

                      <strong>
                        {stats.successRate}%
                      </strong>

                      <span>
                        Success
                      </span>

                    </div>

                  </div>

                  <div className="health-copy">

                    <strong>
                      {stats.successRate >= 90
                        ? "Strong payment performance"
                        : "Payment performance needs attention"}
                    </strong>

                    <p>
                      {stats.failures} failed
                      transactions detected across
                      the current dataset.
                    </p>

                  </div>

                </div>

                <div className="health-metrics">

                  <div>

                    <span>
                      Successful
                    </span>

                    <strong>
                      {stats.successful}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Failed
                    </span>

                    <strong>
                      {stats.failures}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

            <div className="recovery-banner">

              <div className="recovery-icon">
                <WalletCards size={24} />
              </div>

              <div className="recovery-text">

                <span>
                  REVENUE RECOVERY OPPORTUNITY
                </span>

                <h3>
                  Turn failed payments into
                  recovered revenue.
                </h3>

                <p>
                  PayLens identifies failure
                  patterns so payment teams can
                  prioritize retry and recovery
                  actions.
                </p>

              </div>

              <button
                className="recovery-button"
                onClick={() =>
                  openPage("recovery")
                }
              >

                View recovery opportunities

                <ArrowUpRight size={17} />

              </button>

            </div>

            <footer>

              <span>
                © 2026 PayLens AI
              </span>

              <span>
                {lastUpdated
                  ? `Last synced ${lastUpdated.toLocaleTimeString()}`
                  : "Syncing..."}
              </span>

              <span className="footer-status">

                <Database size={14} />

                Neon PostgreSQL

              </span>

            </footer>

          </section>

        )}

        {/* =====================================================
            TRANSACTIONS PAGE
        ===================================================== */}

        {activePage === "transactions" && (

          <section className="dashboard transactions-page">

            <div className="page-heading">

              <div>

                <div className="eyebrow">

                  <Activity size={15} />

                  PAYMENT OPERATIONS

                </div>

                <h1>
                  Transaction
                  <br />
                  <span>intelligence.</span>
                </h1>

                <p>
                  Monitor, search and analyze every
                  payment transaction in your
                  PayLens workspace.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-icon">
                  <Database size={22} />
                </div>

                <div>

                  <span>
                    TOTAL TRANSACTIONS
                  </span>

                  <strong>
                    {transactions.length}
                  </strong>

                </div>

              </div>

            </div>

            {transactionError && (

              <div className="error-banner">

                <AlertTriangle size={18} />

                <div>

                  <strong>
                    Transaction service unavailable
                  </strong>

                  <p>
                    {transactionError}
                  </p>

                </div>

                <button
                  onClick={fetchTransactions}
                >
                  Retry
                </button>

              </div>

            )}

            <div className="panel transaction-filter-panel">

              <div className="transaction-toolbar">

                <div className="transaction-search">

                  <Search size={18} />

                  <input
                    type="text"
                    placeholder="Search payment ID or customer email..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />

                  {search && (

                    <button
                      className="clear-search"
                      onClick={() =>
                        setSearch("")
                      }
                    >
                      <X size={16} />
                    </button>

                  )}

                </div>

                <div className="filter-control">

                  <Filter size={16} />

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Status
                    </option>

                    <option value="success">
                      Success
                    </option>

                    <option value="failed">
                      Failed
                    </option>

                  </select>

                </div>

                <div className="filter-control">

                  <CreditCard size={16} />

                  <select
                    value={methodFilter}
                    onChange={(e) =>
                      setMethodFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      All Methods
                    </option>

                    {paymentMethods.map(
                      (method) => (

                        <option
                          key={method}
                          value={method}
                        >
                          {method}
                        </option>

                      )
                    )}

                  </select>

                </div>

                <button
                  className="refresh-btn"
                  onClick={fetchTransactions}
                  disabled={
                    transactionsLoading
                  }
                >

                  <RefreshCw
                    size={16}
                    className={
                      transactionsLoading
                        ? "spin"
                        : ""
                    }
                  />

                  Refresh

                </button>

              </div>

            </div>

            <div className="panel transactions-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-kicker">
                    TRANSACTION LEDGER
                  </span>

                  <h2>
                    Recent transactions
                  </h2>

                  <p>
                    Live payment activity from
                    Neon PostgreSQL
                  </p>

                </div>

                <div className="chart-pill">

                  <Database size={15} />

                  {transactions.length} results

                </div>

              </div>

              {transactionsLoading ? (

                <div className="transaction-loading">

                  <RefreshCw
                    size={28}
                    className="spin"
                  />

                  <strong>
                    Loading transactions...
                  </strong>

                  <span>
                    Fetching payment activity
                    from the database.
                  </span>

                </div>

              ) : transactions.length === 0 ? (

                <div className="transaction-loading">

                  <Activity size={30} />

                  <strong>
                    No transactions found
                  </strong>

                  <span>
                    Try changing your search or
                    filters.
                  </span>

                </div>

              ) : (

                <div className="transactions-table-wrapper">

                  <table className="transactions-table">

                    <thead>

                      <tr>

                        <th>
                          Payment ID
                        </th>

                        <th>
                          Amount
                        </th>

                        <th>
                          Method
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {transactions.map(
                        (transaction) => (

                          <tr
                            key={transaction.id}
                          >

                            <td>

                              <span className="payment-id">
                                {transaction.payment_id}
                              </span>

                            </td>

                            <td>

                              <strong>
                                {formatCurrency(
                                  transaction.amount
                                )}
                              </strong>

                            </td>

                            <td>

                              <span className="method-badge">
                                {transaction.payment_method ||
                                  "—"}
                              </span>

                            </td>

                            <td>

                              <StatusBadge
                                status={
                                  transaction.status
                                }
                              />

                            </td>

                            <td>

                              <span className="customer-email">
                                {transaction.customer_email ||
                                  "—"}
                              </span>

                            </td>

                            <td>

                              <span className="transaction-date">
                                {formatDate(
                                  transaction.created_at
                                )}
                              </span>

                            </td>

                            <td>

                              <button
                                className="view-transaction"
                                onClick={() =>
                                  setSelectedTransaction(
                                    transaction
                                  )
                                }
                              >

                                <Eye size={15} />

                                View

                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            <footer>

              <span>
                © 2026 PayLens AI
              </span>

              <span>
                Transaction Intelligence
              </span>

              <span className="footer-status">

                <Database size={14} />

                Neon PostgreSQL

              </span>

            </footer>

          </section>

        )}

        {/* =====================================================
            ANALYTICS PAGE
        ===================================================== */}

        {activePage === "analytics" && (

          <section className="dashboard">

            <div className="page-heading">

              <div>

                <div className="eyebrow">

                  <BarChart3 size={15} />

                  PAYMENT ANALYTICS

                </div>

                <h1>
                  Advanced
                  <br />
                  <span>analytics.</span>
                </h1>

                <p>
                  Understand revenue, payment methods,
                  success rates and transaction performance.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-icon">
                  <TrendingUp size={22} />
                </div>

                <div>

                  <span>
                    SUCCESS RATE
                  </span>

                  <strong>
                    {stats.successRate}%
                  </strong>

                </div>

              </div>

            </div>

            <div className="stats-grid">

              <StatCard
                title="Total Transactions"
                value={stats.transactions.toLocaleString(
                  "en-IN"
                )}
                icon={<Activity size={20} />}
                trend="+12.8%"
                positive
              />

              <StatCard
                title="Total Revenue"
                value={formatCurrency(
                  stats.revenue
                )}
                icon={
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: "600",
                    }}
                  >
                    ₹
                  </span>
                }
                trend="+8.4%"
                positive
              />

              <StatCard
                title="Successful Payments"
                value={stats.successful.toLocaleString(
                  "en-IN"
                )}
                icon={
                  <CheckCircle2 size={20} />
                }
                trend={`${stats.successRate}% success`}
                positive
              />

              <StatCard
                title="Failed Payments"
                value={stats.failures.toLocaleString(
                  "en-IN"
                )}
                icon={
                  <AlertTriangle size={20} />
                }
                trend="Requires attention"
                warning
              />

            </div>

            <div className="main-grid">

              <div className="panel revenue-panel">

                <div className="panel-header">

                  <div>

                    <span className="panel-kicker">
                      PERFORMANCE
                    </span>

                    <h2>
                      Revenue trend
                    </h2>

                    <p>
                      Revenue generated across the dataset
                    </p>

                  </div>

                  <TrendingUp size={20} />

                </div>

                <div className="chart-container">

                  {revenueData.length > 0 ? (

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <AreaChart
                        data={revenueData}
                      >

                        <defs>

                          <linearGradient
                            id="analyticsRevenueGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >

                            <stop
                              offset="0%"
                              stopOpacity={0.3}
                            />

                            <stop
                              offset="100%"
                              stopOpacity={0}
                            />

                          </linearGradient>

                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) =>
                            `₹${Math.round(
                              value / 1000
                            )}k`
                          }
                        />

                        <Tooltip
                          formatter={(value) =>
                            formatCurrency(value)
                          }
                        />

                        <Area
                          type="monotone"
                          dataKey="revenue"
                          strokeWidth={3}
                          fill="url(#analyticsRevenueGradient)"
                        />

                      </AreaChart>

                    </ResponsiveContainer>

                  ) : (

                    <EmptyChart
                      loading={loading}
                      text="No revenue data available"
                    />

                  )}

                </div>

              </div>

              <div className="panel">

                <div className="panel-header compact">

                  <div>

                    <span className="panel-kicker">
                      BREAKDOWN
                    </span>

                    <h2>
                      Payment methods
                    </h2>

                  </div>

                  <CreditCard size={20} />

                </div>

                <div className="method-chart">

                  {methodData.length > 0 ? (

                    <>

                      <ResponsiveContainer
                        width={170}
                        height={170}
                        className="payment-pie-chart"
                      >

                        <PieChart>

                          <Pie
                            data={methodData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={64}
                            paddingAngle={3}
                          >

                            {methodData.map(
                              (_, index) => (
                                <Cell
                                  key={index}
                                />
                              )
                            )}

                          </Pie>

                          <Tooltip />

                        </PieChart>

                      </ResponsiveContainer>

                      <div className="legend">

                        {methodData.map(
                          (item, index) => (

                            <div
                              className="legend-row"
                              key={item.name}
                            >

                              <span className="legend-left">

                                <i
                                  className={`dot dot-${index}`}
                                />

                                {item.name}

                              </span>

                              <strong>
                                {item.value}
                              </strong>

                            </div>

                          )
                        )}

                      </div>

                    </>

                  ) : (

                    <EmptyChart
                      loading={loading}
                      text="No payment method data"
                    />

                  )}

                </div>

              </div>

            </div>

            <footer>

              <span>
                © 2026 PayLens AI
              </span>

              <span>
                Advanced Analytics
              </span>

              <span className="footer-status">

                <Database size={14} />

                Neon PostgreSQL

              </span>

            </footer>

          </section>

        )}

        {/* =====================================================
            AI INSIGHTS PAGE
        ===================================================== */}

        {activePage === "ai" && (

          <section className="dashboard">

            <div className="page-heading">

              <div>

                <div className="eyebrow">

                  <BrainCircuit size={15} />

                  PAYLENS AI

                </div>

                <h1>
                  AI payment
                  <br />
                  <span>insights.</span>
                </h1>

                <p>
                  AI-powered analysis of payment patterns,
                  risks and recommended actions.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-icon">
                  <BrainCircuit size={22} />
                </div>

                <div>

                  <span>
                    AI STATUS
                  </span>

                  <strong>
                    Live
                  </strong>

                </div>

              </div>

            </div>

            <div className="panel ai-panel">

              <div className="ai-glow"></div>

              <div className="panel-header ai-header">

                <div className="ai-title">

                  <div className="ai-icon">
                    <BrainCircuit size={21} />
                  </div>

                  <div>

                    <span className="panel-kicker">
                      PAYLENS AI
                    </span>

                    <h2>
                      Payment Intelligence
                    </h2>

                  </div>

                </div>

                <span className="ai-live">

                  <span></span>

                  LIVE

                </span>

              </div>

              {aiLoading ? (

                <div className="ai-loading">

                  <div className="loading-orb">
                    <BrainCircuit size={24} />
                  </div>

                  <strong>
                    Analyzing payment data...
                  </strong>

                  <span>
                    PayLens AI is identifying important patterns.
                  </span>

                </div>

              ) : aiInsight ? (

                <div className="ai-content">

                  <div
                    className={`severity ${aiInsight.severity}`}
                  >

                    <AlertTriangle size={15} />

                    {aiInsight.severity?.toUpperCase()}

                  </div>

                  <h3>
                    {aiInsight.title}
                  </h3>

                  <p className="ai-insight">
                    {aiInsight.insight}
                  </p>

                  <div className="recommendation">

                    <div className="recommendation-icon">

                      <Zap size={16} />

                    </div>

                    <div>

                      <span>
                        RECOMMENDED ACTION
                      </span>

                      <p>
                        {aiInsight.recommendation}
                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="ai-loading">

                  <div className="loading-orb">
                    <BrainCircuit size={24} />
                  </div>

                  <strong>
                    AI insight unavailable
                  </strong>

                  <span>
                    Click Refresh to try again.
                  </span>

                </div>

              )}

            </div>

            <div className="stats-grid">

              <StatCard
                title="Payment Success Rate"
                value={`${stats.successRate}%`}
                icon={
                  <CheckCircle2 size={20} />
                }
                trend="Current"
                positive
              />

              <StatCard
                title="Successful Payments"
                value={stats.successful}
                icon={
                  <CheckCircle2 size={20} />
                }
                trend="Healthy"
                positive
              />

              <StatCard
                title="Failed Payments"
                value={stats.failures}
                icon={
                  <AlertTriangle size={20} />
                }
                trend="Attention"
                warning
              />

              <StatCard
                title="Revenue"
                value={formatCurrency(
                  stats.revenue
                )}
                icon={
                  <WalletCards size={20} />
                }
                trend="Tracked"
                positive
              />

            </div>

            <footer>

              <span>
                © 2026 PayLens AI
              </span>

              <span>
                AI Payment Intelligence
              </span>

              <span className="footer-status">

                <Database size={14} />

                Neon PostgreSQL

              </span>

            </footer>

          </section>

        )}

        {/* =====================================================
            FAILURE ANALYSIS PAGE
        ===================================================== */}

        {activePage === "failure" && (

          <section className="dashboard">

            <div className="page-heading">

              <div>

                <div className="eyebrow">

                  <AlertTriangle size={15} />

                  RISK ANALYSIS

                </div>

                <h1>
                  Failure
                  <br />
                  <span>analysis.</span>
                </h1>

                <p>
                  Identify why payments fail and prioritize
                  the most important payment issues.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-icon">

                  <AlertTriangle size={22} />

                </div>

                <div>

                  <span>
                    FAILED PAYMENTS
                  </span>

                  <strong>
                    {stats.failures}
                  </strong>

                </div>

              </div>

            </div>

            <div className="panel">

              <div className="panel-header compact">

                <div>

                  <span className="panel-kicker">
                    FAILURE BREAKDOWN
                  </span>

                  <h2>
                    Payment failure reasons
                  </h2>

                  <p>
                    Most common reasons behind failed payments.
                  </p>

                </div>

                <AlertTriangle size={20} />

              </div>

              <div className="failure-list">

                {failureData.length > 0 ? (

                  failureData.map(
                    (item, index) => {

                      const maxValue =
                        Math.max(
                          ...failureData.map(
                            (x) => x.value
                          )
                        );

                      const percentage =
                        maxValue > 0
                          ? (item.value / maxValue) *
                            100
                          : 0;

                      return (

                        <div
                          className="failure-item"
                          key={item.name}
                        >

                          <div className="failure-meta">

                            <span>
                              {item.name}
                            </span>

                            <strong>
                              {item.value}
                            </strong>

                          </div>

                          <div className="progress">

                            <div
                              className={`progress-fill fill-${index}`}
                              style={{
                                width: `${percentage}%`,
                              }}
                            />

                          </div>

                        </div>

                      );

                    }
                  )

                ) : (

                  <EmptyChart
                    loading={loading}
                    text="No failure data available"
                  />

                )}

              </div>

            </div>

            <div className="stats-grid">

              <StatCard
                title="Failed Transactions"
                value={stats.failures}
                icon={
                  <AlertTriangle size={20} />
                }
                trend="Requires attention"
                warning
              />

              <StatCard
                title="Successful Transactions"
                value={stats.successful}
                icon={
                  <CheckCircle2 size={20} />
                }
                trend={`${stats.successRate}% success`}
                positive
              />

              <StatCard
                title="Total Transactions"
                value={stats.transactions}
                icon={
                  <Activity size={20} />
                }
                trend="Analyzed"
                positive
              />

              <StatCard
                title="Payment Health"
                value={
                  stats.successRate >= 90
                    ? "Excellent"
                    : stats.successRate >= 75
                    ? "Healthy"
                    : "Needs Attention"
                }
                icon={
                  <ShieldCheck size={20} />
                }
                trend="Current status"
                positive={
                  stats.successRate >= 75
                }
                warning={
                  stats.successRate < 75
                }
              />

            </div>

            <footer>

              <span>
                © 2026 PayLens AI
              </span>

              <span>
                Failure Analysis
              </span>

              <span className="footer-status">

                <Database size={14} />

                Neon PostgreSQL

              </span>

            </footer>

          </section>

        )}

        {/* =====================================================
            REVENUE RECOVERY PAGE
        ===================================================== */}

        {activePage === "recovery" && (

          <section className="dashboard">

            <div className="page-heading">

              <div>

                <div className="eyebrow">

                  <WalletCards size={15} />

                  REVENUE RECOVERY

                </div>

                <h1>
                  Recover lost
                  <br />
                  <span>revenue.</span>
                </h1>

                <p>
                  Review failed payments and identify transactions
                  that may be suitable for recovery or retry.
                </p>

              </div>

              <div className="hero-status">

                <div className="status-icon">

                  <WalletCards size={22} />

                </div>

                <div>

                  <span>
                    FAILED PAYMENTS
                  </span>

                  <strong>
                    {stats.failures}
                  </strong>

                </div>

              </div>

            </div>

            <div className="stats-grid">

              <StatCard
                title="Failed Payments"
                value={stats.failures}
                icon={
                  <AlertTriangle size={20} />
                }
                trend="Recovery candidates"
                warning
              />

              <StatCard
                title="Potential Revenue"
                value={formatCurrency(
                  transactions
                    .filter(
                      (transaction) =>
                        String(
                          transaction.status
                        ).toLowerCase() ===
                        "failed"
                    )
                    .reduce(
                      (sum, transaction) =>
                        sum +
                        Number(
                          transaction.amount || 0
                        ),
                      0
                    )
                )}
                icon={
                  <WalletCards size={20} />
                }
                trend="Failed transaction value"
                warning
              />

              <StatCard
                title="Success Rate"
                value={`${stats.successRate}%`}
                icon={
                  <CheckCircle2 size={20} />
                }
                trend="Current"
                positive
              />

              <StatCard
                title="Transactions"
                value={stats.transactions}
                icon={
                  <Activity size={20} />
                }
                trend="Analyzed"
                positive
              />

            </div>

            <div className="panel transactions-panel">

              <div className="panel-header">

                <div>

                  <span className="panel-kicker">
                    RECOVERY QUEUE
                  </span>

                  <h2>
                    Failed payment opportunities
                  </h2>

                  <p>
                    Review failed transactions for retry
                    and recovery actions.
                  </p>

                </div>

                <div className="chart-pill">

                  <WalletCards size={15} />

                  {
                    transactions.filter(
                      (transaction) =>
                        String(
                          transaction.status
                        ).toLowerCase() ===
                        "failed"
                    ).length
                  }{" "}

                  opportunities

                </div>

              </div>

              {
                transactions.filter(
                  (transaction) =>
                    String(
                      transaction.status
                    ).toLowerCase() ===
                    "failed"
                ).length === 0
              ? (

                <div className="transaction-loading">

                  <CheckCircle2 size={30} />

                  <strong>
                    No failed payments
                  </strong>

                  <span>
                    There are currently no failed payments
                    requiring recovery.
                  </span>

                </div>

              ) : (

                <div className="transactions-table-wrapper">

                  <table className="transactions-table">

                    <thead>

                      <tr>

                        <th>
                          Payment ID
                        </th>

                        <th>
                          Amount
                        </th>

                        <th>
                          Failure Reason
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {transactions
                        .filter(
                          (transaction) =>
                            String(
                              transaction.status
                            ).toLowerCase() ===
                            "failed"
                        )
                        .map(
                          (transaction) => (

                            <tr
                              key={transaction.id}
                            >

                              <td>

                                <span className="payment-id">
                                  {transaction.payment_id}
                                </span>

                              </td>

                              <td>

                                <strong>
                                  {formatCurrency(
                                    transaction.amount
                                  )}
                                </strong>

                              </td>

                              <td>

                                <span>
                                  {transaction.failure_reason ||
                                    "Unknown reason"}
                                </span>

                              </td>

                              <td>

                                <span className="customer-email">
                                  {transaction.customer_email ||
                                    "—"}
                                </span>

                              </td>

                              <td>

                                <StatusBadge
                                  status={
                                    transaction.status
                                  }
                                />

                              </td>

                              <td>

                                <button
                                  className="view-transaction"
                                  onClick={() =>
                                    setSelectedTransaction(
                                      transaction
                                    )
                                  }
                                >

                                  <Eye size={15} />

                                  Review

                                </button>

                              </td>

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            <div className="recovery-banner">

              <div className="recovery-icon">

                <Zap size={24} />

              </div>

              <div className="recovery-text">

                <span>
                  PAYLENS RECOVERY ENGINE
                </span>

                <h3>
                  Prioritize failed payments for recovery.
                </h3>

                <p>
                  Use failure reasons, transaction values and
                  customer information to determine the best
                  retry or recovery strategy.
                </p>

              </div>

            </div>

            <footer>

              <span>
                © 2026 PayLens AI
              </span>

              <span>
                Revenue Recovery
              </span>

              <span className="footer-status">

                <Database size={14} />

                Neon PostgreSQL

              </span>

            </footer>

          </section>

        )}

      </main>

      {/* =====================================================
          TRANSACTION DETAILS MODAL
      ===================================================== */}

      {selectedTransaction && (

        <div
          className="transaction-modal-overlay"
          onClick={() =>
            setSelectedTransaction(null)
          }
        >

          <div
            className="transaction-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="transaction-modal-header">

              <div>

                <span className="panel-kicker">
                  PAYMENT DETAILS
                </span>

                <h2>
                  Transaction details
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedTransaction(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="transaction-detail-grid">

              <DetailItem
                label="Payment ID"
                value={
                  selectedTransaction.payment_id
                }
              />

              <DetailItem
                label="Amount"
                value={formatCurrency(
                  selectedTransaction.amount
                )}
              />

              <DetailItem
                label="Status"
                value={
                  <StatusBadge
                    status={
                      selectedTransaction.status
                    }
                  />
                }
              />

              <DetailItem
                label="Payment Method"
                value={
                  selectedTransaction.payment_method ||
                  "—"
                }
              />

              <DetailItem
                label="Customer Email"
                value={
                  selectedTransaction.customer_email ||
                  "—"
                }
              />

              <DetailItem
                label="Created At"
                value={formatDate(
                  selectedTransaction.created_at
                )}
              />

              <DetailItem
                label="Failure Reason"
                value={
                  selectedTransaction.failure_reason ||
                  "No failure recorded"
                }
              />

            </div>

            {String(
              selectedTransaction.status
            ).toLowerCase() === "failed" && (

              <div className="transaction-ai-note">

                <Zap size={18} />

                <div>

                  <strong>
                    Recovery opportunity
                  </strong>

                  <p>
                    This payment failed due to{" "}
                    {selectedTransaction.failure_reason ||
                      "an unspecified reason"}
                    . This transaction can be
                    evaluated for a suitable
                    recovery or retry strategy.
                  </p>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  trend,
  positive,
  warning,
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <div className="stat-icon">
          {icon}
        </div>

        {positive && (

          <span className="trend positive">

            <ArrowUpRight size={13} />

            {trend}

          </span>

        )}

        {warning && (

          <span className="trend warning">

            <ArrowDownRight size={13} />

            {trend}

          </span>

        )}

      </div>

      <span className="stat-title">
        {title}
      </span>

      <strong className="stat-value">
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {

  const normalized =
    String(status || "").toLowerCase();

  const isSuccess =
    normalized === "success";

  return (

    <span
      className={`status-badge ${
        isSuccess
          ? "status-success"
          : "status-failed"
      }`}
    >

      {isSuccess ? (

        <CheckCircle2 size={14} />

      ) : (

        <AlertTriangle size={14} />

      )}

      {normalized.toUpperCase()}

    </span>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({ label, value }) {

  return (

    <div className="detail-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart({ loading, text }) {

  return (

    <div className="empty-chart">

      {loading ? (

        <>

          <RefreshCw
            size={24}
            className="spin"
          />

          <span>
            Loading data...
          </span>

        </>

      ) : (

        <>

          <BarChart3 size={25} />

          <span>
            {text}
          </span>

        </>

      )}

    </div>
  );
}

/* =========================================================
   PAGE TITLES
========================================================= */

function getPageTitle(page) {

  const titles = {

    dashboard: "Dashboard",

    transactions: "Transactions",

    analytics: "Analytics",

    ai: "AI Insights",

    failure: "Failure Analysis",

    recovery: "Revenue Recovery",

  };

  return titles[page] || "PayLens";
}

export default App;