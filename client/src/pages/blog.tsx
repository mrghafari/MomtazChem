import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ArrowRight,
  Eye,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import OpenGraphTags from "@/components/seo/OpenGraphTags";
import CanonicalUrl from "@/components/seo/CanonicalUrl";

export default function Blog() {
  const { t, language, direction } = useLanguage();
  const [, navigate] = useLocation();
  
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [page, setPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const limit = 9;
  const offset = page * limit;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch blog posts
  const { data: blogData, isLoading } = useQuery({
    queryKey: ['/api/blog', language, page, debouncedSearch, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams({
        language,
        limit: limit.toString(),
        offset: offset.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedTag && { tag: selectedTag }),
      });
      
      const response = await fetch(`/api/blog?${params}`);
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      return response.json();
    },
  });

  const posts = blogData?.posts || [];
  const total = blogData?.total || 0;
  const availableTags = blogData?.tags || [];
  const totalPages = Math.ceil(total / limit);

  // Handle tag filter
  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? "" : tag);
    setPage(0);
  };

  // Handle navigation to blog post
  const handleReadMore = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  // Format date based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ar') {
      return format(date, 'dd MMMM yyyy', { locale: ar });
    }
    return format(date, 'MMM dd, yyyy');
  };

  // Truncate excerpt to 150 characters
  const truncateExcerpt = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Get fallback image
  const getFallbackImage = () => {
    return 'https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Momtazchem+Blog';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* SEO Components */}
      <CanonicalUrl path="/blog" />
      <OpenGraphTags
        title="Blog - Chemical Industry Insights | Momtazchem"
        description="Latest articles, guides, and insights about chemical solutions, fuel additives, water treatment, and industrial chemicals from Momtazchem experts."
        type="website"
        url="/blog"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white py-16" data-testid="blog-hero">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="blog-title">
              {t.blog.title}
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto" data-testid="blog-subtitle">
              {t.blog.subtitle}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5`} />
            <Input
              type="text"
              placeholder={t.blog.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full ${direction === 'rtl' ? 'pr-12' : 'pl-12'} py-6 text-lg border-2 focus:border-blue-500`}
              data-testid="blog-search-input"
            />
          </div>
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center" data-testid="blog-tag-filter">
              <Button
                variant={selectedTag === "" ? "default" : "outline"}
                onClick={() => handleTagClick("")}
                className="rounded-full"
                data-testid="tag-all"
              >
                {t.blog.allTags}
              </Button>
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  onClick={() => handleTagClick(tag)}
                  className="rounded-full"
                  data-testid={`tag-${tag}`}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="blog-loading">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-16" data-testid="blog-empty-state">
            <div className="max-w-md mx-auto">
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {t.blog.noPostsFound}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t.blog.noPostsMessage}
              </p>
            </div>
          </div>
        )}

        {/* Blog Cards Grid */}
        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" data-testid="blog-grid">
            {posts.map((post: any) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
                data-testid={`blog-card-${post.id}`}
              >
                {/* Featured Image */}
                <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <img
                    src={post.featuredImage || getFallbackImage()}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackImage();
                    }}
                    data-testid={`blog-image-${post.id}`}
                  />
                </div>

                <CardHeader className="flex-grow">
                  {/* Title */}
                  <CardTitle className="text-xl mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer" data-testid={`blog-title-${post.id}`}>
                    {post.title}
                  </CardTitle>

                  {/* Excerpt */}
                  <CardDescription className="text-sm line-clamp-3" data-testid={`blog-excerpt-${post.id}`}>
                    {truncateExcerpt(post.excerpt)}
                  </CardDescription>

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {/* Author */}
                    <div className="flex items-center gap-1" data-testid={`blog-author-${post.id}`}>
                      <User className="h-4 w-4" />
                      <span>{t.blog.by} {post.authorName}</span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1" data-testid={`blog-date-${post.id}`}>
                      <Calendar className="h-4 w-4" />
                      <span>{post.publishDate ? formatDate(post.publishDate) : formatDate(post.createdAt)}</span>
                    </div>

                    {/* View Count */}
                    <div className="flex items-center gap-1" data-testid={`blog-views-${post.id}`}>
                      <Eye className="h-4 w-4" />
                      <span>{post.viewCount || 0} {t.blog.views}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3" data-testid={`blog-tags-${post.id}`}>
                      {post.tags.map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                          onClick={() => handleTagClick(tag)}
                          data-testid={`blog-tag-badge-${tag}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Read More Button */}
                  <Button
                    onClick={() => handleReadMore(post.slug)}
                    className="w-full group"
                    data-testid={`blog-read-more-${post.id}`}
                  >
                    <span>{t.blog.readMore}</span>
                    <ArrowRight className={`h-4 w-4 ${direction === 'rtl' ? 'mr-2 group-hover:-translate-x-1' : 'ml-2 group-hover:translate-x-1'} transition-transform`} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && posts.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4" data-testid="blog-pagination">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="gap-2"
              data-testid="pagination-previous"
            >
              {direction === 'rtl' ? (
                <>
                  <span>{t.blog.previousPage}</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t.blog.previousPage}</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" data-testid="pagination-info">
              <span>{t.blog.page} {page + 1} {t.blog.of} {totalPages}</span>
            </div>

            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="gap-2"
              data-testid="pagination-next"
            >
              {direction === 'rtl' ? (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>{t.blog.nextPage}</span>
                </>
              ) : (
                <>
                  <span>{t.blog.nextPage}</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
