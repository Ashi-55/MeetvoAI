'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendPositive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendPositive,
}) => {
  return (
    <div className="stat-card">
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Label */}
        <div
          style={{
            color: '#A8B3CF',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {label}
        </div>

        {/* Icon Circle */}
        <div
          style={{
            width: '38px',
            height: '38px',
            background: iconBg,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '30px',
          fontWeight: 800,
          color: 'white',
          marginTop: '12px',
          marginBottom: '4px',
        }}
      >
        {value}
      </div>

      {/* Trend */}
      {trend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: trendPositive ? '#22C55E' : '#A8B3CF',
          }}
        >
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
