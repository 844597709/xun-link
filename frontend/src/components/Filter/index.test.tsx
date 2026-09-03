import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Filter from './index';

describe('Filter', () => {
  it('submits and resets configured fields', async () => {
    const onSearch = vi.fn();
    render(<Filter configs={[{ key: 'keyword', label: '关键字', type: 'input' }]} onSearch={onSearch} />);
    fireEvent.change(screen.getByPlaceholderText('请输入关键字'), { target: { value: '测试' } });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ keyword: '测试' })));
    fireEvent.click(screen.getByRole('button', { name: /重\s*置/ }));
    expect(onSearch).toHaveBeenLastCalledWith({});
  });
});
