import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type { User } from '../types';

interface AppState {
  collapsed: boolean;
  openKeys: string[];
  currentUser: User | null;
}

type AppAction =
  | { type: 'TOGGLE_SIDER' }
  | { type: 'SET_OPEN_KEYS'; payload: string[] }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' };

const initialState: AppState = {
  collapsed: false,
  openKeys: ['2', '18', '22'],
  currentUser: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_SIDER':
      return { ...state, collapsed: !state.collapsed };
    case 'SET_OPEN_KEYS':
      return { ...state, openKeys: action.payload };
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'CLEAR_USER':
      return { ...state, currentUser: null };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext 必须在 AppProvider 内使用');
  return context;
}
