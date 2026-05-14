import { FormEvent, Suspense, lazy, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { fetchAnalytics, resolveShortLink, shortenUrl, type AnalyticsResponse } from "./api";

const AnalyticsChart = lazy(() => import("./components/AnalyticsChart"));

function HomePage() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; shortUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await shortenUrl({
        url,
        customAlias: customAlias.trim() || undefined,
      });

      setResult(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Ship links that feel branded</p>
          <h1>
            Shorter turns heavy links into
            <span> fast little flexes.</span>
          </h1>
          <p className="subcopy">
            Production-grade URL shortening with analytics, async click logging, Redis hot-path
            caching, and a front-end that feels modern instead of template-y.
          </p>
        </div>

        <form className="shorten-form" onSubmit={onSubmit}>
          <label>
            Destination URL
            <input
              placeholder="https://your-long-link.com/something-really-big"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
            />
          </label>

          <label>
            Custom alias
            <input
              placeholder="drop-v1"
              value={customAlias}
              onChange={(event) => setCustomAlias(event.target.value)}
            />
          </label>

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Cooking..." : "Create short link"}
            </button>
            <button type="button" className="ghost" onClick={() => navigate("/analytics/demo")}>
              Preview analytics view
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          {result ? (
            <div className="result-card">
              <p>Short code</p>
              <h2>{result.code}</h2>
              <a href={result.shortUrl} target="_blank" rel="noreferrer">
                {result.shortUrl}
              </a>
              <div className="result-actions">
                <button type="button" onClick={() => navigator.clipboard.writeText(result.shortUrl)}>
                  Copy link
                </button>
                <Link to={`/analytics/${result.code}`}>View analytics</Link>
              </div>
            </div>
          ) : null}
        </form>
      </section>
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
    <main className="page-shell">
      <section className="analytics-shell">
        <div className="analytics-header">
          <Link to="/">Back home</Link>
          <h1>Analytics for /{code}</h1>
          <p>Track redirect velocity, referral spread, and whether your short link is actually moving.</p>
        </div>

        {loading ? <div className="panel">Loading analytics...</div> : null}
        {error ? <div className="panel error-text">{error}</div> : null}

        {analytics ? (
          <>
            <div className="stats-grid">
              <article className="panel">
                <span>Total clicks</span>
                <strong>{analytics.clickCount}</strong>
              </article>
              <article className="panel">
                <span>Destination</span>
                <strong>{analytics.originalUrl}</strong>
              </article>
              <article className="panel">
                <span>Short link</span>
                <strong>{resolveShortLink(analytics.code)}</strong>
              </article>
            </div>

            <div className="chart-panel">
              <div className="panel-head">
                <h2>Timeline</h2>
                <span>Daily clicks</span>
              </div>
              <Suspense fallback={<div className="chart-fallback">Loading chart...</div>}>
                <AnalyticsChart data={analytics.timeline} />
              </Suspense>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h2>Top referrers</h2>
              </div>
              <div className="referrer-list">
                {analytics.topReferrers.length === 0 ? <p>No click data yet.</p> : null}
                {analytics.topReferrers.map((item) => (
                  <div key={item.referrer} className="referrer-row">
                    <span>{item.referrer}</span>
                    <strong>{item.clicks}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>
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
