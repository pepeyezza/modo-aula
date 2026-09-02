"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_INK } from "./palette";

export function SimpleBarChart({
  data,
  color,
  unit = "",
  layout = "horizontal",
}: {
  data: { name: string; value: number }[];
  color: string;
  unit?: string;
  layout?: "horizontal" | "vertical";
}) {
  if (data.length === 0) {
    return <EmptyState />;
  }

  if (layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
          <XAxis type="number" tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} unit={unit} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 12, fill: CHART_INK.secondary }}
            axisLine={{ stroke: CHART_INK.axis }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v) => [`${v}${unit}`, ""]}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: CHART_INK.secondary }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} axisLine={false} tickLine={false} unit={unit} />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
          formatter={(v) => [`${v}${unit}`, ""]}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EmptyState() {
  return (
    <div className="flex h-52 items-center justify-center text-sm text-[var(--muted-foreground)]">
      Todavía no hay datos suficientes.
    </div>
  );
}
