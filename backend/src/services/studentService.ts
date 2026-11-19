import { prisma, isDatabaseConnected } from '../config/prisma.js';

export interface StudentProfileDTO {
  id?: string;
  fullName: string;
  email: string;
  college: string;
  branch: string;
  currentYear: string;
  cgpa: number;
  skills: string[];
  interests: string[];
  preferredTypes: string[];
  preferredMode: string;
  updatedAt?: string;
}

export const DEFAULT_DEMO_STUDENT: StudentProfileDTO = {
  id: 'student-demo-1',
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@college.edu.in',
  college: 'National Institute of Technology',
  branch: 'CSE',
  currentYear: '3rd Year',
  cgpa: 8.4,
  skills: ['Python', 'Machine Learning', 'SQL', 'React', 'JavaScript', 'Data Science'],
  interests: ['AI/ML', 'Web Development', 'Data Science', 'Cloud'],
  preferredTypes: ['Internship', 'Hackathon', 'Scholarship', 'Certification', 'Job'],
  preferredMode: 'Hybrid',
  updatedAt: new Date().toISOString()
};

let inMemoryProfile: StudentProfileDTO = { ...DEFAULT_DEMO_STUDENT };
const inMemoryProfiles = new Map<string, StudentProfileDTO>();
inMemoryProfiles.set('student-demo-1', { ...DEFAULT_DEMO_STUDENT });
if (DEFAULT_DEMO_STUDENT.email) {
  inMemoryProfiles.set(DEFAULT_DEMO_STUDENT.email.toLowerCase(), { ...DEFAULT_DEMO_STUDENT });
}

