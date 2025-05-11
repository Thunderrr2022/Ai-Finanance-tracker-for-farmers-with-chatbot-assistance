// app/api/gpt4/route.js

import fetch from "node-fetch";

export async function POST(req) {
  try {
    const { prompt, financialData } = await req.json();

    // Creating a customized prompt for GPT-4 API to get tailored advice
    const fullPrompt = `
You are a financial advisor with knowledge about farming and agricultural finance. Use the following user financial data to give detailed suggestions on how to spend the money, which products to buy, or how to allocate loans for farming.

User's Financial Data:
- Budget: $${financialData?.budget || "Not provided"}
- Income: $${financialData?.income || "Not provided"}
- Expenses: $${financialData?.expenses || "Not provided"}

User's Query: ${prompt}

Based on the above financial data, provide categorized recommendations in the following manner:
1. **Crops to plant** (for low-investment, high-return crops).
2. **Loan allocation** (how to spend the loan money effectively).
3. **Product suggestions** (like tools, seeds, fertilizers, etc. based on the budget).
4. **General financial advice** (how to save, where to cut expenses, etc.).

Please provide a structured response and be concise yet detailed.
`;

    // Call OpenAI's GPT-4 API for generating content based on the customized prompt
    const apiKey = process.env.OPENAI_API_KEY; // Ensure you set your OpenAI API key
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // GPT-4 model for the latest generation
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        max_tokens: 150,  // Adjust max tokens as needed for the response length
        temperature: 0.7, // Adjust for creativity
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    // Returning the result from GPT-4 API to the frontend
    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error from GPT-4 API:", error);
    return new Response(
      JSON.stringify({
        text: `❌ Error generating response. Try again later. Details: ${error.message || "Unknown error."}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
