import { useEffect } from 'react';

interface ArticleSchemaProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
  tags?: string[];
}

export default function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  url,
  tags = []
}: ArticleSchemaProps) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": headline,
      "description": description,
      "image": image || "https://momtazchem.com/og-default.jpg",
      "datePublished": datePublished,
      "dateModified": dateModified || datePublished,
      "author": {
        "@type": "Person",
        "name": author
      },
      "publisher": {
        "@type": "Organization",
        "name": "Momtazchem Chemical Solutions",
        "logo": {
          "@type": "ImageObject",
          "url": "https://momtazchem.com/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      },
      "keywords": tags.join(", ")
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.setAttribute('data-article-schema', 'true');
    document.head.appendChild(script);

    return () => {
      const existingScript = document.head.querySelector('[data-article-schema="true"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [headline, description, image, datePublished, dateModified, author, url, tags]);

  return null;
}
