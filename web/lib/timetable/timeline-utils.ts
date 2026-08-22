import { TimetableSlot } from './types';

// Convert "HH:mm" string into total minutes from midnight (00:00)
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return hours * 60 + minutes;
}

// Convert total minutes from midnight back to "HH:mm"
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hStr = hours.toString().padStart(2, '0');
  const mStr = mins.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

export interface TimeRange {
  startHour: number; // e.g. 17
  endHour: number;   // e.g. 21.5 (21:30)
  label: string;
}

// Get working time bounds based on day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
export function getDayWorkingRanges(dayOfWeek: number): TimeRange[] {
  // 0 = Sunday, 6 = Saturday -> Weekend: 08:00 - 11:00 and 14:00 - 21:30
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [
      { startHour: 8, endHour: 11, label: 'Sáng (08:00 - 11:00)' },
      { startHour: 14, endHour: 21.5, label: 'Chiều & Tối (14:00 - 21:30)' },
    ];
  }
  // Mon - Fri: 17:00 - 21:30
  return [{ startHour: 17, endHour: 21.5, label: 'Tối (17:00 - 21:30)' }];
}

// Generate 15-minute time ticks for a range
export function generateTimeTicks(startHour: number, endHour: number, stepMinutes: number = 15): string[] {
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const ticks: string[] = [];

  for (let m = startMin; m <= endMin; m += stepMinutes) {
    ticks.push(minutesToTime(m));
  }
  return ticks;
}

export interface PositionedSlot {
  slot: TimetableSlot;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
  colIndex: number;
  totalCols: number;
}

/**
 * Calculates side-by-side positions for slots that overlap in time on the same day/column.
 * 
 * @param slots Array of slots for a single day / column
 * @param rangeStartMin Range start in minutes from midnight (e.g. 17:00 -> 1020)
 * @param pxPerMinute Pixel height scale factor per minute (e.g. 2px per minute)
 */
export function calculateSideBySidePositions(
  slots: TimetableSlot[],
  rangeStartMin: number,
  pxPerMinute: number = 2
): PositionedSlot[] {
  if (!slots || slots.length === 0) return [];

  // Parse start/end minutes for each slot
  const parsedSlots = slots.map((slot) => ({
    slot,
    startMin: timeToMinutes(slot.start_time),
    endMin: timeToMinutes(slot.end_time),
  }));

  // Sort primarily by start time, then by longer duration first
  parsedSlots.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    return (b.endMin - b.startMin) - (a.endMin - a.startMin);
  });

  // Algorithm to group overlapping slots into cluster columns
  const clusters: Array<typeof parsedSlots> = [];
  let currentCluster: typeof parsedSlots = [];
  let clusterEnd = -1;

  for (const item of parsedSlots) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else if (item.startMin < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMin;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedSlot[] = [];

  // Process each cluster of overlapping slots
  for (const cluster of clusters) {
    const columns: Array<typeof parsedSlots> = [];

    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col && col.length > 0) {
          const lastInCol = col[col.length - 1];
          if (lastInCol && lastInCol.endMin <= item.startMin) {
            col.push(item);
            placed = true;
            break;
          }
        }
      }
      if (!placed) {
        columns.push([item]);
      }
    }

    const totalCols = columns.length;

    for (let c = 0; c < totalCols; c++) {
      const col = columns[c];
      if (col) {
        for (const item of col) {
          const durationMin = Math.max(15, item.endMin - item.startMin);
          const topPx = Math.max(0, (item.startMin - rangeStartMin) * pxPerMinute);
          const heightPx = Math.max(32, durationMin * pxPerMinute);
          const leftPercent = (c / totalCols) * 100;
          const widthPercent = (1 / totalCols) * 100;

          result.push({
            slot: item.slot,
            topPx,
            heightPx,
            leftPercent,
            widthPercent,
            colIndex: c,
            totalCols,
          });
        }
      }
    }
  }

  return result;
}
