import { customerDb } from "./customer-db";
import { 
  customerWallets, 
  walletTransactions, 
  walletRechargeRequests,
  type CustomerWallet,
  type InsertCustomerWallet,
  type WalletTransaction,
  type InsertWalletTransaction,
  type WalletRechargeRequest,
  type InsertWalletRechargeRequest
} from "@shared/customer-schema";
import { eq, desc, sum, and } from "drizzle-orm";

export interface IWalletStorage {
  // Wallet management
  createWallet(walletData: InsertCustomerWallet): Promise<CustomerWallet>;
  getWalletByCustomerId(customerId: number): Promise<CustomerWallet | undefined>;
  updateWalletBalance(walletId: number, newBalance: number): Promise<CustomerWallet>;
  getWalletBalance(customerId: number): Promise<number>;
  
  // Transaction management
  createTransaction(transactionData: InsertWalletTransaction): Promise<WalletTransaction>;
  getTransactionsByWallet(walletId: number, limit?: number): Promise<WalletTransaction[]>;
  getTransactionsByCustomer(customerId: number, limit?: number): Promise<WalletTransaction[]>;
  getTransactionById(transactionId: number): Promise<WalletTransaction | undefined>;
  
  // Credit/Debit operations
  creditWallet(customerId: number, amount: number, description: string, referenceType?: string, referenceId?: number, processedBy?: number): Promise<WalletTransaction>;
  debitWallet(customerId: number, amount: number, description: string, referenceType?: string, referenceId?: number, processedBy?: number): Promise<WalletTransaction>;
  
  // Recharge requests
  createRechargeRequest(requestData: InsertWalletRechargeRequest): Promise<WalletRechargeRequest>;
  getRechargeRequestById(requestId: number): Promise<WalletRechargeRequest | undefined>;
  getRechargeRequestsByCustomer(customerId: number): Promise<WalletRechargeRequest[]>;
  getAllPendingRechargeRequests(): Promise<WalletRechargeRequest[]>;
  updateRechargeRequestStatus(requestId: number, status: string, adminNotes?: string, approvedBy?: number): Promise<WalletRechargeRequest>;
  processRechargeRequest(requestId: number, approvedBy: number): Promise<{ request: WalletRechargeRequest; transaction: WalletTransaction }>;
  
  // Analytics and reporting
  getWalletStatistics(): Promise<{
    totalWallets: number;
    totalBalance: number;
    activeWallets: number;
    pendingRecharges: number;
    totalTransactions: number;
  }>;
  
  getCustomerWalletSummary(customerId: number): Promise<{
    wallet: CustomerWallet | undefined;
    recentTransactions: WalletTransaction[];
    pendingRecharges: WalletRechargeRequest[];
    totalSpent: number;
    totalRecharged: number;
  }>;
}

export class WalletStorage implements IWalletStorage {
  // Wallet management
  async createWallet(walletData: InsertCustomerWallet): Promise<CustomerWallet> {
    const [wallet] = await customerDb
      .insert(customerWallets)
      .values(walletData)
      .returning();
    return wallet;
  }

  async getWalletByCustomerId(customerId: number): Promise<CustomerWallet | undefined> {
    const [wallet] = await customerDb
      .select()
      .from(customerWallets)
      .where(eq(customerWallets.customerId, customerId));
    return wallet;
  }

