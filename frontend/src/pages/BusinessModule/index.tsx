import ModuleListPage from '../../components/ModuleListPage';
import { businessPageConfigs } from '../pageConfigs';
import type { BusinessModuleKey } from '../../mock';
import type { BusinessRecord } from '../../types';
import DebtSignPage from '../bank-login/DebtSign';

export default function BusinessModule({ moduleKey }: { moduleKey: BusinessModuleKey }) {
  if (moduleKey === 'debtSign') return <DebtSignPage />;
  return <ModuleListPage<BusinessRecord> {...businessPageConfigs[moduleKey]} />;
}
