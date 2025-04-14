import { useState } from "react";
import { signIn, signUp, resetPassword } from "@/lib/auth"; // Adjust if your path is different
import { supabase } from "@/lib/supabase";
import { Button } from "./button";
import { Input } from "./input";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setIsError(true);
          setMessage(error.message);
        } else {
          setMessage("Logged in successfully!");
          // Redirect to dashboard
          window.location.href = "/dashboard";
        }
      } else if (mode === "register") {
        // First check if the user already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (existingUser) {
          setIsError(true);
          setMessage("An account with this email already exists. Please log in instead.");
          return;
        }

        // Register new user
        const { data, error } = await signUp(email, password);
        
        if (error) {
          setIsError(true);
          setMessage(error.message);
        } else {
          // Try to sign in immediately
          const { error: signInError } = await signIn(email, password);
          
          if (signInError) {
            // If immediate sign-in fails, notify the user to check email
            setMessage("Registration successful! Please check your email to confirm your account, then sign in.");
          } else {
            setMessage("Registration successful! Redirecting to dashboard...");
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1500);
          }
        }
      } else if (mode === "reset") {
        const { error } = await resetPassword(email);
        if (error) {
          setIsError(true);
          setMessage(error.message);
        } else {
          setMessage("Password reset link sent to your email.");
        }
      }
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-jet-600 text-center">
        {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Reset Password"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-jet-600 block">
            Email
          </label>
          <Input
            id="email"
            type="email"
            className="w-full"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {mode !== "reset" && (
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-jet-600 block">
              Password
            </label>
            <Input
              id="password"
              type="password"
              className="w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        
        <Button 
          type="submit"
          className={`w-full bg-buff-500 hover:bg-buff-600 text-white ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? "Processing..." : 
            mode === "login" ? "Sign In" : 
            mode === "register" ? "Create Account" : 
            "Send Reset Link"}
        </Button>
        
        {message && (
          <div className={`p-3 rounded-md text-sm ${isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {message}
          </div>
        )}
        
        <div className="text-center text-sm space-y-2 pt-4 text-jet-500">
          {mode !== "login" && (
            <button type="button" className="text-buff-600 hover:text-buff-700 block w-full" onClick={() => setMode("login")}>
              Already have an account? Sign In
            </button>
          )}
          {mode !== "register" && (
            <button type="button" className="text-buff-600 hover:text-buff-700 block w-full" onClick={() => setMode("register")}>
              Don't have an account? Sign Up
            </button>
          )}
          {mode !== "reset" && (
            <button type="button" className="text-buff-600 hover:text-buff-700 block w-full" onClick={() => setMode("reset")}>
              Forgot password?
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
