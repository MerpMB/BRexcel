import type { CSSProperties } from "react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/publication";
import type { Messages } from "@/lib/i18n/dictionaries/en";

type ProductCardProps = {
  product: PublicProduct;
  index: string;
  accent: string;
  title: string;
  summary: string;
  t: Messages["catalog"]["productCard"];
};

export function ProductCard({ product, index, accent, title, summary, t }: ProductCardProps) {
  return (
    <article
      className="featured-product"
      style={{ "--product-accent": accent } as CSSProperties}
    >
      <div className="featured-product__rail">PLANNING · {index}</div>
      <div className="featured-product__content">
        <div className="product-meta">
          <span>{t.featuredPreview}</span>
          <span className="status-tag status-tag--accent">{t.statusTag}</span>
        </div>
        <h3>{title}</h3>
        <p>{summary}</p>
        <div className="product-facts" aria-label="Product facts">
          {t.facts.map((fact) => <span key={fact}>{fact}</span>)}
        </div>
        <div className="product-actions">
          <span className="launch-price">{t.launchPrice}</span>
          <a className="button button--accent" href="#demo-lab">{t.openDemo}</a>
          <Link className="text-action" href={`/products/${product.slug}`}>{t.viewProduct} <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="featured-product__preview" aria-label={t.previewAriaLabel}>
        <span className="cell-label">{t.sheet2Label}</span>
        <dl>
          <div><dt>{t.income}</dt><dd>50,000</dd></div>
          <div className="data-bar"><i style={{ width: "100%" }} /></div>
          <div><dt>{t.commitments}</dt><dd>30,000</dd></div>
          <div className="data-bar data-bar--muted"><i style={{ width: "60%" }} /></div>
          <div><dt>{t.remaining}</dt><dd className="accent-value">20,000</dd></div>
          <div className="data-bar data-bar--accent"><i style={{ width: "40%" }} /></div>
        </dl>
        <div className="preview-totals">
          <span>{t.savingsRate} <b>40%</b></span>
          <span>{t.gapToTarget} <b>0</b></span>
        </div>
      </div>
    </article>
  );
}
