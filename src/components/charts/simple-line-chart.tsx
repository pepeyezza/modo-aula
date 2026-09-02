"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK } from "./palette";
import { EmptyState } from "./simple-bar-chart";

export function SimpleLineChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.every((d) => d.value === 0)) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_INK.secondary }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#areaFill)" dot={{ r: 3, fill: color, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
