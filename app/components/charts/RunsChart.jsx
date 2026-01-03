'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RunsChart({ data, dataKey = 'runs', color = '#a855f7', title = 'Runs' }) {
  // Format date for display (e.g., "Jan 5")
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formattedData = data.map(item => ({
    ...item,
    displayDate: formatDate(item.date)
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="displayDate" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [value, title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
