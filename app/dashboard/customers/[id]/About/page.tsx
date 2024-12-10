import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Breadcrumbs from '@/app/ui/customers/breadcrumbs';
import { fetchCustomerById, fetchCustomerStats } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Details',
};

export default async function CustomerDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [customerData, statsData] = await Promise.all([
        fetchCustomerById(id),
        fetchCustomerStats(id),
      ]);

      if (!customerData) {
        notFound();
      }

      setCustomer(customerData);
      setStats(statsData);
    }

    fetchData();
  }, [id]);

  if (!customer || !stats) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Customer Details',
            href: `/dashboard/customers/${id}/details`,
            active: true,
          },
        ]}
      />
      <section>
        <h1>{customer.name}</h1>
        <p>{customer.email}</p>
        <div>
          <h2>Statistics</h2>
          <p>Total Orders: {stats.totalOrders}</p>
          <p>Total Spend: {stats.totalSpend}</p>
        </div>
        <div>
          <button>Edit Customer</button>
          <button>Delete Customer</button>
        </div>
      </section>
    </main>
  );
}