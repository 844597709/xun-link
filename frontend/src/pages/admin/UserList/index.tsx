import ModuleListPage from '../../../components/ModuleListPage';
import { adminPageConfigs } from '../../pageConfigs';
import type { User } from '../../../types';

export default function UserList() { return <ModuleListPage<User> {...adminPageConfigs.users} />; }
