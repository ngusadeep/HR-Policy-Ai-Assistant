import {
  BookOpen,
  MessageSquareText,
  Users,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  Upload,
  MessagesSquare,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { QueriesChart } from './components/queries-chart'
import { TopicsChart } from './components/topics-chart'
import { RecentQueries } from './components/recent-queries'
import { PolicyDocuments } from './components/policy-documents'

const stats = [
  {
    title: 'Policy Documents',
    value: '47',
    change: '+3 this week',
    trend: 'up',
    icon: BookOpen,
    description: 'Indexed in knowledge base',
  },
  {
    title: 'Queries This Month',
    value: '892',
    change: '+16.8% vs last month',
    trend: 'up',
    icon: MessageSquareText,
    description: 'Employee AI interactions',
  },
  {
    title: 'Active Users',
    value: '134',
    change: '+12 since last month',
    trend: 'up',
    icon: Users,
    description: 'Employees using the assistant',
  },
  {
    title: 'Escalated Queries',
    value: '18',
    change: '+5 this week',
    trend: 'down',
    icon: TriangleAlert,
    description: 'Require HR team review',
  },
]

export function Dashboard() {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* Page heading */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>HR Admin Dashboard</h1>
            <p className='text-sm text-muted-foreground'>
              Monitor AI policy assistant usage and document health.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' asChild>
              <Link to='/chat'>
                <MessagesSquare className='mr-2 h-4 w-4' />
                Open Chat
              </Link>
            </Button>
            <Button>
              <Upload className='mr-2 h-4 w-4' />
              Upload Policy
            </Button>
          </div>
        </div>

        {/* KPI stat cards */}
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {stats.map((stat) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
            const trendColor =
              stat.trend === 'up'
                ? stat.title === 'Escalated Queries'
                  ? 'text-red-500'
                  : 'text-green-500'
                : 'text-red-500'

            return (
              <Card key={stat.title}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
                  <div className='flex h-8 w-8 items-center justify-center rounded-md bg-muted'>
                    <Icon className='h-4 w-4 text-muted-foreground' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-3xl font-bold'>{stat.value}</div>
                  <div className={`mt-1 flex items-center gap-1 text-xs ${trendColor}`}>
                    <TrendIcon className='h-3 w-3' />
                    <span>{stat.change}</span>
                  </div>
                  <p className='mt-0.5 text-xs text-muted-foreground'>
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts + lists */}
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='topics'>Policy Topics</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 lg:grid-cols-7'>
              {/* Queries over time */}
              <Card className='col-span-full lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Queries Over Time</CardTitle>
                  <CardDescription>
                    Monthly employee questions to the AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QueriesChart />
                </CardContent>
              </Card>

              {/* Recent queries */}
              <Card className='col-span-full lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Queries</CardTitle>
                  <CardDescription>
                    Latest employee questions and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentQueries />
                </CardContent>
              </Card>
            </div>

            <div className='grid gap-4 lg:grid-cols-7'>
              {/* Policy documents */}
              <Card className='col-span-full lg:col-span-4'>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle>Policy Documents</CardTitle>
                    <CardDescription>Recently uploaded to the knowledge base</CardDescription>
                  </div>
                  <Button variant='outline' size='sm'>
                    Manage
                  </Button>
                </CardHeader>
                <CardContent>
                  <PolicyDocuments />
                </CardContent>
              </Card>

              {/* Topic breakdown bar list */}
              <Card className='col-span-full lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Top Query Topics</CardTitle>
                  <CardDescription>Most frequently asked policy areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <TopicBarList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Topics tab */}
          <TabsContent value='topics' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Policy Topic Trends</CardTitle>
                <CardDescription>
                  Weekly query volume by HR policy category (last 8 weeks)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopicsChart />
              </CardContent>
            </Card>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {topicStats.map((t) => (
                <Card key={t.topic}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>{t.topic}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{t.total}</div>
                    <p className='text-xs text-muted-foreground'>{t.sub}</p>
                    <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-2 rounded-full bg-primary'
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>{t.pct}% of all queries</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

// ─── Inline helpers ────────────────────────────────────────────────────────────

const topicBarItems = [
  { name: 'Leave Policy', value: 312, pct: 100 },
  { name: 'Code of Conduct', value: 241, pct: 77 },
  { name: 'Benefits', value: 198, pct: 63 },
  { name: 'Recruitment', value: 142, pct: 46 },
  { name: 'Health & Safety', pct: 28, value: 89 },
  { name: 'Compensation', value: 67, pct: 21 },
]

function TopicBarList() {
  return (
    <ul className='space-y-3'>
      {topicBarItems.map((item) => (
        <li key={item.name} className='flex items-center justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <div className='mb-1 truncate text-xs text-muted-foreground'>{item.name}</div>
            <div className='h-2.5 w-full rounded-full bg-muted'>
              <div
                className='h-2.5 rounded-full bg-primary'
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
          <div className='ps-2 text-xs font-medium tabular-nums'>{item.value}</div>
        </li>
      ))}
    </ul>
  )
}

const topicStats = [
  { topic: 'Leave Policy', total: 312, pct: 35, sub: 'Annual, sick & maternity leave' },
  { topic: 'Code of Conduct', total: 241, pct: 27, sub: 'Ethics, harassment & discipline' },
  { topic: 'Benefits', total: 198, pct: 22, sub: 'Health, pension & allowances' },
  { topic: 'Recruitment', total: 142, pct: 16, sub: 'Hiring process & onboarding' },
  { topic: 'Health & Safety', total: 89, pct: 10, sub: 'Workplace safety regulations' },
  { topic: 'Compensation', total: 67, pct: 8, sub: 'Salary, bonuses & deductions' },
]
