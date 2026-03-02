import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/mdx";

const BASE_URL = "https://www.signalhaus.ai";

// Static routes with priorities and change frequencies
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/services", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.8, changeFrequency: "monthly" },
  { path: "/roi-calculator", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })
  );

  // Dynamic blog post pages — auto-discovered from MDX files
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = getAllPostsMeta();
    blogEntries = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // getAllPostsMeta can throw if content dir missing (e.g. build environment)
    // Gracefully skip dynamic entries rather than fail the build
  }

  return [...staticEntries, ...blogEntries];
}
