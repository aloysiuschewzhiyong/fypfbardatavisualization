import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';
import { getActiveCampaignCounts } from '@/app/firebase';

interface Props {}

const CampaignChart: React.FC<Props> = () => {
  const [chartData, setChartData] = React.useState<{ month: string; campaigns: number }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await getActiveCampaignCounts();
        setChartData(data);
      } catch (error) {
        console.error('Error fetching active campaign counts:', error);
        setError('Failed to fetch active campaign counts');
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
    campaigns: {
      label: 'Campaigns active',
      color: 'currentColor',
    },

  };

  return (
    <div className='p-2'>
      <p className='font-medium text-sm bg-transparent'>Active Campaign by Month</p>
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart data={chartData}  accessibilityLayer>
        <CartesianGrid vertical={false}/>
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false}     tickFormatter={(value) => value.slice(0, 3)} />
  
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Bar dataKey="campaigns" fill="currentColor"  radius={[4, 4, 0, 0]}
          stackId="a"
          minPointSize={5}>
          <LabelList dataKey="campaigns" position="top" />
        </Bar>
      </BarChart>
    </ChartContainer>
    </div>
  );
};



export default CampaignChart;
