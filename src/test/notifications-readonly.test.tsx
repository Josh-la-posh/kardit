import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import NotificationsListPage from '@/pages/notifications/NotificationsListPage';

vi.mock('@/hooks/useAuth', () => {
  return {
    useAuth: () => ({
      isAuthenticated: true,
      passwordMustChange: false,
      sessionExpired: false,
      user: {
        id: 'u1',
        email: 'bank@kardit.app',
        name: 'Bank User',
        role: 'User',
        stakeholderType: 'BANK',
        tenantId: 't1',
        tenantName: 'Alpha Bank',
      },
    }),
  };
});

vi.mock('@/hooks/useNotifications', () => {
  return {
    useNotifications: () => ({
      notifications: [],
      isLoading: false,
      markAllAsRead: vi.fn(),
    }),
  };
});

describe('NotificationsListPage bank read-only', () => {
  it('disables the "Mark all read" action', () => {
    render(
      <MemoryRouter>
        <NotificationsListPage />
      </MemoryRouter>,
    );

    const markAll = screen.getByRole('button', { name: /mark all read/i });
    expect(markAll).toBeDisabled();
  });
});
