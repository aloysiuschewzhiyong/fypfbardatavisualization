"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Tooltip, Legend, Label } from "recharts"
import { getCouponUserCounts } from "@/app/firebase"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { cn } from "@/lib/utils" // Assuming you have a utility for classNames

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

const getRandomColor = (index: number) => {
  const hue = (index * 137.508) % 360; // Use golden angle approximation for better color distribution
  return `hsl(${hue}, 70%, 50%)`;
};

const CouponChart: React.FC = () => {
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCouponUserCounts()
        const chartData = Object.keys(data).map((couponName, index) => ({
          name: couponName,
          value: data[couponName],
          fill: getRandomColor(index),
        }))
        setChartData(chartData)

        const config = Object.keys(data).reduce((acc, couponName, index) => {
          acc[couponName] = {
            label: couponName,
            color: getRandomColor(index),
          }
          return acc
        }, {} as ChartConfig)

        config.visitors = {
          label: "Coupon",
        }

        setChartConfig(config)
      } catch (error) {
        console.error('Error fetching counts:', error)
        setError('Failed to fetch coupon user counts')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalUsers = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])

  const filteredChartData = chartData.filter(item => item.value > 0)

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="p-2">
        <p className="text-sm font-medium">Distribution of Redemption by Coupon Type</p>


        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <Tooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={filteredChartData}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={80}
              label
              labelLine={false}
            >
              {filteredChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              {totalUsers > 0 && (
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalUsers.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Users
                          </tspan>
                        </text>
                      )
                    }
                    return null;
                  }}
                />
              )}
            </Pie>
            <Legend content={<ChartLegendContent payload={chartData.map(item => ({
              value: item.name,
              color: item.fill,
              dataKey: 'value'
            }))} />} />
          </PieChart>
        </ChartContainer>

    </div>
  )
}

export default CouponChart
