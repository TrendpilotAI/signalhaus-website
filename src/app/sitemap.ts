import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/mdx";
import { absoluteUrl } from "@/lib/site";

const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPostsMeta();
  const newest = posts.reduce<string | undefined>(
    (latest, post) => {
      const changed = post.updated ?? post.date;
      return !latest || changed > latest ? changed : latest;
    },
    undefined
  );
  const siteModified = newest ? new Date(newest) : undefined;

  return [
    ...STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      lastModified: siteModified,
      changeFrequency,
      priority,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated ?? post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
