import { useSession } from 'next-auth/react';

export const useRefreshSession = () => {
  const { data: session, update } = useSession();

  const refreshSession = async () => {
    try {
      // Force update session with latest data from database
      await update();
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  return { session, refreshSession };
};