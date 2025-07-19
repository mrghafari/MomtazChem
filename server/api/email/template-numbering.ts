// Backend API برای مدیریت شماره‌گذاری قالب‌ها
import { Router } from 'express';

export const templateNumberingRouter = Router();

// تنظیم شماره قالب
templateNumberingRouter.put('/templates/:id/number', async (req, res) => {
  try {
    const { id } = req.params;
    const { templateNumber, isNumberLocked } = req.body;

    // بررسی تکراری نبودن شماره
    const existingTemplate = await checkTemplateNumberExists(templateNumber, id);
    if (existingTemplate) {
      return res.status(400).json({ 
        success: false, 
        error: 'شماره قالب تکراری است' 
      });
    }

    // بروزرسانی قالب
    await updateTemplateNumber(id, templateNumber, isNumberLocked);
    
    res.json({ 
      success: true, 
      message: 'شماره قالب با موفقیت تنظیم شد' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'خطا در تنظیم شماره قالب' 
    });
  }
});

// قفل کردن همه شماره‌ها
templateNumberingRouter.post('/templates/lock-all-numbers', async (req, res) => {
  try {
    await lockAllTemplateNumbers();
    
    res.json({ 
      success: true, 
      message: 'همه شماره‌ها قفل شدند' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'خطا در قفل کردن شماره‌ها' 
    });
  }
});

// Helper functions (these would be implemented with actual database calls)
async function checkTemplateNumberExists(templateNumber: string, excludeId: string) {
  // Implementation would check database for existing template number
  return false;
}

async function updateTemplateNumber(id: string, templateNumber: string, isNumberLocked: boolean) {
  // Implementation would update template in database
}

async function lockAllTemplateNumbers() {
  // Implementation would lock all template numbers in database
}