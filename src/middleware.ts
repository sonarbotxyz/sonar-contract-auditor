import { paymentMiddleware } from "x402-next";

const payTo = (process.env.X402_PAYTO_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const middleware = paymentMiddleware(
  payTo,
  {
    "/api/analyze": {
      price: "$0.50",
      network: "base",
      config: {
        description: "AI Contract Audit",
      },
    },
  },
  {
    url: "https://x402.org/facilitator",
  }
);

export const config = {
  matcher: ["/api/analyze"],
};
