export type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";

export interface Invoice {
  id: string;
  client: string;
  email: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
}

export const invoices: Invoice[] = [
  { id: "INV-2041", client: "Aakash Mehta", email: "aakash@brightlabs.in", amount: 48500, status: "paid", dueDate: "2025-04-12", issuedDate: "2025-03-28" },
  { id: "INV-2042", client: "Priya Sharma", email: "priya@northwinds.co", amount: 12750, status: "pending", dueDate: "2025-05-02", issuedDate: "2025-04-15" },
  { id: "INV-2043", client: "Rohan Kapoor", email: "rohan@kapoorco.in", amount: 89000, status: "overdue", dueDate: "2025-04-05", issuedDate: "2025-03-20" },
  { id: "INV-2044", client: "Saanvi Iyer", email: "saanvi@iyerstudio.com", amount: 22000, status: "paid", dueDate: "2025-04-18", issuedDate: "2025-04-01" },
  { id: "INV-2045", client: "Vikram Singh", email: "vikram@vsenterprises.in", amount: 156400, status: "pending", dueDate: "2025-05-10", issuedDate: "2025-04-20" },
  { id: "INV-2046", client: "Neha Reddy", email: "neha@reddybuilders.in", amount: 34200, status: "overdue", dueDate: "2025-04-01", issuedDate: "2025-03-10" },
  { id: "INV-2047", client: "Arjun Nair", email: "arjun@nairgroup.in", amount: 67800, status: "paid", dueDate: "2025-04-22", issuedDate: "2025-04-08" },
  { id: "INV-2048", client: "Isha Patel", email: "isha@patelcrafts.in", amount: 9800, status: "draft", dueDate: "2025-05-15", issuedDate: "2025-04-22" },
];

export const cashflow = [
  { month: "Nov", revenue: 142000, expected: 90000 },
  { month: "Dec", revenue: 168000, expected: 110000 },
  { month: "Jan", revenue: 184000, expected: 130000 },
  { month: "Feb", revenue: 152000, expected: 145000 },
  { month: "Mar", revenue: 219000, expected: 160000 },
  { month: "Apr", revenue: 248500, expected: 178000 },
];

export const weekly = [
  { day: "Mon", paid: 14000, pending: 6000 },
  { day: "Tue", paid: 22000, pending: 8500 },
  { day: "Wed", paid: 18500, pending: 12000 },
  { day: "Thu", paid: 31000, pending: 4500 },
  { day: "Fri", paid: 27500, pending: 9800 },
  { day: "Sat", paid: 19200, pending: 5400 },
  { day: "Sun", paid: 11000, pending: 3000 },
];

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function inrShort(n: number) {
  return n >= 1e7
    ? `₹${(n / 1e7).toFixed(1)}Cr`
    : n >= 1e5
      ? `₹${(n / 1e5).toFixed(1)}L`
      : `₹${(n / 1e3).toFixed(0)}K`;
}
