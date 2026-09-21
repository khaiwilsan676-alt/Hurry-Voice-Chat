import { apiUrl } from "./api";

// Assuming we get the accountId from localStorage or currentUser
export function getWalletAccountId(): string | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.accountId || user.accountNumber || user.uid || null;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export async function getWalletBalance(): Promise<{ coins: number, diamonds: number }> {
  try {
    const accountId = getWalletAccountId();
    if (!accountId) return { coins: 0, diamonds: 0 };

    const res = await fetch(apiUrl(`/api/wallet?accountId=${encodeURIComponent(accountId)}`));
    if (res.ok) {
      const data = await res.json();
      return { coins: data.coins || 0, diamonds: data.diamonds || 0 };
    }
    return { coins: 0, diamonds: 0 };
  } catch (e) {
    console.error("Failed to fetch wallet balance", e);
    return { coins: 0, diamonds: 0 };
  }
}

export async function updateWalletBalance(coinsDelta: number, diamondsDelta: number = 0): Promise<{ coins: number, diamonds: number }> {
  try {
    const accountId = getWalletAccountId();
    if (!accountId) throw new Error("No accountId found");

    const res = await fetch(apiUrl('/api/wallet/update'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId,
        coinsDelta,
        diamondsDelta
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('walletBalanceChanged', { detail: data }));
      }
      return { coins: data.coins || 0, diamonds: data.diamonds || 0 };
    }
    throw new Error("Failed to update wallet");
  } catch (e) {
    console.error("Failed to update wallet balance", e);
    throw e;
  }
}
