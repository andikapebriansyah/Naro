import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useProfileValidation } from '@/lib/hooks/useProfileValidation';

interface ProfileGuardProps {
  children: React.ReactNode;
  requiresTaskerProfile?: boolean;
  requiresBasicProfile?: boolean;
  requiresVerification?: boolean;
  fallbackUrl?: string;
}

export function ProfileGuard({ 
  children, 
  requiresTaskerProfile = false,
  requiresBasicProfile = false,
  requiresVerification = true,
  fallbackUrl = '/profil' 
}: ProfileGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canAccessFeatures, canCreateTasks } = useProfileValidation();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Check verification requirement
    if (requiresVerification && !session.user.isVerified) {
      router.push('/dashboard');
      return;
    }

    // Check basic profile requirement (for creating tasks)
    if (requiresBasicProfile && !canCreateTasks) {
      router.push(fallbackUrl);
      return;
    }

    // Check tasker profile requirement (for working as tasker)
    if (requiresTaskerProfile && !canAccessFeatures) {
      router.push(fallbackUrl);
      return;
    }
  }, [session, status, canAccessFeatures, canCreateTasks, requiresTaskerProfile, requiresBasicProfile, requiresVerification, fallbackUrl, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;
  
  if (requiresVerification && !session.user.isVerified) return null;
  
  if (requiresBasicProfile && !canCreateTasks) return null;
  
  if (requiresTaskerProfile && !canAccessFeatures) return null;

  return <>{children}</>;
}

export function withProfileGuard<T extends object>(
  Component: React.ComponentType<T>,
  requiresTaskerProfile = false
) {
  return function GuardedComponent(props: T) {
    return (
      <ProfileGuard requiresTaskerProfile={requiresTaskerProfile}>
        <Component {...props} />
      </ProfileGuard>
    );
  };
}