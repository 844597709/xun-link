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
      { path: 'operation/interest-rule/:id', element: lazyPage(() => import('../pages/operation/InterestRule/Detail')) },
      { path: 'operation/interest-agreement', element: lazyPage(() => import('../pages/operation/InterestAgreement')) },
      { path: 'operation/interest-agreement/:id', element: lazyPage(() => import('../pages/operation/InterestAgreement/Detail')) },
      { path: 'operation/interest-flow', element: lazyPage(() => import('../pages/operation/InterestFlow')) },
      { path: 'operation/interest-flow/:id', element: lazyPage(() => import('../pages/operation/InterestFlow/Detail')) },
      { path: 'operation/interest-system-verify', element: lazyPage(() => import('../pages/operation/InterestSystemVerify')) },
      { path: 'operation/interest-verify', element: lazyPage(() => import('../pages/operation/InterestVerify')) },
      { path: 'operation/interest-verify/:id/:source', element: lazyPage(() => import('../pages/operation/InterestVerify/Detail')) },
      { path: 'operation/loan-interest', element: lazyPage(() => import('../pages/operation/LoanInterest')) },
      { path: 'operation/loan-interest/:id', element: lazyPage(() => import('../pages/operation/LoanInterest/Detail')) },
      { path: 'operation/consume-interest', element: lazyPage(() => import('../pages/operation/ConsumeInterest')) },
      { path: 'operation/consume-interest/:id', element: lazyPage(() => import('../pages/operation/ConsumeInterest/Detail')) },
      { path: 'operation/stop-batch-deduction/execution', element: lazyPage(() => import('../pages/operation/StopBatchDeduction/Execution')) },
      { path: 'operation/stop-batch-deduction/detail', element: lazyPage(() => import('../pages/operation/StopBatchDeduction/Detail')) },
      { path: 'operation/manual-repayment', element: lazyPage(() => import('../pages/operation/ManualRepayment')) },
      { path: 'repayment/manual', element: lazyPage(() => import('../pages/repayment/RepaymentPage')) },
      { path: 'product/list', element: lazyPage(() => import('../pages/product/ProductList')) },
      { path: 'product/repayment-maintenance/:productId', element: lazyPage(() => import('../pages/product/RepaymentMaintenance')) },
      { path: 'approval/pending', element: lazyPage(() => import('../pages/approval/PendingApprovalPage')) },
      { path: 'approval/pending-list', element: lazyPage(() => import('../pages/approval/DebtApprovalPage')) },
      { path: 'bank-login/agility-sign', element: lazyPage(() => import('../pages/bank-login/AgilitySign')) },
      { path: 'bank-login/debt-sign', element: businessPage('debtSign') },
      { path: 'bank-login/combo-repayment-withdrawal', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/loan', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/loan-term', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/coupons', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/repayment-plan', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/detail', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/result', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/combo-repayment-withdrawal/repayment-records', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/repayment-withdraw', element: lazyPage(() => import('../pages/bank-login/ComboRepaymentWithdrawal')) },
      { path: 'bank-login/consume-interest', element: lazyPage(() => import('../pages/bank-login/ConsumeInterest')) },
      { path: 'bank-login/cross-year-interest', element: lazyPage(() => import('../pages/bank-login/CrossYearInterest')) },
      // Existing direct links remain available even though they are not in the new sidebar menu.
      { path: 'admin/user-list', element: lazyPage(() => import('../pages/admin/UserList')) },
      { path: 'admin/role-list', element: lazyPage(() => import('../pages/admin/RoleList')) },
      { path: 'content/articles', element: lazyPage(() => import('../pages/content/ArticleList')) },
      { path: 'content/categories', element: lazyPage(() => import('../pages/content/CategoryList')) },
      { path: '*', element: lazyPage(() => import('../pages/NotFound')) },
    ],
  },
]);
