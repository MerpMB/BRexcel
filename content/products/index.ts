import { freelancerCashflowPlanner } from "./freelancer-cashflow-planner";

export const products = [freelancerCashflowPlanner] as const;

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
