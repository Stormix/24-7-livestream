export interface QueueItem {
  /** The unique identifier of the track. */
  id: string;
  /** The file path */
  path: string;
}

/**
 * Represents an audio track.
 * @interface
 */
export interface Track extends QueueItem {}
