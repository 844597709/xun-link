import ModuleListPage from '../../../components/ModuleListPage';
import { businessPageConfigs } from '../../pageConfigs';
import type { BusinessRecord } from '../../../types';
export default function AdjustDetail() { return <ModuleListPage<BusinessRecord> {...businessPageConfigs.adjustDetail} />; }
