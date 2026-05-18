import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../auth";
import { useTranslation } from "react-i18next";

export function useGstSettings() {
  const { user, setUser } = useAuth();
  const [gstEnabled, setGstEnabled] = useState(user?.gstEnabled || false);
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "");
  const [defaultGstRate, setDefaultGstRate] = useState(user?.defaultGstRate || 18);
  const [businessState, setBusinessState] = useState(user?.businessState || "Gujarat");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/users/update-gst`,
        { gstEnabled, gstNumber, defaultGstRate, businessState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem("pay_tracker_user", JSON.stringify(updatedUser));
      toast.success("GST settings updated successfully");
    } catch (error) {
      toast.error("Failed to update GST settings");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    gstEnabled, setGstEnabled,
    gstNumber, setGstNumber,
    defaultGstRate, setDefaultGstRate,
    businessState, setBusinessState,
    isSaving,
    handleSave
  };
}

export function useDeleteAccount() {
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This will export your invoices and then permanently delete all your data. This action cannot be undone.");
    
    if (!confirmDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const invoices = res.data.data || [];
      
      if (invoices.length === 0) {
        toast.info("No invoice data was stored in DB.");
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "invoices_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success(`Exported ${invoices.length} invoices successfully.`);
      }
      
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/delete-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Account deleted successfully.");
      logout();
      navigate({ to: "/login" });
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDelete
  };
}

export function useRegionalSettings() {
  const { t, i18n } = useTranslation();
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "inr");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || i18n.language || "en");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("timezone") || "ist");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("dateFormat") || "dmy");

  const handleSave = () => {
    localStorage.setItem("currency", currency);
    localStorage.setItem("language", language);
    localStorage.setItem("timezone", timezone);
    localStorage.setItem("dateFormat", dateFormat);
    i18n.changeLanguage(language);
    toast.success(t('save_preferences') + " saved");
  };

  return {
    t,
    currency, setCurrency,
    language, setLanguage,
    timezone, setTimezone,
    dateFormat, setDateFormat,
    handleSave
  };
}

export function useAppearanceSettings() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleSetTheme = (t: string) => {
    setTheme(t);
    toast(`Theme set to ${t}`);
  };

  return { theme, handleSetTheme };
}
