import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  publishDate: timestamp("publish_date"),
  featuredImage: text("featured_image"),
  authorId: integer("author_id"),
  authorName: text("author_name").notNull(),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const blogPostTranslations = pgTable("blog_post_translations", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  language: text("language", { enum: ["en", "ar"] }).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogPostTranslationSchema = createInsertSchema(blogPostTranslations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertBlogPostTranslation = z.infer<typeof insertBlogPostTranslationSchema>;
export type BlogPostTranslation = typeof blogPostTranslations.$inferSelect;

export type BlogPostWithTranslations = BlogPost & {
  translations: BlogPostTranslation[];
};

export type BlogPostWithTranslation = BlogPost & {
  translation: BlogPostTranslation;
};
