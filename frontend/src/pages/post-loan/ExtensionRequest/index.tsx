import ModuleListPage from '../../../components/ModuleListPage';
import { businessPageConfigs } from '../../pageConfigs';
import type { BusinessRecord } from '../../../types';
export default function ExtensionRequest() { return <ModuleListPage<BusinessRecord> {...businessPageConfigs.extensionRequest} />; }
