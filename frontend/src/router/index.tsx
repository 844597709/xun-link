import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import BasicLayout from '../layouts/BasicLayout';
import LoginLayout from '../layouts/LoginLayout';
import type { BusinessModuleKey } from '../mock';

const loading = <div className="route-loading">页面加载中...</div>;
const lazyPage = (loader: () => Promise<{ default: ComponentType }>) => {
  const Page = lazy(loader);
  return <Suspense fallback={loading}><Page /></Suspense>;
};
const businessPage = (moduleKey: BusinessModuleKey) => lazyPage(
  () => import('../pages/BusinessModule').then(({ default: Page }) => ({
    default: () => <Page moduleKey={moduleKey} />,
  })),
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginLayout />, children: [{ index: true, element: lazyPage(() => import('../pages/Login')) }] },
  {
    path: '/', element: <BasicLayout />, children: [
      { index: true, element: <Navigate to="/welcome" replace /> },
      { path: 'welcome', element: lazyPage(() => import('../pages/Welcome')) },
      { path: 'post-loan/adjust-request', element: lazyPage(() => import('../pages/post-loan/AdjustRequest')) },
      { path: 'post-loan/adjust-detail', element: lazyPage(() => import('../pages/post-loan/AdjustDetail')) },
      { path: 'post-loan/agility-request', element: lazyPage(() => import('../pages/post-loan/AgilityRequest')) },
      { path: 'post-loan/agility-request-form', element: lazyPage(() => import('../pages/post-loan/AgilityAdjustment').then(({ default: Page }) => ({ default: () => <Page mode="request" /> }))) },
      { path: 'post-loan/agility-calculate', element: lazyPage(() => import('../pages/post-loan/AgilityAdjustment').then(({ default: Page }) => ({ default: () => <Page mode="calculate" /> }))) },
      { path: 'post-loan/agility-detail', element: lazyPage(() => import('../pages/post-loan/AgilityDetail')) },
      { path: 'post-loan/debt-request', element: lazyPage(() => import('../pages/post-loan/DebtRequest')) },
      { path: 'post-loan/debt-detail', element: lazyPage(() => import('../pages/post-loan/DebtDetail')) },
      { path: 'post-loan/extension-request', element: lazyPage(() => import('../pages/post-loan/ExtensionRequest')) },
      { path: 'post-loan/extension-detail', element: lazyPage(() => import('../pages/post-loan/ExtensionDetail')) },
      { path: 'post-loan/litigation-request', element: lazyPage(() => import('../pages/post-loan/LitigationRequest')) },
      { path: 'post-loan/litigation-execution', element: businessPage('litigationExecution') },
      { path: 'post-loan/litigation-detail', element: lazyPage(() => import('../pages/post-loan/LitigationDetail')) },
      { path: 'operation/interest-rule', element: lazyPage(() => import('../pages/operation/InterestRule')) },
      { path: 'operation/interest-agreement', element: lazyPage(() => import('../pages/operation/InterestAgreement')) },
      { path: 'operation/interest-flow', element: lazyPage(() => import('../pages/operation/InterestFlow')) },
      { path: 'operation/interest-system-verify', element: businessPage('interestSystemVerify') },
      { path: 'operation/interest-verify', element: lazyPage(() => import('../pages/operation/InterestVerify')) },
      { path: 'operation/loan-interest', element: businessPage('loanInterest') },
      { path: 'operation/consume-interest', element: businessPage('consumeInterest') },
      { path: 'repayment/manual', element: lazyPage(() => import('../pages/repayment/RepaymentPage')) },
      { path: 'product/list', element: lazyPage(() => import('../pages/product/ProductList')) },
      { path: 'product/repayment-maintenance/:productId', element: lazyPage(() => import('../pages/product/RepaymentMaintenance')) },
      { path: 'approval/pending', element: businessPage('approvalPending') },
      { path: 'bank-login/agility-sign', element: businessPage('agilitySign') },
      { path: 'bank-login/debt-sign', element: businessPage('debtSign') },
      { path: 'bank-login/repayment-withdraw', element: businessPage('repaymentWithdraw') },
      { path: 'bank-login/consume-interest', element: businessPage('bankConsumeInterest') },
      // Existing direct links remain available even though they are not in the new sidebar menu.
      { path: 'admin/user-list', element: lazyPage(() => import('../pages/admin/UserList')) },
      { path: 'admin/role-list', element: lazyPage(() => import('../pages/admin/RoleList')) },
      { path: 'content/articles', element: lazyPage(() => import('../pages/content/ArticleList')) },
      { path: 'content/categories', element: lazyPage(() => import('../pages/content/CategoryList')) },
      { path: '*', element: lazyPage(() => import('../pages/NotFound')) },
    ],
  },
]);
