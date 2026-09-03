import ModuleListPage from '../../components/ModuleListPage';
import { businessPageConfigs } from '../pageConfigs';
import type { BusinessModuleKey } from '../../mock';
import type { BusinessRecord } from '../../types';

export default function BusinessModule({ moduleKey }: { moduleKey: BusinessModuleKey }) {
  return <ModuleListPage<BusinessRecord> {...businessPageConfigs[moduleKey]} />;
}
