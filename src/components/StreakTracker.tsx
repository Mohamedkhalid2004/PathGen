import React, { useEffect, useState } from 'react';
import { Flame, Calendar, Zap, TrendingUp, BookOpen, Loader } from 'lucide-react';
import type { ActivityDay } from '../types';
import { getActivityLog, getQOTDStreak } from '../lib/api';
import '../css/StreakTracker.css';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKS = 16;

// Use local date to avoid UTC offset issues
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function cellColor(count: number): string {
  if (count === 0) return '#d6d7d8';
  if (count === 1) return '#c4b5fd';
  if (count === 2) return '#8b5cf6';
  return '#5b21b6';
}

const StreakTracker: React.FC = () => {
  const [activityDays, setActivityDays] = useState<ActivityDay[]>([]);
  const [qotdStreak, setQotdStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getActivityLog(WEEKS * 7),
      getQOTDStreak(),
    ])
      .then(([days, qStreak]) => {
        setActivityDays(days);
        setQotdStreak(qStreak);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayStr = toLocalDateStr(new Date());

  const countMap: Record<string, number> = {};
  for (const d of activityDays) countMap[d.date] = d.count;

  // Build grid aligned to Monday
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - WEEKS * 7 + 1);
  const dow = startDate.getDay();
  startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));

  const grid: { date: string; count: number; isFuture: boolean; isToday: boolean }[][] = [];
  const cur = new Date(startDate);
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; count: number; isFuture: boolean; isToday: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toLocalDateStr(cur);
      week.push({
        date: dateStr,
        count: countMap[dateStr] ?? 0,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
      });
      cur.setDate(cur.getDate() + 1);
    }
    grid.push(week);
  }

  const monthLabels: { week: number; month: string }[] = [];
  let lastMonth = -1;
  let nextAllowedWeek = 0;
  grid.forEach((week, wi) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      // Place label at actual start OR the first non-overlapping slot, whichever is later
      const labelWeek = Math.max(wi, nextAllowedWeek);
      if (labelWeek < WEEKS) {
        monthLabels.push({ week: labelWeek, month: MONTHS[m] });
        nextAllowedWeek = labelWeek + 2; // 34px min gap — enough for a 3-char label
      }
      lastMonth = m;
    }
  });

  const activeDays = activityDays.filter(d => d.count > 0);
  const totalActiveDays = activeDays.length;
  const totalActivities = activityDays.reduce((s, d) => s + d.count, 0);

  // Current streak: if today has no activity yet, check from yesterday (grace period)
  let currentStreak = 0;
  const check = new Date();
  if ((countMap[todayStr] ?? 0) === 0) {
    check.setDate(check.getDate() - 1);
  }
  while (true) {
    const d = toLocalDateStr(check);
    if ((countMap[d] ?? 0) > 0) {
      currentStreak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak (within fetched range; also consider currentStreak)
  let longestStreak = currentStreak;
  let streak = 0;
  const sortedActive = [...new Set(activeDays.map(d => d.date))].sort();
  for (let i = 0; i < sortedActive.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const diff = (new Date(sortedActive[i]).getTime() - new Date(sortedActive[i - 1]).getTime()) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  if (loading) {
    return (
      <div className="card streak-loading-card">
        <Loader size={28} className="streak-spinner" color="#667eea" />
        <p>Loading activity data…</p>
      </div>
    );
  }

  const cellStep = 17; // 14px cell + 3px gap, must match CSS

  return (
    <div className="streak-wrapper">
      <div className="streak-header">
        <h2 className="streak-header-title">Activity & Streaks</h2>
        <p className="streak-header-sub">Stay consistent — every day counts</p>
      </div>

      <div className="streak-stats-row">
        <div className="streak-stat-card streak-stat-fire">
          <div className="streak-stat-icon"><Flame size={30} /></div>
          <div className="streak-stat-value">{currentStreak}</div>
          <div className="streak-stat-label">Current Streak</div>
          <div className="streak-stat-sub">{currentStreak > 0 ? `${currentStreak} day${currentStreak !== 1 ? 's' : ''} running` : 'Start today!'}</div>
        </div>
        <div className="streak-stat-card streak-stat-zap">
          <div className="streak-stat-icon"><Zap size={30} /></div>
          <div className="streak-stat-value">{longestStreak}</div>
          <div className="streak-stat-label">Longest Streak</div>
          <div className="streak-stat-sub">Personal best</div>
        </div>
        <div className="streak-stat-card streak-stat-calendar">
          <div className="streak-stat-icon"><Calendar size={30} /></div>
          <div className="streak-stat-value">{totalActiveDays}</div>
          <div className="streak-stat-label">Active Days</div>
          <div className="streak-stat-sub">Last {WEEKS} weeks</div>
        </div>
        <div className="streak-stat-card streak-stat-trend">
          <div className="streak-stat-icon"><TrendingUp size={30} /></div>
          <div className="streak-stat-value">{totalActivities}</div>
          <div className="streak-stat-label">Total Activities</div>
          <div className="streak-stat-sub">Logged actions</div>
        </div>
        <div className="streak-stat-card streak-stat-english">
          <div className="streak-stat-icon"><BookOpen size={30} /></div>
          <div className="streak-stat-value">{qotdStreak}</div>
          <div className="streak-stat-label">English Streak</div>
          <div className="streak-stat-sub">{qotdStreak > 0 ? `${qotdStreak} day${qotdStreak !== 1 ? 's' : ''} in a row` : 'Answer today!'}</div>
        </div>
      </div>

      <div className="card streak-heatmap-card">
        <div className="streak-heatmap-header">
          <h3 className="streak-heatmap-title">Learning Activity</h3>
          <span className="streak-heatmap-sub">Last {WEEKS} weeks</span>
        </div>

        <div className="streak-heatmap-outer">
          <div className="streak-day-col">
            {DAYS_SHORT.map((d, i) => (
              <div
                key={d}
                className="streak-day-label"
                style={{ visibility: i % 2 === 0 ? 'visible' : 'hidden' }}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="streak-heatmap-inner">
            <div className="streak-month-row" style={{ position: 'relative', height: '20px', marginBottom: '6px' }}>
              {monthLabels.map(({ week, month }) => (
                <span
                  key={month + week}
                  className="streak-month-label"
                  style={{ position: 'absolute', left: `${week * cellStep}px` }}
                >
                  {month}
                </span>
              ))}
            </div>

            <div className="streak-grid">
              {grid.flatMap((week, wi) =>
                week.map((cell, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className={`streak-cell${cell.isToday ? ' streak-cell-today' : ''}`}
                    style={{ backgroundColor: cell.isFuture ? 'transparent' : cellColor(cell.count) }}
                    title={cell.isFuture ? '' : `${cell.date}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="streak-legend">
          <span className="streak-legend-text">Less</span>
          {[0, 1, 2, 3].map(n => (
            <div
              key={n}
              className="streak-legend-cell"
              style={{ backgroundColor: cellColor(n) }}
            />
          ))}
          <span className="streak-legend-text">More</span>
        </div>

        {totalActiveDays === 0 && (
          <p className="streak-empty-hint">
            Complete skills, projects, or interviews to start building your streak!
          </p>
        )}
      </div>
    </div>
  );
};

export default StreakTracker;
