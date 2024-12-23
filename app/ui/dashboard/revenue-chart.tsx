import { CalendarIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import { fetchRevenue } from '@/app/lib/data';
import { RevenueChartComponent } from './revenue-chart-component';

// 这个组件只是一个展示组件。
// 有关数据可视化UI，请查看：
// https://www.tremor.so/
// https://www.chartjs.org/
// https://airbnb.io/visx/

export default async function RevenueChart() {
  const revenue = await fetchRevenue();

  if (!revenue || revenue.length === 0) {
    return <p className="mt-4 text-gray-400">没有可用数据。</p>;
  }

  return (
    <div className="w-full md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        最近收入
      </h2>
      <div className="rounded-xl bg-gray-50 p-4">
        <RevenueChartComponent revenue={revenue} />
        <div className="flex items-center pb-2 pt-6">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500">最近12个月</h3>
        </div>
      </div>
    </div>
  );
}
