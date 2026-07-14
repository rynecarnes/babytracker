import { Pipe, PipeTransform } from '@angular/core';

/** Converts total seconds to a human-readable duration string.
 *  e.g. 3725 → "1h 2m 5s"  |  90 → "1m 30s"  |  45 → "45s"
 */
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null, format: 'short' | 'long' = 'long'): string {
    if (totalSeconds === null || totalSeconds < 0) return '--';

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (format === 'short') {
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    }

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }
}
