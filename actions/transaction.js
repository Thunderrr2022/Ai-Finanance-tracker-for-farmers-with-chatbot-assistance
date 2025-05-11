"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Helper function to check if a date is in a new month
function isNewMonth(date1, date2) {
  return (
    date1.getMonth() !== date2.getMonth() ||
    date1.getFullYear() !== date2.getFullYear()
  );
}

// Helper function to check budget alerts
async function checkBudgetAlert(userId, accountId, amount) {
  try {
    // Get user's budget and user data
    const [budget, user] = await Promise.all([
      db.budget.findUnique({
        where: { userId },
      }),
      db.user.findUnique({
        where: { id: userId },
      }),
    ]);

    if (!budget || !user) {
      return;
    }

    // Get current month's expenses
    const startDate = new Date();
    startDate.setDate(1); // Start of current month

    const expenses = await db.transaction.aggregate({
      where: {
        userId,
        accountId,
        type: "EXPENSE",
        date: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const budgetAmount = budget.amount.toNumber();
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    // Get top spending categories
    const categoryExpenses = await db.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        accountId,
        type: "EXPENSE",
        date: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 3,
    });

    // Calculate remaining budget and days
    const remainingBudget = budgetAmount - totalExpenses;
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    const dailyBudget = budgetAmount / daysInMonth;
    const projectedExpenses = totalExpenses + (dailyBudget * daysRemaining);
    const projectedPercentage = (projectedExpenses / budgetAmount) * 100;

    // Check if we should send an alert
    const shouldSendAlert = (
      // Send alert if budget is 80% used
      (percentageUsed >= 80 && percentageUsed < 100) ||
      // Send alert if projected to exceed budget
      (projectedPercentage >= 100 && percentageUsed < 100) ||
      // Send alert if budget is exceeded
      (percentageUsed >= 100)
    );

    if (shouldSendAlert && (!budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date()))) {
      const alertType = percentageUsed >= 100 
        ? "budget-exceeded" 
        : projectedPercentage >= 100 
          ? "budget-projection" 
          : "budget-warning";

      // Get account name
      const account = await db.account.findUnique({
        where: { id: accountId },
      });

      // Send email alert
      const emailResult = await sendEmail({
        to: user.email,
        subject: `Budget Alert: ${alertType === "budget-exceeded" ? "Budget Exceeded" : "Budget Warning"}`,
        react: EmailTemplate({
          userName: user.name || "User",
          type: "budget-alert",
          data: {
            percentageUsed,
            budgetAmount: budgetAmount.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            remainingBudget: remainingBudget.toFixed(2),
            daysRemaining,
            projectedExpenses: projectedExpenses.toFixed(2),
            projectedPercentage: projectedPercentage.toFixed(1),
            accountName: account?.name || "Default Account",
            topCategories: categoryExpenses.map(cat => ({
              name: cat.category,
              amount: cat._sum.amount.toFixed(2),
              percentage: ((cat._sum.amount.toNumber() / totalExpenses) * 100).toFixed(1)
            })),
            alertType
          },
        }),
      });

      if (emailResult.success) {
        // Update last alert sent
        await db.budget.update({
          where: { id: budget.id },
          data: { lastAlertSent: new Date() },
        });
      }
    }
  } catch (error) {
    console.error("Error in checkBudgetAlert:", error);
  }
}

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    // Check budget alert if this is an expense
    if (data.type === "EXPENSE") {
      await checkBudgetAlert(user.id, data.accountId, data.amount);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: error.message };
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    // Check budget alert if this is an expense
    if (data.type === "EXPENSE") {
      await checkBudgetAlert(user.id, data.accountId, data.amount);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);
    revalidatePath("/api/budget");

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
