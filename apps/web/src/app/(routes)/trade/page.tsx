"use client";

import { redirect } from "next/navigation";

export default function TradePage() {
  redirect("/trade/sol-usdc");
}

// import { TradingLayout } from '@/components/Trading/TradingLayout';

// export default function TradePage() {
//   return(
//   <div>
//       <TradingLayout />
//   </div>
//   )
// }
