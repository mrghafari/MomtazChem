import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ShowcaseProduct } from "@shared/showcase-schema";

// Form validation schema
const inquiryFormSchema = z.object({
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  type: z.enum(["product_info", "quote_request", "technical_support", "general"]),
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
});

type InquiryFormData = z.infer<typeof inquiryFormSchema>;

interface ProductInquiryFormProps {
  product?: ShowcaseProduct;
  productName?: string;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
  className?: string;
  triggerClassName?: string;
}

export function ProductInquiryForm({ 
  product, 
  productName,
  triggerText = "Inquire About Product",
  triggerVariant = "default",
  triggerSize = "default",
  className = "",
  triggerClassName = ""
}: ProductInquiryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const displayProductName = product?.name || productName || "Product";
  
  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      contactEmail: "",
      contactPhone: "",
      company: "",
      subject: `Inquiry about ${displayProductName}`,
      message: `I am interested in learning more about ${displayProductName}. Please provide me with detailed information including pricing, specifications, and availability.`,
      type: "product_info",
      priority: "normal",
    },
  });

  const submitInquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const inquiryData = {
        ...data,
        category: product?.category || "agricultural-products",
        productIds: product ? [product.id] : [],
        customerId: null, // Guest inquiry
      };
      
      return apiRequest("/api/inquiries", "POST", inquiryData);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Inquiry Submitted",
        description: "Thank you! We'll get back to you within 24 hours.",
      });
      
      // Auto-close dialog after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
      }, 3000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    submitInquiryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={triggerVariant} 
          size={triggerSize}
          className={triggerClassName || className}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Product Inquiry
          </DialogTitle>
        </DialogHeader>

        {isSubmitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inquiry Submitted Successfully!
            </h3>
            <p className="text-gray-600">
              We'll get back to you within 24 hours with detailed information.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {product?.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{displayProductName}</h4>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {product?.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Agricultural Products"}
                  </Badge>
                  {product?.priceRange && (
                    <p className="text-sm text-gray-600 mt-1">{product.priceRange}</p>
                  )}
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="your@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1 (555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inquiry Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product_info">Product Information</SelectItem>
                              <SelectItem value="quote_request">Request Quote</SelectItem>
                              <SelectItem value="technical_support">Technical Support</SelectItem>
                              <SelectItem value="general">General Inquiry</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brief description of your inquiry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Please provide details about your requirements, quantities, timeline, or any specific questions..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitInquiryMutation.isPending}
                  >
                    {submitInquiryMutation.isPending ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}