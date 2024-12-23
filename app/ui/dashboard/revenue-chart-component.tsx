'use client';

import { BarChart } from '@tremor/react';
import { Card } from "@tremor/react";

type Revenue = {
  month: string;
  revenue: number;
};

export function RevenueChartComponent({ revenue }: { revenue: Revenue[] }) {
  const chartData = revenue.map((item) => ({
    name: item.month,
    "收入": item.revenue / 100,
  }));

  return (
    <Card>
      <BarChart
        data={chartData}
        index="name"
        categories={["收入"]}
        colors={["blue"]}
        valueFormatter={(number) => `$${(number).toLocaleString()}`}
        className="mt-4 h-80"
        showAnimation={true}
        customTooltip={(props) => (
          <div className="p-2 bg-white rounded-lg shadow-lg">
            <div className="text-gray-600">{props.payload?.[0]?.payload.name}</div>
            <div className="text-blue-600 font-bold">
              ¥{props.payload?.[0]?.value?.toLocaleString()}
            </div>
          </div>
        )}
        style={{
          // 自定义柱状图样式
          ['--tremor-color-scale-blue-500' as string]: '#3b82f6',
          ['--bar-border-radius' as string]: '6px 6px 0 0',
        }}
      />
    </Card>
  );
}
