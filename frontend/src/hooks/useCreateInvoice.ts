import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../auth";
import { formatINR } from "@/lib/utils";

export const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

export function useCreateInvoice() {
  const { user } = useAuth();
  const [client, setClient] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [clientState, setClientState] = useState(user?.businessState || "Gujarat");
  const [gstRate, setGstRate] = useState(user?.gstEnabled ? user.defaultGstRate || 18 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");
  const navigate = useNavigate();

  const checkEmail = async (checkEmailStr: string) => {
    if (!checkEmailStr || !checkEmailStr.includes('@')) {
      setEmailWarning("");
      return;
    }
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/check-email?email=${checkEmailStr}`);
      if (!res.data?.data?.exists) {
        setEmailWarning("Warning: Client email is not registered in Pay-Tracker.");
      } else {
        setEmailWarning("");
      }
    } catch (e) {
      setEmailWarning("");
    }
  };

  const amountNum = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const gstAmount = Math.round((amountNum * gstRate) / 100);
  const total = amountNum + gstAmount;
  const isSameState = user?.businessState === clientState;
  const taxType = gstRate > 0 ? (isSameState ? "CGST_SGST" : "IGST") : "NONE";

  const handleSend = async () => {
    if (!client || !email || !amountNum || !due) {
      toast.error("Please fill client name, email, amount and due date");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.post(`${import.meta.env.VITE_API_URL}/invoices`, {
        clientName: client,
        clientEmail: email,
        clientState,
        amount: amountNum,
        gstRate,
        dueDate: due,
        notes,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Invoice created successfully!", {
        description: `${client} · ${formatINR(total)}`
      });

      navigate({ to: "/invoices" });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to create invoice";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user,
    client, setClient,
    email, setEmail,
    amount, setAmount,
    due, setDue,
    notes, setNotes,
    clientState, setClientState,
    gstRate, setGstRate,
    isSubmitting,
    emailWarning,
    checkEmail,
    amountNum,
    gstAmount,
    total,
    taxType,
    handleSend
  };
}
