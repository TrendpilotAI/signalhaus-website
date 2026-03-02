/**
 * JsonLd — reusable JSON-LD structured data injector
 * Usage: <JsonLd data={{ "@context": "https://schema.org", ... }} />
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
