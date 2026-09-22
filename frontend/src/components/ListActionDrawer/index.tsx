import { Drawer } from 'antd';
import type { ReactNode } from 'react';

interface ListActionDrawerProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  className?: string;
}

export default function ListActionDrawer({ open, title, onClose, children, footer, width = 'min(720px, 100vw)', className }: ListActionDrawerProps) {
  return <Drawer
    title={title}
    open={open}
    placement="right"
    onClose={onClose}
    width={width}
    destroyOnClose
    className={className}
    footer={footer}
  >
    {children}
  </Drawer>;
}
