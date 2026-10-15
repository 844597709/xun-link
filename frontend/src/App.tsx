import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { router } from './router';

const locale = {
  locale: 'zh-CN',
  Pagination: {
    items_per_page: '/页',
  },
};

export default function App() {
  return <ConfigProvider locale={locale}><AppProvider><RouterProvider router={router} /></AppProvider></ConfigProvider>;
}
