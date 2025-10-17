import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useUserNameSync() {
  const { data: session, update } = useSession();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const checkNameUpdate = async () => {
      setIsChecking(true);
      try {
        const response = await fetch('/api/users/me');
        const data = await response.json();

        if (data.success && data.data.nameChanged) {
          console.log('User name updated, refreshing session...');
          
          // Show toast notification
          toast.success(`Nama Anda telah diperbarui menjadi: ${data.data.name}`);
          
          // Trigger session refresh
          await update();
        }
      } catch (error) {
        console.error('Error checking name update:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately when verification status changes
    if (session.user.isVerified) {
      checkNameUpdate();
    }

    // Set up interval to check periodically (every 30 seconds)
    const interval = setInterval(checkNameUpdate, 30000);

    return () => clearInterval(interval);
  }, [session?.user?.id, session?.user?.isVerified, update]);

  return { isChecking };
}