import { useState } from "react";
import { useAuth } from "../auth";

export function useProfile() {
  const { user, updateUser, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    businessName: user?.businessName || "",
    upiId: user?.upiId || "",
  });

  const handleSave = async () => {
    try {
      await updateUser(formData);
    } catch (error) {
      // Error handled in auth context
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return {
    user,
    isLoading,
    formData,
    handleSave,
    handleChange
  };
}
