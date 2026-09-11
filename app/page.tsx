import Link from "next/link";
import { Showcase } from "@/components/showcase/Showcase";
import { ProductCard } from "@/components/storefront/ProductCard";
import { products } from "@/content/products";
import { freelancerCashflowShowcase } from "@/content/showcases/freelancer-cashflow";
import { validateManifest } from "@/lib/showcase/core";

validateManifest(freelancerCashflowShowcase);

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export default function Home() {
  const product = products[0];

  return (
    <div className="storefront" id="top">
      <header className="storefront-header">
        <div className="site-width header-inner">
          <Link className="storefront-wordmark" href="/" aria-label="BRexcel home">
            <BrandMark />
            BRexcel
          </Link>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#products">Products</a>
            <a href="#browse">Browse</a>
            <a href="#demo-lab">Demo Lab</a>
            <a href="#buying">How buying works</a>
          </nav>
          <span className="header-status"><i aria-hidden="true" />Catalog in development</span>
        </div>
      </header>

      <main>
        <section className="platform-hero site-width" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="kicker">BRexcel — spreadsheet-native tools</p>
            <h1 id="page-title">Focused Excel tools, built one module at a time.</h1>
            <p className="hero-lede">
              BRexcel is a growing collection of focused spreadsheet tools. Each module is designed
              for one clear job, with a public browser demo wherever a product is ready to show.
            </p>
            <div className="hero-actions">
              <a className="button button--primary" href="#products">Browse products <span aria-hidden="true">↓</span></a>
              <a className="button button--secondary" href="#demo-lab">Try the Demo Lab <span aria-hidden="true">↗</span></a>
            </div>
            <dl className="hero-index" aria-label="Platform summary">
              <div><dt>01</dt><dd>Public product preview</dd></div>
              <div><dt>01</dt><dd>Interactive demo</dd></div>
              <div><dt>DEV</dt><dd>Storefront status</dd></div>
            </dl>
          </div>

          <div className="hero-workbook" aria-label="Synthetic cashflow workbook preview">
            <div className="workbook-bar"><span>Cashflow · 01</span><span>Preview data</span></div>
            <div className="workbook-sheet">
              <div className="sheet-title-row">
                <div><span className="cell-label">SHEET 1</span><strong>Cash position</strong></div>
                <span className="sheet-badge">Synthetic</span>
              </div>
              <div className="sheet-grid" role="presentation">
                <span className="grid-corner" /><span>A</span><span>B</span><span>C</span>
                <span>3</span><strong>Category</strong><strong>Typical</strong><strong>Tight</strong>
                <span>4</span><span>Monthly income</span><b>50,000</b><b>40,000</b>
                <span>5</span><span>Essential expenses</span><b>18,000</b><b>18,000</b>
                <span>6</span><span>Flexible expenses</span><b>7,000</b><b>9,000</b>
                <span>7</span><strong>Total commitments</strong><b>30,000</b><b>34,000</b>
                <span>8</span><strong>Remaining cash</strong><b className="selected-cell">20,000</b><b>6,000</b>
                <span>9</span><span>Savings rate</span><b>40%</b><b>15%</b>
              </div>
              <div className="sheet-tabs" aria-hidden="true"><span className="active">Cash position</span><span>Breakdown</span><span>Notes</span></div>
            </div>
          </div>
        </section>

        <section className="products-section site-width" id="products" aria-labelledby="products-title">
          <div className="storefront-section-heading">
            <div><p className="kicker">Products</p><h2 id="products-title">A catalog built to grow.</h2></div>
            <p>BRexcel green stays constant. Each released product adds one useful accent.</p>
          </div>
          <ProductCard product={product} index="01" accent="#d2661d" />
          <div className="pipeline-grid" aria-label="Product pipeline">
            <article className="pipeline-card">
              <div className="module-rail">PLANNING · 02</div>
              <div>
                <div className="module-meta"><span>Next module</span><span className="status-tag">In development</span></div>
                <h3>Next workbook module</h3>
                <p>Being written and tested. Its name, demo and price will appear only when they are ready.</p>
                <span className="module-family">Planning family</span>
              </div>
            </article>
            <article className="pipeline-card pipeline-card--quiet">
              <div className="module-rail">ANALYSIS · —</div>
              <div>
                <div className="module-meta"><span>Future module</span><span className="status-tag">Coming later</span></div>
                <h3>Analysis module</h3>
                <p>No feature claims yet. This space is reserved for a future tool once its scope is public.</p>
                <span className="module-family">Analysis family</span>
              </div>
            </article>
          </div>
        </section>

        <section className="browse-section site-width" id="browse" aria-labelledby="browse-title">
          <div className="browse-panel">
            <div className="browse-heading"><h2 id="browse-title">Browse</h2><span>Filter by family, or start from the job</span></div>
            <div className="filter-chips" aria-label="Catalog families">
              <span className="filter-chip filter-chip--active">All products <b>01</b></span>
              <a className="filter-chip" href="#products">Planning <b>01</b></a>
              <span className="filter-chip filter-chip--disabled">Analysis <b>00</b></span>
              <a className="filter-chip" href="#demo-lab">With a live demo <b>01</b></a>
            </div>
            <div className="use-case-links">
              <a href="#demo-lab"><span>What does a normal month leave me?</span><b>1 tool</b></a>
              <a href="#demo-lab"><span>How different is a tight month?</span><b>1 tool</b></a>
              <span><span>What should I charge per day?</span><b>Later</b></span>
            </div>
          </div>
        </section>

        <section className="demo-lab" id="demo-lab" aria-labelledby="demo-lab-title">
          <div className="site-width">
            <div className="demo-lab-heading">
              <div><p className="kicker">Demo Lab · a BRexcel platform feature</p><h2 id="demo-lab-title">Try how a tool thinks before you buy it.</h2></div>
              <p>This public preview uses synthetic figures and validated arithmetic written for the web. It never loads or exposes a proprietary workbook in the browser.</p>
            </div>
            <div className="demo-product-tabs" aria-label="Available product demos"><span>Cashflow Planner</span><span>More demos as products ship</span></div>
            <Showcase manifest={freelancerCashflowShowcase} variant="lab" />
          </div>
        </section>

        <section className="buying-section site-width" id="buying" aria-labelledby="buying-title">
          <div>
            <p className="kicker">Release path</p>
            <h2 id="buying-title">How buying will work</h2>
            <p>Public purchasing is not open in this development slice. When a product is released, BRexcel is designed around a short guest checkout with server-confirmed payment.</p>
          </div>
          <ol className="buying-steps">
            <li><span>01</span><p><strong>Try the public demo</strong> — synthetic data, nothing to install.</p></li>
            <li><span>02</span><p><strong>Wait for a public release</strong> — price and availability appear only after validation.</p></li>
            <li><span>03</span><p><strong>Payment is confirmed server-side</strong> before any future fulfilment action.</p></li>
          </ol>
        </section>
      </main>

      <footer className="storefront-footer">
        <div className="site-width footer-grid">
          <div><span className="storefront-wordmark storefront-wordmark--footer"><BrandMark />BRexcel</span><p className="footer-statement">Spreadsheet-native tools<br />built one module at a time.</p></div>
          <div><strong>Browse</strong><a href="#products">Products</a><a href="#browse">Families</a><a href="#browse">Use cases</a></div>
          <div><strong>Platform</strong><a href="#demo-lab">Demo Lab</a><a href="#buying">How buying works</a><Link href={`/products/${product.slug}`}>Product details</Link></div>
          <div><strong>Status</strong><span>Public storefront preview</span><span>Product not for sale</span><span>Demo uses synthetic data</span></div>
        </div>
      </footer>
    </div>
  );
}
