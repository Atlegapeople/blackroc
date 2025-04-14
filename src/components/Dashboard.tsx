import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Building,
  Phone,
  Edit,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth";
import logo from "../images/logo.png";

// Add Dialog components for modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Import toast components
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";

// Import dropdown menu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("overview");
  
  // Add state for onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [customerProfile, setCustomerProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  
  // Add state for profile editing
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null);
  // Add state for dropdown menu
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { toast } = useToast(); // Add toast hook

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
        console.log("User authenticated:", data.user.id);
        setUser(data.user);
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    };

    getUser();
  }, []);

  // Add separate useEffect to properly handle profile data loading
  // This ensures user state is fully available before checking profile
  useEffect(() => {
    if (user && !loading) {
      console.log("User data available, checking profile for:", user.id);
      checkCustomerProfile(user.id);
    }
  }, [user, loading]);

  // Function to check if customer profile exists
  const checkCustomerProfile = async (userId: string) => {
    try {
      console.log("Checking customer profile for user ID:", userId);
      // Reset states to prevent flashing
      setShowOnboarding(false);
      setOnboardingError("");
      
      const { data: customerData, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .single();

      console.log("Query response:", { customerData, error });

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No customer profile found, will show onboarding");
          
          // Reset the form first with just the email
          setCustomerProfile({
            name: "",
            email: user?.email || "",
            phone: "",
            company: ""
          });
          
          // Clear any existing customer ID
          setExistingCustomerId(null);
          
          // Show onboarding modal
          setShowOnboarding(true);
        } else {
          console.error("Database error checking customer profile:", error);
        }
        return;
      }

      // If customer profile found
      if (customerData) {
        console.log("Customer profile found:", customerData);
        
        // Save the customer ID
        setExistingCustomerId(customerData.id);
        
        // Load profile data
        setCustomerProfile({
          name: customerData.name || "",
          email: customerData.email || "",
          phone: customerData.phone || "",
          company: customerData.company || "",
        });
        
        // Ensure onboarding is definitely not shown
        setShowOnboarding(false);
      }
    } catch (err) {
      console.error("Unexpected error in customer profile check:", err);
    }
  };

  // Handle form input changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit customer profile
  const submitCustomerProfile = async () => {
    if (!customerProfile.name || !customerProfile.email || !customerProfile.phone) {
      setOnboardingError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setOnboardingError("");

    try {
      // First check if user has RLS permissions with current session
      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            name: customerProfile.name,
            email: customerProfile.email,
            phone: customerProfile.phone,
            company: customerProfile.company,
            user_id: user.id
          }
        ])
        .select();

      // If RLS error occurs
      if (error && error.message.includes("row-level security")) {
        console.log("RLS error detected, trying with auth context", error);
        
        // Try with explicit auth context
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          setOnboardingError(authError.message);
          setIsSubmitting(false);
          return;
        }
        
        // Verify session exists and retry with auth context
        if (authData && authData.session) {
          // Try with returning data this time
          const { data: insertData, error: retryError } = await supabase
            .from("customers")
            .insert([
              {
                name: customerProfile.name,
                email: customerProfile.email,
                phone: customerProfile.phone,
                company: customerProfile.company,
                user_id: user.id
              }
            ])
            .select();
            
          if (retryError) {
            console.error("Second attempt failed:", retryError);
            setOnboardingError("Authorization error: " + retryError.message + 
              ". You may need to configure Row Level Security policies in your Supabase dashboard for the customers table.");
            setIsSubmitting(false);
            return;
          }
          
          // Success on second attempt - show success toast
          setShowOnboarding(false);
          setProfileDropdownOpen(false);
          setIsSubmitting(false);
          
          // Save the new customer ID to prevent onboarding from showing again
          if (insertData && insertData[0]) {
            console.log("Setting customer ID after creation:", insertData[0].id);
            setExistingCustomerId(insertData[0].id);
          }
          
          // Show success toast with simpler implementation
          toast({
            title: "Profile Created Successfully",
            description: "Your profile has been created",
            className: "bg-green-50 border-green-200 text-green-800",
            variant: "default",
            duration: 3000,
          });
          return;
        }
      } else if (error) {
        // Other non-RLS errors
        setOnboardingError(error.message);
        setIsSubmitting(false);
        return;
      }

      // First attempt successful - show success toast
      setShowOnboarding(false);
      setProfileDropdownOpen(false);
      setIsSubmitting(false);
      
      // Save the new customer ID to prevent onboarding from showing again
      if (data && data[0]) {
        console.log("Setting customer ID after standard creation:", data[0].id);
        setExistingCustomerId(data[0].id);
      }
      
      // Show success toast with simpler implementation
      toast({
        title: "Profile Created Successfully",
        description: "Your profile has been created",
        className: "bg-green-50 border-green-200 text-green-800",
        variant: "default",
        duration: 3000,
      });
    } catch (err: any) {
      setOnboardingError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  // Add function to handle profile edit
  const handleProfileEdit = async () => {
    if (!customerProfile.name || !customerProfile.email || !customerProfile.phone) {
      setOnboardingError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setOnboardingError("");

    try {
      // Update existing profile
      if (existingCustomerId) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: customerProfile.name,
            email: customerProfile.email,
            phone: customerProfile.phone,
            company: customerProfile.company,
          })
          .eq("id", existingCustomerId);

        if (error) {
          console.error("Error updating profile:", error);
          setOnboardingError("Error updating profile: " + error.message);
          setIsSubmitting(false);
          return;
        }

        // Success - close dropdown and show success toast
        setShowProfileEdit(false);
        setProfileDropdownOpen(false);
        setIsSubmitting(false);
        
        // Show success toast with simpler implementation
        toast({
          title: "Profile Updated Successfully",
          description: "Your profile information has been updated",
          className: "bg-green-50 border-green-200 text-green-800",
          variant: "default",
          duration: 3000,
        });
      } else {
        // Should not happen, but handle it gracefully
        setOnboardingError("Could not find your profile. Please try again later.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setOnboardingError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  // Function to open profile edit modal
  const openProfileEdit = async () => {
    // If we already have the profile data, just open modal
    if (existingCustomerId) {
      setShowProfileEdit(true);
    } else {
      // Otherwise, fetch it first
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          setExistingCustomerId(data.id);
          setCustomerProfile({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            company: data.company || "",
          });
          setShowProfileEdit(true);
        } else {
          // No profile exists yet, show onboarding instead
          setCustomerProfile(prev => ({
            ...prev,
            email: user?.email || ""
          }));
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Error in profile edit:", err);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-buff-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-jet-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-white text-jet-600 p-4 hidden md:block border-r border-gray-100 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8">
          <img 
            src={logo} 
            alt="BlackRoc Logo" 
            className="h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200 mb-4"
          />
          <p className="text-jet-500 text-sm">Construction Materials</p>
        </div>

        <nav>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveMenu("overview")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "overview"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <Home className="mr-3 h-5 w-5" />
                Overview
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu("orders")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "orders"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                Orders
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu("products")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "products"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <Package className="mr-3 h-5 w-5" />
                Products
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu("deliveries")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "deliveries"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <Truck className="mr-3 h-5 w-5" />
                Deliveries
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu("calendar")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "calendar"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Calendar
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveMenu("reports")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "reports"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Reports
              </button>
            </li>
          </ul>

          <Separator className="my-6 bg-gray-200" />
          
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveMenu("settings")}
                className={`flex items-center w-full p-2 rounded-md transition ${
                  activeMenu === "settings"
                    ? "bg-buff-500 text-white"
                    : "hover:bg-gray-100 text-jet-600"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </button>
            </li>
            <li>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 text-jet-600 transition"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="md:hidden">
              <button className="text-jet-600">
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <div className="text-jet-600 md:block hidden">
              <h1 className="text-xl font-bold">
                {activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-jet-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-buff-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="text-jet-600 relative">
                <Mail className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-buff-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  5
                </span>
              </button>
              <div className="flex items-center">
                <DropdownMenu open={profileDropdownOpen} onOpenChange={setProfileDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <div 
                      className="w-8 h-8 bg-buff-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-buff-600 transition-colors"
                    >
                      <User className="h-5 w-5" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="text-center font-semibold text-lg">
                      Your Profile
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {onboardingError && (
                      <div className="bg-red-50 mx-2 my-1 p-3 rounded-md text-red-600 text-sm">
                        {onboardingError}
                      </div>
                    )}
                    
                    <div className="p-3">
                      <div className="mb-3">
                        <Label htmlFor="dropdown-name" className="text-sm font-medium block mb-1">
                          Name *
                        </Label>
                        <Input
                          id="dropdown-name"
                          name="name"
                          value={customerProfile.name}
                          onChange={handleProfileChange}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <Label htmlFor="dropdown-email" className="text-sm font-medium block mb-1">
                          Email *
                        </Label>
                        <Input
                          id="dropdown-email"
                          name="email"
                          type="email"
                          value={customerProfile.email}
                          onChange={handleProfileChange}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <Label htmlFor="dropdown-phone" className="text-sm font-medium block mb-1">
                          Phone *
                        </Label>
                        <Input
                          id="dropdown-phone"
                          name="phone"
                          value={customerProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <Label htmlFor="dropdown-company" className="text-sm font-medium block mb-1">
                          Company
                        </Label>
                        <Input
                          id="dropdown-company"
                          name="company"
                          value={customerProfile.company}
                          onChange={handleProfileChange}
                          className="w-full"
                        />
                      </div>
                      
                      <Button 
                        onClick={existingCustomerId ? handleProfileEdit : submitCustomerProfile} 
                        disabled={isSubmitting}
                        className="bg-buff-500 hover:bg-buff-600 text-white w-full"
                      >
                        {isSubmitting ? "Saving..." : "Update Profile"}
                      </Button>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="ml-2 text-jet-600 hidden md:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 bg-gray-50 flex-1 overflow-auto">
          {activeMenu === "overview" && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <h2 className="text-2xl font-bold text-jet-600 mb-2">
                  Welcome back, {user?.email?.split('@')[0] || 'User'}!
                </h2>
                <p className="text-jet-500">
                  Here's a summary of your recent activity and important updates.
                </p>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-jet-500 text-sm">Pending Orders</p>
                      <h3 className="text-3xl font-bold text-jet-600 mt-1">8</h3>
                    </div>
                    <div className="bg-buff-500/10 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-buff-500" />
                    </div>
                  </div>
                  <p className="text-green-600 text-sm mt-4 flex items-center">
                    <span className="inline-block mr-1">↑</span> 12% from last month
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-jet-500 text-sm">Products</p>
                      <h3 className="text-3xl font-bold text-jet-600 mt-1">124</h3>
                    </div>
                    <div className="bg-champagne-400/30 p-3 rounded-full">
                      <Package className="h-6 w-6 text-champagne-800" />
                    </div>
                  </div>
                  <p className="text-green-600 text-sm mt-4 flex items-center">
                    <span className="inline-block mr-1">↑</span> 8% from last month
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-jet-500 text-sm">Scheduled Deliveries</p>
                      <h3 className="text-3xl font-bold text-jet-600 mt-1">5</h3>
                    </div>
                    <div className="bg-buff-500/10 p-3 rounded-full">
                      <Truck className="h-6 w-6 text-buff-500" />
                    </div>
                  </div>
                  <p className="text-red-600 text-sm mt-4 flex items-center">
                    <span className="inline-block mr-1">↓</span> 3% from last month
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-jet-500 text-sm">Total Revenue</p>
                      <h3 className="text-3xl font-bold text-jet-600 mt-1">R32,450</h3>
                    </div>
                    <div className="bg-champagne-400/30 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-champagne-800" />
                    </div>
                  </div>
                  <p className="text-green-600 text-sm mt-4 flex items-center">
                    <span className="inline-block mr-1">↑</span> 18% from last month
                  </p>
                </motion.div>
              </div>

              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-jet-600">Recent Orders</h3>
                  <Button variant="outline" className="text-sm">
                    View All
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-jet-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-jet-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-jet-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-jet-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-jet-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          #OR-7893
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          Building Sand - Coarse
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-500">
                          Jul 28, 2023
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Delivered
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600 text-right">
                          R4,200
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          #OR-7894
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          Cement - 42.5N (10 bags)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-500">
                          Jul 29, 2023
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Processing
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600 text-right">
                          R2,850
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          #OR-7895
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          Crushed Stone - 19mm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-500">
                          Jul 30, 2023
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600 text-right">
                          R3,500
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          #OR-7896
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600">
                          Clay Bricks - Stock (500 units)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-500">
                          Aug 1, 2023
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-jet-600 text-right">
                          R5,750
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-jet-600">Notifications</h3>
                  <Button variant="ghost" className="text-sm text-buff-500">
                    Mark all as read
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start p-3 rounded-md bg-gray-50 border border-gray-100">
                    <AlertCircle className="h-5 w-5 text-buff-500 mr-3 mt-0.5" />
                    <div>
                      <p className="text-jet-600 font-medium">
                        Delivery scheduled for tomorrow
                      </p>
                      <p className="text-jet-500 text-sm">
                        Your order #OR-7893 is scheduled for delivery tomorrow between 9AM and 12PM.
                      </p>
                      <p className="text-jet-400 text-xs mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 rounded-md border border-transparent">
                    <Users className="h-5 w-5 text-champagne-700 mr-3 mt-0.5" />
                    <div>
                      <p className="text-jet-600 font-medium">
                        New product catalog available
                      </p>
                      <p className="text-jet-500 text-sm">
                        The latest product catalog for August 2023 is now available for download.
                      </p>
                      <p className="text-jet-400 text-xs mt-1">Yesterday</p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 rounded-md border border-transparent">
                    <Package className="h-5 w-5 text-champagne-700 mr-3 mt-0.5" />
                    <div>
                      <p className="text-jet-600 font-medium">Order confirmed</p>
                      <p className="text-jet-500 text-sm">
                        Your order #OR-7895 has been confirmed and is being processed.
                      </p>
                      <p className="text-jet-400 text-xs mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeMenu !== "overview" && (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-jet-600 mb-2">
                  {activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)} Content
                </h2>
                <p className="text-jet-500">
                  This section is under development. Check back soon!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please provide your information to get started with BlackRoc's services.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {onboardingError && (
              <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
                {onboardingError}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={customerProfile.name}
                onChange={handleProfileChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={customerProfile.email}
                onChange={handleProfileChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone *
              </Label>
              <Input
                id="phone"
                name="phone"
                value={customerProfile.phone}
                onChange={handleProfileChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                name="company"
                value={customerProfile.company}
                onChange={handleProfileChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={submitCustomerProfile} 
              disabled={isSubmitting}
              className="bg-buff-500 hover:bg-buff-600 text-white"
            >
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast notification component */}
      <Toaster />
    </div>
  );
};

export default Dashboard; 