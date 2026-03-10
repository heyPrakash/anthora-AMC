"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, TrendingUp, Calendar } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Line,
  LineChart,
  Tooltip,
  Legend,
} from "recharts"

const monthlyServicesData = [
  { month: "Oct", completed: 45, scheduled: 48 },
  { month: "Nov", completed: 52, scheduled: 55 },
  { month: "Dec", completed: 48, scheduled: 50 },
  { month: "Jan", completed: 58, scheduled: 60 },
  { month: "Feb", completed: 62, scheduled: 65 },
  { month: "Mar", completed: 35, scheduled: 55 },
]

const contractsByTypeData = [
  { name: "AC", value: 18, color: "hsl(var(--chart-1))" },
  { name: "CCTV", value: 12, color: "hsl(var(--chart-2))" },
  { name: "Lift", value: 8, color: "hsl(var(--chart-3))" },
  { name: "Fire Safety", value: 6, color: "hsl(var(--chart-4))" },
  { name: "Other", value: 4, color: "hsl(var(--chart-5))" },
]

const technicianWorkloadData = [
  { name: "Mike J.", completed: 15, pending: 5 },
  { name: "Sarah S.", completed: 12, pending: 3 },
  { name: "John D.", completed: 10, pending: 4 },
  { name: "Emily B.", completed: 8, pending: 2 },
  { name: "Robert W.", completed: 14, pending: 6 },
  { name: "Amanda L.", completed: 11, pending: 4 },
]

const upcomingServicesData = [
  { week: "Week 1", services: 12 },
  { week: "Week 2", services: 18 },
  { week: "Week 3", services: 15 },
  { week: "Week 4", services: 22 },
]

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Analytics and insights for your AMC business</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="this-month">
              <SelectTrigger className="w-[160px]">
                <Calendar className="mr-2 size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Services (Month)</CardDescription>
              <CardTitle className="text-3xl">55</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-alert-success">
                <TrendingUp className="size-4" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Services</CardDescription>
              <CardTitle className="text-3xl">35</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">63.6% completion rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Contracts</CardDescription>
              <CardTitle className="text-3xl">48</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">3 new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Response Time</CardDescription>
              <CardTitle className="text-3xl">2.4h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-alert-success">
                <TrendingUp className="size-4" />
                <span>Improved by 15%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Services Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Services Overview</CardTitle>
              <CardDescription>Completed vs Scheduled services over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyServicesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="scheduled" fill="hsl(var(--chart-2))" name="Scheduled" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Contracts by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Contracts by Service Type</CardTitle>
              <CardDescription>Distribution of contracts across service categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractsByTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {contractsByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Technician Workload */}
          <Card>
            <CardHeader>
              <CardTitle>Technician Workload</CardTitle>
              <CardDescription>Completed and pending jobs per technician this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={technicianWorkloadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={70} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill="hsl(var(--chart-1))" name="Completed" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Services Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Services Forecast</CardTitle>
              <CardDescription>Projected services for the next 4 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={upcomingServicesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="services"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
