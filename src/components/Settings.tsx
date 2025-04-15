import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  User, 
  Building, 
  Bell, 
  Paintbrush, 
  Shield, 
  Save,
  Eye
} from 'lucide-react';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { useToast } from './ui/use-toast';
import { supabase } from '../lib/supabase';

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // User profile form state
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Company information form state
  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'BlackRoc Construction Materials',
    address: '123 Construction Way, Cape Town, South Africa, 8001',
    phone: '+27 21 123 4567',
    email: 'info@blackroc.co.za',
    vatNumber: '123456789',
    registrationNumber: 'REG123456'
  });
  
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    orderUpdates: true,
    paymentReminders: true,
    marketingEmails: false
  });
  
  // Display preferences state
  const [displayPrefs, setDisplayPrefs] = useState({
    darkMode: false,
    compactView: false,
    highContrast: false
  });
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setUserProfile({
            ...userProfile,
            email: user.email || '',
          });
          
          // Fetch user profile data from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileData && !profileError) {
            setUserProfile({
              ...userProfile,
              name: profileData.name || '',
              email: user.email || '',
              phone: profileData.phone || ''
            });
          } else if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "Resource not found", which is expected if the profile doesn't exist yet
            console.error('Error fetching profile data:', profileError);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleUserProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile({
      ...userProfile,
      [e.target.name]: e.target.value
    });
  };
  
  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyInfo({
      ...companyInfo,
      [e.target.name]: e.target.value
    });
  };
  
  const handleNotificationPrefsChange = (key: string) => {
    setNotificationPrefs({
      ...notificationPrefs,
      [key]: !notificationPrefs[key as keyof typeof notificationPrefs]
    });
  };
  
  const handleDisplayPrefsChange = (key: string) => {
    setDisplayPrefs({
      ...displayPrefs,
      [key]: !displayPrefs[key as keyof typeof displayPrefs]
    });
  };
  
  const saveUserProfile = async () => {
    if (userProfile.newPassword !== userProfile.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Update profile information in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: userProfile.name,
          phone: userProfile.phone,
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('Error updating profile data:', profileError);
        throw profileError;
      }
      
      // Update password if provided
      if (userProfile.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: userProfile.newPassword
        });
        
        if (passwordError) throw passwordError;
      }
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      
      // Clear password fields
      setUserProfile({
        ...userProfile,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveCompanyInfo = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Success',
        description: 'Company information updated successfully',
      });
    }, 1000);
  };
  
  const saveNotificationPrefs = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully',
      });
    }, 1000);
  };
  
  const saveDisplayPrefs = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Success',
        description: 'Display preferences updated successfully',
      });
    }, 1000);
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 flex w-full border-b overflow-x-auto">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center">
            <Paintbrush className="w-4 h-4 mr-2" />
            Display
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={userProfile.name} 
                  onChange={handleUserProfileChange} 
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  value={userProfile.email} 
                  onChange={handleUserProfileChange}
                  disabled
                  placeholder="Your email address"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email address cannot be changed
                </p>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={userProfile.phone} 
                  onChange={handleUserProfileChange} 
                  placeholder="Your phone number"
                />
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    name="currentPassword" 
                    type="password" 
                    value={userProfile.currentPassword} 
                    onChange={handleUserProfileChange} 
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    name="newPassword" 
                    type="password" 
                    value={userProfile.newPassword} 
                    onChange={handleUserProfileChange} 
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    value={userProfile.confirmPassword} 
                    onChange={handleUserProfileChange} 
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveUserProfile} 
                disabled={isLoading}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Company Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details used in invoices and other documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  name="companyName" 
                  value={companyInfo.companyName} 
                  onChange={handleCompanyInfoChange} 
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={companyInfo.address} 
                  onChange={handleCompanyInfoChange} 
                  placeholder="Company address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <Input 
                    id="companyPhone" 
                    name="phone" 
                    value={companyInfo.phone} 
                    onChange={handleCompanyInfoChange} 
                    placeholder="Company phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email Address</Label>
                  <Input 
                    id="companyEmail" 
                    name="email" 
                    value={companyInfo.email} 
                    onChange={handleCompanyInfoChange} 
                    placeholder="Company email address"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input 
                    id="vatNumber" 
                    name="vatNumber" 
                    value={companyInfo.vatNumber} 
                    onChange={handleCompanyInfoChange} 
                    placeholder="Company VAT number"
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input 
                    id="registrationNumber" 
                    name="registrationNumber" 
                    value={companyInfo.registrationNumber} 
                    onChange={handleCompanyInfoChange} 
                    placeholder="Company registration number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="companyLogo">Company Logo</Label>
                <div className="mt-1 flex items-center">
                  <Input 
                    id="companyLogo" 
                    type="file" 
                    accept="image/*"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveCompanyInfo} 
                disabled={isLoading}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Company Information
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.emailNotifications} 
                  onCheckedChange={() => handleNotificationPrefsChange('emailNotifications')} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Order Updates</h3>
                  <p className="text-sm text-gray-500">
                    Get notified when order status changes
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.orderUpdates} 
                  onCheckedChange={() => handleNotificationPrefsChange('orderUpdates')} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Payment Reminders</h3>
                  <p className="text-sm text-gray-500">
                    Receive reminders about upcoming and overdue payments
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.paymentReminders} 
                  onCheckedChange={() => handleNotificationPrefsChange('paymentReminders')} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Marketing Emails</h3>
                  <p className="text-sm text-gray-500">
                    Get updates about new products, services, and promotions
                  </p>
                </div>
                <Switch 
                  checked={notificationPrefs.marketingEmails} 
                  onCheckedChange={() => handleNotificationPrefsChange('marketingEmails')} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveNotificationPrefs} 
                disabled={isLoading}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notification Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Display Tab */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize how the dashboard appears
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Dark Mode</h3>
                  <p className="text-sm text-gray-500">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch 
                  checked={displayPrefs.darkMode} 
                  onCheckedChange={() => handleDisplayPrefsChange('darkMode')} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Compact View</h3>
                  <p className="text-sm text-gray-500">
                    Reduce spacing and size of elements
                  </p>
                </div>
                <Switch 
                  checked={displayPrefs.compactView} 
                  onCheckedChange={() => handleDisplayPrefsChange('compactView')} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">High Contrast</h3>
                  <p className="text-sm text-gray-500">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch 
                  checked={displayPrefs.highContrast} 
                  onCheckedChange={() => handleDisplayPrefsChange('highContrast')} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={saveDisplayPrefs} 
                disabled={isLoading}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Display Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage account security and session information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline" className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium">Active Sessions</h3>
                <p className="text-sm text-gray-500 mb-4">
                  View and manage devices logged into your account
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-gray-500">
                        Windows • Chrome • Cape Town, South Africa
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active Now
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Logout of All Other Devices
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Danger Zone</h3>
                <Button variant="destructive" className="flex items-center">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 