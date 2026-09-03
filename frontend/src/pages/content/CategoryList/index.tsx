import ModuleListPage from '../../../components/ModuleListPage';
import { adminPageConfigs } from '../../pageConfigs';
import type { Category } from '../../../types';

export default function CategoryList() { return <ModuleListPage<Category> {...adminPageConfigs.categories} />; }
