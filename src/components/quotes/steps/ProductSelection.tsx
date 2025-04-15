import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../ui/table';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { 
  Search, 
  Plus, 
  Trash,
  MinusCircle,
  Tag,
  Package2,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';

interface Product {
  id: string;
  name: string;
  unit: string;
  unit_price: number;
}

interface QuoteItem {
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ProductSelectionProps {
  quoteData: {
    items: QuoteItem[];
    [key: string]: any;
  };
  updateQuoteData: (data: { items: QuoteItem[] }) => void;
}

export default function ProductSelection({ quoteData, updateQuoteData }: ProductSelectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>(quoteData.items || []);
  const initialRenderRef = useRef(true);
  
  // Only set initial state from props during the initial render
  useEffect(() => {
    if (initialRenderRef.current) {
      setSelectedItems(quoteData.items || []);
      initialRenderRef.current = false;
    }
  }, [quoteData.items]);
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // Only update parent when selectedItems changes and after initial render
  useEffect(() => {
    // Skip the first render effect to prevent synchronization loop
    if (!initialRenderRef.current) {
      updateQuoteData({ items: selectedItems });
    }
  }, [selectedItems, updateQuoteData]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit, unit_price')
        .order('name');
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleAddProduct = (product: Product) => {
    // Check if already added
    if (selectedItems.some(item => item.product_id === product.id)) {
      return;
    }
    
    // Add to selected items
    const newItem: QuoteItem = {
      product_id: product.id,
      product_name: product.name,
      unit: product.unit,
      quantity: 1,
      unit_price: product.unit_price,
      line_total: product.unit_price * 1
    };
    
    setSelectedItems(prevItems => [...prevItems, newItem]);
  };
  
  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };
  
  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    
    setSelectedItems(prevItems => prevItems.map(item => {
      if (item.product_id === productId) {
        return {
          ...item,
          quantity,
          line_total: item.unit_price * quantity
        };
      }
      return item;
    }));
  };
  
  const calculateSubtotal = (item: QuoteItem) => {
    return item.quantity * item.unit_price;
  };
  
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium text-gray-800">Select Products</h3>
        {selectedItems.length > 0 && (
          <Badge 
            variant="secondary" 
            className="bg-buff-50 text-buff-700 hover:bg-buff-100 border border-buff-200 py-1.5 px-3 text-sm"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            {selectedItems.length} {selectedItems.length === 1 ? 'product' : 'products'} selected
          </Badge>
        )}
      </div>
      
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-buff-500 focus:ring-buff-500"
            />
          </div>
          
          <div className="overflow-x-auto rounded-md bg-white">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="w-6 h-6 border-2 border-buff-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10">
                <Package2 className="h-12 w-12 mx-auto text-gray-300" />
                <p className="mt-2 text-gray-500 font-medium">No products found matching your search</p>
                <p className="text-gray-400 text-sm">Try a different search term</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50%]">Product</TableHead>
                    <TableHead className="w-[15%]">Unit</TableHead>
                    <TableHead className="w-[20%] text-right">Price</TableHead>
                    <TableHead className="w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const isSelected = selectedItems.some(item => item.product_id === product.id);
                    
                    return (
                      <TableRow 
                        key={product.id}
                        className={isSelected ? "bg-buff-50" : "hover:bg-gray-50"}
                      >
                        <TableCell className="font-medium text-gray-700">
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 text-gray-400 mr-2" />
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <DollarSign className="h-3.5 w-3.5 text-gray-400 mr-0.5" />
                            <span className="font-medium">{formatCurrency(product.unit_price)}</span>
                            <span className="text-gray-500 text-sm ml-1">/ {product.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={isSelected ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => isSelected 
                              ? handleRemoveProduct(product.id) 
                              : handleAddProduct(product)
                            }
                            className={`w-full ${isSelected 
                              ? 'bg-buff-100 text-buff-700 hover:bg-buff-200 border border-buff-200' 
                              : 'hover:bg-buff-50 hover:text-buff-600 hover:border-buff-200'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Trash className="h-3.5 w-3.5 mr-1" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedItems.length > 0 && (
        <Card className="border border-gray-200 mt-8">
          <CardContent className="p-6">
            <h4 className="font-medium text-gray-800 mb-4 flex items-center">
              <ShoppingCart className="h-4 w-4 mr-2 text-buff-500" />
              Selected Products ({selectedItems.length})
            </h4>
            
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[35%]">Product</TableHead>
                  <TableHead className="w-[10%]">Unit</TableHead>
                  <TableHead className="w-[15%] text-right">Price</TableHead>
                  <TableHead className="w-[20%]">Quantity</TableHead>
                  <TableHead className="w-[15%] text-right">Subtotal</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedItems.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium text-gray-700">{item.product_name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-md"
                          onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value, 10) || 1)}
                          className="h-8 w-16 text-center rounded-md"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-md"
                          onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calculateSubtotal(item))}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(item.product_id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="border-t-2 border-gray-200">
                  <TableCell colSpan={4} className="text-right font-medium text-gray-800">
                    Total:
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900">
                    {formatCurrency(calculateTotal())}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {selectedItems.length === 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 mt-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-700 font-medium">No products added to the quote yet</p>
          <p className="mt-1 text-gray-500">Search and select products from the list above</p>
        </div>
      )}
    </div>
  );
} 