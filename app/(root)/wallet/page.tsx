import { Suspense } from "react";
import Wallet from "@/components/Wallet";

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <Wallet />
    </Suspense>
  );
}
