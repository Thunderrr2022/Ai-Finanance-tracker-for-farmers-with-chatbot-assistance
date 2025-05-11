import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper function to safely parse numeric values
const safeParseFloat = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  try {
    return parseFloat(value) || 0;
  } catch (e) {
    return 0;
  }
};

export async function POST(req) {
  try {
    const { location, weatherData, financialData, userName, message } = await req.json();
    
    if (!location || !weatherData || !financialData) {
      return NextResponse.json(
        { error: "Location, weather data, and financial data are required" },
        { status: 400 }
      );
    }

    const accountBalance = safeParseFloat(financialData.accountBalance);
    const budget = safeParseFloat(financialData.budget);
    const loanAmount = safeParseFloat(financialData.loanAmount);
    const name = userName || "farmer";

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set, using fallback crop suggestions");
      return NextResponse.json({ 
        suggestions: `
# Crop Recommendations for ${name} in ${location.city || location.region || "Your Region"}

Based on your location and current weather conditions (${weatherData.weather?.[0]?.main || "Clear"}, ${Math.round(weatherData.main?.temp || 22)}°C), here are my recommendations:

## Your Financial Summary
- Account Balance: $${accountBalance.toFixed(2)}
- Budget Amount: $${budget.toFixed(2)}
- Loan Amount: $${loanAmount.toFixed(2)}

## Top Recommended Crops

1. **Wheat**
   - Estimated cost: $400-600 per acre
   - Expected ROI: 1.5-2x investment
   - Fertilizers: NPK 20-20-20, Urea
   
2. **Soybeans**
   - Estimated cost: $350-500 per acre
   - Expected ROI: 1.3-1.8x investment
   - Fertilizers: Low nitrogen, high phosphorus and potassium
   
3. **Corn/Maize**
   - Estimated cost: $450-700 per acre
   - Expected ROI: 1.4-2.2x investment
   - Fertilizers: Nitrogen-rich, balanced NPK

## Budget Optimization for Your Farm

Hey ${name}, considering your budget of $${budget.toFixed(2)} and account balance of $${accountBalance.toFixed(2)}, here's how I recommend allocating your resources:

### Budget Allocation
- Seeds and planting: 20% ($${Math.round(budget * 0.2)})
- Fertilizers: 15% ($${Math.round(budget * 0.15)})
- Equipment: 30% ($${Math.round(budget * 0.3)})
- Labor: 25% ($${Math.round(budget * 0.25)})
- Reserve: 10% ($${Math.round(budget * 0.1)})

### Cost-Saving Recommendations
- Consider bulk purchasing of fertilizers
- Explore equipment sharing with neighboring farms
- Invest in soil testing to apply fertilizers more efficiently
- Consider crop rotation to reduce pest control expenses
- Look into drought-resistant varieties to save on irrigation
        `
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-001" });

    // Calculate key financial metrics
    const income = safeParseFloat(financialData.income);
    const expenses = safeParseFloat(financialData.expenses);
    const cashFlow = income - expenses;
    const debtToIncome = income > 0 ? (loanAmount / income * 100) : 0;
    
    // Determine farming investment amount (budget or balance-based)
    const farmingBudget = Math.max(budget, accountBalance * 0.7);

    const fullPrompt = `
You are an expert agricultural advisor with knowledge of farming practices, crops, and financial management.
Address the user as ${name} and use this name occasionally in your responses to personalize your advice.

Provide crop recommendations and financial advice based on the following information:

User Information:
- Name: ${name}
- Query: "${message}"
- Account Balance: $${accountBalance.toFixed(2)}
- Budget Amount: $${budget.toFixed(2)}
- Loan Amount: $${loanAmount.toFixed(2)}
- Available for Farm Investment: $${farmingBudget.toFixed(2)}

Location: ${location.city || location.region || location.country || "Unknown"}
Weather Conditions: 
- Temperature: ${weatherData.main?.temp || "Unknown"} °C
- Humidity: ${weatherData.main?.humidity || "Unknown"}%
- Weather: ${weatherData.weather?.[0]?.main || "Unknown"} (${weatherData.weather?.[0]?.description || "Unknown"})

Financial Situation:
- Current Expenses: $${expenses.toFixed(2)}
- Current Income: $${income.toFixed(2)}
- Cash Flow: $${cashFlow.toFixed(2)}
- Debt-to-Income Ratio: ${debtToIncome.toFixed(2)}%

Based on this information, please provide:
1. Top 3 recommended crops suitable for ${name}'s location and current weather conditions
2. Estimated cost of growing each recommended crop per acre
3. Expected return on investment for each crop
4. Specific fertilizers and products to use for each crop
5. Products or expenses that could be reduced or eliminated to optimize budget
6. Detailed budget allocation recommendations using the budget amount of $${budget.toFixed(2)}
7. Advice on how much of the account balance ($${accountBalance.toFixed(2)}) should be invested in farming

Address ${name} by name occasionally. Format your response in clear sections with bullet points where appropriate.
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ suggestions: text });
  } catch (error) {
    console.error("Crop suggestion API error:", error);
    // Provide static fallback data in case of error
    return NextResponse.json({ 
      suggestions: `
# Farm Budget and Crop Recommendations

## Recommended Crops
1. Corn/Maize - Low water requirement, good for most climates
2. Soybeans - Nitrogen-fixing, good for soil health
3. Wheat - Drought-resistant, reliable yield

## Budget Allocation Suggestions
* Seeds: 15-20% of budget
* Fertilizer: 15-20% of budget
* Equipment: 30-35% of budget
* Labor: 20% of budget
* Reserve: 10-15% of budget

## Cost Reduction Tips
* Consider equipment sharing or renting instead of buying
* Use organic fertilizers where possible
* Implement crop rotation to reduce pest control costs
* Focus on water conservation techniques
      `
    });
  }
} 