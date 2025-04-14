import AuthForm from "../ui/AuthForm";
import logo from "../../images/logo.png";
import { Link } from "react-router-dom";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center">
          <Link to="/">
            <img 
              src={logo} 
              alt="BlackRoc Logo" 
              className="h-20 mx-auto mb-4 cursor-pointer hover:opacity-90 transition-opacity duration-200"
            />
          </Link>
          <p className="text-jet-500 text-sm">Construction Materials</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
