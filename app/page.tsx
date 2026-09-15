import Link from "next/link";
import { Showcase } from "@/components/showcase/Showcase";
import { ProductCard } from "@/components/storefront/ProductCard";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { products } from "@/content/products";
import { freelancerCashflowShowcase } from "@/content/showcases/freelancer-cashflow";
import { validateManifest } from "@/lib/showcase/core";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFreelancerCashflowShowcaseProps } from "@/lib/i18n/showcase";

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

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const product = products[0];
  const productCopy = dict.product.freelancerCashflowPlanner;
  const showcaseProps = getFreelancerCashflowShowcaseProps(dict);

  return (
    <div className="storefront" id="top">
      <header className="storefront-header">
        <div className="site-width header-inner">
          <Link className="storefront-wordmark" href="/" aria-label={dict.navigation.homeAriaLabel}>
            <BrandMark />
            BRexcel
          </Link>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a href="#products">{dict.navigation.products}</a>
            <a href="#browse">{dict.navigation.browse}</a>
            <a href="#demo-lab">{dict.navigation.demoLab}</a>
            <a href="#buying">{dict.navigation.howBuyingWorks}</a>
          </nav>
          <div className="header-meta">
            <span className="header-status"><i aria-hidden="true" />{dict.navigation.statusCatalogDev}</span>
            <LanguageSwitch
              locale={locale}
              groupLabel={dict.navigation.languageGroupLabel}
              switchToEnglish={dict.navigation.switchToEnglish}
              switchToThai={dict.navigation.switchToThai}
              currentLanguageEnglish={dict.navigation.currentLanguageEnglish}
              currentLanguageThai={dict.navigation.currentLanguageThai}
            />
          </div>
        </div>
      </header>

      <main>
        <section className="platform-hero site-width" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="kicker">{dict.home.kicker}</p>
            <h1 id="page-title">{dict.home.heading}</h1>
            <p className="hero-lede">{dict.home.lede}</p>
            <div className="hero-actions">
              <a className="button button--primary" href="#products">{dict.home.browseProducts} <span aria-hidden="true">↓</span></a>
              <a className="button button--secondary" href="#demo-lab">{dict.home.tryDemoLab} <span aria-hidden="true">↗</span></a>
            </div>
            <dl className="hero-index" aria-label="Platform summary">
              {dict.home.heroIndex.map((item) => (
                <div key={item.label}><dt>{item.value}</dt><dd>{item.label}</dd></div>
              ))}
            </dl>
          </div>

          <div className="hero-workbook" aria-label={dict.home.workbookAriaLabel}>
            <div className="workbook-bar"><span>{dict.home.workbookBarTitle}</span><span>{dict.home.workbookBarPreview}</span></div>
            <div className="workbook-sheet">
              <div className="sheet-title-row">
                <div><span className="cell-label">{dict.home.sheet1Label}</span><strong>{dict.home.cashPosition}</strong></div>
                <span className="sheet-badge">{dict.home.syntheticBadge}</span>
              </div>
              <div className="sheet-grid" role="presentation">
                <span className="grid-corner" /><span>A</span><span>B</span><span>C</span>
                <span>3</span><strong>{dict.home.sheetRows.category}</strong><strong>{dict.home.sheetRows.typical}</strong><strong>{dict.home.sheetRows.tight}</strong>
                <span>4</span><span>{dict.home.sheetRows.monthlyIncome}</span><b>50,000</b><b>40,000</b>
                <span>5</span><span>{dict.home.sheetRows.essentialExpenses}</span><b>18,000</b><b>18,000</b>
                <span>6</span><span>{dict.home.sheetRows.flexibleExpenses}</span><b>7,000</b><b>9,000</b>
                <span>7</span><strong>{dict.home.sheetRows.totalCommitments}</strong><b>30,000</b><b>34,000</b>
                <span>8</span><strong>{dict.home.sheetRows.remainingCash}</strong><b className="selected-cell">20,000</b><b>6,000</b>
                <span>9</span><span>{dict.home.sheetRows.savingsRate}</span><b>40%</b><b>15%</b>
              </div>
              <div className="sheet-tabs" aria-hidden="true"><span className="active">{dict.home.sheetTabs.cashPosition}</span><span>{dict.home.sheetTabs.breakdown}</span><span>{dict.home.sheetTabs.notes}</span></div>
            </div>
          </div>
        </section>

        <section className="products-section site-width" id="products" aria-labelledby="products-title">
          <div className="storefront-section-heading">
            <div><p className="kicker">{dict.catalog.kicker}</p><h2 id="products-title">{dict.catalog.heading}</h2></div>
            <p>{dict.catalog.lede}</p>
          </div>
          <ProductCard
            product={product}
            index="01"
            accent="#d2661d"
            title={productCopy.title}
            summary={productCopy.summary}
            t={dict.catalog.productCard}
          />
          <div className="pipeline-grid" aria-label="Product pipeline">
            <article className="pipeline-card">
              <div className="module-rail">{dict.catalog.pipeline.next.rail}</div>
              <div>
                <div className="module-meta"><span>{dict.catalog.pipeline.next.meta}</span><span className="status-tag">{dict.catalog.pipeline.next.status}</span></div>
                <h3>{dict.catalog.pipeline.next.title}</h3>
                <p>{dict.catalog.pipeline.next.body}</p>
                <span className="module-family">{dict.catalog.pipeline.next.family}</span>
              </div>
            </article>
            <article className="pipeline-card pipeline-card--quiet">
              <div className="module-rail">{dict.catalog.pipeline.future.rail}</div>
              <div>
                <div className="module-meta"><span>{dict.catalog.pipeline.future.meta}</span><span className="status-tag">{dict.catalog.pipeline.future.status}</span></div>
                <h3>{dict.catalog.pipeline.future.title}</h3>
                <p>{dict.catalog.pipeline.future.body}</p>
                <span className="module-family">{dict.catalog.pipeline.future.family}</span>
              </div>
            </article>
          </div>
        </section>

        <section className="browse-section site-width" id="browse" aria-labelledby="browse-title">
          <div className="browse-panel">
            <div className="browse-heading"><h2 id="browse-title">{dict.catalog.browse.heading}</h2><span>{dict.catalog.browse.lede}</span></div>
            <div className="filter-chips" aria-label={dict.catalog.browse.ariaLabel}>
              <span className="filter-chip filter-chip--active">{dict.catalog.browse.chips.allProducts} <b>01</b></span>
              <a className="filter-chip" href="#products">{dict.catalog.browse.chips.planning} <b>01</b></a>
              <span className="filter-chip filter-chip--disabled">{dict.catalog.browse.chips.analysis} <b>00</b></span>
              <a className="filter-chip" href="#demo-lab">{dict.catalog.browse.chips.withLiveDemo} <b>01</b></a>
            </div>
            <div className="use-case-links">
              <a href="#demo-lab"><span>{dict.catalog.browse.useCases.normalMonth}</span><b>{dict.catalog.browse.useCases.oneTool}</b></a>
              <a href="#demo-lab"><span>{dict.catalog.browse.useCases.tightMonth}</span><b>{dict.catalog.browse.useCases.oneTool}</b></a>
              <span><span>{dict.catalog.browse.useCases.dayRate}</span><b>{dict.catalog.browse.useCases.later}</b></span>
            </div>
          </div>
        </section>

        <section className="demo-lab" id="demo-lab" aria-labelledby="demo-lab-title">
          <div className="site-width">
            <div className="demo-lab-heading">
              <div><p className="kicker">{dict.demo.kicker}</p><h2 id="demo-lab-title">{dict.demo.heading}</h2></div>
              <p>{dict.demo.lede}</p>
            </div>
            <div className="demo-product-tabs" aria-label="Available product demos"><span>{dict.demo.tabs.cashflowPlanner}</span><span>{dict.demo.tabs.moreDemos}</span></div>
            <Showcase manifest={freelancerCashflowShowcase} variant="lab" locale={locale} {...showcaseProps} />
          </div>
        </section>

        <section className="buying-section site-width" id="buying" aria-labelledby="buying-title">
          <div>
            <p className="kicker">{dict.purchase.kicker}</p>
            <h2 id="buying-title">{dict.purchase.heading}</h2>
            <p>{dict.purchase.lede}</p>
          </div>
          <ol className="buying-steps">
            {dict.purchase.steps.map((step, index) => (
              <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{step.title}</strong> — {step.body}</p></li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="storefront-footer">
        <div className="site-width footer-grid">
          <div>
            <span className="storefront-wordmark storefront-wordmark--footer"><BrandMark />BRexcel</span>
            <p className="footer-statement">
              {dict.footer.statementLines[0]}<br />{dict.footer.statementLines[1]}
            </p>
          </div>
          <div><strong>{dict.footer.browseHeading}</strong><a href="#products">{dict.footer.products}</a><a href="#browse">{dict.footer.families}</a><a href="#browse">{dict.footer.useCases}</a></div>
          <div><strong>{dict.footer.platformHeading}</strong><a href="#demo-lab">{dict.footer.demoLab}</a><a href="#buying">{dict.footer.howBuyingWorks}</a><Link href={`/products/${product.slug}`}>{dict.footer.productDetails}</Link></div>
          <div><strong>{dict.footer.statusHeading}</strong><span>{dict.footer.statusPreview}</span><span>{dict.footer.statusNotForSale}</span><span>{dict.footer.statusSyntheticDemo}</span></div>
        </div>
      </footer>
    </div>
  );
}
