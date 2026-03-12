"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockDailyStats, mockCosts } from "@/lib/mock-data";

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Метрики</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily discovery stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ежедневный поиск</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockDailyStats}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.205 0 0)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="totalFound"
                    name="Найдено"
                    fill="oklch(0.556 0 0)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="totalScored"
                    name="Оценено"
                    fill="oklch(0.488 0.243 264.376)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly costs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Расходы в месяц (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockCosts}>
                  <XAxis
                    dataKey="month"
                    tickFormatter={(m: string) => m.slice(5)}
                    tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.205 0 0)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `$${value.toFixed(2)}`,
                      "Расходы",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="costUsd"
                    stroke="oklch(0.723 0.191 149)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "oklch(0.723 0.191 149)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Всего идей найдено</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {mockDailyStats.reduce((s, d) => s + d.totalFound, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Всего оценено</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {mockDailyStats.reduce((s, d) => s + d.totalScored, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Всего потрачено</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              ${mockCosts.reduce((s, c) => s + c.costUsd, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
