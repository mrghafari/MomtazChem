import OpenAI from "openai";
import { db } from "./db";
import { shopProducts, showcaseProducts } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SeoGenerationRequest {
  pageType: string;
  pageIdentifier?: string;
  language: string;
  targetKeywords?: string[];
  competitorUrls?: string[];
  businessContext?: string;
  productCategory?: string;
  customPrompt?: string;
}

export interface SeoGenerationResult {
  title: string;
  description: string;
  keywords: string[];
  h1Title: string;
  focusKeyword: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  reasoning: string;
  suggestions: string[];
  contentOutline?: string[];
}

export async function generateAISeoContent(request: SeoGenerationRequest): Promise<SeoGenerationResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Get relevant products if this is a product/category page
    let productsContext = "";
    if (request.pageType === "product" || request.pageType === "category") {
      const products = await getRelevantProducts(request.productCategory, request.pageIdentifier);
      productsContext = `Available products: ${products.map(p => `${p.name} - ${p.description || 'Chemical product'}`).join(', ')}`;
    }

    const prompt = createSeoPrompt(request, productsContext);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO specialist for Momtazchem, a leading chemical products company in Iraq and the Middle East. You understand search engine optimization best practices, keyword research, and content optimization for chemical industry websites. Always prioritize Momtazchem branded products and create content that drives organic traffic."
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

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return validateAndFormatSeoResult(result, request);
  } catch (error) {
    console.error("Error generating AI SEO content:", error);
    throw new Error("Failed to generate AI SEO content: " + error.message);
  }
}

export async function analyzeSeoPerformance(url: string, targetKeywords: string[]): Promise<{
  titleScore: number;
  descriptionScore: number;
  keywordDensity: number;
  recommendations: string[];
  competitorAnalysis?: any;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // This would typically involve scraping the URL and analyzing content
    // For now, we'll use AI to provide analysis based on keywords
    const prompt = `Analyze SEO performance for URL: ${url}
    Target keywords: ${targetKeywords.join(', ')}
    
    Provide a comprehensive SEO analysis including:
    1. Title optimization score (0-100)
    2. Meta description score (0-100)
    3. Keyword density analysis
    4. Specific recommendations for improvement
    
    Respond in JSON format with: titleScore, descriptionScore, keywordDensity, recommendations array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an SEO analysis expert. Provide detailed, actionable SEO recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing SEO performance:", error);
    throw new Error("Failed to analyze SEO performance");
  }
}

export async function generateKeywordSuggestions(
  seedKeywords: string[], 
  language: string = "fa",
  industry: string = "chemical"
): Promise<{
  primaryKeywords: string[];
  longTailKeywords: string[];
  localKeywords: string[];
  competitorKeywords: string[];
  searchVolume?: any;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const prompt = `Generate comprehensive keyword suggestions for a chemical products company in Iraq/Middle East.
    
    Seed keywords: ${seedKeywords.join(', ')}
    Language: ${language === 'fa' ? 'Persian/Farsi' : language === 'ar' ? 'Arabic' : 'Kurdish'}
    Industry: ${industry}
    
    Generate:
    1. Primary keywords (high competition, high volume)
    2. Long-tail keywords (specific phrases, lower competition)
    3. Local keywords (Iraq, Baghdad, Middle East specific)
    4. Competitor keywords (terms competitors might rank for)
    
    Focus on chemical industry terms, manufacturing, industrial supplies, and regional relevance.
    
    Respond in JSON format with arrays for each category.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a keyword research expert specializing in Middle East markets and chemical industry SEO." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating keyword suggestions:", error);
    throw new Error("Failed to generate keyword suggestions");
  }
}

