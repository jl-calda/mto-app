// Projects — workspaces; take-offs live here.

import type { Visual } from './visual';
import type { Takeoff } from './takeoff';

export type Project = {
  id: string;
  visual?: Visual;
  name: string;
  client: string;
  location?: string;
  created_at: number;
  takeoffs: Takeoff[];
  notes?: string;
};
