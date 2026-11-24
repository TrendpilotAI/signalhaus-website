import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { isLeadTopic, type LeadTopic } from "./leads/schema";
import { SITE } from "./site";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export interface PostFrontmatter {
  title: string;
  excerpt: string;
  date: string;
  /** Optional ISO date of the last meaningful edit. */
  updated?: string;
  /** Pre-selects the topic in the lead form under the post. */
  topic?: LeadTopic;
  /** Position among posts that share a date. Lower comes first. */
  order?: number;
  tags: string[];
  author: string;
}

export interface Post extends PostFrontmatter {
  slug: string;
  readingTime: string;
  wordCount: number;
  content: string;
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
  readingTime: string;
}

function ensureContentDir() {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(`Content directory not found: ${CONTENT_DIR}`);
  }
}

export function getAllPostsMeta(): PostMeta[] {
  ensureContentDir();
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.(mdx|md)$/, "");
    const filePath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const fm = data as PostFrontmatter;
    const rt = readingTime(content);

    return {
      slug,
      title: fm.title,
      excerpt: fm.excerpt,
      date: fm.date,
      updated: fm.updated,
      topic: isLeadTopic(fm.topic) ? fm.topic : undefined,
      order: typeof fm.order === "number" ? fm.order : undefined,
      tags: fm.tags ?? [],
      author: fm.author ?? SITE.founder.name,
      readingTime: rt.text,
    } satisfies PostMeta;
  });

  // Newest first. Posts published on the same day keep their stated order.
  return posts.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      a.slug.localeCompare(b.slug)
  );
}

export function getPostBySlug(slug: string): Post | null {
  ensureContentDir();
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const rt = readingTime(content);

  return {
    slug,
    title: fm.title,
    excerpt: fm.excerpt,
    date: fm.date,
    updated: fm.updated,
    topic: isLeadTopic(fm.topic) ? fm.topic : undefined,
    order: typeof fm.order === "number" ? fm.order : undefined,
    tags: fm.tags ?? [],
    author: fm.author ?? SITE.founder.name,
    readingTime: rt.text,
    wordCount: rt.words,
    content,
  };
}

export function getAllTags(): string[] {
  const posts = getAllPostsMeta();
  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

export function getAdjacentPosts(slug: string): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  const posts = getAllPostsMeta();
  const idx = posts.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? posts[idx - 1] : null,
    next: idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
