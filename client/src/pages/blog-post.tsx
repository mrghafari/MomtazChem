import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { marked } from "marked";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Share2,
  Link as LinkIcon,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ArticleSchema from "@/components/seo/ArticleSchema";
import OpenGraphTags from "@/components/seo/OpenGraphTags";
import CanonicalUrl from "@/components/seo/CanonicalUrl";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function BlogPost() {
  const { slug } = useParams();
  const { t, language, direction } = useLanguage();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeHeading, setActiveHeading] = useState<string>("");

  // Auto-scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Fetch blog post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/blog/', slug, language],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');
      const response = await fetch(`/api/blog/${slug}?language=${language}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found');
        }
        throw new Error('Failed to fetch blog post');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['/api/blog/', post?.id, 'related', language],
    queryFn: async () => {
      if (!post?.id) return [];
      const response = await fetch(`/api/blog/${post.id}/related?language=${language}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!post?.id,
  });

  // Parse markdown content and extract headings for TOC
  const { htmlContent, tableOfContents } = useMemo(() => {
    if (!post?.content) return { htmlContent: '', tableOfContents: [] };

    const toc: Array<{ id: string; text: string; level: number }> = [];
    let idCounter = 0;

    // Custom renderer to add IDs to headings
    const renderer = new marked.Renderer();
    renderer.heading = ({ tokens, depth }: { tokens: any[]; depth: number }) => {
      const text = tokens.map((t: any) => t.text || '').join('');
      const id = `heading-${idCounter++}`;
      
      if (depth === 2 || depth === 3) {
        toc.push({ id, text, level: depth });
      }
      
      return `<h${depth} id="${id}" class="scroll-mt-20">${text}</h${depth}>`;
    };

    marked.setOptions({ renderer });
    const html = marked.parse(post.content);

    return { htmlContent: html, tableOfContents: toc };
  }, [post?.content]);

  // Calculate reading time (assuming 200 words per minute)
  const readingTime = useMemo(() => {
    if (!post?.content) return 0;
    const wordCount = post.content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }, [post?.content]);

  // Format date based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ar') {
      return format(date, 'dd MMMM yyyy', { locale: ar });
    }
    return format(date, 'MMMM dd, yyyy');
  };

  // Handle copy link to clipboard
  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t.blogPost.linkCopied,
        description: t.blogPost.linkCopiedMessage,
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Smooth scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeading(id);
    }
  };

  // Track scroll position for active TOC item
  useEffect(() => {
    const handleScroll = () => {
      const headings = tableOfContents.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading && heading.offsetTop <= scrollPosition) {
          setActiveHeading(tableOfContents[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  // Loading State
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error / 404 State
  if (error || !post) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
        <div className="text-center max-w-md mx-auto px-4" data-testid="blog-post-not-found">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {t.blogPost.notFound}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t.blogPost.notFoundMessage}
          </p>
          <Button onClick={() => navigate('/blog')} data-testid="button-back-to-blog">
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {t.blogPost.backToBlog}
          </Button>
        </div>
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* SEO Components */}
      <CanonicalUrl path={`/blog/${slug}`} />
      <ArticleSchema
        headline={post.title}
        description={post.excerpt || post.title}
        image={post.featuredImage}
        datePublished={post.publishDate || post.createdAt}
        dateModified={post.updatedAt}
        author={post.authorName || 'Momtazchem'}
        url={currentUrl}
        tags={post.tags || []}
      />
      <OpenGraphTags
        title={`${post.title} | Momtazchem Blog`}
        description={post.excerpt || post.title}
        type="article"
        image={post.featuredImage}
        url={currentUrl}
        publishedTime={post.publishDate || post.createdAt}
        modifiedTime={post.updatedAt}
        author={post.authorName}
        tags={post.tags || []}
      />
      
      {/* Page Title & Meta */}
      <title>{post.title} | Momtazchem Blog</title>
      <meta name="description" content={post.excerpt || post.title} />

      {/* Hero Section */}
      <section
        className="relative w-full h-96 bg-cover bg-center"
        style={{
          backgroundImage: post.featuredImage
            ? `url(${post.featuredImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        data-testid="blog-post-hero"
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60" />

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-12 max-w-7xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'Blog', href: '/blog' },
                { label: post.title },
              ]}
              className="text-white"
            />
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-4xl"
            data-testid="blog-post-title"
          >
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap gap-4 text-white text-sm md:text-base">
            {/* Author */}
            <div className="flex items-center gap-2" data-testid="blog-post-author">
              <User className="h-5 w-5" />
              <span>{t.blog.by} {post.authorName || 'Momtazchem'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2" data-testid="blog-post-date">
              <Calendar className="h-5 w-5" />
              <span>{formatDate(post.publishDate || post.createdAt)}</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-2" data-testid="blog-post-views">
              <Eye className="h-5 w-5" />
              <span>{post.viewCount || 0} {t.blog.views}</span>
            </div>

            {/* Reading Time */}
            {readingTime > 0 && (
              <div className="flex items-center gap-2" data-testid="blog-post-reading-time">
                <Clock className="h-5 w-5" />
                <span>{readingTime} {t.blogPost.minutes}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4" data-testid="blog-post-tags">
              {post.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-gray-900"
                  data-testid={`blog-post-tag-${tag}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-8">
                {/* Share Buttons */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b">
                  <h2 className="text-lg font-semibold">{t.blogPost.share}</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      data-testid="button-copy-link"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {t.blogPost.copyLink}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="button-share"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {t.blogPost.shareArticle}
                    </Button>
                  </div>
                </div>

                {/* Article Body */}
                <article
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  data-testid="blog-post-content"
                />
              </CardContent>
            </Card>

            {/* Previous/Next Navigation */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.previousPost && (
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/blog/${post.previousPost.slug}`)}
                  data-testid="blog-post-previous"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <ChevronLeft className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                      <span>{t.blogPost.previousPost}</span>
                    </div>
                    <CardTitle className="text-lg">{post.previousPost.title}</CardTitle>
                  </CardHeader>
                </Card>
              )}

              {post.nextPost && (
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/blog/${post.nextPost.slug}`)}
                  data-testid="blog-post-next"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2 justify-end">
                      <span>{t.blogPost.nextPost}</span>
                      <ChevronRight className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                    </div>
                    <CardTitle className="text-lg text-right">{post.nextPost.title}</CardTitle>
                  </CardHeader>
                </Card>
              )}
            </div>

            {/* Back to Blog Button */}
            <div className="mt-8">
              <Button
                variant="outline"
                onClick={() => navigate('/blog')}
                className="w-full md:w-auto"
                data-testid="button-back-to-blog-bottom"
              >
                <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
                {t.blogPost.backToBlog}
              </Button>
            </div>
          </div>

          {/* Sidebar (Desktop) / Bottom (Mobile) */}
          <div className="space-y-6">
            {/* Author Card */}
            <Card data-testid="blog-post-author-card">
              <CardHeader>
                <CardTitle>{t.blogPost.aboutAuthor}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(post.authorName || 'M')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{post.authorName || 'Momtazchem'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Chemical industry expert and content creator
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <Card data-testid="blog-post-toc">
                <CardHeader>
                  <CardTitle>{t.blogPost.tableOfContents}</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToHeading(item.id)}
                        className={`block w-full text-left text-sm hover:text-blue-600 transition-colors ${
                          item.level === 3 ? 'pl-4' : ''
                        } ${
                          activeHeading === item.id
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        data-testid={`toc-item-${item.id}`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            )}

            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
              <Card data-testid="blog-post-related">
                <CardHeader>
                  <CardTitle>{t.blogPost.relatedPosts}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.slice(0, 4).map((relatedPost: any) => (
                    <div
                      key={relatedPost.id}
                      className="cursor-pointer group"
                      onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                      data-testid={`related-post-${relatedPost.id}`}
                    >
                      <div className="flex gap-3">
                        {relatedPost.featuredImage && (
                          <img
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(relatedPost.publishDate || relatedPost.createdAt)}
                          </p>
                        </div>
                      </div>
                      {relatedPost.id !== relatedPosts[relatedPosts.length - 1].id && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
