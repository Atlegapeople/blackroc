import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  generateCustomerStatement, 
  getCustomerBalance 
} from '../../lib/services/financeService';
import { LedgerEntry, CustomerStatement as CustomerStatementType } from '../../lib/interfaces/finance';
import { formatCurrency } from '../../lib/utils';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '../../lib/supabase';
import { format, subMonths } from 'date-fns';

import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  ArrowLeft, 
  Download, 
  Printer,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar
} from 'lucide-react';
import { useToast } from '../ui/use-toast';

const CustomerStatement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [statement, setStatement] = useState<CustomerStatementType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  // Date range state
  const today = new Date();
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  
  const [startDate, setStartDate] = useState<string>(
    format(firstDayLastMonth, 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(lastDayLastMonth, 'yyyy-MM-dd')
  );

  const statementRef = useRef<HTMLDivElement>(null);
  
  // Use our custom type definition
  const handlePrint = useReactToPrint({
    content: () => statementRef.current,
    documentTitle: `Statement-${customer?.name}-${startDate}`,
    onAfterPrint: () => console.log('Printed successfully')
  });

  // Simple wrapper function
  const printStatement = () => handlePrint();

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setCustomer(data);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer details');
      }
    };
    
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const fetchStatement = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Generate statement for the selected period
        const statementData = await generateCustomerStatement(
          id,
          startDate,
          endDate
        );
        
        if (!statementData) {
          throw new Error('Failed to generate statement');
        }
        
        setStatement(statementData);
        
        // Get total account balance
        const balance = await getCustomerBalance(id);
        setTotalBalance(balance);
      } catch (err) {
        console.error('Error generating statement:', err);
        setError('Failed to generate customer statement');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate customer statement'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatement();
  }, [id, startDate, endDate, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleThisMonth = () => {
    const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(format(firstDayThisMonth, 'yyyy-MM-dd'));
    setEndDate(format(lastDayThisMonth, 'yyyy-MM-dd'));
  };

  const handleLastMonth = () => {
    setStartDate(format(firstDayLastMonth, 'yyyy-MM-dd'));
    setEndDate(format(lastDayLastMonth, 'yyyy-MM-dd'));
  };

  const handleLast3Months = () => {
    const threeMonthsAgo = subMonths(today, 3);
    const firstDayThreeMonthsAgo = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1);
    
    setStartDate(format(firstDayThreeMonthsAgo, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
  };

  if (loading && !statement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-buff-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Generating statement...</p>
        </div>
      </div>
    );
  }

  if (error && !statement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)} className="bg-buff-500 hover:bg-buff-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-jet-600">Customer Statement</h1>
            <p className="text-gray-500">
              {customer?.name}{customer?.company ? ` - ${customer.company}` : ''}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={printStatement}
              className="flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
              onClick={printStatement}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>
      
      {/* Statement Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statement Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex items-end space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLastMonth}
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Last Month
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleThisMonth}
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  This Month
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLast3Months}
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Last 3 Months
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Statement Content */}
      <main className="max-w-7xl mx-auto px-6 pb-8">
        {statement ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden" ref={statementRef}>
            <div className="p-8">
              {/* Statement Header */}
              <div className="flex justify-between border-b border-gray-200 pb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Account Statement</h1>
                  <p className="text-gray-600">Period: {formatDate(startDate)} to {formatDate(endDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-gray-800">BlackRoc Construction Materials</p>
                  <p className="text-gray-600">123 Construction Way</p>
                  <p className="text-gray-600">Cape Town, South Africa, 8001</p>
                  <p className="text-gray-600">+27 21 123 4567</p>
                  <p className="text-gray-600">info@blackroc.co.za</p>
                </div>
              </div>
              
              {/* Customer Info & Statement Summary */}
              <div className="flex flex-col md:flex-row justify-between mt-6 gap-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Customer</h2>
                  <p className="font-medium">{statement.customer.name}</p>
                  {statement.customer.company && (
                    <p className="text-gray-700">{statement.customer.company}</p>
                  )}
                  <p className="text-gray-700">{statement.customer.email}</p>
                  {statement.customer.phone && (
                    <p className="text-gray-700">{statement.customer.phone}</p>
                  )}
                </div>
                
                <div className="md:text-right">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Summary</h2>
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between md:justify-end md:space-x-8">
                      <span className="text-gray-600">Opening Balance:</span>
                      <span className="font-medium">{formatCurrency(statement.openingBalance)}</span>
                    </div>
                    <div className="flex justify-between md:justify-end md:space-x-8">
                      <span className="text-gray-600">Total Debits:</span>
                      <span className="font-medium text-red-600">{formatCurrency(statement.totalDebits || 0)}</span>
                    </div>
                    <div className="flex justify-between md:justify-end md:space-x-8">
                      <span className="text-gray-600">Total Credits:</span>
                      <span className="font-medium text-green-600">{formatCurrency(statement.totalCredits || 0)}</span>
                    </div>
                    <div className="flex justify-between md:justify-end md:space-x-8 pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-800 font-medium">Closing Balance:</span>
                      <span className="font-bold">{formatCurrency(statement.closingBalance)}</span>
                    </div>
                    <div className="flex justify-between md:justify-end md:space-x-8 pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-800 font-medium">Current Balance:</span>
                      <span className={`font-bold ${totalBalance > 0 ? 'text-red-600' : totalBalance < 0 ? 'text-green-600' : ''}`}>
                        {formatCurrency(totalBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ledger Entries */}
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction History</h2>
                
                {statement.entries.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                    No transactions found for the selected period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{formatDate(startDate)}</TableCell>
                        <TableCell><em>Opening Balance</em></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(statement.openingBalance)}</TableCell>
                      </TableRow>

                      {statement.entries.map((entry: LedgerEntry, index: number) => {
                        // Calculate running balance
                        const previousEntries = statement.entries.slice(0, index);
                        const runningBalance = previousEntries.reduce((balance, prevEntry) => {
                          if (prevEntry.entry_type === 'debit') {
                            return balance + prevEntry.amount;
                          } else {
                            return balance - prevEntry.amount;
                          }
                        }, statement.openingBalance);
                        
                        // Calculate current entry balance
                        const currentBalance = entry.entry_type === 'debit' 
                          ? runningBalance + entry.amount 
                          : runningBalance - entry.amount;
                        
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {entry.entry_type === 'debit' ? (
                                  <ArrowUpCircle className="w-4 h-4 text-red-500 mr-2" />
                                ) : (
                                  <ArrowDownCircle className="w-4 h-4 text-green-500 mr-2" />
                                )}
                                {entry.description}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.entry_type === 'debit' ? formatCurrency(entry.amount) : ''}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.entry_type === 'credit' ? formatCurrency(entry.amount) : ''}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(currentBalance)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      <TableRow className="bg-gray-50 font-medium">
                        <TableCell>{formatDate(endDate)}</TableCell>
                        <TableCell><em>Closing Balance</em></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(statement.closingBalance)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
              
              {/* Notes */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Notes</h3>
                <p className="text-gray-700">
                  This statement reflects activities on your account during the specified period.
                  Please contact us if you have any questions about this statement.
                </p>
                <p className="text-gray-700 mt-2">
                  Email: accounting@blackroc.co.za | Phone: +27 21 123 4567
                </p>
              </div>
              
              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} BlackRoc Construction Materials. All rights reserved.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-12">
            <p>No statement data available. Please select a different date range.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerStatement; 