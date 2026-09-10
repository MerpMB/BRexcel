export default function Home() {
  return (
    <main className="foundation">
      <p className="foundation__eyebrow">Foundation stage</p>
      <h1>BRexcel</h1>
      <p>
        An open-source foundation for a future digital-commerce platform for
        premium spreadsheet products.
      </p>
      <section className="foundation__status" aria-labelledby="status-heading">
        <h2 id="status-heading">Current scope</h2>
        <ul>
          <li>Next.js application foundation</li>
          <li>Repository documentation and contribution guidance</li>
          <li>No product, payment, or workbook delivery features</li>
        </ul>
      </section>
    </main>
  );
}
