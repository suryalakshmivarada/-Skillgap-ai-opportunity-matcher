import { useStudent } from '../context/StudentContext';
import type { StudentProfile } from '../types';

/**
 * Custom Hook: useStudentProfile
 * -------------------------------------------------------------
 * Provides direct, reactive access to the student profile state,
 * update handlers, validation, and demo profile reset utilities.
 * -------------------------------------------------------------
 */
export function useStudentProfile() {
  const {
    profile,
    updateProfile,
    resetToDemoProfile
  } = useStudent();

  /**
   * Helper to validate a student profile against required constraints
   */
  const validateProfile = (data: Partial<StudentProfile>): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!data.fullName?.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.college?.trim()) {
      errors.college = 'College / University is required';
    }

    if (data.cgpa === undefined || isNaN(data.cgpa) || data.cgpa < 0 || data.cgpa > 10) {
      errors.cgpa = 'Enter a valid CGPA between 0.0 and 10.0';
    }

    if (!data.skills || data.skills.length === 0) {
      errors.skills = 'Please add at least 1 technical skill';
    }

    if (!data.interests || data.interests.length === 0) {
      errors.interests = 'Please select at least 1 career interest';
    }

    if (!data.preferredTypes || data.preferredTypes.length === 0) {
      errors.preferredTypes = 'Select at least 1 opportunity type';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  /**
   * Add a skill if not already present
   */
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!profile.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      updateProfile({ skills: [...profile.skills, trimmed] });
    }
  };

  /**
   * Remove a skill by name
   */
  const removeSkill = (skillToRemove: string) => {
    updateProfile({
      skills: profile.skills.filter((s) => s !== skillToRemove)
    });
  };

  /**
   * Toggle a career interest
   */
  const toggleInterest = (interest: string) => {
    const exists = profile.interests.includes(interest);
    updateProfile({
      interests: exists
        ? profile.interests.filter((i) => i !== interest)
        : [...profile.interests, interest]
    });
  };

  return {
    profile,
    updateProfile,
    resetToDemoProfile,
    validateProfile,
    addSkill,
    removeSkill,
    toggleInterest
  };
}
