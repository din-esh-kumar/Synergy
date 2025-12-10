// frontend/src/hooks/useRealtimeTeams.ts

import { useContext } from 'react';
import { TeamContext } from '../context/TeamContext';

export function useTeams() {
  const context = useContext(TeamContext);
  
  if (!context) {
    throw new Error('useTeams must be used within TeamProvider');
  }

  return context;
}
