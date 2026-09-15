import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/content/products";
import { Showcase } from "@/components/showcase/Showcase";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { freelancerCashflowShowcase } from "@/content/showcases/freelancer-cashflow";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFreelancerCashflowShowcaseProps } from "@/lib/i18n/showcase";

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.product;
  const copy = t.freelancerCashflowPlanner;
  const showcaseProps = getFreelancerCashflowShowcaseProps(dict);

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label={dict.navigation.homeAriaLabel}>BRexcel</Link>
        <div className="site-header__end">
          <Link className="back-link" href="/"><span aria-hidden="true">←</span> {dict.navigation.backToCatalog}</Link>
          <LanguageSwitch
            locale={locale}
            groupLabel={dict.navigation.languageGroupLabel}
            switchToEnglish={dict.navigation.switchToEnglish}
            switchToThai={dict.navigation.switchToThai}
            currentLanguageEnglish={dict.navigation.currentLanguageEnglish}
            currentLanguageThai={dict.navigation.currentLanguageThai}
          />
        </div>
      </header>
      <article className="product-detail">
        <p className="eyebrow">{t.eyebrowSyntheticFixture}</p>
        <h1>{copy.title}</h1>
        <p className="product-detail__summary">{copy.summary}</p>
        <aside className="disclosure" aria-label={t.fixtureDisclosureAriaLabel}><strong>{t.developmentFixture}</strong><p>{copy.fixtureDisclosure}</p></aside>
        <div className="product-detail__grid">
          <section aria-labelledby="benefits-title"><h2 id="benefits-title">{t.benefitsHeading}</h2><ul className="detail-list">{copy.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></section>
          <aside className="price-panel" aria-label={t.availabilityAriaLabel}>
            <p className="eyebrow">{t.illustrativePrice}</p>
            <strong className="price">{product.displayPrice}</strong>
            <p>{t.saleAvailabilityUnavailable}</p>
            <p>{t.purchaseUnavailable}</p>
          </aside>
        </div>
        <section className="detail-section" aria-labelledby="compatibility-title"><h2 id="compatibility-title">{t.compatibilityHeading}</h2><ul className="detail-list">{copy.compatibility.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="detail-section" aria-labelledby="license-title"><h2 id="license-title">{t.licenseHeading}</h2><p>{copy.licenseSummary}</p></section>
        <Showcase manifest={freelancerCashflowShowcase} locale={locale} {...showcaseProps} />
      </article>
    </main>
  );
}
