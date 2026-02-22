import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";
import { AUDIT_SYSTEM_PROMPT } from "@/lib/constants";
import { nanoid } from "nanoid";
import type { Finding } from "@/types/audit";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { code, contractAddress, source } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length < 10) {
      return Response.json(
        { error: "Please provide valid Solidity code." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Anthropic API key not configured." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });
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
          const response = await client.messages.create({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: `Analyze this Solidity smart contract:\n\n\`\`\`solidity\n${code.slice(0, 30000)}\n\`\`\``,
              },
            ],
            system: AUDIT_SYSTEM_PROMPT,
          });

          // Extract text content from response
          const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === "text")
            .map((block) => block.text)
            .join("");

          // Parse JSON from the response — handle markdown code blocks too
          let parsed: { findings: Finding[]; score: number; summary: string };
          try {
            // Try stripping markdown code fences if present
            const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            // Try to extract JSON from anywhere in the text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              send("error", "Failed to parse audit results. Please try again.");
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            parsed = JSON.parse(jsonMatch[0]);
          }

          // Validate and normalize
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

          // Stream each finding individually for a nice incremental UI
          for (const finding of findings) {
            send("finding", finding);
            // Small delay for streaming effect
            await new Promise((resolve) => setTimeout(resolve, 150));
          }

          send("score", score);
          send("summary", summary);

          // Store in Supabase
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
            // Still send ID even if storage fails — audit result is valid
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
}
