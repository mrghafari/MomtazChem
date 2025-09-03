import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// DeepSeek AI client configuration
const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

// AI Provider selection enum
export enum AIProvider {
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek'
}

// Helper function to get AI client based on provider
function getAIClient(provider: AIProvider) {
  switch (provider) {
    case AIProvider.OPENAI:
      return { client: openai, model: 'gpt-5' }; // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    case AIProvider.DEEPSEEK:
      return { client: deepseekClient, model: 'deepseek-chat' };
    default:
      return { client: openai, model: 'gpt-5' };
  }
}

// Enhanced AI SEO interfaces
export interface SeoContentRequest {
  pageType: string;
  language: string;
  targetKeywords: string[];
  businessContext: string;
  productName?: string;
  productCategory?: string;
  targetAudience?: string;
  competitorAnalysis?: string;
  aiProvider?: AIProvider;
}

export interface KeywordResearchRequest {
  seedKeywords: string[];
  language: string;
  industry: string;
  businessContext: string;
  targetMarket?: string;
  competitorUrls?: string[];
  aiProvider?: AIProvider;
}

export interface ContentOptimizationRequest {
  content: string;
  targetKeywords: string[];
  language: string;
  contentType: string;
  targetAudience?: string;
  aiProvider?: AIProvider;
}

export interface SeoAnalysisRequest {
  url: string;
  targetKeywords: string[];
  language?: string;
  competitorUrls?: string[];
  aiProvider?: AIProvider;
}

