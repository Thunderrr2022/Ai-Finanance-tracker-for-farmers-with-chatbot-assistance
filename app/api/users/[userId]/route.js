import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req, context) {
  try {
    // In Next.js 15, params must be accessed through context.params
    const params = context.params;
    
    // Use the new approach to access dynamic route parameters
    const userId = params.userId;
    
    // Using getAuth to get the authenticated user ID
    const auth = getAuth(req);
    const authUserId = auth?.userId || null;
    
    // For development, allow access without authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!isDev && (!authUserId || authUserId !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Find the user in the database
      const dbUser = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: {
          transactions: {
            orderBy: { date: "desc" },
            take: 100, // Limit to recent transactions
          },
          accounts: true,
          budgets: true,
        },
      });

      if (!dbUser) {
        // Create mock data for development or if user not found
        if (isDev) {
          return NextResponse.json({
            id: "mock_user_id",
            clerkUserId: userId,
            name: "Test Farmer",
            email: "farmer@example.com",
            accounts: [
              { 
                id: "mock_account_1", 
                name: "Farm Account", 
                balance: "15000.00", 
                type: "CHECKING"
              }
            ],
            budgets: [
              {
                id: "mock_budget_1",
                name: "Farm Budget 2023",
                amount: "12000.00",
              }
            ],
            transactions: Array(10).fill(0).map((_, i) => ({
              id: `mock_tx_${i}`,
              description: i % 2 === 0 ? "Seed Purchase" : "Equipment Rental",
              amount: (i % 2 === 0 ? "-250.00" : "-450.00"),
              date: new Date(Date.now() - (i * 86400000)).toISOString(),
              type: "EXPENSE",
              category: i % 2 === 0 ? "SUPPLIES" : "EQUIPMENT",
            })),
          });
        }
        
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(dbUser);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Error retrieving user data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in user API route:", error);
    return NextResponse.json(
      { error: "Error fetching user data" },
      { status: 500 }
    );
  }
} 