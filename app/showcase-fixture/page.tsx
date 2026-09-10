import { Showcase } from "@/components/showcase/Showcase";
import { monthlySavingsShowcase } from "@/content/showcases/monthly-savings";
import { validateManifest } from "@/lib/showcase/core";
validateManifest(monthlySavingsShowcase);
export default function ShowcaseFixturePage() { return <main className="page-shell"><Showcase manifest={monthlySavingsShowcase} /></main>; }
