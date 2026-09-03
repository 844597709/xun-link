import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DataTable from './index';

describe('DataTable', () => {
  it('renders loading and empty states', () => {
    render(<DataTable columns={[{ title: '名称', dataIndex: 'name' }]} dataSource={[]} loading pagination={{ current: 1, pageSize: 10, total: 0 }} onPageChange={vi.fn()} />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(document.querySelector('.ant-spin-spinning')).toBeInTheDocument();
  });
});
