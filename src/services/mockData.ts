/**
 * Mock Data Service for Kardit
 * 
 * This file contains all mock data that will be replaced with real API calls later.
 * All hooks wrap this data for easy future replacement.
 */

import { User } from '@/hooks/useAuth';

// Dashboard Summary Types
export interface DashboardSummary {
  totalCustomers: number;
  activeCustomers: number;
  totalCards: number;
  activeCards: number;
  todayLoadsCount: number;
  todayLoadsAmount: number;
  pendingCustomerBatches: number;
  pendingLoadBatches: number;
  unreadNotifications: number;
}

// Notification Types
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: Date;
  isRead: boolean;
}

// Mock Dashboard Data
export const mockDashboardSummary: DashboardSummary = {
  totalCustomers: 12847,
  activeCustomers: 11203,
  totalCards: 28432,
  activeCards: 24891,
  todayLoadsCount: 342,
  todayLoadsAmount: 156780.50,
  pendingCustomerBatches: 3,
  pendingLoadBatches: 7,
  unreadNotifications: 5,
};

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Large Load Detected',
    message: 'A load of $50,000 was processed for customer #12345. Requires approval.',
    severity: 'warning',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
  },
  {
    id: '2',
    title: 'Batch Processing Complete',
    message: 'Customer batch #B-2024-001 has been successfully processed. 150 records updated.',
    severity: 'success',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
  },
  {
    id: '3',
    title: 'Card Activation Failed',
    message: 'Card ending in 4532 failed activation due to verification issues.',
    severity: 'error',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: '4',
    title: 'New User Registration',
    message: 'A new operator account has been created and is pending approval.',
    severity: 'info',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: true,
  },
  {
    id: '5',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance window: Tomorrow 02:00 - 04:00 UTC.',
    severity: 'info',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: true,
  },
  {
    id: '6',
    title: 'Compliance Alert',
    message: 'Monthly compliance report is due in 3 days. Please review pending items.',
    severity: 'warning',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: '7',
    title: 'API Rate Limit Warning',
    message: 'Partner API usage is at 85% of daily limit.',
    severity: 'warning',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
    isRead: true,
  },
];

// Mock Users for User Management
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  lastLogin: Date | null;
  createdAt: Date;
}

export const mockUsers: UserRecord[] = [
  {
    id: '1',
    email: 'admin@alphabank.com',
    name: 'Admin User',
    role: 'Super Admin',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    email: 'operator1@alphabank.com',
    name: 'Sarah Johnson',
    role: 'Operator',
    status: 'ACTIVE',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date('2023-06-20'),
  },
  {
    id: '3',
    email: 'analyst@alphabank.com',
    name: 'Mike Chen',
    role: 'Analyst',
    status: 'PENDING',
    lastLogin: null,
    createdAt: new Date('2024-01-10'),
  },
];

// Simulate API delay
export const simulateDelay = (ms: number = 500) => 
  new Promise((resolve) => setTimeout(resolve, ms));
