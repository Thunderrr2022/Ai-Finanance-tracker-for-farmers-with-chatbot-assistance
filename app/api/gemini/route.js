import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to safely parse numeric values
function safeParseFloat(value) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

export async function POST(request) {
  // Get required API_KEY from environment variables
  const API_KEY = process.env.GEMINI_API_KEY;
  
  // Log key state for debugging (don't log the actual key)
  console.log("Gemini API Key status:", API_KEY ? "Present" : "Missing");
  
  if (!API_KEY) {
    console.warn("Missing GEMINI_API_KEY environment variable");
    // Return a fallback response for development
    return NextResponse.json({ 
      text: "I'm in development mode without an API key. Here's some general farming advice: Start with crops suited to your region, allocate your budget carefully (40% seeds, 30% fertilizer, 20% equipment, 10% reserve), and consider both immediate returns and long-term sustainability."
    });
  }
  
  try {
    const { prompt, userName = "farmer", financialData = {}, clerkUserId } = await request.json();
    
    let userData = null;
    
    // If clerkUserId is provided, try to fetch real user data
    if (clerkUserId && clerkUserId !== "default-user") {
      userData = await prisma.user.findUnique({
        where: { clerkUserId },
        include: {
          transactions: true,
          budgets: true,
          accounts: true,
        },
      });

      if (!userData) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      }
    }

    // Safely parse financial data values
    const income = userData ? userData.transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + safeParseFloat(t.amount), 0) : safeParseFloat(financialData.income);

    const expenses = userData ? userData.transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + safeParseFloat(t.amount), 0) : safeParseFloat(financialData.expenses);

    const budget = userData && userData.budgets.length > 0 
      ? safeParseFloat(userData.budgets[0].amount)
      : safeParseFloat(financialData.budget);
      
    const loanAmount = safeParseFloat(financialData.loanAmount) || budget || 50000;
    const accountBalance = safeParseFloat(financialData.accountBalance);
    const name = userName || (userData?.name || "farmer");

    // Format numbers for display
    const formattedIncome = income.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    const formattedExpenses = expenses.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    const formattedBudget = budget.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    const formattedLoanAmount = loanAmount.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    const formattedAccountBalance = accountBalance.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    
    // Calculate farm-specific financial metrics
    const farmingBudget = Math.min(loanAmount, budget > 0 ? budget : loanAmount);
    const savingsRatio = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const formattedFarmingBudget = farmingBudget.toLocaleString('en-US', {style: 'currency', currency: 'USD'});
    const formattedSavingsRatio = savingsRatio.toFixed(1) + '%';
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(API_KEY);
    const geminiModel = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    // Construct a detailed prompt with user's financial data
    const detailedPrompt = `
      You are a helpful farm assistant talking to "${name}". You should respond in a friendly, conversational way like you're chatting with a neighbor.
      
      User's Financial Information:
      - Income: ${formattedIncome}
      - Expenses: ${formattedExpenses}
      - Current Budget: ${formattedBudget}
      - Loan Amount: ${formattedLoanAmount} (this is a loan the user is considering)
      - Account Balance: ${formattedAccountBalance}
      - Farming Budget: ${formattedFarmingBudget}
      - Savings Ratio: ${formattedSavingsRatio}
      
      The user is a farmer seeking advice. Keep your responses:
      1. Conversational and friendly - speak like a helpful neighbor, not a formal advisor
      2. Brief and to the point - farmers are busy people
      3. Practical - recommend specific tools, fertilizers, or crops with approximate costs
      4. Action-oriented - give clear next steps
      
      When recommending products, suggest specific brands, models, and approximate prices.
      For example, say things like "You might want to look up the John Deere 1023E compact tractor (~$15,000) or the more affordable Kubota BX1880 (~$10,000)."
      
      For fertilizers, mention both organic options (like "Harris Premium Organic Plant Food at around $20/bag") and conventional options (like "Miracle-Gro All Purpose at around $15/bag").
      
      When suggesting products, help them know what to search for online, mentioning popular retailers like Amazon, Home Depot, Tractor Supply Co. or farm supply websites.
      
      Respond to: "${prompt}"
    `;
    
    try {
      // Try with Gemini 1.5 Pro first
      let result;
      try {
        result = await geminiModel.generateContent(detailedPrompt);
      } catch (modelError) {
        // If Gemini 1.5 Pro fails, try with Gemini Pro
        console.warn("Gemini 1.5 Pro failed, trying Gemini Pro:", modelError.message);
        
        // Try with Gemini Pro as fallback
        const fallbackModel = genAI.getGenerativeModel({ 
          model: "gemini-pro",
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        });
        
        try {
          result = await fallbackModel.generateContent(detailedPrompt);
        } catch (fallbackError) {
          // Both models failed, throw error to trigger fallback response
          console.error("Both Gemini models failed:", fallbackError.message);
          throw fallbackError;
        }
      }
      
      const response = await result.response;
      const text = response.text();
      
      // Return the generated response
      return NextResponse.json({ text });
    } catch (modelError) {
      console.error("Gemini model error:", modelError);
      
      // Provide topic-specific fallback responses based on the prompt
      let fallbackResponse = "I couldn't connect to my AI service, but I can still help with some general advice. ";
      
      if (prompt.toLowerCase().includes("crop")) {
        fallbackResponse += `${userName}, for your farming budget of ${formattedFarmingBudget}, focus on crops with reliable yields in your local area. Consider starting with staple crops that have steady market demand.`;
      } else if (prompt.toLowerCase().includes("fertilizer")) {
        fallbackResponse += `With your budget of ${formattedFarmingBudget}, here are some fertilizer recommendations:

**Organic Options:**

• Dr. Earth Organic Fertilizer ($15-25): Organic All Purpose
  https://www.amazon.com/Dr-Earth-Premium-Purpose-Fertilizer/dp/B003QB156K/
  
• Espoma Organic Garden-Tone ($20-30): Organic Plant Food
  https://www.homedepot.com/p/Espoma-18-lb-Garden-Tone-Herb-and-Vegetable-Food-100047170/203633149

**Conventional Options:**

• Miracle-Gro All Purpose ($15-25): NPK 24-8-16
  https://www.walmart.com/ip/Miracle-Gro-All-Purpose-Plant-Food-Plant-Fertilizer-5-lb/16888880
  
• Peters 20-20-20 Fertilizer ($15-35): Balanced NPK
  https://www.amazon.com/Peters-Professional-Purpose-Fertilizer-Fertilizers/dp/B01N20V3O7/

For cost efficiency, consider mixing commercial fertilizers with organic options like compost. The right balance will depend on your specific crops and soil conditions.`;
      } else if (prompt.toLowerCase().includes("loan") || prompt.toLowerCase().includes("budget")) {
        fallbackResponse += `For your ${formattedLoanAmount} loan, create a detailed spending plan. Typically, allocate 40% to seeds, 30% to fertilizers, 20% to equipment, and keep 10% as reserve for unexpected expenses.`;
      } else if (prompt.toLowerCase().includes("tool") || prompt.toLowerCase().includes("equipment")) {
        const budgetLevel = loanAmount < 5000 ? "low" : (loanAmount < 15000 ? "medium" : "high");
        
        if (budgetLevel === "low") {
          fallbackResponse += `With your ${formattedFarmingBudget} budget, focus on essential hand tools:
          
• Garden hoe ($20-40) for weeding and soil prep: https://www.tractorsupply.com/tsc/product/groundwork-garden-hoe
• Shovel ($25-50) for digging and transplanting: https://www.homedepot.com/p/CRAFTSMAN-Fiberglass-Handle-Digging-Shovel-CMXMTLSG0009/304412762
• Rake ($15-30) for soil preparation: https://www.lowes.com/pd/Kobalt-Garden-Bow-Rake-with-Fiberglass-Handle/1000377511
• Hand pruners ($15-30) for harvesting: https://www.amazon.com/Fiskars-91095935J-Softgrip-Bypass-Pruner/dp/B00004SD76/

Look at hardware stores like Home Depot or farm supply stores for budget options.`;
        } else if (budgetLevel === "medium") {
          fallbackResponse += `Your ${formattedFarmingBudget} budget allows for both basic hand tools and some intermediate equipment:
          
• Wheelbarrow ($80-120) for moving materials: https://www.ruralking.com/true-temper-6-cu-ft-steel-wheelbarrow-with-flat-free-tire
• Garden tiller ($200-500) for soil preparation: https://www.tractorsupply.com/tsc/product/yard-machines-208cc-21-in-front-tine-tiller-21aa40m1000
• Drip irrigation system ($50-200) for efficient watering: https://www.amazon.com/Raindrip-R560DP-Automatic-Container-Hanging/dp/B00J2NRSIQ/

In addition to the essential hand tools mentioned above.`;
        } else {
          fallbackResponse += `With your substantial ${formattedFarmingBudget} budget, you can invest in labor-saving equipment:
          
• Small tractor ($1,500+) for larger plot cultivation: https://www.deere.com/en/tractors/compact-tractors/1-series-sub-compact-tractors/
• Rotary cultivator ($300-800) for weed control: https://www.northerntool.com/shop/tools/product_200631482_200631482
• Quality sprayer system ($100-400) for pest control: https://www.ruralking.com/northstar-31-gallon-tow-behind-boom-broadcast-sprayer

Along with all the essential hand tools.`;
        }
      } else {
        fallbackResponse += `For your farming operation with a budget of ${formattedFarmingBudget}, focus on careful planning, soil preparation, and selecting appropriate seeds and fertilizers for your region.`;
      }
      
      return NextResponse.json({ text: fallbackResponse });
    }
    
  } catch (error) {
    console.error("Error in Gemini API:", error);
    
    // Return a more helpful error response
    return NextResponse.json(
      { text: "I'm experiencing technical difficulties right now. In the meantime, here's some general farm financial advice: Diversify your crops, keep detailed records of expenses, and build relationships with local buyers. I'll be fully operational again soon." },
      { status: 200 } // Return 200 instead of 500 to avoid triggering client-side errors
    );
  }
}
