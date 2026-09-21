import { apiUrl } from "./api";

export async function getMongoWallet(): Promise<number> {
  try {
    const accountId = localStorage.getItem("accountNumber") || "";
    if (!accountId) return 0;

    const res = await fetch(
      apiUrl(`/api/wallet?accountId=${encodeURIComponent(accountId)}`),
      { cache: "no-store" }
    );

    if (!res.ok) return 0;

    const data = await res.json();
    return Number(data?.coins || 0);
  } catch (error) {
    console.error("Mongo wallet load failed:", error);
    return 0;
  }
}

export async function updateMongoWallet(amount: number): Promise<number | null> {
  try {
    const accountId = localStorage.getItem("accountNumber") || "";
    if (!accountId) return null;

    const res = await fetch(apiUrl("/api/wallet"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountId,
        amount,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Mongo wallet update failed:", data?.error);
      return null;
    }

    return Number(data?.coins || 0);
  } catch (error) {
    console.error("Mongo wallet update failed:", error);
    return null;
  }
}
