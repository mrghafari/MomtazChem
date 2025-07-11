import { type Express, Request, Response } from "express";
import { ticketStorage } from "./ticket-storage";
import { insertTicketSchema, insertTicketCategorySchema, insertTicketCommentSchema } from "@shared/ticket-schema";
// Authentication middleware function
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.adminId || !req.session.isAuthenticated) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  next();
};
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";

// Create ticket uploads directory
const ticketUploadsDir = path.join(process.cwd(), 'uploads', 'tickets');
if (!fs.existsSync(ticketUploadsDir)) {
  fs.mkdirSync(ticketUploadsDir, { recursive: true });
}

// Multer configuration for ticket attachments
const ticketFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ticketUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `ticket-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadTicketFiles = multer({
  storage: ticketFileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed types: JPG, PNG, GIF, PDF, DOC, DOCX, TXT'));
    }
  }
});

// Email notification function
async function sendTicketNotification(ticket: any, type: 'new' | 'updated' | 'commented') {
  try {
    const settings = await ticketStorage.getTicketSettings();
    
    if (!settings?.enableEmailNotifications || !settings?.adminNotificationEmail) {
      return;
    }

    // Create transporter (use existing email configuration)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "mail.momtazchem.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let subject = '';
    let html = '';

    switch (type) {
      case 'new':
        subject = `تیکت جدید: ${ticket.title} (${ticket.ticketNumber})`;
        html = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>تیکت جدید دریافت شد</h2>
            <p><strong>شماره تیکت:</strong> ${ticket.ticketNumber}</p>
            <p><strong>عنوان:</strong> ${ticket.title}</p>
            <p><strong>اولویت:</strong> ${ticket.priority}</p>
            <p><strong>گزارش‌دهنده:</strong> ${ticket.reporterName} (${ticket.reporterEmail})</p>
            <p><strong>توضیحات:</strong></p>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
              ${ticket.description}
            </div>
            <p><small>برای مشاهده و پاسخ به تیکت وارد پنل مدیریت شوید.</small></p>
          </div>
        `;
        break;
      case 'updated':
        subject = `تیکت به‌روزرسانی شد: ${ticket.title} (${ticket.ticketNumber})`;
        html = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>تیکت به‌روزرسانی شد</h2>
            <p><strong>شماره تیکت:</strong> ${ticket.ticketNumber}</p>
            <p><strong>عنوان:</strong> ${ticket.title}</p>
            <p><strong>وضعیت جدید:</strong> ${ticket.status}</p>
            <p><small>برای مشاهده جزئیات وارد پنل مدیریت شوید.</small></p>
          </div>
        `;
        break;
      case 'commented':
        subject = `پاسخ جدید به تیکت: ${ticket.title} (${ticket.ticketNumber})`;
        html = `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>پاسخ جدید به تیکت</h2>
            <p><strong>شماره تیکت:</strong> ${ticket.ticketNumber}</p>
            <p><strong>عنوان:</strong> ${ticket.title}</p>
            <p><small>برای مشاهده پاسخ جدید وارد پنل مدیریت شوید.</small></p>
          </div>
        `;
        break;
    }

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: settings.adminNotificationEmail,
      subject,
      html,
    });

  } catch (error) {
    console.error('Error sending ticket notification:', error);
  }
}

export function registerTicketRoutes(app: Express) {
  
  // Get all tickets (admin only)
  app.get("/api/tickets", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const category = req.query.category as string;
      const search = req.query.search as string;

      let tickets;
      
      if (search) {
        tickets = await ticketStorage.searchTickets(search);
      } else if (status) {
        tickets = await ticketStorage.getTicketsByStatus(status);
      } else if (category) {
        tickets = await ticketStorage.getTicketsByCategory(parseInt(category));
      } else {
        tickets = await ticketStorage.getTickets(limit, offset);
      }

      res.json({ success: true, data: tickets });
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ success: false, message: "Failed to fetch tickets" });
    }
  });

  // Get single ticket
  app.get("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await ticketStorage.getTicketById(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      // Get comments
      const comments = await ticketStorage.getTicketComments(ticketId);
      
      res.json({ 
        success: true, 
        data: { 
          ...ticket, 
          comments 
        } 
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ success: false, message: "Failed to fetch ticket" });
    }
  });

  // Create new ticket
  app.post("/api/tickets", requireAuth, uploadTicketFiles.array('attachments', 5), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      
      // Process attachments
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          attachments.push({
            filename: file.originalname,
            path: `/uploads/tickets/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      }

      const ticketData = {
        ...validatedData,
        attachments: JSON.stringify(attachments),
        ticketNumber: await ticketStorage.generateTicketNumber(),
      };

      const ticket = await ticketStorage.createTicket(ticketData);
      
      // Send notification
      await sendTicketNotification(ticket, 'new');
      
      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ success: false, message: "Failed to create ticket" });
    }
  });

  // Update ticket
  app.put("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updateData = req.body;

      // Handle status changes
      if (updateData.status === 'resolved' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (updateData.status === 'closed' && !updateData.closedAt) {
        updateData.closedAt = new Date();
      }

      const ticket = await ticketStorage.updateTicket(ticketId, updateData);
      
      // Send notification for status changes
      if (updateData.status) {
        await sendTicketNotification(ticket, 'updated');
      }
      
      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ success: false, message: "Failed to update ticket" });
    }
  });

  // Add comment to ticket
  app.post("/api/tickets/:id/comments", requireAuth, uploadTicketFiles.array('attachments', 3), async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { comment, isInternal = false } = req.body;
      
      // Process attachments
      const attachments = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          attachments.push({
            filename: file.originalname,
            path: `/uploads/tickets/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      }

      const commentData = {
        ticketId,
        authorEmail: req.session.adminEmail || "admin@momtazchem.com",
        authorName: req.session.adminName || "Admin",
        comment,
        isInternal: Boolean(isInternal),
        attachments: JSON.stringify(attachments),
      };

      const newComment = await ticketStorage.createTicketComment(commentData);
      
      // Get ticket for notification
      const ticket = await ticketStorage.getTicketById(ticketId);
      if (ticket) {
        await sendTicketNotification(ticket, 'commented');
      }
      
      res.json({ success: true, data: newComment });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ success: false, message: "Failed to add comment" });
    }
  });

  // Get ticket categories
  app.get("/api/tickets/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const categories = await ticketStorage.getTicketCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
  });

  // Create ticket category
  app.post("/api/tickets/categories", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertTicketCategorySchema.parse(req.body);
      const category = await ticketStorage.createTicketCategory(validatedData);
      res.json({ success: true, data: category });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ success: false, message: "Failed to create category" });
    }
  });

  // Get ticket statistics
  app.get("/api/tickets/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await ticketStorage.getTicketStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      res.status(500).json({ success: false, message: "Failed to fetch statistics" });
    }
  });

  // Get ticket settings
  app.get("/api/tickets/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await ticketStorage.getTicketSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ success: false, message: "Failed to fetch settings" });
    }
  });

  // Update ticket settings
  app.put("/api/tickets/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await ticketStorage.updateTicketSettings(req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ success: false, message: "Failed to update settings" });
    }
  });

  // Delete ticket
  app.delete("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id);
      await ticketStorage.deleteTicket(ticketId);
      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ success: false, message: "Failed to delete ticket" });
    }
  });
}