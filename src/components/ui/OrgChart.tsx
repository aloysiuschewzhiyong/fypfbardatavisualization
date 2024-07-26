"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import { getOrganizationUserCounts } from "@/app/firebase"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { cn } from "@/lib/utils" // Assuming you have a utility for classNames

const getRandomColor = (index: number) => {
  const hue = (index * 137.508) % 360; // Use golden angle approximation for better color distribution
  return `hsl(${hue}, 70%, 50%)`;
}

export function OrgChart() {
  const [chartData, setChartData] = React.useState<{ name: string, value: number, fill: string }[]>([])
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await getOrganizationUserCounts()
        const data = counts
          ? Object.keys(counts).map((organization, index) => ({
              name: organization,
              value: counts[organization],
              fill: getRandomColor(index),
            }))
          : []
        setChartData(data)

        const config = Object.keys(counts).reduce((acc, organization, index) => {
          acc[organization] = {
            label: organization,
            color: getRandomColor(index),
          }
          return acc
        }, {} as ChartConfig)

        config.visitors = {
          label: "Users",
        }

        setChartConfig(config)
      } catch (error) {
        console.error('Error fetching counts:', error)
        setError('Failed to fetch organization user counts')
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
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
        <p className="font-medium text-sm">Distrubution of Organizations</p>
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
          innerRadius={55}
          outerRadius={75}
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

export default OrgChart
