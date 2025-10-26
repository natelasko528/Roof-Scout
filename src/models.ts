export type LeadStatus = 'Not Visited' | 'Knocked' | 'Interested' | 'Not Interested' | 'Not Home' | 'Appointment' | 'Callback' | 'Completed';
export type Priority = 'High' | 'Medium' | 'Low';

export const LEAD_STATUSES: LeadStatus[] = ['Not Visited', 'Knocked', 'Interested', 'Not Interested', 'Not Home', 'Appointment', 'Callback', 'Completed'];
export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export interface Lead {
  id: string;
  address: string;
  homeownerName: string;
  phone: string;
  email: string;
  roofAge: number | null;
  roofMaterial: string;
  visibleDamage: boolean;
  notes: string;
  priority: Priority;
  status: LeadStatus;
  createdAt: number;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  leads: Lead[];
}