export async function getStudentProfile(idOrEmail?: string): Promise<StudentProfileDTO> {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !isDatabaseConnected()) {
    const err: any = new Error('Database service is temporarily unavailable. Unable to load profile.');
    err.statusCode = 503;
    throw err;
  }

  if (isDatabaseConnected()) {
    try {
      const student = await prisma.student.findFirst({
        where: idOrEmail
          ? {
              OR: [{ id: idOrEmail }, { email: idOrEmail }]
            }
          : undefined,
        include: {
          skills: true,
          interests: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (student) {
        const profile: StudentProfileDTO = {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          college: student.college,
          branch: student.branch,
          currentYear: student.currentYear,
          cgpa: student.cgpa,
          skills: student.skills.map(s => s.skill),
          interests: student.interests.map(i => i.interest),
          preferredTypes: student.preferredTypes,
          preferredMode: student.preferredMode,
          updatedAt: student.updatedAt.toISOString()
        };
        inMemoryProfiles.set(student.id, profile);
        inMemoryProfiles.set(student.email.toLowerCase(), profile);
        return profile;
      }

      // If connected but no student found in PostgreSQL, auto-seed default student directly in PostgreSQL
      if (!idOrEmail) {
        return await createOrUpdateStudentProfile(DEFAULT_DEMO_STUDENT);
      } else {
        const notFoundErr: any = new Error(`Student not found with ID or email: ${idOrEmail}`);
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }
    } catch (e: any) {
      if (isProd || idOrEmail || e.statusCode) {
        if (!e.statusCode) e.statusCode = 503;
        throw e;
      }
      console.warn('Error fetching student from database, using memory fallback:', e);
    }
  }

  if (isProd) {
    const err: any = new Error('Database service is offline.');
    err.statusCode = 503;
    throw err;
  }

  // In-memory lookup by ID or email
  if (idOrEmail) {
    const memory = inMemoryProfiles.get(idOrEmail) || inMemoryProfiles.get(idOrEmail.toLowerCase());
    if (memory) return memory;
    for (const p of inMemoryProfiles.values()) {
      if (p.id === idOrEmail || p.email.toLowerCase() === idOrEmail.toLowerCase()) {
        return p;
      }
    }
  }

  return inMemoryProfile;
}

export async function createOrUpdateStudentProfile(data: Partial<StudentProfileDTO>): Promise<StudentProfileDTO> {
  const isProd = process.env.NODE_ENV === 'production';
  const targetId = data.id?.trim();
  const targetEmail = data.email?.toLowerCase().trim();

  const isDemoAccount =
    targetId === DEFAULT_DEMO_STUDENT.id ||
    targetEmail === DEFAULT_DEMO_STUDENT.email.toLowerCase();

  // For non-demo accounts, require valid authenticated student ID and email
  if (!isDemoAccount) {
    if (!targetId) {
      const err: any = new Error('A valid authenticated student ID is required to create or update a profile.');
      err.statusCode = 400;
      throw err;
    }
    if (!targetEmail) {
      const err: any = new Error('A valid authenticated student email is required to create or update a profile.');
      err.statusCode = 400;
      throw err;
    }
  }

  const accountEmail = isDemoAccount ? (targetEmail || DEFAULT_DEMO_STUDENT.email) : targetEmail!;
  const accountId = isDemoAccount ? (targetId || DEFAULT_DEMO_STUDENT.id!) : targetId!;

  if (isDatabaseConnected()) {
    try {
      let student = null;

      // 1. Strictly look up student by primary key ID
      if (accountId) {
        student = await prisma.student.findUnique({
          where: { id: accountId },
          include: { skills: true, interests: true }
        });
      }

      // 2. Conflict prevention: Check if email is registered to another student ID
      if (accountEmail) {
        const existingWithEmail = await prisma.student.findUnique({
          where: { email: accountEmail }
        });

        if (existingWithEmail) {
          // If the email belongs to a different student ID, reject conflict immediately
          if (student && existingWithEmail.id !== student.id) {
            const conflictErr: any = new Error(
              `Forbidden: Email ${accountEmail} is already registered to another student account.`
            );
            conflictErr.statusCode = 403;
            throw conflictErr;
          }
          if (!student && accountId && existingWithEmail.id !== accountId) {
            const conflictErr: any = new Error(
              `Forbidden: Email ${accountEmail} is already registered to another student account.`
            );
            conflictErr.statusCode = 403;
            throw conflictErr;
          }
          // Only if this is the demo account without a pre-existing student record by ID, link it
          if (!student && isDemoAccount) {
            student = existingWithEmail;
          }
        }
      }

      // 3. Update existing student strictly by ID
      if (student) {
        const updatedStudent = await prisma.student.update({
          where: { id: student.id },
          data: {
            fullName: data.fullName ?? student.fullName,
            college: data.college ?? student.college,
            branch: data.branch ?? student.branch,
            currentYear: data.currentYear ?? student.currentYear,
            cgpa: data.cgpa ?? student.cgpa,
            preferredTypes: data.preferredTypes ?? student.preferredTypes,
            preferredMode: data.preferredMode ?? student.preferredMode,
            // Account email is locked to verified student email; never overwrite with arbitrary email
            email: student.email
          }
        });
        student = updatedStudent;
      } else {
        // 4. Create new student record with verified accountId and accountEmail (never falling back to demo email for real students!)
        student = await prisma.student.create({
          data: {
            id: accountId,
            fullName: data.fullName || (isDemoAccount ? DEFAULT_DEMO_STUDENT.fullName : 'Student User'),
            email: accountEmail,
            college: data.college || (isDemoAccount ? DEFAULT_DEMO_STUDENT.college : 'University'),
            branch: data.branch || (isDemoAccount ? DEFAULT_DEMO_STUDENT.branch : 'General'),
            currentYear: data.currentYear || (isDemoAccount ? DEFAULT_DEMO_STUDENT.currentYear : '1st Year'),
            cgpa: data.cgpa ?? (isDemoAccount ? DEFAULT_DEMO_STUDENT.cgpa : 8.0),
            preferredTypes: data.preferredTypes || (isDemoAccount ? DEFAULT_DEMO_STUDENT.preferredTypes : []),
            preferredMode: data.preferredMode || (isDemoAccount ? DEFAULT_DEMO_STUDENT.preferredMode : 'Hybrid')
          }
        });
      }

      // 5. Sync Skills
      if (data.skills && Array.isArray(data.skills)) {
        await prisma.studentSkill.deleteMany({
          where: { studentId: student.id }
        });
        for (const skill of data.skills) {
          await prisma.studentSkill.create({
            data: {
              studentId: student.id,
              skill
            }
          });
        }
      }

      // 6. Sync Interests
      if (data.interests && Array.isArray(data.interests)) {
        await prisma.studentInterest.deleteMany({
          where: { studentId: student.id }
        });
        for (const interest of data.interests) {
          await prisma.studentInterest.create({
            data: {
              studentId: student.id,
              interest
            }
          });
        }
      }

      // Return fully reloaded record
      const reloaded = await getStudentProfile(student.id);
      if (reloaded.id) {
        inMemoryProfiles.set(reloaded.id, reloaded);
        inMemoryProfiles.set(reloaded.email.toLowerCase(), reloaded);
      }
      return reloaded;
    } catch (e: any) {
      if (isProd || e.statusCode) {
        if (!e.statusCode) e.statusCode = 503;
        throw e;
      }
      // Database write error when DB is connected is a genuine error - rethrow!
      throw e;
    }
  }

  // Database is offline
  if (isProd) {
    const err: any = new Error('Database service is offline. Unable to persist profile.');
    err.statusCode = 503;
    throw err;
  }

  // In-memory fallback per student ID in development
  const existingMem = inMemoryProfiles.get(accountId);
  const merged: StudentProfileDTO = {
    ...DEFAULT_DEMO_STUDENT,
    ...(existingMem || {}),
    ...data,
    id: accountId,
    email: accountEmail,
    fullName: data.fullName || existingMem?.fullName || (isDemoAccount ? DEFAULT_DEMO_STUDENT.fullName : 'Student User'),
    updatedAt: new Date().toISOString()
  };

  inMemoryProfiles.set(accountId, merged);
  inMemoryProfiles.set(accountEmail.toLowerCase(), merged);
  if (isDemoAccount) {
    inMemoryProfile = merged;
  }

  return merged;
}

export async function resetStudentProfile(studentId?: string): Promise<StudentProfileDTO> {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !isDatabaseConnected()) {
    const err: any = new Error('Database service is temporarily unavailable. Unable to reset profile.');
    err.statusCode = 503;
    throw err;
  }

  // 1. When database is connected:
  if (isDatabaseConnected()) {
    if (!studentId) {
      // Demo reset fallback if called without studentId
      const demoEmail = DEFAULT_DEMO_STUDENT.email.toLowerCase();
      const existingDemo = await prisma.student.findUnique({
        where: { email: demoEmail }
      });
      if (existingDemo) {
        return await resetStudentProfile(existingDemo.id);
      }
      const err: any = new Error('Demo student not found in database.');
      err.statusCode = 404;
      throw err;
    }

    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        const notFoundErr: any = new Error(`Student not found with ID: ${studentId}`);
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }

      const isDefaultDemo =
        student.email.toLowerCase() === DEFAULT_DEMO_STUDENT.email.toLowerCase() ||
        student.id === DEFAULT_DEMO_STUDENT.id;

      // Reset profile fields to default template values, while preserving identity (id, email, passwordHash, and student's registered name)
      await prisma.student.update({
        where: { id: student.id },
        data: {
          fullName: isDefaultDemo ? DEFAULT_DEMO_STUDENT.fullName : student.fullName,
          college: DEFAULT_DEMO_STUDENT.college,
          branch: DEFAULT_DEMO_STUDENT.branch,
          currentYear: DEFAULT_DEMO_STUDENT.currentYear,
          cgpa: DEFAULT_DEMO_STUDENT.cgpa,
          preferredTypes: DEFAULT_DEMO_STUDENT.preferredTypes,
          preferredMode: DEFAULT_DEMO_STUDENT.preferredMode
          // id, email, passwordHash are untouched and preserved!
        }
      });

      // Reset skills to default template skills
      await prisma.studentSkill.deleteMany({
        where: { studentId: student.id }
      });
      for (const skill of DEFAULT_DEMO_STUDENT.skills) {
        await prisma.studentSkill.create({
          data: { studentId: student.id, skill }
        });
      }

      // Reset interests to default template interests
      await prisma.studentInterest.deleteMany({
        where: { studentId: student.id }
      });
      for (const interest of DEFAULT_DEMO_STUDENT.interests) {
        await prisma.studentInterest.create({
          data: { studentId: student.id, interest }
        });
      }

      const reloaded = await getStudentProfile(student.id);
      inMemoryProfiles.set(student.id, reloaded);
      inMemoryProfiles.set(reloaded.email.toLowerCase(), reloaded);
      if (isDefaultDemo) {
        inMemoryProfile = reloaded;
      }
      return reloaded;
    } catch (e: any) {
      // Database is connected: any failure must return an appropriate error instead of silently resetting in-memory
      const err: any = new Error(`Failed to reset student profile: ${e.message || 'Database reset error'}`);
      err.statusCode = e.statusCode || 500;
      throw err;
    }
  }

  // 2. Safe development-only fallback when database is GENUINELY unavailable (!isDatabaseConnected()):
  if (isProd) {
    const err: any = new Error('Database service is offline. Unable to reset profile.');
    err.statusCode = 503;
    throw err;
  }

  const targetId = studentId || 'student-demo-1';
  const existingMem = inMemoryProfiles.get(targetId);
  const isDefaultDemo = targetId === 'student-demo-1';

  const resetMem: StudentProfileDTO = {
    ...DEFAULT_DEMO_STUDENT,
    id: targetId,
    email: existingMem?.email || (isDefaultDemo ? DEFAULT_DEMO_STUDENT.email : `student-${targetId}@college.edu`),
    fullName: existingMem && !isDefaultDemo ? existingMem.fullName : DEFAULT_DEMO_STUDENT.fullName,
    updatedAt: new Date().toISOString()
  };

  inMemoryProfiles.set(targetId, resetMem);
  if (resetMem.email) {
    inMemoryProfiles.set(resetMem.email.toLowerCase(), resetMem);
  }
  if (isDefaultDemo) {
    inMemoryProfile = resetMem;
  }
  return resetMem;
}
