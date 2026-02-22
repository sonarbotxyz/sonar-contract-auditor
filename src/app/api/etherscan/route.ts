import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return Response.json(
      { error: "Invalid Ethereum address." },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Etherscan API key not configured." },
      { status: 500 }
    );
  }

  try {
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "1" || !data.result?.[0]?.SourceCode) {
      return Response.json(
        {
          error:
            "Contract source code not found. Make sure the contract is verified on Etherscan.",
        },
        { status: 404 }
      );
    }

    let sourceCode = data.result[0].SourceCode;

    // Handle multi-file JSON format from Etherscan
    if (sourceCode.startsWith("{{")) {
      try {
        const parsed = JSON.parse(sourceCode.slice(1, -1));
        const sources = parsed.sources || {};
        sourceCode = Object.values(sources)
          .map((s: unknown) => (s as { content: string }).content)
          .join("\n\n");
      } catch {
        // Use as-is if parsing fails
      }
    }

    return Response.json({
      sourceCode,
      contractName: data.result[0].ContractName,
      compiler: data.result[0].CompilerVersion,
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch from Etherscan." },
      { status: 500 }
    );
  }
}
