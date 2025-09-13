"use client";

import { useDashboard } from './DashboardContext';
import StatCard from '../../components/StatCard';
import TopCustomersList from '../../components/TopCustomersList';
import { CustomerSegmentationChart } from '../../components/CustomerSegmentationChart';
import { Customer, Order } from '../../lib/clientApiService';
import { EmptyState } from '../../components/EmptyState'; // <-- IMPORT THE NEW COMPONENT

export default function DashboardOverviewPage() {
  const { selectedTenant } = useDashboard();

  // --- THIS IS THE FIX ---
  // If no tenant is selected, render the helpful EmptyState component.
  if (!selectedTenant) {
    return <EmptyState />;
  }
  // -----------------------

  // --- Data Processing for the selected tenant ---
  const { customers, orders } = selectedTenant;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  const processedCustomers = customers.map((c: Customer) => {
      const customerOrders = orders.filter((o: Order) => o.customer?.id === c.id);
      return { ...c, totalSpend: customerOrders.reduce((sum, order) => sum + order.totalPrice, 0) };
  });
  
  const topCustomers = processedCustomers.sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0)).slice(0, 5);

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
            <StatCard title="Avg. Order Value (AOV)" value={`$${averageOrderValue.toFixed(2)}`} />
            <StatCard title="Total Orders" value={orders.length} />
            <StatCard title="Total Customers" value={customers.length} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CustomerSegmentationChart customers={customers} />
            <TopCustomersList customers={topCustomers} />
        </div>
    </div>
  );
}