// Enhanced AI SEO Content Generator with dual AI support
export async function generateAdvancedSeoContent(request: SeoContentRequest) {
  try {
    const aiProvider = request.aiProvider || AIProvider.OPENAI;
    const { client, model } = getAIClient(aiProvider);
    
    const prompt = `
نقش: شما یک متخصص حرفه‌ای SEO هستید که برای شرکت شیمیایی Momtazchem کار می‌کنید.

کار شما: تولید محتوای SEO بهینه شده برای موتورهای جستجو با جزئیات کامل

اطلاعات پروژه:
- نوع صفحه: ${request.pageType}
- زبان: ${request.language}
- کلیدواژه‌های هدف: ${request.targetKeywords.join(', ')}
- متن کسب‌وکار: ${request.businessContext}
${request.productName ? `- نام محصول: ${request.productName}` : ''}
${request.productCategory ? `- دسته‌بندی: ${request.productCategory}` : ''}
${request.targetAudience ? `- مخاطب هدف: ${request.targetAudience}` : ''}

الزامات:
1. عنوان SEO (30-60 کاراکتر)
2. توضیحات متا (120-160 کاراکتر)
3. کلیدواژه‌های پیشنهادی (10-15 کلیدواژه)
4. عنوان Open Graph
5. توضیحات Open Graph
6. عنوان Twitter Card
7. توضیحات Twitter Card
8. Schema.org markup (JSON-LD)
9. محتوای H1 تا H3
10. محتوای بهینه شده (300-500 کلمه)
11. پیشنهادات لینک داخلی
12. فراتگ‌های hreflang

خروجی را در قالب JSON ارائه دهید.
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما یک متخصص SEO هستید که محتوای بهینه شده برای موتورهای جستجو تولید می‌کنید. همیشه خروجی را در قالب JSON معتبر ارائه دهید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: result.title || '',
      description: result.description || '',
      keywords: result.keywords || [],
      ogTitle: result.ogTitle || result.title || '',
      ogDescription: result.ogDescription || result.description || '',
      twitterTitle: result.twitterTitle || result.title || '',
      twitterDescription: result.twitterDescription || result.description || '',
      schema: result.schema || {},
      headings: result.headings || {},
      optimizedContent: result.optimizedContent || '',
      internalLinks: result.internalLinks || [],
      hreflang: result.hreflang || [],
      seoScore: result.seoScore || 0,
      recommendations: result.recommendations || [],
      aiProvider: aiProvider
    };

  } catch (error: any) {
    console.error(`Error generating AI SEO content with ${aiProvider}:`, error);
    throw new Error(`Failed to generate SEO content with ${aiProvider}: ${error.message}`);
  }
}

// Enhanced Keyword Research with dual AI support
export async function generateAdvancedKeywordResearch(request: KeywordResearchRequest) {
  try {
    const aiProvider = request.aiProvider || AIProvider.DEEPSEEK; // Default to DeepSeek for keyword research
    const { client, model } = getAIClient(aiProvider);
    
    const prompt = `
نقش: شما یک متخصص تحقیق کلیدواژه SEO هستید.

کار: تحقیق پیشرفته کلیدواژه برای شرکت شیمیایی Momtazchem

اطلاعات:
- کلیدواژه‌های بذر: ${request.seedKeywords.join(', ')}
- زبان: ${request.language}
- صنعت: ${request.industry}
- متن کسب‌وکار: ${request.businessContext}
${request.targetMarket ? `- بازار هدف: ${request.targetMarket}` : ''}
${request.competitorUrls ? `- رقبا: ${request.competitorUrls.join(', ')}` : ''}

نیازمندی‌ها:
1. کلیدواژه‌های اصلی با حجم جستجوی بالا
2. کلیدواژه‌های Long-tail
3. کلیدواژه‌های محلی (عراق، ترکیه، خاورمیانه)
4. کلیدواژه‌های فنی صنعت شیمی
5. کلیدواژه‌های Intent-based (خرید، تحقیق، مقایسه)
6. تحلیل رقابت برای هر کلیدواژه
7. پیشنهاد استراتژی محتوا
8. کلیدواژه‌های فصلی
9. سوالات مرتبط (People Also Ask)
10. موضوعات کلاستر

خروجی JSON با جزئیات کامل.
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما متخصص تحقیق کلیدواژه هستید. خروجی را در قالب JSON معتبر ارائه دهید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      primaryKeywords: result.primaryKeywords || [],
      longTailKeywords: result.longTailKeywords || [],
      localKeywords: result.localKeywords || [],
      technicalKeywords: result.technicalKeywords || [],
      intentBasedKeywords: result.intentBasedKeywords || {
        commercial: [],
        informational: [],
        navigational: [],
        transactional: []
      },
      competitorAnalysis: result.competitorAnalysis || {},
      contentStrategy: result.contentStrategy || [],
      seasonalKeywords: result.seasonalKeywords || [],
      relatedQuestions: result.relatedQuestions || [],
      topicClusters: result.topicClusters || [],
      difficulty: result.difficulty || {},
      searchVolume: result.searchVolume || {},
      opportunities: result.opportunities || [],
      aiProvider: aiProvider
    };

  } catch (error: any) {
    console.error(`Error generating keyword research with ${aiProvider}:`, error);
    throw new Error(`Failed to generate keyword research with ${aiProvider}: ${error.message}`);
  }
}