export async function optimizeContentForSeo(
  content: string,
  targetKeywords: string[],
  language: string = "fa"
): Promise<{
  optimizedContent: string;
  keywordDensity: number;
  readabilityScore: number;
  suggestions: string[];
  headingStructure: string[];
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const prompt = `Optimize the following content for SEO while maintaining natural readability:

Content: ${content}
Target keywords: ${targetKeywords.join(', ')}
Language: ${language === 'fa' ? 'Persian/Farsi' : language === 'ar' ? 'Arabic' : 'Kurdish'}

Tasks:
1. Optimize keyword placement and density (2-3% target)
2. Improve heading structure (H1, H2, H3)
3. Enhance readability and flow
4. Add semantic keywords and synonyms
5. Ensure proper keyword distribution

Respond in JSON format with optimizedContent, keywordDensity, readabilityScore, suggestions array, headingStructure array.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a content optimization expert specializing in SEO for chemical industry websites in the Middle East." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error optimizing content for SEO:", error);
    throw new Error("Failed to optimize content for SEO");
  }
}

function createSeoPrompt(request: SeoGenerationRequest, productsContext: string): string {
  const languageContext = {
    'fa': 'Persian/Farsi for Iranian and Persian-speaking markets',
    'ar': 'Arabic for Middle Eastern and Arab markets', 
    'ku': 'Kurdish for Kurdish-speaking regions',
    'en': 'English for international markets'
  }[request.language] || 'English';

  return `Generate comprehensive SEO content for Momtazchem chemical company:

Page Type: ${request.pageType}
${request.pageIdentifier ? `Page Identifier: ${request.pageIdentifier}` : ''}
Language: ${languageContext}
${request.targetKeywords ? `Target Keywords: ${request.targetKeywords.join(', ')}` : ''}
${request.productCategory ? `Product Category: ${request.productCategory}` : ''}
${request.businessContext ? `Business Context: ${request.businessContext}` : ''}
${productsContext}
${request.customPrompt ? `Custom Requirements: ${request.customPrompt}` : ''}

Company Context:
- Momtazchem is a leading chemical products manufacturer in Iraq and Middle East
- Specializes in industrial chemicals, water treatment, fuel additives, agricultural products
- Target audience: industrial clients, manufacturers, agricultural sector, technical professionals
- Geographic focus: Iraq, Middle East, regional markets

Generate:
1. SEO-optimized title (50-60 characters, compelling, keyword-rich)
2. Meta description (150-160 characters, action-oriented, includes CTA)
3. Primary keywords array (5-10 keywords)
4. H1 title (different from meta title, engaging)
5. Focus keyword (main target keyword)
6. Meta keywords (comma-separated)
7. Open Graph title and description for social media
8. Reasoning for choices made
9. Additional suggestions for improvement
10. Content outline suggestions (optional)

Requirements:
- Follow Google SEO best practices
- Use natural, compelling language
- Include location-based keywords when relevant (Iraq, Baghdad, Middle East)
- Emphasize Momtazchem brand and expertise
- Focus on business benefits and technical solutions
- Ensure cultural and linguistic appropriateness

Respond in JSON format with all requested fields.`;
}

async function getRelevantProducts(category?: string, identifier?: string) {
  try {
    let shopProductsQuery = db.select().from(shopProducts);
    let showcaseProductsQuery = db.select().from(showcaseProducts);

    if (category) {
      shopProductsQuery = shopProductsQuery.where(eq(shopProducts.category, category));
      showcaseProductsQuery = showcaseProductsQuery.where(eq(showcaseProducts.category, category));
    }

    const shopResults = await shopProductsQuery.limit(10);
    const showcaseResults = await showcaseProductsQuery.limit(10);

    return [...shopResults, ...showcaseResults].slice(0, 15);
  } catch (error) {
    console.error("Error fetching relevant products:", error);
    return [];
  }
}

function validateAndFormatSeoResult(result: any, request: SeoGenerationRequest): SeoGenerationResult {
  return {
    title: result.title || `${request.pageType} - Momtazchem`,
    description: result.description || `Professional chemical solutions from Momtazchem`,
    keywords: Array.isArray(result.keywords) ? result.keywords : [],
    h1Title: result.h1Title || result.title || `${request.pageType}`,
    focusKeyword: result.focusKeyword || request.targetKeywords?.[0] || "",
    metaKeywords: result.metaKeywords || "",
    ogTitle: result.ogTitle || result.title || "",
    ogDescription: result.ogDescription || result.description || "",
    reasoning: result.reasoning || "AI-generated SEO content based on best practices",
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    contentOutline: Array.isArray(result.contentOutline) ? result.contentOutline : undefined
  };
}

export async function generateBulkSeoContent(
  pages: Array<{
    pageType: string;
    pageIdentifier?: string;
    language: string;
    productCategory?: string;
  }>
): Promise<Array<SeoGenerationResult & { pageType: string; pageIdentifier?: string; language: string }>> {
  const results = [];
  
  for (const page of pages) {
    try {
      const seoContent = await generateAISeoContent(page);
      results.push({
        ...seoContent,
        pageType: page.pageType,
        pageIdentifier: page.pageIdentifier,
        language: page.language
      });
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error generating SEO content for ${page.pageType}:`, error);
      // Continue with other pages even if one fails
    }
  }
  
  return results;
}