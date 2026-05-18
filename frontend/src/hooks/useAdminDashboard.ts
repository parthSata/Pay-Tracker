import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../auth";

export function useAdminDashboard() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (error) {
      toast.error("Failed to load admin statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const token = localStorage.getItem("pay_tracker_token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data);
    } catch (error) {
      toast.error("Failed to load users list");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user and all their invoices? This action cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("pay_tracker_token");
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User deleted successfully");
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    users,
    isLoading,
    isUsersLoading,
    fetchUsers,
    handleDeleteUser,
    logout
  };
}