// Advanced Content Optimization with dual AI support
export async function optimizeContentForSeoAdvanced(request: ContentOptimizationRequest) {
  try {
    const aiProvider = request.aiProvider || AIProvider.OPENAI; // Default to OpenAI for content optimization
    const { client, model } = getAIClient(aiProvider);
    const prompt = `
نقش: متخصص بهینه‌سازی محتوا برای SEO

کار: بهینه‌سازی پیشرفته محتوای ارائه شده

محتوای فعلی:
"${request.content}"

پارامترها:
- کلیدواژه‌های هدف: ${request.targetKeywords.join(', ')}
- زبان: ${request.language}
- نوع محتوا: ${request.contentType}
${request.targetAudience ? `- مخاطب: ${request.targetAudience}` : ''}

بهینه‌سازی‌های مورد نیاز:
1. تراکم کلیدواژه بهینه (2-3%)
2. استفاده از LSI Keywords
3. بهبود readability score
4. ساختار H1-H6 بهینه
5. Meta descriptions بهینه
6. Internal linking opportunities
7. بهینه‌سازی برای featured snippets
8. Schema markup پیشنهادی
9. تحلیل sentiment
10. بهبود user engagement
11. Mobile optimization
12. Page speed recommendations
13. Accessibility improvements

خروجی JSON شامل:
- محتوای بهینه شده
- پیشنهادات بهبود
- امتیاز SEO
- نکات فنی
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما متخصص بهینه‌سازی محتوا هستید. محتوای بهینه شده با جزئیات کامل تولید کنید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      optimizedContent: result.optimizedContent || '',
      improvements: result.improvements || [],
      seoScore: result.seoScore || 0,
      keywordDensity: result.keywordDensity || {},
      readabilityScore: result.readabilityScore || 0,
      headingStructure: result.headingStructure || {},
      lsiKeywords: result.lsiKeywords || [],
      internalLinkSuggestions: result.internalLinkSuggestions || [],
      featuredSnippetOptimization: result.featuredSnippetOptimization || {},
      schema: result.schema || {},
      technicalRecommendations: result.technicalRecommendations || [],
      userEngagementTips: result.userEngagementTips || [],
      mobileOptimization: result.mobileOptimization || [],
      accessibilityTips: result.accessibilityTips || [],
      aiProvider: aiProvider
    };

  } catch (error: any) {
    console.error(`Error optimizing content with ${aiProvider}:`, error);
    throw new Error(`Failed to optimize content with ${aiProvider}: ${error.message}`);
  }
}

// Advanced SEO Performance Analysis with dual AI support
export async function analyzeAdvancedSeoPerformance(request: SeoAnalysisRequest) {
  try {
    const aiProvider = request.aiProvider || AIProvider.DEEPSEEK; // Default to DeepSeek for analysis
    const { client, model } = getAIClient(aiProvider);
    const prompt = `
نقش: تحلیل‌گر پیشرفته عملکرد SEO

کار: تحلیل کامل عملکرد SEO سایت

اطلاعات:
- URL: ${request.url}
- کلیدواژه‌های هدف: ${request.targetKeywords.join(', ')}
${request.language ? `- زبان: ${request.language}` : ''}
${request.competitorUrls ? `- رقبا: ${request.competitorUrls.join(', ')}` : ''}

تحلیل‌های مورد نیاز:
1. On-Page SEO Analysis
2. Technical SEO Audit
3. Content Quality Assessment
4. Keyword Performance
5. Backlink Profile Analysis
6. Page Speed Analysis
7. Mobile Friendliness
8. Core Web Vitals
9. Structured Data Analysis
10. Security Assessment (HTTPS)
11. Indexability Check
12. Competition Analysis
13. Local SEO (اگر مربوطه)
14. Multi-language SEO
15. E-commerce SEO (اگر مربوطه)

خروجی JSON با:
- امتیاز کلی SEO
- نقاط قوت
- نقاط ضعف
- اولویت‌های بهبود
- پیشنهادات اقدام
- مقایسه با رقبا
- برنامه زمان‌بندی بهبود
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system", 
          content: "شما تحلیل‌گر متخصص SEO هستید که گزارش‌های تفصیلی و عملی ارائه می‌دهید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      overallScore: result.overallScore || 0,
      onPageSeo: result.onPageSeo || {},
      technicalSeo: result.technicalSeo || {},
      contentQuality: result.contentQuality || {},
      keywordPerformance: result.keywordPerformance || {},
      backlinks: result.backlinks || {},
      pageSpeed: result.pageSpeed || {},
      mobileFriendly: result.mobileFriendly || {},
      coreWebVitals: result.coreWebVitals || {},
      structuredData: result.structuredData || {},
      security: result.security || {},
      indexability: result.indexability || {},
      competitorComparison: result.competitorComparison || {},
      localSeo: result.localSeo || {},
      multiLanguage: result.multiLanguage || {},
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      priorities: result.priorities || [],
      actionPlan: result.actionPlan || [],
      timeline: result.timeline || {},
      aiProvider: aiProvider
    };

  } catch (error: any) {
    console.error(`Error analyzing SEO performance with ${aiProvider}:`, error);
    throw new Error(`Failed to analyze SEO performance with ${aiProvider}: ${error.message}`);
  }
}

