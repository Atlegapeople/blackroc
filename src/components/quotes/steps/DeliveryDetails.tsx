import { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { CalendarIcon, MapPin, Truck, Calculator } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { format } from 'date-fns';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { formatCurrency } from '../../../lib/utils';
import { Card, CardContent } from '../../ui/card';
import { toast } from '../../ui/use-toast';

interface TransportZone {
  id: string;
  name: string;
  rate_per_km: number;
  notes: string;
}

interface Service {
  id: string;
  name: string;
  flat_rate: number;
}

interface DeliveryDetailsProps {
  quoteData: {
    delivery_address: string;
    delivery_date: string | null;
    transport_cost: number;
    services: {
      service_id: string;
      name: string;
      rate: number;
    }[];
  };
  updateQuoteData: (data: any) => void;
}

export default function DeliveryDetails({ quoteData, updateQuoteData }: DeliveryDetailsProps) {
  const [transportZones, setTransportZones] = useState<TransportZone[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    quoteData.delivery_date ? new Date(quoteData.delivery_date) : undefined
  );
  const [deliveryAddress, setDeliveryAddress] = useState(quoteData.delivery_address || '');
  const [transportCost, setTransportCost] = useState(quoteData.transport_cost || 0);
  const [selectedServices, setSelectedServices] = useState<{
    service_id: string;
    name: string;
    rate: number;
  }[]>(quoteData.services || []);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<TransportZone | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchTransportZonesAndServices();
  }, []);

  useEffect(() => {
    // Update parent component's state when our state changes
    updateQuoteData({
      delivery_address: deliveryAddress,
      delivery_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      transport_cost: transportCost,
      services: selectedServices,
    });
  }, [deliveryAddress, selectedDate, transportCost, selectedServices]);

  const fetchTransportZonesAndServices = async () => {
    setLoading(true);
    try {
      // Fetch transport zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('transport_zones')
        .select('*')
        .order('name');

      if (zonesError) throw zonesError;
      setTransportZones(zonesData || []);

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectZone = (zoneId: string) => {
    const zone = transportZones.find(z => z.id === zoneId);
    setSelectedZone(zone || null);
  };

  const calculateTransportCost = () => {
    if (!selectedZone) {
      toast({
        title: "Zone required",
        description: "Please select a delivery zone first",
        variant: "destructive"
      });
      return;
    }
    
    if (distance <= 0) {
      toast({
        title: "Invalid distance",
        description: "Please enter a valid distance greater than 0 km",
        variant: "destructive"
      });
      return;
    }
    
    setCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      const cost = selectedZone.rate_per_km * distance;
      setTransportCost(cost);
      setCalculating(false);
      
      toast({
        title: "Transport cost calculated",
        description: `${distance} km × ${formatCurrency(selectedZone.rate_per_km)}/km = ${formatCurrency(cost)}`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
    }, 500);
  };

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.service_id === service.id);
    
    if (isSelected) {
      // Remove service
      setSelectedServices(prev => prev.filter(s => s.service_id !== service.id));
    } else {
      // Add service
      setSelectedServices(prev => [
        ...prev, 
        { 
          service_id: service.id, 
          name: service.name,
          rate: service.flat_rate 
        }
      ]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium text-gray-800 mb-6">Delivery Details</h3>
        
        <div className="space-y-6">
          {/* Delivery Address */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <Label htmlFor="delivery-address" className="flex items-center text-gray-700 mb-2">
                <MapPin className="h-4 w-4 text-buff-500 mr-2" />
                <span>Delivery Address</span>
              </Label>
              <Textarea
                id="delivery-address"
                placeholder="Enter the full delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>
          
          {/* Delivery Date */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <Label className="flex items-center text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 text-buff-500 mr-2" />
                <span>Delivery Date</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {selectedDate ? (
                      format(selectedDate, 'PPP')
                    ) : (
                      <span className="text-muted-foreground">Select a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
          
          {/* Transport Zone and Cost */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center mb-4">
                <Truck className="h-5 w-5 text-buff-500 mr-2" />
                <h4 className="text-md font-medium text-gray-800">Transport Cost Calculator</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="transport-zone" className="text-gray-700">Delivery Zone</Label>
                  <Select onValueChange={handleSelectZone}>
                    <SelectTrigger id="transport-zone" className="w-full">
                      <SelectValue placeholder="Select delivery zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportZones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} - {formatCurrency(zone.rate_per_km)}/km
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedZone?.notes && (
                    <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded border border-amber-200">
                      {selectedZone.notes}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="distance" className="text-gray-700">Distance (km)</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="distance"
                        type="number"
                        min="0"
                        step="0.1"
                        value={distance || ''}
                        onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                        placeholder="Enter distance in km"
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        km
                      </span>
                    </div>
                    <Button 
                      onClick={calculateTransportCost} 
                      disabled={!selectedZone || distance <= 0 || calculating}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {calculating ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span>Calculating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Calculator className="h-4 w-4 mr-1.5" />
                          <span>Calculate</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                <Label htmlFor="transport-cost" className="text-gray-700 mb-2 block">Transport Cost</Label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="transport-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={transportCost || ''}
                      onChange={(e) => setTransportCost(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-lg font-medium pr-14"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ZAR
                    </span>
                  </div>
                </div>
                
                {selectedZone && distance > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    {distance} km × {formatCurrency(selectedZone.rate_per_km)}/km
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Services */}
          <Card className="border border-gray-200">
            <CardContent className="p-5">
              <h4 className="text-md font-medium text-gray-800 mb-4">Additional Services</h4>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-6 h-6 border-2 border-buff-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-gray-600">Loading services...</span>
                </div>
              ) : services.length === 0 ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                  No additional services available.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(service => {
                    const isSelected = selectedServices.some(s => s.service_id === service.id);
                    
                    return (
                      <div 
                        key={service.id} 
                        className={`border rounded-md p-3 cursor-pointer transition-colors ${
                          isSelected ? 'border-buff-300 bg-buff-50' : 'hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleService(service)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{service.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(service.flat_rate)}
                            </p>
                          </div>
                          <div>
                            {isSelected && (
                              <Badge className="bg-buff-500">Selected</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {selectedServices.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h5 className="font-medium mb-3 text-gray-800">Selected Services</h5>
                  <ul className="divide-y divide-gray-200">
                    {selectedServices.map(service => (
                      <li key={service.service_id} className="py-2 flex justify-between">
                        <span className="text-gray-700">{service.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(service.rate)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 