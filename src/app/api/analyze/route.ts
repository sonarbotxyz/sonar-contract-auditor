import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withX402 } from "x402-next";
import { getSupabase } from "@/lib/supabase";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/constants";
import { nanoid } from "nanoid";
import type { Finding } from "@/types/audit";

export const maxDuration = 60;
export const runtime = "nodejs";

const payTo = (process.env.X402_PAYTO_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

async function handler(req: NextRequest) {
  try {
    const { code, contractAddress, source } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide valid Solidity code." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    const auditId = nanoid(12);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );
        };

        try {
          const prompt = `${AUDIT_SYSTEM_PROMPT}\n\nAnalyze this Solidity smart contract:\n\n\`\`\`solidity\n${code.slice(0, 30000)}\n\`\`\``;

          const result = await model.generateContent(prompt);
          const text = result.response.text();

          let parsed: { findings: Finding[]; score: number; summary: string };
          try {
            const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              send("error", "Failed to parse audit results. Please try again.");
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            parsed = JSON.parse(jsonMatch[0]);
          }

          const findings: Finding[] = (parsed.findings || []).map(
            (f: Finding) => ({
              severity: ["Critical", "High", "Medium", "Low", "Info"].includes(
                f.severity
              )
                ? f.severity
                : "Info",
              title: String(f.title || "Unnamed Finding"),
              description: String(f.description || ""),
              recommendation: String(f.recommendation || ""),
              line: f.line ? String(f.line) : undefined,
            })
          );

          const score = Math.max(
            0,
            Math.min(100, Math.round(Number(parsed.score) || 0))
          );

          const summary = String(parsed.summary || "");

          for (const finding of findings) {
            send("finding", finding);
            await new Promise((resolve) => setTimeout(resolve, 150));
          }

          send("score", score);
          send("summary", summary);

          try {
            await getSupabase().from("audits").insert({
              id: auditId,
              contract_code: code.slice(0, 50000),
              contract_address: contractAddress || null,
              score,
              findings,
              summary,
              source: source || "paste",
            });
            send("id", auditId);
          } catch {
            send("id", auditId);
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Analysis failed";
          send("error", message);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export const POST = withX402(
  handler,
  payTo,
  {
    price: "$0.50",
    network: "base",
    config: { description: "AI Contract Audit" },
  },
  { url: "https://x402.org/facilitator" }
);
