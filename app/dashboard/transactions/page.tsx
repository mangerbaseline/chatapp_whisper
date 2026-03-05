import ManageTransactions from "@/components/ManageTransactions";

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Transactions
        </h1>
        <p className="text-muted-foreground mt-2">
          View all transactions, plan purchases, and token transfers across the
          platform.
        </p>
      </div>
      <ManageTransactions />
    </div>
  );
}
