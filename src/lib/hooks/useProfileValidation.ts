import { useSession } from 'next-auth/react';

export interface ProfileValidation {
  isTaskerProfileComplete: boolean;
  isBasicProfileComplete: boolean;
  missingFields: string[];
  missingBasicFields: string[];
  canAccessFeatures: boolean;
  canCreateTasks: boolean;
  verificationStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  needsProfileCompletion: boolean;
}

export function useProfileValidation(): ProfileValidation {
  const { data: session } = useSession();

  const checkProfile = () => {
    if (!session?.user) {
      return {
        isTaskerProfileComplete: false,
        isBasicProfileComplete: false,
        missingFields: ['session'],
        missingBasicFields: ['session'],
        canAccessFeatures: false,
        canCreateTasks: false,
        verificationStatus: 'not_submitted' as const,
        needsProfileCompletion: false,
      };
    }

    const missingFields: string[] = [];
    const missingBasicFields: string[] = [];

    // Check basic fields (required for creating tasks)
    if (!session.user.phone) missingBasicFields.push('Nomor HP');
    if (!session.user.about) missingBasicFields.push('Tentang Diri');

    // Check all fields for tasker (required for working as tasker)
    missingFields.push(...missingBasicFields);
    if (!session.user.workCategories || session.user.workCategories.length === 0) {
      missingFields.push('Kategori Pekerjaan');
    }

    const isBasicProfileComplete = missingBasicFields.length === 0;
    const isTaskerProfileComplete = missingFields.length === 0;

    // Get verification status from session (will be added to session type)
    const verificationStatus = (session.user as any).verificationStatus || 'not_submitted';
    
    // User needs to complete profile if:
    // - Is verified by admin
    // - But profile is not complete
    const needsProfileCompletion = session.user.isVerified && !isTaskerProfileComplete;

    return {
      isTaskerProfileComplete,
      isBasicProfileComplete,
      missingFields,
      missingBasicFields,
      canAccessFeatures: session.user.isVerified && isTaskerProfileComplete, // Need verified + complete profile
      canCreateTasks: session.user.isVerified && isBasicProfileComplete, // Need verified + basic info
      verificationStatus,
      needsProfileCompletion,
    };
  };

  return checkProfile();
}

export function useCanAccessFeatures(): boolean {
  const { canAccessFeatures } = useProfileValidation();
  return canAccessFeatures;
}