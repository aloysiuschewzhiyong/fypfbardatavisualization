import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';
import { getMonthlyRedemptionCount } from '@/app/firebase'; // Ensure this import matches your actual file structure

interface Props {}

const CouponRedemptionChart: React.FC<Props> = () => {
  const [chartData, setChartData] = React.useState<{ month: string; redemptions: number }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await getMonthlyRedemptionCount();
        setChartData(data);
      } catch (error) {
        console.error('Error fetching monthly redemption counts:', error);
        setError('Failed to fetch monthly redemption counts');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const chartConfig: ChartConfig = {
    redemptions: {
      label: 'Redemptions',
      color: 'currentColor',
    },
  };
  const roundUpToNearest10 = (num: number) => Math.ceil(num / 10) * 10;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  
  const maxCampaigns = roundUpToNearest10(Math.max(...chartData.map(data => data.redemptions)));


  return (
    <div className='p-2'>
      <p className='font-medium text-sm bg-transparent'>Coupon Redemptions by Month</p>
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart data={chartData} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
          <YAxis domain={[0, maxCampaigns]} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar dataKey="redemptions" fill="currentColor" radius={[4, 4, 0, 0]} stackId="a" minPointSize={5}>
            <LabelList dataKey="redemptions" position="top" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default CouponRedemptionChart;
