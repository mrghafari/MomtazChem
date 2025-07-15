import { customerStorage } from "./customer-storage";
import { sendProductInquiryEmail, ProductInquiryData } from "./email";

interface TemplateVariables {
  // Customer variables
  customer_name?: string;
  customer_email?: string;
  customer_company?: string;
  customer_phone?: string;
  
  // Inquiry variables
  inquiry_number?: string;
  ticket_number?: string;
  date?: string;
  time?: string;
  priority?: string;
  
  // Product variables
  product_name?: string;
  product_category?: string;
  product_price?: string;
  product_description?: string;
  product_features?: string;
  
  // Support variables
  support_agent?: string;
  estimated_resolution?: string;
  solution_steps?: string;
  
  // Company variables
  company_name?: string;
  company_phone?: string;
  company_email?: string;
}

export class TemplateProcessor {
  
  /**
   * Replace template variables with actual values
   */
  static processTemplate(content: string, variables: TemplateVariables): string {
    let processedContent = content;
    
    // Add default variables
    const defaultVariables: TemplateVariables = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      company_name: "Momtazchem",
      company_email: "admin@momtazchem.com",
      company_phone: "+98 21 1234 5678",
      ...variables
    };
    
    // Replace all template variables
    Object.entries(defaultVariables).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, String(value));
      }
    });
    
    return processedContent;
  }
  
  /**
   * Send templated email response for customer inquiry
   */
  static async sendTemplatedResponse(
    inquiryId: number,
    templateId: number,
    customVariables: TemplateVariables = {},
    customContent?: { subject?: string; htmlContent?: string; textContent?: string }
  ): Promise<void> {
    
    // Get the inquiry details
    const inquiry = await customerStorage.getInquiryById(inquiryId);
    if (!inquiry) {
      throw new Error("Inquiry not found");
    }
    
    // Get the email template
    const template = await customerStorage.getEmailTemplateById(templateId);
    if (!template) {
      throw new Error("Email template not found");
    }
    
    // Prepare template variables
    const templateVariables: TemplateVariables = {
      customer_name: inquiry.contactEmail.split('@')[0], // Simple name extraction
      customer_email: inquiry.contactEmail,
      customer_company: inquiry.company || '',
      customer_phone: inquiry.contactPhone || '',
      inquiry_number: inquiry.inquiryNumber,
      ticket_number: inquiry.inquiryNumber,
      priority: inquiry.priority,
      ...customVariables
    };
    
    // Process template content
    const subject = this.processTemplate(
      customContent?.subject || template.subject, 
      templateVariables
    );
    
    const htmlContent = this.processTemplate(
      customContent?.htmlContent || template.htmlContent, 
      templateVariables
    );
    
    const textContent = template.textContent ? this.processTemplate(
      customContent?.textContent || template.textContent, 
      templateVariables
    ) : undefined;
    
    // Create email data for sending
    const emailData: ProductInquiryData = {
      contactEmail: inquiry.contactEmail,
      contactPhone: inquiry.contactPhone,
      company: inquiry.company,
      subject: subject,
      message: htmlContent,
      type: 'template_response',
      priority: inquiry.priority || 'normal',
      category: inquiry.category || 'general',
      productName: templateVariables.product_name || 'Product',
      inquiryNumber: inquiry.inquiryNumber
    };
    
    // Send the email
    await sendProductInquiryEmail(emailData);
    
    // Update template usage count
    await customerStorage.incrementTemplateUsage(templateId);
    
    // Create inquiry response record
    await customerStorage.createInquiryResponse({
      inquiryId: inquiry.id,
      senderId: 1, // Should be current admin user ID
      senderType: 'admin',
      message: `Email sent using template: ${template.name}`,
      attachments: null,
      isInternal: false
    });
  }
  
  /**
   * Get template suggestions based on inquiry category
   */
  static async getTemplateSuggestions(category: string, language: string = 'en'): Promise<any[]> {
    const templates = await customerStorage.getEmailTemplatesByCategory(category);
    return templates.filter(template => template.language === language);
  }
  
  /**
   * Preview template with variables
   */
  static previewTemplate(
    template: { subject: string; htmlContent: string; textContent?: string | null },
    variables: TemplateVariables
  ): { subject: string; htmlContent: string; textContent?: string } {
    
    return {
      subject: this.processTemplate(template.subject, variables),
      htmlContent: this.processTemplate(template.htmlContent, variables),
      textContent: template.textContent ? this.processTemplate(template.textContent, variables) : undefined
    };
  }
  
  /**
   * Extract available variables from template content
   */
  static extractVariables(content: string): string[] {
    const variableRegex = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }
  
  /**
   * Validate template variables
   */
  static validateTemplate(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const variables = this.extractVariables(content);
    
    // Check for common variable naming issues
    variables.forEach(variable => {
      if (variable.includes(' ')) {
        errors.push(`Variable "${variable}" contains spaces`);
      }
      if (variable.length === 0) {
        errors.push("Empty variable name found");
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default TemplateProcessor;