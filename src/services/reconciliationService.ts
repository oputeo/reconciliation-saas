// src/services/reconciliationService.ts
export type Break = {
  id: string;
  source: string;
  dest: string;
  amount: string;
  date: string;
  reason: string;
  status: string;
};

const mockBreaks: Break[] = [
  { id: "BRK-8921", source: "NIBSS", dest: "Wallet", amount: "₦2,450,000", date: "2026-05-15", reason: "Timing Difference", status: "Unreconciled" },
  { id: "BRK-8920", source: "Paystack", dest: "Core Banking", amount: "₦875,500", date: "2026-05-15", reason: "Partial Match", status: "Pending" },
  { id: "BRK-8919", source: "Flutterwave", dest: "Wallet", amount: "₦1,250,000", date: "2026-05-14", reason: "Missing Transaction", status: "Unreconciled" },
];

// Simulate real-time updates
export const reconciliationApi = {
  getBreaks: async (): Promise<Break[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockBreaks];
  },

  // Simulate live update (add new break)
  simulateLiveUpdate: (callback: (newBreak: Break) => void) => {
    const interval = setInterval(() => {
      const newBreak: Break = {
        id: `BRK-${Math.floor(Math.random() * 9000) + 1000}`,
        source: ["NIBSS", "Paystack", "Flutterwave"][Math.floor(Math.random() * 3)],
        dest: ["Wallet", "Core Banking", "Settlement"][Math.floor(Math.random() * 3)],
        amount: `₦${(Math.random() * 3000000 + 500000).toFixed(0)}`,
        date: "2026-05-15",
        reason: ["Timing Difference", "Partial Match", "Missing Transaction"][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.5 ? "Unreconciled" : "Pending",
      };
      callback(newBreak);
    }, 8000); // New break every 8 seconds

    return () => clearInterval(interval);
  }
};