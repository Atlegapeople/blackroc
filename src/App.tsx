import { Suspense } from "react";
import { Routes, Route, useRoutes } from "react-router-dom";
import Home from "./components/home";
import POPIPolicy from "./components/POPIPolicy";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import LoginPage from "./components/ui/LoginPage";
import Dashboard from "./components/Dashboard";
import CreateQuoteForm from "./components/quotes/CreateQuoteForm";
import QuoteList from "./components/quotes/QuoteList";
import QuoteDetail from "./components/quotes/QuoteDetail";
import OrderList from "./components/orders/OrderList";
import OrderDetail from "./components/orders/OrderDetail";
import CustomerList from "./components/customers/CustomerList";
import InvoiceView from "./components/orders/Invoice";
import DashboardLayout from "./components/DashboardLayout";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/popi" element={<POPIPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dashboard routes with shared layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="quotes/create" element={<CreateQuoteForm />} />
            <Route path="quotes" element={<QuoteList />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="quotes/:id/edit" element={<CreateQuoteForm />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/invoice" element={<InvoiceView />} />
            <Route path="orders/:id/edit" element={<div className="p-8">Update Order Status (Coming Soon)</div>} />
            <Route path="customers" element={<CustomerList />} />
          </Route>
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
