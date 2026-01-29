import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { HorsemanScores, HorsemanType } from '@/lib/scoringEngine';
import { getHorsemanShortLabel } from '@/lib/scoringEngine';

interface HorsemenRadarChartProps {
  scores: HorsemanScores;
  primaryHorseman: HorsemanType;
}

export function HorsemenRadarChart({
  scores,
  primaryHorseman,
}: HorsemenRadarChartProps) {
  const data = [
    { subject: getHorsemanShortLabel('interest'), value: scores.interest, fullMark: 100 },
    { subject: getHorsemanShortLabel('taxes'), value: scores.taxes, fullMark: 100 },
    { subject: getHorsemanShortLabel('insurance'), value: scores.insurance, fullMark: 100 },
    { subject: getHorsemanShortLabel('education'), value: scores.education, fullMark: 100 },
  ];

  return (
    <div className="w-full aspect-square max-w-md mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--muted-foreground))" />
          <PolarAngleAxis
            dataKey="subject"
          tick={({ x, y, payload }) => {
              const horseman = Object.entries({
                Interest: 'interest',
                Taxes: 'taxes',
                Insurance: 'insurance',
                Education: 'education',
              }).find(([label]) => label === payload.value)?.[1] as HorsemanType;

              const isPrimary = horseman === primaryHorseman;

              // Offset labels outward for better visibility
              let offsetX = x;
              let offsetY = y;
              let anchor: 'start' | 'middle' | 'end' = 'middle';
              
              if (payload.value === 'Taxes') {
                offsetX = x - 25;
                anchor = 'end';
              } else if (payload.value === 'Education') {
                offsetX = x + 25;
                anchor = 'start';
              } else if (payload.value === 'Interest') {
                offsetY = y - 10;
              } else if (payload.value === 'Insurance') {
                offsetY = y + 10;
              }

              return (
                <text
                  x={offsetX}
                  y={offsetY}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className={isPrimary ? 'fill-primary font-semibold' : 'fill-muted-foreground'}
                  fontSize={14}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <Radar
            name="Pressure"
            dataKey="value"
            stroke="hsl(var(--accent))"
            fill="hsl(var(--accent))"
            fillOpacity={0.4}
            strokeWidth={2}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
