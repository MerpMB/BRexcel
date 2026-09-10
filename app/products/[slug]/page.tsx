import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/content/products";

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="page-shell">
      <header className="site-header"><Link className="wordmark" href="/">BRexcel</Link><Link className="back-link" href="/"><span aria-hidden="true">←</span> Catalog preview</Link></header>
      <article className="product-detail">
        <p className="eyebrow">Synthetic fixture</p><h1>{product.title}</h1><p className="product-detail__summary">{product.summary}</p><p className="thai-summary" lang="th">{product.thaiSummary}</p>
        <aside className="disclosure" aria-label="Fixture disclosure"><strong>Development fixture</strong><p>{product.fixtureDisclosure}</p></aside>
        <div className="product-detail__grid">
          <section aria-labelledby="benefits-title"><h2 id="benefits-title">What it would help with</h2><ul className="detail-list">{product.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></section>
          <aside className="price-panel" aria-label="Product availability"><p className="eyebrow">Illustrative price</p><strong className="price">{product.displayPrice}</strong><p>Sale availability: not available.</p><p>Purchasing is not available in this development slice.</p></aside>
        </div>
        <section className="detail-section" aria-labelledby="compatibility-title"><h2 id="compatibility-title">Compatibility</h2><ul className="detail-list">{product.compatibility.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="detail-section" aria-labelledby="license-title"><h2 id="license-title">Licensing status</h2><p>{product.licenseSummary}</p></section>
        <section className="demo-placeholder" aria-labelledby="demo-title"><p className="eyebrow">Demo status</p><h2 id="demo-title">No interactive demo yet</h2><p>{product.demoDisclosure}</p></section>
      </article>
    </main>
  );
}
