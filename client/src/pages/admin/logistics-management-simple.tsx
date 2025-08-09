  // Simple vehicle assignment function - WORKING VERSION
  const handleVehicleAssignment = async (order: any) => {
    try {
      console.log('🚚 [VEHICLE ASSIGNMENT] Starting for order:', order.orderNumber);
      
      // Set the selected order for vehicle assignment
      setSelectedOrderForVehicle(order);
      
      // Use mock data for testing
      const mockVehicles = [
        {
          id: 1,
          vehicleTemplateName: 'کامیون سبک',
          licensePlate: 'بغداد-123457',
          driverName: 'احمد محمدی',
          isAvailable: true,
          loadCapacity: 2000,
          vehicleType: 'کامیون سبک'
        },
        {
          id: 2,
          vehicleTemplateName: 'وانت',
          licensePlate: 'اربیل-789012',
          driverName: 'کریم احمد',
          isAvailable: true,
          loadCapacity: 1000,
          vehicleType: 'وانت'
        },
        {
          id: 3,
          vehicleTemplateName: 'کامیون سنگین',
          licensePlate: 'کرکوک-456789',
          driverName: 'صلاح احمد',
          isAvailable: true,
          loadCapacity: 5000,
          vehicleType: 'کامیون سنگین'
        }
      ];
      
      console.log('🔧 [MOCK DATA] Using mock vehicles:', mockVehicles.length);
      
      // Filter by weight capacity
      const orderWeight = order.calculatedWeight || order.totalWeight || 0;
      const availableVehicles = mockVehicles.filter(vehicle => 
        vehicle.isAvailable && vehicle.loadCapacity >= orderWeight
      );
      
      setAvailableFleetVehicles(availableVehicles);
      console.log('✅ [VEHICLES] Available vehicles:', availableVehicles.length);
      
      // Open the assignment dialog
      setIsVehicleAssignmentOpen(true);
      
    } catch (error) {
      console.error('Vehicle assignment error:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات خودروها",
        variant: "destructive"
      });
    }
  };