import { freelancerCashflowPlanner } from "./freelancer-cashflow-planner";
import { createPublicCatalog } from "@/lib/catalog/publication";

const internalProducts = [freelancerCashflowPlanner];

export const products = createPublicCatalog(internalProducts);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
