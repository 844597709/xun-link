import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import Menu from './Menu';

describe('BasicLayout Menu', () => {
  it('allows 运营管理 to collapse while keeping the current route selected', async () => {
    render(
      <MemoryRouter initialEntries={['/operation/interest-rule']}>
        <AppProvider>
          <Menu />
        </AppProvider>
      </MemoryRouter>,
    );

    const operationLabel = screen.getByText('运营管理');
    const operationSubMenu = operationLabel.closest('.ant-menu-submenu');
    expect(operationSubMenu).toHaveClass('ant-menu-submenu-open');

    fireEvent.click(operationLabel);

    await waitFor(() => {
      expect(operationSubMenu).not.toHaveClass('ant-menu-submenu-open');
    });
    expect(operationSubMenu).toBeInTheDocument();
  });
});
