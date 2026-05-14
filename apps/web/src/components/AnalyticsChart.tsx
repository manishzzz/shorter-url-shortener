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
            <stop offset="5%" stopColor="#ff7b72" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ff7b72" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="#d7d4ff" />
        <YAxis stroke="#d7d4ff" allowDecimals={false} />
        <Tooltip />
        <Area type="monotone" dataKey="clicks" stroke="#ffb86b" fill="url(#timelineFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
