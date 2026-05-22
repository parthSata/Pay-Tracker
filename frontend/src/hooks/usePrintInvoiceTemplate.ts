import { useMemo } from "react";

interface UsePrintInvoiceTemplateProps {
  invoice: any;
}

export function usePrintInvoiceTemplate({ invoice }: UsePrintInvoiceTemplateProps) {
  const merchant = useMemo(() => {
    if (!invoice) return {};
    return invoice.sme || invoice.userId || {};
  }, [invoice]);

  const tax = useMemo(() => {
    if (!invoice) return 0;
    return invoice.gstAmount || 0;
  }, [invoice]);

  const total = useMemo(() => {
    if (!invoice) return 0;
    return invoice.totalAmount || ((invoice.amount || 0) + tax);
  }, [invoice, tax]);

  const isPaid = useMemo(() => {
    if (!invoice) return false;
    return (invoice.status || "").toUpperCase() === "PAID";
  }, [invoice]);

  const formattedCreatedDate = useMemo(() => {
    if (!invoice?.createdAt) return "";
    return new Date(invoice.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [invoice?.createdAt]);

  const formattedDueDate = useMemo(() => {
    if (!invoice?.dueDate) return "";
    return new Date(invoice.dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [invoice?.dueDate]);

  const headerBgColor = useMemo(() => {
    return merchant.brandColor || "#1e3a8a"; // Default professional deep blue
  }, [merchant.brandColor]);

  return {
    merchant,
    tax,
    total,
    isPaid,
    formattedCreatedDate,
    formattedDueDate,
    headerBgColor,
  };
}
