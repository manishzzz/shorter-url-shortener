import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsChart({
  data,
}: {
  data: Array<{ date: string; clicks: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1b4d66" stopOpacity={0.34} />
            <stop offset="95%" stopColor="#1b4d66" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(31,36,48,0.1)" vertical={false} />
        <XAxis dataKey="date" stroke="#6c7382" tickLine={false} axisLine={false} />
        <YAxis stroke="#6c7382" allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "18px",
            border: "1px solid rgba(31,36,48,0.12)",
            boxShadow: "0 20px 48px rgba(34,35,38,0.12)",
            background: "rgba(255,253,248,0.96)",
          }}
          labelStyle={{ color: "#1f2430", fontWeight: 700 }}
          itemStyle={{ color: "#1b4d66" }}
        />
        <Area type="monotone" dataKey="clicks" stroke="#1b4d66" strokeWidth={2.2} fill="url(#timelineFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
