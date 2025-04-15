import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Separator } from "./ui/separator";
import {
  BarChart3,
  Calendar,
  FileText,
  Home,
  LogOut,
  Settings,
  Truck,
  Package,
  Users,
  AlertCircle,
  Mail,
  Bell,
  User,
  Menu,
  CircleDollarSign,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth";
// import logo from "../images/logo.png";

// Import dropdown menu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Import toast components
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";

const DashboardLayout = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  
  // Determine active menu from current path
  const getActiveMenu = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "overview";
    if (path.includes("/dashboard/quotes")) return "quotes";
    if (path.includes("/dashboard/orders")) return "orders";
    if (path.includes("/dashboard/customers")) return "customers";
    if (path.includes("/dashboard/payments")) return "payments";
    if (path.includes("/dashboard/admin")) return "admin";
    if (path.includes("/dashboard/settings")) return "settings";
    return "overview";
  };
  
  const activeMenu = getActiveMenu();

  useEffect(() => {
    // Check for authenticated user
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login";
        return;
      }
      
      if (data?.user) {
        setUser(data.user);
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account",
    });
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center">
          <img src="/images/logo.png" alt="BlackRoc Logo" className="h-12 mb-4" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="px-6 pt-6 pb-4">
            <Link to="/">
              <img src="/images/logo.png" alt="BlackRoc Logo" className="h-8" />
            </Link>
          </div>
          <Separator />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/dashboard"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeMenu === "overview"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <BarChart3 className="mr-3 h-5 w-5 text-gray-500" />
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/quotes"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeMenu === "quotes"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <FileText className="mr-3 h-5 w-5 text-gray-500" />
                  Quotes
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/orders"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeMenu === "orders"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Package className="mr-3 h-5 w-5 text-gray-500" />
                  Orders
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/payments/capture"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeMenu === "payments"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <CircleDollarSign className="mr-3 h-5 w-5 text-gray-500" />
                  Payments
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/customers"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeMenu === "customers"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Users className="mr-3 h-5 w-5 text-gray-500" />
                  Customers
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/settings"
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    activeMenu === "settings"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-500" />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>

          {/* Sign Out Button */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar (off-canvas) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" className="flex items-center">
                <img src="/images/logo.png" alt="BlackRoc Logo" className="h-8" />
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 overflow-y-auto">
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/dashboard"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeMenu === "overview"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="mr-3 h-5 w-5 text-gray-500" />
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/quotes"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeMenu === "quotes"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="mr-3 h-5 w-5 text-gray-500" />
                    Quotes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/orders"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeMenu === "orders"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="mr-3 h-5 w-5 text-gray-500" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/payments/capture"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeMenu === "payments"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CircleDollarSign className="mr-3 h-5 w-5 text-gray-500" />
                    Payments
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/customers"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeMenu === "customers"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="mr-3 h-5 w-5 text-gray-500" />
                    Customers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/settings"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeMenu === "settings"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-5 w-5 text-gray-500" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Sign Out Button */}
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {activeMenu === "overview" && "Dashboard"}
              {activeMenu === "quotes" && "Quotes"}
              {activeMenu === "orders" && "Orders"}
              {activeMenu === "customers" && "Customers"}
              {activeMenu === "settings" && "Settings"}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.email || "Your Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-white overflow-y-auto">
          <Outlet />
          <Toaster />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 