import ModuleListPage from '../../../components/ModuleListPage';
import { adminPageConfigs } from '../../pageConfigs';
import type { Article } from '../../../types';

export default function ArticleList() { return <ModuleListPage<Article> {...adminPageConfigs.articles} />; }