  async updateWalletBalance(walletId: number, newBalance: number): Promise<CustomerWallet> {
    const [wallet] = await customerDb
      .update(customerWallets)
      .set({ 
        balance: newBalance.toString(),
        lastActivityDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(customerWallets.id, walletId))
      .returning();
    return wallet;
  }

  async getWalletBalance(customerId: number): Promise<number> {
    const wallet = await this.getWalletByCustomerId(customerId);
    return wallet ? parseFloat(wallet.balance) : 0;
  }

  // Transaction management
  async createTransaction(transactionData: InsertWalletTransaction): Promise<WalletTransaction> {
    const [transaction] = await customerDb
      .insert(walletTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getTransactionsByWallet(walletId: number, limit: number = 50): Promise<WalletTransaction[]> {
    return await customerDb
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, walletId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async getTransactionsByCustomer(customerId: number, limit: number = 50): Promise<WalletTransaction[]> {
    return await customerDb
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.customerId, customerId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  async getTransactionById(transactionId: number): Promise<WalletTransaction | undefined> {
    const [transaction] = await customerDb
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, transactionId));
    return transaction;
  }

  // Credit/Debit operations
  async creditWallet(
    customerId: number, 
    amount: number, 
    description: string, 
    referenceType?: string, 
    referenceId?: number,
    processedBy?: number
  ): Promise<WalletTransaction> {
    // Get or create wallet
    let wallet = await this.getWalletByCustomerId(customerId);
    if (!wallet) {
      wallet = await this.createWallet({
        customerId,
        balance: "0",
        currency: "IQD",
        status: "active"
      });
    }

    const currentBalance = parseFloat(wallet.balance);
    const newBalance = currentBalance + amount;

    // Create transaction record
    const transaction = await this.createTransaction({
      walletId: wallet.id,
      customerId,
      transactionType: "credit",
      amount: amount.toString(),
      currency: wallet.currency,
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString(),
      description,
      referenceType,
      referenceId,
      status: "completed",
      processedBy
    });

    // Update wallet balance
    await this.updateWalletBalance(wallet.id, newBalance);

    return transaction;
  }

  async debitWallet(
    customerId: number, 
    amount: number, 
    description: string, 
    referenceType?: string, 
    referenceId?: number,
    processedBy?: number
  ): Promise<WalletTransaction> {
    const wallet = await this.getWalletByCustomerId(customerId);
    if (!wallet) {
      throw new Error("Customer wallet not found");
    }

    const currentBalance = parseFloat(wallet.balance);
    const creditLimit = parseFloat(wallet.creditLimit || "0");
    const availableAmount = currentBalance + creditLimit;

    if (amount > availableAmount) {
      throw new Error(`Insufficient funds. Available: ${availableAmount}, Required: ${amount}`);
    }

    const newBalance = currentBalance - amount;

    // Create transaction record
    const transaction = await this.createTransaction({
      walletId: wallet.id,
      customerId,
      transactionType: "debit",
      amount: amount.toString(),
      currency: wallet.currency,
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString(),
      description,
      referenceType,
      referenceId,
      status: "completed",
      processedBy
    });

    // Update wallet balance
    await this.updateWalletBalance(wallet.id, newBalance);

    return transaction;
  }

  // Recharge requests
  async createRechargeRequest(requestData: InsertWalletRechargeRequest): Promise<WalletRechargeRequest> {
    // Generate unique request number
    const requestNumber = `WR${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const [request] = await customerDb
      .insert(walletRechargeRequests)
      .values({
        ...requestData,
        requestNumber
      })
      .returning();
    return request;
  }

  async getRechargeRequestById(requestId: number): Promise<WalletRechargeRequest | undefined> {
    const [request] = await customerDb
      .select()
      .from(walletRechargeRequests)
      .where(eq(walletRechargeRequests.id, requestId));
    return request;
  }

  async getRechargeRequestsByCustomer(customerId: number): Promise<WalletRechargeRequest[]> {
    return await customerDb
      .select()
      .from(walletRechargeRequests)
      .where(eq(walletRechargeRequests.customerId, customerId))
      .orderBy(desc(walletRechargeRequests.createdAt));
  }

  async getAllPendingRechargeRequests(): Promise<WalletRechargeRequest[]> {
    return await customerDb
      .select()
      .from(walletRechargeRequests)
      .where(eq(walletRechargeRequests.status, "pending"))
      .orderBy(desc(walletRechargeRequests.createdAt));
  }

  async updateRechargeRequestStatus(
    requestId: number, 
    status: string, 
    adminNotes?: string, 
    approvedBy?: number
  ): Promise<WalletRechargeRequest> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (adminNotes) updateData.adminNotes = adminNotes;
    if (approvedBy) updateData.approvedBy = approvedBy;
    if (status === "approved") updateData.approvedAt = new Date();
    if (status === "completed") updateData.processedAt = new Date();

    const [request] = await customerDb
      .update(walletRechargeRequests)
      .set(updateData)
      .where(eq(walletRechargeRequests.id, requestId))
      .returning();
    return request;
  }

  async processRechargeRequest(
    requestId: number, 
    approvedBy: number
  ): Promise<{ request: WalletRechargeRequest; transaction: WalletTransaction }> {
    const request = await this.getRechargeRequestById(requestId);
    if (!request) {
      throw new Error("Recharge request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Recharge request is not pending");
    }

    // Credit the wallet
    const transaction = await this.creditWallet(
      request.customerId,
      parseFloat(request.amount),
      `Wallet recharge - Request #${request.requestNumber}`,
      "recharge_request",
      request.id,
      approvedBy
    );

    // Update request status
    const updatedRequest = await this.updateRechargeRequestStatus(
      requestId,
      "completed",
      `Processed by admin ID: ${approvedBy}`,
      approvedBy
    );

    return { request: updatedRequest, transaction };
  }

  // Analytics and reporting
  async getWalletStatistics(): Promise<{
    totalWallets: number;
    totalBalance: number;
    activeWallets: number;
    pendingRecharges: number;
    totalTransactions: number;
  }> {
    const [walletsCount] = await customerDb
      .select({ count: sum(customerWallets.id) })
      .from(customerWallets);

    const [activeWalletsCount] = await customerDb
      .select({ count: sum(customerWallets.id) })
      .from(customerWallets)
      .where(eq(customerWallets.status, "active"));

    const [totalBalanceResult] = await customerDb
      .select({ total: sum(customerWallets.balance) })
      .from(customerWallets);

    const [pendingRechargesCount] = await customerDb
      .select({ count: sum(walletRechargeRequests.id) })
      .from(walletRechargeRequests)
      .where(eq(walletRechargeRequests.status, "pending"));

    const [transactionsCount] = await customerDb
      .select({ count: sum(walletTransactions.id) })
      .from(walletTransactions);

    return {
      totalWallets: Number(walletsCount?.count || 0),
      totalBalance: parseFloat(totalBalanceResult?.total || "0"),
      activeWallets: Number(activeWalletsCount?.count || 0),
      pendingRecharges: Number(pendingRechargesCount?.count || 0),
      totalTransactions: Number(transactionsCount?.count || 0)
    };
  }

  async getCustomerWalletSummary(customerId: number): Promise<{
    wallet: CustomerWallet | undefined;
    recentTransactions: WalletTransaction[];
    pendingRecharges: WalletRechargeRequest[];
    totalSpent: number;
    totalRecharged: number;
  }> {
    const wallet = await this.getWalletByCustomerId(customerId);
    const recentTransactions = await this.getTransactionsByCustomer(customerId, 10);
    const pendingRecharges = await customerDb
      .select()
      .from(walletRechargeRequests)
      .where(and(
        eq(walletRechargeRequests.customerId, customerId),
        eq(walletRechargeRequests.status, "pending")
      ));

    // Calculate totals
    const [spentResult] = await customerDb
      .select({ total: sum(walletTransactions.amount) })
      .from(walletTransactions)
      .where(and(
        eq(walletTransactions.customerId, customerId),
        eq(walletTransactions.transactionType, "debit")
      ));

    const [rechargedResult] = await customerDb
      .select({ total: sum(walletTransactions.amount) })
      .from(walletTransactions)
      .where(and(
        eq(walletTransactions.customerId, customerId),
        eq(walletTransactions.transactionType, "credit")
      ));

    return {
      wallet,
      recentTransactions,
      pendingRecharges,
      totalSpent: parseFloat(spentResult?.total || "0"),
      totalRecharged: parseFloat(rechargedResult?.total || "0")
    };
  }
}

export const walletStorage = new WalletStorage();