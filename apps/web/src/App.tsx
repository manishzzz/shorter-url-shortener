import { FormEvent, Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { fetchAnalytics, resolveShortLink, shortenUrl, type AnalyticsResponse } from "./api";

const AnalyticsChart = lazy(() => import("./components/AnalyticsChart"));
const RECENT_LINKS_KEY = "shorter-recent-links";

type RecentLink = {
  code: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
};

const productNotes = [
  "301 redirects with async click capture",
  "Per-IP rate limiting tuned for public traffic",
  "Redis hot-path caching for popular destinations",
];

const shortUrlPreviewNotes = [
  "The live demo uses a temporary tunnel host, so the domain reads longer than a production custom domain.",
  "What matters in the product is the short code and the redirect behavior. A branded domain makes the final URL feel properly compact.",
];

function truncateMiddle(value: string, start = 34, end = 18) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getHostname(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

function Surface({
  title,
  eyebrow,
  actions,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface ${className}`.trim()}>
      {title || eyebrow || actions ? (
        <header className="surface-head">
          <div>
            {eyebrow ? <p className="surface-eyebrow">{eyebrow}</p> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {actions ? <div className="surface-actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

function HomePage() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; shortUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<string | null>(null);
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const navigate = useNavigate();

  const shortHost = useMemo(
    () => (result ? getHostname(result.shortUrl) : getHostname(resolveShortLink("demo"))),
    [result],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(RECENT_LINKS_KEY);
    if (!stored) {
      return;
    }

    try {
      setRecentLinks(JSON.parse(stored) as RecentLink[]);
    } catch {
      window.localStorage.removeItem(RECENT_LINKS_KEY);
    }
  }, []);

  const persistRecentLinks = (links: RecentLink[]) => {
    setRecentLinks(links);
    window.localStorage.setItem(RECENT_LINKS_KEY, JSON.stringify(links));
  };

  const copyToClipboard = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopyState(label);
    window.setTimeout(() => setCopyState(null), 1800);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await shortenUrl({
        url,
        customAlias: customAlias.trim() || undefined,
      });

      const normalizedShortUrl = resolveShortLink(response.code);
      setResult({
        ...response,
        shortUrl: normalizedShortUrl,
      });
      persistRecentLinks(
        [
          {
            code: response.code,
            shortUrl: normalizedShortUrl,
            originalUrl: url,
            createdAt: new Date().toISOString(),
          },
          ...recentLinks.filter((item) => item.code !== response.code),
        ].slice(0, 6),
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="page-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">S</div>
            <div>
              <p className="brand-name">Shorter</p>
              <span>Link infrastructure with analytics</span>
            </div>
          </div>
          <div className="topbar-meta">
            <span>Public demo</span>
            <span>{shortHost}</span>
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-panel">
            <p className="kicker">Professional URL management</p>
            <h1>Clean links, credible analytics, and a front end that behaves like a real product.</h1>
            <p className="hero-text">
              The live demo host is temporary, but the application behavior is production-shaped:
              branded aliases, redirect tracking, Redis acceleration, and a backend built for real
              traffic patterns.
            </p>

            <div className="hero-notes">
              {productNotes.map((item) => (
                <div key={item} className="note-chip">
                  {item}
                </div>
              ))}
            </div>

            <Surface eyebrow="Why the link looks long" title="This is a host issue, not a short-code issue.">
              <div className="explain-list">
                {shortUrlPreviewNotes.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </Surface>
          </div>

          <Surface className="composer-panel" eyebrow="Create link" title="Publish a short URL">
            <form className="composer-form" onSubmit={onSubmit}>
              <label>
                Destination URL
                <input
                  placeholder="https://your-long-link.com/something-important"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  required
                />
              </label>

              <label>
                Custom alias
                <input
                  placeholder="spring-launch"
                  value={customAlias}
                  onChange={(event) => setCustomAlias(event.target.value)}
                />
              </label>

              <div className="button-row">
                <button type="submit" disabled={loading}>
                  {loading ? "Generating..." : "Create short link"}
                </button>
                <button type="button" className="button-secondary" onClick={() => navigate("/analytics/demo")}>
                  Open sample analytics
                </button>
              </div>

              {error ? <p className="feedback error-text">{error}</p> : null}

              {result ? (
                <div className="launch-card">
                  <div className="launch-card-head">
                    <div>
                      <p className="surface-eyebrow">Ready to share</p>
                      <h3>/{result.code}</h3>
                    </div>
                    <span className="host-pill">{getHostname(result.shortUrl)}</span>
                  </div>

                  <div className="launch-grid">
                    <div>
                      <span className="metric-label">Short code</span>
                      <strong className="metric-value">/{result.code}</strong>
                    </div>
                    <div>
                      <span className="metric-label">Full URL</span>
                      <strong className="metric-value compact-url">
                        {truncateMiddle(result.shortUrl, 28, 16)}
                      </strong>
                    </div>
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => copyToClipboard(result.shortUrl, "fresh-link")}
                    >
                      {copyState === "fresh-link" ? "Copied" : "Copy URL"}
                    </button>
                    <a className="button-link" href={result.shortUrl} target="_blank" rel="noreferrer">
                      Open redirect
                    </a>
                    <Link className="button-link subtle" to={`/analytics/${result.code}`}>
                      View analytics
                    </Link>
                  </div>
                </div>
              ) : null}
            </form>
          </Surface>
        </section>

        <Surface
          eyebrow="Recent links"
          title="Latest published codes"
          actions={
            recentLinks.length > 0 ? (
              <button type="button" className="button-secondary button-small" onClick={() => persistRecentLinks([])}>
                Clear list
              </button>
            ) : null
          }
        >
          {recentLinks.length === 0 ? (
            <p className="empty-state">Create a link and it will appear here for quick reuse.</p>
          ) : (
            <div className="link-table">
              {recentLinks.map((item) => (
                <article key={item.code} className="link-row">
                  <div className="link-row-main">
                    <strong>/{item.code}</strong>
                    <span>{truncateMiddle(item.originalUrl, 58, 18)}</span>
                  </div>
                  <div className="link-row-meta">
                    <span>{formatDateTime(item.createdAt)}</span>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="button-secondary button-small"
                        onClick={() => copyToClipboard(item.shortUrl, item.code)}
                      >
                        {copyState === item.code ? "Copied" : "Copy"}
                      </button>
                      <a className="button-link button-small" href={item.shortUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                      <Link className="button-link subtle button-small" to={`/analytics/${item.code}`}>
                        Analytics
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </main>
  );
}

function AnalyticsPage() {
  const { code = "" } = useParams();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAnalytics(code);
        setAnalytics(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to fetch analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  return (
    <main className="app-shell">
      <div className="page-frame analytics-frame">
        <header className="analytics-hero">
          <div>
            <Link className="back-link" to="/">
              Back to composer
            </Link>
            <p className="kicker">Performance view</p>
            <h1>Analytics for /{code}</h1>
            <p className="hero-text analytics-copy">
              A cleaner read on traffic volume, redirect activity, and where visits are coming
              from.
            </p>
          </div>
          {analytics ? (
            <div className="hero-sidecard">
              <span className="metric-label">Live URL host</span>
              <strong>{getHostname(resolveShortLink(analytics.code))}</strong>
              <p>{truncateMiddle(resolveShortLink(analytics.code), 34, 16)}</p>
            </div>
          ) : null}
        </header>

        {loading ? <Surface className="status-surface">Loading analytics...</Surface> : null}
        {error ? <Surface className="status-surface error-text">{error}</Surface> : null}

        {analytics ? (
          <>
            <section className="analytics-summary">
              <Surface className="summary-card" eyebrow="Traffic" title={String(analytics.clickCount)}>
                <p>Total recorded clicks</p>
              </Surface>
              <Surface className="summary-card" eyebrow="Short code" title={`/${analytics.code}`}>
                <p>{truncateMiddle(resolveShortLink(analytics.code), 30, 14)}</p>
              </Surface>
              <Surface className="summary-card" eyebrow="Destination" title={getHostname(analytics.originalUrl)}>
                <p>{truncateMiddle(analytics.originalUrl, 38, 18)}</p>
              </Surface>
            </section>

            <section className="analytics-layout">
              <Surface className="timeline-surface" eyebrow="Timeline" title="Daily click pattern">
                <Suspense fallback={<div className="chart-fallback">Loading chart...</div>}>
                  <AnalyticsChart data={analytics.timeline} />
                </Suspense>
              </Surface>

              <div className="analytics-side">
                <Surface eyebrow="Referrers" title="Top sources">
                  <div className="referrer-list">
                    {analytics.topReferrers.length === 0 ? (
                      <p className="empty-state">No referrer breakdown yet.</p>
                    ) : (
                      analytics.topReferrers.map((item) => (
                        <div key={item.referrer} className="referrer-row">
                          <span>{item.referrer}</span>
                          <strong>{item.clicks}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </Surface>

                <Surface eyebrow="Lifecycle" title="Link details">
                  <div className="detail-stack">
                    <div className="detail-item">
                      <span>Created</span>
                      <strong>{formatDateTime(analytics.createdAt)}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Last accessed</span>
                      <strong>
                        {analytics.lastAccessedAt ? formatDateTime(analytics.lastAccessedAt) : "No visits yet"}
                      </strong>
                    </div>
                    <div className="detail-item">
                      <span>Redirect target</span>
                      <strong>{truncateMiddle(analytics.originalUrl, 28, 16)}</strong>
                    </div>
                  </div>
                </Surface>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/analytics/:code" element={<AnalyticsPage />} />
    </Routes>
  );
}
