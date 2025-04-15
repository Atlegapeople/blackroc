import React, { useState, useEffect, useRef } from 'react';
import { Payment } from '../../lib/interfaces/finance';
import { getPaymentsForInvoice } from '../../lib/services/financeService';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface PaymentsListProps {
  invoiceId: string;
  onPaymentsLoaded?: (payments: Payment[]) => void;
}

const PaymentsList: React.FC<PaymentsListProps> = ({ invoiceId, onPaymentsLoaded }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onPaymentsLoadedRef = useRef(onPaymentsLoaded);

  // Update ref when callback changes
  useEffect(() => {
    onPaymentsLoadedRef.current = onPaymentsLoaded;
  }, [onPaymentsLoaded]);

  useEffect(() => {
    // Don't try to fetch if no invoiceId is provided
    if (!invoiceId) {
      setLoading(false);
      return;
    }
    
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('PaymentsList: Fetching payments for invoice', invoiceId);
        const paymentsList = await getPaymentsForInvoice(invoiceId);
        console.log('PaymentsList: Received payments', paymentsList);
        
        setPayments(paymentsList);
        
        if (onPaymentsLoadedRef.current) {
          onPaymentsLoadedRef.current(paymentsList);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  // Remove onPaymentsLoaded from dependency array to prevent infinite loop
  }, [invoiceId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'failed':
      case 'refunded':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'eft':
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4 mr-1" />;
      case 'cash':
        return <span className="mr-1">💵</span>;
      case 'credit_card':
        return <CreditCard className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'eft':
        return 'EFT';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'credit_card':
        return 'Credit Card';
      case 'other':
        return 'Other';
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {getStatusIcon(status)} Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {getStatusIcon(status)} Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {getStatusIcon(status)} Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {getStatusIcon(status)} Refunded
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!invoiceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-6">
            <p>No invoice selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-2 text-gray-500">Loading payments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-6">
            <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p>No payments recorded for this invoice yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getPaymentMethodIcon(payment.payment_method)}
                    {getPaymentMethodName(payment.payment_method)}
                  </div>
                </TableCell>
                <TableCell>{payment.reference_number || '-'}</TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Payment Summary */}
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentsList; 