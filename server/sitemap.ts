import { db } from './db';
import { shopProducts, shopCategories } from '../shared/shop-schema';
import { blogPosts, blogPostTranslations } from '../shared/blog-schema';
import { sql, eq } from 'drizzle-orm';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function generateSitemap(): Promise<string> {
  const baseUrl = 'https://momtazchem.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages: SitemapUrl[] = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/shop`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/blog`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.8 },
    { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.8 },
    { loc: `${baseUrl}/services`, changefreq: 'monthly', priority: 0.7 },
    { loc: `${baseUrl}/quote`, changefreq: 'weekly', priority: 0.6 },
  ];

  urls.push(...staticPages);

  try {
    // Get all active products
    const activeProducts = await db
      .select({
        id: shopProducts.id,
        updatedAt: shopProducts.updatedAt,
      })
      .from(shopProducts)
      .where(sql`${shopProducts.isActive} = true AND ${shopProducts.visibleInShop} = true AND ${shopProducts.stockQuantity} > 0`);

    // Add product pages
    activeProducts.forEach((product: any) => {
      urls.push({
        loc: `${baseUrl}/product-reviews/${product.id}`,
        lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Get all categories
    const allCategories = await db.select().from(shopCategories);

    // Add category pages
    allCategories.forEach((category: any) => {
      if (category.slug) {
        urls.push({
          loc: `${baseUrl}/products/${category.slug}`,
          changefreq: 'weekly',
          priority: 0.6,
        });
      }
    });

    // Get all published blog posts with translations
    const publishedPosts = await db
      .select({
        id: blogPosts.id,
        updatedAt: blogPosts.updatedAt,
        publishDate: blogPosts.publishDate,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'));

    // For each published post, get its translations and add to sitemap
    for (const post of publishedPosts) {
      const translations = await db
        .select({
          slug: blogPostTranslations.slug,
          language: blogPostTranslations.language,
          updatedAt: blogPostTranslations.updatedAt,
        })
        .from(blogPostTranslations)
        .where(eq(blogPostTranslations.postId, post.id));

      translations.forEach((translation: any) => {
        urls.push({
          loc: `${baseUrl}/blog/${translation.slug}`,
          lastmod: translation.updatedAt 
            ? new Date(translation.updatedAt).toISOString().split('T')[0]
            : post.publishDate 
              ? new Date(post.publishDate).toISOString().split('T')[0]
              : undefined,
          changefreq: 'weekly',
          priority: 0.8,
        });
      });
    }

  } catch (error) {
    console.error('Error fetching sitemap data:', error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}${url.changefreq ? `
    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority ? `
    <priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}
