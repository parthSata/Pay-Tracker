import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

export type UserRole = "SME" | "ADMIN";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  plan?: "FREE" | "PAID";
  businessName?: string;
  upiId?: string;
  gstEnabled?: boolean;
  gstNumber?: string;
  defaultGstRate?: number;
  businessState?: string;
  isTwoFactorEnabled?: boolean;
  profilePic?: string;
  logoUrl?: string;
  watermarkEnabled?: boolean;
  watermarkOpacity?: number;
  brandTemplate?: "CLASSIC" | "MINIMAL" | "CREATIVE" | "MODERN";
  brandColor?: string;
  brandTextColor?: string;
  footerText?: string;
  signatureType?: "NONE" | "UPLOAD" | "TYPED";
  signatureUrl?: string;
  signatureText?: string;
  signatureFont?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | { requires2FA: true, tempToken: string }>;
  verify2FA: (tempToken: string, token: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  toggleSubscription: () => Promise<void>;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("pay_tracker_user");
    const token = localStorage.getItem("pay_tracker_token");
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("pay_tracker_user");
    const token = localStorage.getItem("pay_tracker_token");
    if (storedUser && !token) {
      localStorage.removeItem("pay_tracker_user");
      setUser(null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      
      if (response.data.data.requires2FA) {
        return {
          requires2FA: true,
          tempToken: response.data.data.tempToken
        };
      }

      const { user: userData, accessToken } = response.data.data;
      
      setUser(userData);
      localStorage.setItem("pay_tracker_user", JSON.stringify(userData));
      localStorage.setItem("pay_tracker_token", accessToken);
      
      toast.success("Welcome back!");
      return userData;
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (tempToken: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/login/verify`, { tempToken, token });
      const { user: userData, accessToken } = response.data.data;
      
      setUser(userData);
      localStorage.setItem("pay_tracker_user", JSON.stringify(userData));
      localStorage.setItem("pay_tracker_token", accessToken);
      
      toast.success("Welcome back!");
      return userData;
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid 2FA code";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/users/register`, {
        name: data.fullName,
        email: data.email,
        password: data.password,
        businessName: data.businessName,
        upiId: data.upiId
      });
      
      toast.success("Account created! Please login.");
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pay_tracker_user");
    localStorage.removeItem("pay_tracker_token");
    toast.info("Logged out");
  };

  const updateUser = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.patch(`${API_URL}/users/update-account`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem("pay_tracker_user", JSON.stringify(updatedUser));
      toast.success("Profile updated!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscription = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.post(`${API_URL}/users/subscribe`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem("pay_tracker_user", JSON.stringify(updatedUser));
      toast.success(`Successfully switched to ${updatedUser.plan} plan!`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update subscription";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user, login, verify2FA, register, logout, updateUser, toggleSubscription, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
