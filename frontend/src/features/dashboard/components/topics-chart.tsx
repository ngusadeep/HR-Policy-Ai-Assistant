import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const data = [
  { week: 'W1', leave: 48, conduct: 31, benefits: 22, recruitment: 17, safety: 12 },
  { week: 'W2', leave: 52, conduct: 28, benefits: 35, recruitment: 21, safety: 9 },
  { week: 'W3', leave: 61, conduct: 44, benefits: 29, recruitment: 18, safety: 15 },
  { week: 'W4', leave: 45, conduct: 38, benefits: 41, recruitment: 26, safety: 20 },
  { week: 'W5', leave: 70, conduct: 33, benefits: 38, recruitment: 30, safety: 11 },
  { week: 'W6', leave: 58, conduct: 50, benefits: 27, recruitment: 22, safety: 18 },
  { week: 'W7', leave: 76, conduct: 41, benefits: 44, recruitment: 35, safety: 14 },
  { week: 'W8', leave: 63, conduct: 56, benefits: 52, recruitment: 28, safety: 23 },
]

const COLORS = {
  leave: 'hsl(221, 83%, 53%)',
  conduct: 'hsl(142, 71%, 45%)',
  benefits: 'hsl(38, 92%, 50%)',
  recruitment: 'hsl(262, 83%, 58%)',
  safety: 'hsl(0, 84%, 60%)',
}

export function TopicsChart() {
  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray='3 3' className='stroke-border' vertical={false} />
        <XAxis
          dataKey='week'
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
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          iconType='circle'
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(value) =>
            value.charAt(0).toUpperCase() + value.slice(1)
          }
        />
        <Area type='monotone' dataKey='leave' stroke={COLORS.leave} fill={COLORS.leave} fillOpacity={0.12} strokeWidth={2} />
        <Area type='monotone' dataKey='conduct' stroke={COLORS.conduct} fill={COLORS.conduct} fillOpacity={0.12} strokeWidth={2} />
        <Area type='monotone' dataKey='benefits' stroke={COLORS.benefits} fill={COLORS.benefits} fillOpacity={0.12} strokeWidth={2} />
        <Area type='monotone' dataKey='recruitment' stroke={COLORS.recruitment} fill={COLORS.recruitment} fillOpacity={0.12} strokeWidth={2} />
        <Area type='monotone' dataKey='safety' stroke={COLORS.safety} fill={COLORS.safety} fillOpacity={0.12} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
