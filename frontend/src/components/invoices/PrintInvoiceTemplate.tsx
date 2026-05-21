import { formatINR } from "@/lib/utils";

interface PrintInvoiceTemplateProps {
  id?: string;
  invoice: any;
  qrCodeUrl?: string;
}

export function PrintInvoiceTemplate({ id, invoice, qrCodeUrl }: PrintInvoiceTemplateProps) {
  if (!invoice) return null;

  const merchant = invoice.sme || invoice.userId || {};
  const tax = invoice.gstAmount || 0;
  const total = invoice.totalAmount || ((invoice.amount || 0) + tax);
  const isPaid = (invoice.status || "").toUpperCase() === "PAID";

  const formattedCreatedDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const formattedDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const headerBgColor = merchant.brandColor || "#1e3a8a"; // Default professional deep blue

  return (
    <div
      id={id}
      className="relative bg-white text-slate-800 font-sans flex flex-col justify-between box-border"
      style={{
        width: "794px",
        height: "1123px",
        maxHeight: "1123px",
        padding: "0",
        margin: "0",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* 1. Watermark logo inside the body */}
      {merchant.watermarkEnabled && merchant.logoUrl && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0"
          style={{ opacity: merchant.watermarkOpacity ?? 0.08 }}
        >
          <img
            src={merchant.logoUrl}
            alt="Watermark"
            className="w-1/2 max-w-[300px] object-contain select-none bg-transparent"
            style={{ mixBlendMode: "multiply" }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* 2. Full-bleed top header banner (no margins, no rounded corners) */}
      <div
        className="w-full px-10 py-5 flex justify-between items-center text-white"
        style={{ backgroundColor: headerBgColor }}
      >
        <div className="flex items-center gap-4">
          {merchant.logoUrl ? (
            <img
              src={merchant.logoUrl}
              alt="Logo"
              className="h-14 max-h-14 object-contain bg-transparent rounded"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-white/20 flex items-center justify-center font-bold text-2xl uppercase">
              {(merchant.businessName || merchant.name || "B")
                .split(" ")
                .map((n: string) => n[0] || "")
                .join("")
                .slice(0, 2)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight">
              {merchant.businessName || "Business Merchant"}
            </h1>
            <p className="text-xs text-white/80 font-medium">
              {merchant.name || "Merchant Partner"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black tracking-widest">INVOICE</h2>
          <div className="text-xs font-mono opacity-90 mt-1">Ref No. {invoice.invoiceNumber}</div>
          <div className="text-[10px] opacity-75 mt-1">
            Date: {formattedCreatedDate} | Due: {formattedDueDate}
          </div>
        </div>
      </div>

      {/* 3. Padded Body Content */}
      <div className="flex-1 px-10 py-4 flex flex-col justify-between z-10 relative">
        <div>
          {/* Billed To & Sender Details */}
          <div className="grid grid-cols-2 gap-8 mb-4 pb-4 border-b border-slate-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Billed To:</div>
              <div className="text-base font-bold text-slate-900">{invoice.clientName}</div>
              <div className="text-sm text-slate-600 mt-1">{invoice.clientEmail}</div>
              {invoice.clientState && (
                <div className="text-xs text-slate-500 mt-0.5">State: {invoice.clientState}</div>
              )}
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">From:</div>
              <div className="text-base font-bold text-slate-900">
                {merchant.businessName || merchant.name}
              </div>
              <div className="text-sm text-slate-600 mt-1">{merchant.email}</div>
              {merchant.gstNumber && (
                <div className="text-xs text-slate-500 font-mono mt-0.5">GSTIN: {merchant.gstNumber}</div>
              )}
              {merchant.businessState && (
                <div className="text-xs text-slate-500 mt-0.5">State: {merchant.businessState}</div>
              )}
            </div>
          </div>

          {/* Table Grid */}
          <table className="w-full text-left border-collapse mb-4 z-10 relative">
            <thead>
              <tr
                className="text-white text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: headerBgColor }}
              >
                <th className="py-3 px-4 rounded-l-lg w-12 text-center">No.</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-24 text-center">Quantity</th>
                <th className="py-3 px-4 w-32 text-right">Unit Price</th>
                <th className="py-3 px-4 rounded-r-lg w-36 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr className="bg-slate-50/50">
                <td className="py-4 px-4 text-center text-slate-500 font-medium">1</td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-800">Services rendered</div>
                  <div className="text-xs text-slate-400 mt-0.5">Taxable base transaction value</div>
                </td>
                <td className="py-4 px-4 text-center text-slate-600">1 unit</td>
                <td className="py-4 px-4 text-right text-slate-700 font-mono">
                  {formatINR(invoice.amount)}
                </td>
                <td className="py-4 px-4 text-right text-slate-900 font-semibold font-mono">
                  {formatINR(invoice.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary Breakdown (Subtotal, GST, Total) */}
          <div className="flex justify-end mb-4">
            <div className="w-80 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Taxable)</span>
                <span className="font-mono font-medium">{formatINR(invoice.amount)}</span>
              </div>

              {invoice.taxType === "CGST_SGST" ? (
                <>
                  <div className="flex justify-between text-xs text-slate-500 pl-4">
                    <span>CGST ({invoice.gstRate / 2}%)</span>
                    <span className="font-mono">{formatINR(invoice.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pl-4">
                    <span>SGST ({invoice.gstRate / 2}%)</span>
                    <span className="font-mono">{formatINR(invoice.sgst)}</span>
                  </div>
                </>
              ) : invoice.taxType === "IGST" ? (
                <div className="flex justify-between text-xs text-slate-500 pl-4">
                  <span>IGST ({invoice.gstRate}%)</span>
                  <span className="font-mono">{formatINR(invoice.igst)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="font-mono font-semibold">{formatINR(total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid</span>
                <span className="font-mono font-semibold">{formatINR(isPaid ? total : 0)}</span>
              </div>

              <div
                className="flex justify-between items-center pt-3 border-t border-slate-200 text-base font-bold text-slate-900"
              >
                <span>Remaining Payment</span>
                <span className="text-lg font-mono tracking-tight" style={{ color: headerBgColor }}>
                  {formatINR(isPaid ? 0 : total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
            <div className="col-span-3 space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                Payment Info
              </h3>
              {merchant.bankDetails && merchant.bankDetails.bankName ? (
                <div className="grid grid-cols-3 gap-y-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Bank Name:</span>
                  <span className="col-span-2 font-semibold text-slate-700">
                    {merchant.bankDetails.bankName}
                  </span>

                  <span className="text-slate-400 font-medium">Account Name:</span>
                  <span className="col-span-2 font-semibold text-slate-700">
                    {merchant.bankDetails.accountName}
                  </span>

                  <span className="text-slate-400 font-medium">Account No:</span>
                  <span className="col-span-2 font-bold font-mono text-slate-900">
                    {merchant.bankDetails.accountNumber}
                  </span>

                  <span className="text-slate-400 font-medium">IFSC Code:</span>
                  <span className="col-span-2 font-bold font-mono text-slate-900">
                    {merchant.bankDetails.ifscCode}
                  </span>

                  {merchant.bankDetails.branchName && (
                    <>
                      <span className="text-slate-400 font-medium">Branch:</span>
                      <span className="col-span-2 font-semibold text-slate-700">
                        {merchant.bankDetails.branchName}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No bank transfer details provided.</p>
              )}

              {merchant.upiId && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-400 font-medium">UPI ID: </span>
                  <span className="font-bold text-slate-800">{merchant.upiId}</span>
                </div>
              )}
            </div>

            <div className="col-span-2 flex flex-col items-center justify-center border-l border-slate-200/60 pl-6">
              {qrCodeUrl ? (
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                  <img src={qrCodeUrl} alt="Payment QR" className="h-24 w-24 object-contain" />
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 text-center">Scan to Pay via UPI</div>
              )}
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Scan to Pay
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Authorized Signature block */}
        <div className="border-t border-slate-100 pt-4 flex justify-between items-end">
          <div className="max-w-[420px] space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {invoice.notes ||
                "Please quote the invoice reference number in all bank communications. Thank you for your business!"}
            </p>
            {merchant.footerText && (
              <p className="text-[10px] text-slate-400 italic mt-1">{merchant.footerText}</p>
            )}
          </div>

          <div className="text-right flex flex-col items-end min-w-[200px]">
            {merchant.signatureType === "UPLOAD" && merchant.signatureUrl ? (
              <img
                src={merchant.signatureUrl}
                alt="Signature"
                className="h-10 max-h-10 object-contain bg-transparent mb-1"
                crossOrigin="anonymous"
              />
            ) : merchant.signatureType === "TYPED" && merchant.signatureText ? (
              <div
                className="text-2xl font-medium text-slate-800 mb-1"
                style={{
                  fontFamily: merchant.signatureFont || "'Dancing Script', cursive",
                }}
              >
                {merchant.signatureText}
              </div>
            ) : (
              <div className="h-10" />
            )}
            <div className="w-full border-t border-slate-200 mt-2 pt-1.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Authorized Signature
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">SME Proprietor/Partner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
