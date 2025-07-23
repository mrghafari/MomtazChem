import { eq, and, desc } from "drizzle-orm";
import { customerDb } from "./customer-db.js";
import { customerAddresses, type InsertCustomerAddress, type CustomerAddress } from "@shared/schema";

export interface ICustomerAddressStorage {
  // Address management
  createAddress(addressData: InsertCustomerAddress): Promise<CustomerAddress>;
  getCustomerAddresses(customerId: number): Promise<CustomerAddress[]>;
  getAddressById(addressId: number): Promise<CustomerAddress | undefined>;
  updateAddress(addressId: number, addressData: Partial<InsertCustomerAddress>): Promise<CustomerAddress>;
  deleteAddress(addressId: number): Promise<void>;
  setDefaultAddress(customerId: number, addressId: number): Promise<void>;
}

export class CustomerAddressStorage implements ICustomerAddressStorage {
  async createAddress(addressData: InsertCustomerAddress): Promise<CustomerAddress> {
    try {
      const [newAddress] = await customerDb
        .insert(customerAddresses)
        .values(addressData)
        .returning();
      
      return newAddress;
    } catch (error) {
      console.error('Error creating customer address:', error);
      throw new Error('خطا در ایجاد آدرس جدید');
    }
  }

  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    try {
      const addresses = await customerDb
        .select()
        .from(customerAddresses)
        .where(eq(customerAddresses.customerId, customerId))
        .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
      
      return addresses;
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      throw new Error('خطا در دریافت آدرس‌های مشتری');
    }
  }

  async getAddressById(addressId: number): Promise<CustomerAddress | undefined> {
    try {
      const [address] = await customerDb
        .select()
        .from(customerAddresses)
        .where(eq(customerAddresses.id, addressId))
        .limit(1);
      
      return address;
    } catch (error) {
      console.error('Error fetching address by ID:', error);
      throw new Error('خطا در دریافت آدرس');
    }
  }

  async updateAddress(addressId: number, addressData: Partial<InsertCustomerAddress>): Promise<CustomerAddress> {
    try {
      const [updatedAddress] = await customerDb
        .update(customerAddresses)
        .set({ ...addressData, updatedAt: new Date() })
        .where(eq(customerAddresses.id, addressId))
        .returning();
      
      if (!updatedAddress) {
        throw new Error('آدرس یافت نشد');
      }
      
      return updatedAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('خطا در بروزرسانی آدرس');
    }
  }

  async deleteAddress(addressId: number): Promise<void> {
    try {
      await customerDb
        .delete(customerAddresses)
        .where(eq(customerAddresses.id, addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
      throw new Error('خطا در حذف آدرس');
    }
  }

  async setDefaultAddress(customerId: number, addressId: number): Promise<void> {
    try {
      // First, unset all default addresses for this customer
      await customerDb
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
      
      // Then set the specified address as default
      await customerDb
        .update(customerAddresses)
        .set({ isDefault: true })
        .where(and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId)
        ));
    } catch (error) {
      console.error('Error setting default address:', error);
      throw new Error('خطا در تنظیم آدرس پیش‌فرض');
    }
  }
}

export const customerAddressStorage = new CustomerAddressStorage();