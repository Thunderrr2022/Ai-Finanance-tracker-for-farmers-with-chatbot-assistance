import { NextResponse } from "next/server";

export async function POST(req) {
  const { message } = await req.json();

  let reply = "Sorry, I didn't understand that.";

  if (/saving|budget/i.test(message)) {
    reply = "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.";
  } else if (/crop.*location|best crop/i.test(message)) {
    reply = "Based on most regions, paddy, millets, and pulses are good in the current season.";
  } else if (/low investment/i.test(message)) {
    reply = "Try vegetables like okra, beans, and leafy greens—they're cost-effective and yield quickly.";
  }

  return NextResponse.json({ reply });
}
