// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
const users = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    name: 'User',
    email: 'user@nextmail.com',
    password: '123456',
  },
  {
    id: '18bef991-b641-11ef-921b-0242ac110002',
    name: 'Myouren',
    email: 'myouren@myouren.com',
    password: '9994205',
  }
];

const customers = [
  {
    id: 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa',
    name: 'A',
    email: 'aaaaa@aaaaa.com',
    image_url: '/customers/evil-rabbit.png',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    id: '3958dc9e-712f-4377-85e9-fec4b6a6442a',
    name: 'B',
    email: 'bbbbb@bbbbb.com',
    image_url: '/customers/delba-de-oliveira.png',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
    name: 'C',
    email: 'ccccc@ccccc.com',
    image_url: '/customers/lee-robinson.png',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    id: '76d65c26-f784-44a2-ac19-586678f7c2f2',
    name: 'D',
    email: 'ddddd@ddddd.com',
    image_url: '/customers/michael-novotny.png',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    id: 'CC27C14A-0ACF-4F4A-A6C9-D45682C144B9',
    name: 'E',
    email: 'aaaaa@aaaaa.com',
    image_url: '/customers/amy-burns.png',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    id: '13D07535-C59E-4157-A011-F8D2EF4E0CBB',
    name: 'F',
    email: 'aaaaa@aaaaa.com',
    image_url: '/customers/balazs-orban.png',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
];

const invoices = [
  {
    customer_id: customers[0].id,
    amount: 15795,
    status: 'pending',
    date: '2022-12-06',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[1].id,
    amount: 20348,
    status: 'pending',
    date: '2022-11-14',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[4].id,
    amount: 3040,
    status: 'paid',
    date: '2022-10-29',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[3].id,
    amount: 44800,
    status: 'paid',
    date: '2023-09-10',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[5].id,
    amount: 34577,
    status: 'pending',
    date: '2023-08-05',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[2].id,
    amount: 54246,
    status: 'pending',
    date: '2023-07-16',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[0].id,
    amount: 666,
    status: 'pending',
    date: '2023-06-27',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[3].id,
    amount: 32545,
    status: 'paid',
    date: '2023-06-09',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[4].id,
    amount: 1250,
    status: 'paid',
    date: '2023-06-17',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[5].id,
    amount: 8546,
    status: 'paid',
    date: '2023-06-07',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[1].id,
    amount: 500,
    status: 'paid',
    date: '2023-08-19',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[5].id,
    amount: 8945,
    status: 'paid',
    date: '2023-06-03',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
  {
    customer_id: customers[2].id,
    amount: 1000,
    status: 'paid',
    date: '2022-06-05',
    user: '410544b2-4001-4271-9855-fec4b6a6442a',
  },
];

const revenue = [
  { month: '1', revenue: 2000, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '2', revenue: 1800, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '3', revenue: 2200, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '4', revenue: 2500, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '5', revenue: 2300, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '6', revenue: 3200, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '7', revenue: 3500, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '8', revenue: 3700, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '9', revenue: 2500, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '10', revenue: 2800, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '11', revenue: 3000, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
  { month: '12', revenue: 4800, user: '410544b2-4001-4271-9855-fec4b6a6442a' },
];

export { users, customers, invoices, revenue };
