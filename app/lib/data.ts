import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  Device,
} from './definitions';
import { formatCurrency } from './utils';
import { SettingField } from './definitions';
import { auth } from '@/auth';
import { getCurrentUserId } from './auth';

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`
      SELECT * FROM revenue
      WHERE user_id = ${await getCurrentUserId()}
    `;

    // console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const userId = await getCurrentUserId();
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE invoices.user_id = ${userId}
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices WHERE user_id = ${await getCurrentUserId()}`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers WHERE user_id = ${await getCurrentUserId()}`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices
         WHERE user_id = ${await getCurrentUserId()}`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        invoices.user_id = ${await getCurrentUserId()} AND
        (customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`})
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      invoices.user_id = ${await getCurrentUserId()} AND
      (customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`})
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id} AND invoices.user_id = ${await getCurrentUserId()};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      WHERE user_id = ${await getCurrentUserId()}
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
      customers.user_id = ${await getCurrentUserId()} AND
		  (customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`})
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

// Fetch user settings from the database
export async function fetchUserSettings() {
  try {
    const data = await sql<SettingField>`
      SELECT id, name, email, password
      FROM users
      WHERE id = ${await getCurrentUserId()}
    `;

    const userSettings = data.rows[0];
    return userSettings;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user settings.');
  }
}

// Update user settings in the database
export async function updateUserSettings(settings: Partial<SettingField>): Promise<void> {
  try {
    const { name, email, password } = settings;

    await sql`
      UPDATE users
      SET
        name = ${name},
        email = ${email},
        password = ${password}
      WHERE id = ${await getCurrentUserId()}
    `;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update user settings.');
  }
}

// Fetch devices for a user
export async function fetchDevices(userId: string) {
  try {
    const data = await sql<Device>`
      SELECT id, user_id, device_name, last_login
      FROM devices
      WHERE user_id = ${userId}
    `;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch devices.');
  }
}

// Add a new device for a user
export async function addDevice(userId: string, deviceName: string) {
  try {
    await sql`
      INSERT INTO devices (user_id, device_name, last_login)
      VALUES (${userId}, ${deviceName}, NOW())
    `;

    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to add device.');
  }
}

// Create devices table if it doesn't exist
export async function createDevicesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        device_name TEXT NOT NULL,
        last_login TIMESTAMP NOT NULL
      )
    `;

    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to create devices table.');
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const data = await sql<CustomerField>`
      SELECT id, name, email, image_url
      FROM customers
      WHERE id = ${id} AND user_id = ${await getCurrentUserId()}
    `;

    const customer = data.rows[0];
    return customer;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer.');
  }
}

export async function fetchCustomerStats(id: string) {
  try {
    const data = await sql`
      SELECT
        COUNT(*) AS total_orders,
        SUM(amount) AS total_spend
      FROM invoices
      WHERE customer_id = ${id} AND user_id = ${await getCurrentUserId()}
    `;

    const stats = data.rows[0];
    return stats;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customer stats.');
  }
}
