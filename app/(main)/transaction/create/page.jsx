import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) {
  // In Next.js 15, searchParams is already resolved
  const editId = searchParams?.edit || null;
  
  const [accounts, initialData] = await Promise.all([
    getUserAccounts(),
    editId ? getTransaction(editId) : Promise.resolve(null)
  ]);

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title">
          {editId ? "Edit Transaction" : "Add Transaction"}
        </h1>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        initialData={initialData}
      />
    </div>
  );
}
