import ModuleListPage from '../../../components/ModuleListPage';
import { adminPageConfigs } from '../../pageConfigs';
import type { Role } from '../../../types';

export default function RoleList() { return <ModuleListPage<Role> {...adminPageConfigs.roles} />; }
