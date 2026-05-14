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
            <stop offset="5%" stopColor="#ccff00" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#ccff00" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" stroke="#a1a1aa" tickLine={false} axisLine={false} />
        <YAxis stroke="#a1a1aa" allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #3f3f46",
            boxShadow: "0 8px 30px rgba(0,0,0,0.8)",
            background: "#0a0a0a",
            fontFamily: "Space Grotesk, sans-serif"
          }}
          labelStyle={{ color: "#ffffff", fontWeight: 700 }}
          itemStyle={{ color: "#ccff00", fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="clicks" stroke="#ccff00" strokeWidth={3} fill="url(#timelineFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

