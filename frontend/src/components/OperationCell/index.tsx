import { Button, Space } from 'antd';
import type { ReactNode } from 'react';

export interface OperationItem {
  key: string;
  label: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface OperationCellProps {
  items: OperationItem[];
  onAction: (key: string) => void;
}

export default function OperationCell({ items, onAction }: OperationCellProps) {
  return <Space className="loan-list-actions operation-cell" size={0} wrap={false}>
    {items.map((item) => <Button key={item.key} type="link" size="small" danger={item.danger} disabled={item.disabled} onClick={() => onAction(item.key)}>{item.label}</Button>)}
  </Space>;
}
