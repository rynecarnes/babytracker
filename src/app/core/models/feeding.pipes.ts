import { Pipe, PipeTransform } from '@angular/core';
import { FeedingWithSegments } from '../models/feeding.model';

/** Returns total seconds for a completed feeding */
@Pipe({ name: 'totalDuration', standalone: true })
export class TotalDurationPipe implements PipeTransform {
  transform(feeding: FeedingWithSegments): number {
    if (!feeding.ended_at) return 0;
    return Math.floor(
      (new Date(feeding.ended_at).getTime() - new Date(feeding.started_at).getTime()) / 1000
    );
  }
}

/** Returns seconds spent on a given breast for a feeding */
@Pipe({ name: 'breastTime', standalone: true })
export class BreastTimePipe implements PipeTransform {
  transform(feeding: FeedingWithSegments, breast: 'left' | 'right'): number {
    return feeding.segments
      .filter((s) => s.breast === breast && s.ended_at)
      .reduce(
        (acc, s) =>
          acc + Math.floor((new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()) / 1000),
        0
      );
  }
}
