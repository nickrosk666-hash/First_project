"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import { SCORE_LABELS } from "@/lib/constants";
import type { Idea } from "@/types/idea";

interface ScoreRadarProps {
  idea: Idea;
}

const FIELDS = [
  "score_market", "score_automation", "score_pain_level", "score_competition",
  "score_willingness_to_pay", "score_margin", "score_build", "score_timing",
] as const;

export default function ScoreRadar({ idea }: ScoreRadarProps) {
  const data = FIELDS.map((field) => ({
    label: SCORE_LABELS[field]?.short ?? field,
    value: idea[field] ?? 0,
    fullMark: 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#2A2A2D" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: "#A1A1AA", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={{ fill: "#71717A", fontSize: 10 }}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#3B82F6"
          fill="url(#radarGradient)"
          fillOpacity={0.3}
          strokeWidth={2}
          dot={{ r: 3, fill: "#3B82F6", stroke: "#3B82F6" }}
        />
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}
