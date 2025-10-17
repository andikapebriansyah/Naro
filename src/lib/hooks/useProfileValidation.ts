import { useSession } from 'next-auth/react';

export interface ProfileValidation {
  isTaskerProfileComplete: boolean;
  isBasicProfileComplete: boolean;
  missingFields: string[];
  missingBasicFields: string[];
  canAccessFeatures: boolean;
  canCreateTasks: boolean;
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

    return {
      isTaskerProfileComplete,
      isBasicProfileComplete,
      missingFields,
      missingBasicFields,
      canAccessFeatures: isTaskerProfileComplete, // For working as tasker
      canCreateTasks: session.user.isVerified && isBasicProfileComplete, // For creating tasks
    };
  };

  return checkProfile();
}

export function useCanAccessFeatures(): boolean {
  const { isTaskerProfileComplete } = useProfileValidation();
  return isTaskerProfileComplete;
}