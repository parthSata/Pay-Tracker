import { useState } from "react";
import { useAuth } from "../auth";
import axios from "axios";
import { toast } from "sonner";

export function useProfile() {
  const { user, updateUser, setUser, isLoading } = useAuth();
  const [uploadingState, setUploadingState] = useState({
    logo: false,
    signature: false,
    avatar: false,
  });

  const isUploading = uploadingState.logo || uploadingState.signature || uploadingState.avatar;
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    businessName: user?.businessName || "",
    upiId: user?.upiId || "",
    profilePic: user?.profilePic || "",
    logoUrl: user?.logoUrl || "",
    watermarkEnabled: user?.watermarkEnabled || false,
    watermarkOpacity: user?.watermarkOpacity ?? 0.1,
    brandTemplate: user?.brandTemplate || "CLASSIC",
    brandColor: user?.brandColor || "#6366f1",
    brandTextColor: user?.brandTextColor || "#ffffff",
    footerText: user?.footerText || "",
    signatureType: user?.signatureType || "NONE",
    signatureUrl: user?.signatureUrl || "",
    signatureText: user?.signatureText || "",
    signatureFont: user?.signatureFont || "Dancing Script",
    bankDetails: {
      bankName: user?.bankDetails?.bankName || "",
      accountName: user?.bankDetails?.accountName || "",
      accountNumber: user?.bankDetails?.accountNumber || "",
      ifscCode: user?.bankDetails?.ifscCode || "",
      branchName: user?.bankDetails?.branchName || "",
    }
  });

  const handleSave = async () => {
    try {
      await updateUser(formData);
    } catch (error) {
      // Error handled in auth context
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setVal = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const setBankDetail = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [key]: value
      }
    }));
  };

  const uploadFile = async (file: File, type: "logo" | "signature" | "avatar") => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds the 10MB limit.");
      return;
    }

    setUploadingState(prev => ({ ...prev, [type]: true }));
    const form = new FormData();
    form.append(type, file);

    try {
      const token = localStorage.getItem("pay_tracker_token");
      const urlMap = {
        logo: "/users/upload-logo",
        signature: "/users/upload-signature",
        avatar: "/users/upload-avatar"
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}${urlMap[type]}`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem("pay_tracker_user", JSON.stringify(updatedUser));

      if (type === "logo") {
        setVal("logoUrl", updatedUser.logoUrl);
      } else if (type === "signature") {
        setVal("signatureUrl", updatedUser.signatureUrl);
      } else if (type === "avatar") {
        setVal("profilePic", updatedUser.profilePic);
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setUploadingState(prev => ({ ...prev, [type]: false }));
    }
  };

  return {
    user,
    isLoading,
    isUploading,
    uploadingState,
    formData,
    handleSave,
    handleChange,
    setVal,
    setBankDetail,
    uploadFile
  };
}
