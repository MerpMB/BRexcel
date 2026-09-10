import Link from "next/link";
import { products } from "@/content/products";

export default function Home() {
  const product = products[0];

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="wordmark" href="/">BRexcel</Link>
        <p>Foundation-stage catalog</p>
      </header>
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Early development</p>
        <h1 id="page-title">A small, truthful product discovery slice.</h1>
        <p>BRexcel is exploring how premium spreadsheet products can be understood before any commerce or interactive showcase exists.</p>
      </section>
      <section className="catalog" aria-labelledby="catalog-title">
        <div className="section-heading"><div><p className="eyebrow">Catalog preview</p><h2 id="catalog-title">One synthetic product</h2></div><p className="fixture-note">Not available for purchase</p></div>
        <article className="product-card">
          <p className="eyebrow">Synthetic fixture</p><h3>{product.title}</h3><p>{product.summary}</p>
          <div className="product-card__footer"><strong>{product.displayPrice}</strong><Link className="text-link" href={`/products/${product.slug}`}>View product details <span aria-hidden="true">→</span></Link></div>
        </article>
      </section>
    </main>
  );
}