// Schema.org Generator with dual AI support
export async function generateSchemaMarkup(pageType: string, data: any, aiProvider: AIProvider = AIProvider.OPENAI) {
  try {
    const { client, model } = getAIClient(aiProvider);
    const prompt = `
نقش: متخصص Schema.org markup

کار: تولید Schema.org markup بهینه برای نوع صفحه "${pageType}"

داده‌ها:
${JSON.stringify(data, null, 2)}

Schema types مورد نیاز:
1. Organization Schema
2. Product Schema (برای محصولات شیمیایی)
3. WebSite Schema
4. BreadcrumbList Schema
5. FAQ Schema (اگر مربوطه)
6. Review Schema (اگر مربوطه)
7. LocalBusiness Schema (اگر مربوطه)
8. Article Schema (برای محتوای مقاله‌ای)
9. Chemical Substance Schema (برای محصولات شیمیایی)
10. ContactPoint Schema

خروجی JSON-LD معتبر و کامل.
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما متخصص Schema.org هستید. JSON-LD معتبر و بهینه تولید کنید."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return { ...result, aiProvider };

  } catch (error: any) {
    console.error(`Error generating schema markup with ${aiProvider}:`, error);
    throw new Error(`Failed to generate schema markup with ${aiProvider}: ${error.message}`);
  }
}

// SEO Audit and Recommendations with dual AI support
export async function generateSeoAudit(url: string, aiProvider: AIProvider = AIProvider.DEEPSEEK) {
  try {
    const { client, model } = getAIClient(aiProvider);
    const prompt = `
نقش: اودیتور SEO حرفه‌ای

کار: تولید گزارش اودیت کامل SEO برای "${url}"

بررسی‌های مورد نیاز:
1. Title Tags Analysis
2. Meta Descriptions Review  
3. Heading Structure (H1-H6)
4. Image Alt Text
5. URL Structure
6. Internal Linking
7. Page Load Speed
8. Mobile Responsiveness
9. Schema Markup
10. SSL Certificate
11. Robots.txt
12. XML Sitemap
13. Canonical URLs
14. Redirect Chains
15. Broken Links
16. Content Quality
17. Keyword Optimization
18. Social Media Tags
19. Analytics Setup
20. Search Console Issues

خروجی JSON با:
- امتیاز کلی (0-100)
- جزئیات هر بخش
- اولویت‌بندی مسائل
- دستورالعمل رفع مشکلات
- تخمین زمان اجرا
- تأثیر احتمالی هر بهبود
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما اودیتور SEO متخصص هستید که گزارش‌های جامع و عملی ارائه می‌دهید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return { ...result, aiProvider };

  } catch (error: any) {
    console.error(`Error generating SEO audit with ${aiProvider}:`, error);
    throw new Error(`Failed to generate SEO audit with ${aiProvider}: ${error.message}`);
  }
}

// Competitive Analysis with dual AI support
export async function analyzeCompetitors(competitorUrls: string[], targetKeywords: string[], aiProvider: AIProvider = AIProvider.DEEPSEEK) {
  try {
    const { client, model } = getAIClient(aiProvider);
    const prompt = `
نقش: تحلیل‌گر رقابت SEO

کار: تحلیل کامل رقبا و ارائه استراتژی

رقبا: ${competitorUrls.join(', ')}
کلیدواژه‌های هدف: ${targetKeywords.join(', ')}

تحلیل‌های مورد نیاز:
1. Content Gap Analysis
2. Keyword Opportunities
3. Backlink Profile Comparison
4. Technical SEO Comparison
5. Content Strategy Analysis
6. Social Media Presence
7. Local SEO Performance
8. Page Speed Comparison
9. Mobile Experience
10. User Experience Analysis

خروجی JSON با:
- نقاط قوت رقبا
- فرصت‌های شناسایی شده
- استراتژی پیشرفت
- کلیدواژه‌های بدون رقیب
- تاکتیک‌های موثر رقبا
- پیشنهاد اقدامات
`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "شما تحلیل‌گر رقابت SEO هستید که استراتژی‌های برنده ارائه می‌دهید."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return { ...result, aiProvider };

  } catch (error: any) {
    console.error(`Error analyzing competitors with ${aiProvider}:`, error);
    throw new Error(`Failed to analyze competitors with ${aiProvider}: ${error.message}`);
  }
}