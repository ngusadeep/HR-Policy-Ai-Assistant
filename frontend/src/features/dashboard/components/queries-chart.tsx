import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const data = [
  { month: 'Jan', queries: 312 },
  { month: 'Feb', queries: 428 },
  { month: 'Mar', queries: 391 },
  { month: 'Apr', queries: 514 },
  { month: 'May', queries: 476 },
  { month: 'Jun', queries: 603 },
  { month: 'Jul', queries: 558 },
  { month: 'Aug', queries: 689 },
  { month: 'Sep', queries: 724 },
  { month: 'Oct', queries: 811 },
  { month: 'Nov', queries: 763 },
  { month: 'Dec', queries: 892 },
]

export function QueriesChart() {
  return (
    <ResponsiveContainer width='100%' height={300}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray='3 3' className='stroke-border' vertical={false} />
        <XAxis
          dataKey='month'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [value ?? 0, 'Queries']}
        />
        <Bar
          dataKey='queries'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
