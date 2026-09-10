export type InternalProduct = {
  productId: string;
  slug: string;
  title: string;
  summary: string;
  thaiSummary: string;
  displayPrice: string;
  benefits: readonly string[];
  compatibility: readonly string[];
  licenseSummary: string;
  demoReference: string;
  publicationState: string;
  saleAvailability: string;
  fixtureDisclosure: string;
  demoDisclosure: string;
  synthetic: boolean;
  saleEnabled: boolean;
  internalSource?: string;
};

export type PublicProduct = Omit<InternalProduct, "internalSource" | "saleEnabled" | "synthetic">;

export function validateCatalog(products: readonly InternalProduct[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const product of products) {
    if (!/^prd_[A-Za-z0-9]+$/.test(product.productId)) throw new Error("Invalid product ID");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) throw new Error("Invalid product slug");
    if (ids.has(product.productId)) throw new Error("Duplicate product ID");
    if (slugs.has(product.slug)) throw new Error("Duplicate product slug");
    ids.add(product.productId); slugs.add(product.slug);
    if (!/^฿[1-9][0-9]*(?:\.[0-9]{2})?$/.test(product.displayPrice)) throw new Error("Invalid display price");
    if (!product.title || !product.summary || !product.thaiSummary || !product.benefits.length || !product.compatibility.length || !product.licenseSummary || !product.demoReference || !product.publicationState) throw new Error("Missing required product metadata");
    if (product.synthetic && product.saleEnabled) throw new Error("Synthetic fixtures cannot be sale-enabled");
    if (product.saleEnabled && product.saleAvailability !== "available") throw new Error("Sale-enabled product has invalid availability");
  }
}

export function toPublicProduct(product: InternalProduct): PublicProduct {
  return {
    productId: product.productId, slug: product.slug, title: product.title,
    summary: product.summary, thaiSummary: product.thaiSummary,
    displayPrice: product.displayPrice, benefits: product.benefits,
    compatibility: product.compatibility, licenseSummary: product.licenseSummary,
    demoReference: product.demoReference, publicationState: product.publicationState,
    saleAvailability: product.saleAvailability, fixtureDisclosure: product.fixtureDisclosure,
    demoDisclosure: product.demoDisclosure,
  };
}

export function createPublicCatalog(products: readonly InternalProduct[]) {
  validateCatalog(products);
  return products.map(toPublicProduct);
}
