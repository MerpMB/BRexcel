import type { CSSProperties } from "react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/publication";

type ProductCardProps = {
  product: PublicProduct;
  index: string;
  accent: string;
};

export function ProductCard({ product, index, accent }: ProductCardProps) {
  return (
    <article
      className="featured-product"
      style={{ "--product-accent": accent } as CSSProperties}
    >
      <div className="featured-product__rail">PLANNING · {index}</div>
      <div className="featured-product__content">
        <div className="product-meta">
          <span>Featured product preview</span>
          <span className="status-tag status-tag--accent">Synthetic fixture · not for sale</span>
        </div>
        <h3>{product.title}</h3>
        <p>{product.summary}</p>
        <div className="product-facts" aria-label="Product facts">
          <span>Excel concept</span>
          <span>Live browser demo</span>
          <span>Two scenarios</span>
        </div>
        <div className="product-actions">
          <span className="launch-price">Price announced at launch</span>
          <a className="button button--accent" href="#demo-lab">Open demo</a>
          <Link className="text-action" href={`/products/${product.slug}`}>View product <span aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="featured-product__preview" aria-label="Cashflow breakdown preview">
        <span className="cell-label">SHEET 2 · BREAKDOWN</span>
        <dl>
          <div><dt>Income</dt><dd>50,000</dd></div>
          <div className="data-bar"><i style={{ width: "100%" }} /></div>
          <div><dt>Commitments</dt><dd>30,000</dd></div>
          <div className="data-bar data-bar--muted"><i style={{ width: "60%" }} /></div>
          <div><dt>Remaining</dt><dd className="accent-value">20,000</dd></div>
          <div className="data-bar data-bar--accent"><i style={{ width: "40%" }} /></div>
        </dl>
        <div className="preview-totals">
          <span>Savings rate <b>40%</b></span>
          <span>Gap to target <b>0</b></span>
        </div>
      </div>
    </article>
  );
}
