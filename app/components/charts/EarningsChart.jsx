'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EarningsChart({ data }) {
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
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            formatter={(value) => [`$${value.toFixed(2)}`, 'Earnings']}
          />
          <Bar 
            dataKey="earnings" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
