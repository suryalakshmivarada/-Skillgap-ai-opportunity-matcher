import { prisma, isDatabaseConnected } from '../config/prisma.js';
import { getStudentProfile } from './studentService.js';
import { getOpportunityById } from './opportunityService.js';

export interface ApplicationDTO {
  id: string;
  studentId: string;
  opportunityId: string;
  opportunityTitle?: string;
  organization?: string;
  status: string;
  appliedAt: string;
  notes?: string;
}

const inMemoryApplications: ApplicationDTO[] = [];

export async function createApplication(data: {
  studentId: string;
  opportunityId: string;
  notes?: string;
}): Promise<ApplicationDTO> {
  // 1. Require a valid student ID
  if (!data.studentId || !data.studentId.trim()) {
    const err: any = new Error('Valid student ID is required to submit an application.');
    err.statusCode = 400;
    throw err;
  }

  if (!data.opportunityId || !data.opportunityId.trim()) {
    const err: any = new Error('Opportunity ID is required to submit an application.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Verify the student exists before creating an application (never silently fall back to student-demo-1)
  const student = await getStudentProfile(data.studentId);
  if (!student || !student.id) {
    const err: any = new Error(`Student not found with ID: ${data.studentId}`);
    err.statusCode = 404;
    throw err;
  }

  // 3. Verify the opportunity exists
  const opp = await getOpportunityById(data.opportunityId);
  if (!opp) {
    const err: any = new Error(`Opportunity not found with ID: ${data.opportunityId}`);
    err.statusCode = 404;
    throw err;
  }

  // 4. When database is connected, persist to PostgreSQL via upsert
  if (isDatabaseConnected()) {
    try {
      const dbApp = await prisma.application.upsert({
        where: {
          studentId_opportunityId: {
            studentId: student.id,
            opportunityId: data.opportunityId
          }
        },
        update: {
          status: 'Submitted',
          appliedAt: new Date(),
          notes: data.notes
        },
        create: {
          studentId: student.id,
          opportunityId: data.opportunityId,
          status: 'Submitted',
          appliedAt: new Date(),
          notes: data.notes
        },
        include: {
          opportunity: true
        }
      });

      const formattedApp: ApplicationDTO = {
        id: dbApp.id,
        studentId: dbApp.studentId,
        opportunityId: dbApp.opportunityId,
        opportunityTitle: dbApp.opportunity.title,
        organization: dbApp.opportunity.organization,
        status: dbApp.status,
        appliedAt: dbApp.appliedAt.toISOString(),
        notes: dbApp.notes || undefined
      };

      // Add to in-memory cache ONLY AFTER database write has succeeded
      const existingMemIdx = inMemoryApplications.findIndex(
        a => a.studentId === student.id && a.opportunityId === data.opportunityId
      );
      if (existingMemIdx >= 0) {
        inMemoryApplications[existingMemIdx] = formattedApp;
      } else {
        inMemoryApplications.push(formattedApp);
      }

      return formattedApp;
    } catch (e: any) {
      // Database is connected: throw real error, never silently fall back to memory!
      const err: any = new Error(`Failed to record application in database: ${e.message || 'Database write error'}`);
      err.statusCode = e.statusCode || 500;
      throw err;
    }
  }

  // 5. Database genuinely unavailable: check environment
  if (process.env.NODE_ENV === 'production') {
    const err: any = new Error('Database connection is offline. Unable to record application.');
    err.statusCode = 503;
    throw err;
  }

  // Development-only fallback when database is genuinely unavailable
  const existingMemIdx = inMemoryApplications.findIndex(
    a => a.studentId === student.id && a.opportunityId === data.opportunityId
  );

  const fallbackApp: ApplicationDTO = {
    id: existingMemIdx >= 0 ? inMemoryApplications[existingMemIdx].id : `app-${data.opportunityId}-${Date.now()}`,
    studentId: student.id,
    opportunityId: data.opportunityId,
    opportunityTitle: opp.title,
    organization: opp.organization,
    status: 'Submitted',
    appliedAt: new Date().toISOString(),
    notes: data.notes
  };

  if (existingMemIdx >= 0) {
    inMemoryApplications[existingMemIdx] = fallbackApp;
  } else {
    inMemoryApplications.push(fallbackApp);
  }

  return fallbackApp;
}

export async function getStudentApplications(studentId?: string): Promise<ApplicationDTO[]> {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !isDatabaseConnected()) {
    const err: any = new Error('Database service is temporarily unavailable. Unable to load applications.');
    err.statusCode = 503;
    throw err;
  }

  // Require valid student ID for retrieval
  if (!studentId || !studentId.trim()) {
    return [];
  }

  if (isDatabaseConnected()) {
    try {
      const student = await getStudentProfile(studentId);
      if (student && student.id) {
        const apps = await prisma.application.findMany({
          where: { studentId: student.id },
          include: { opportunity: true },
          orderBy: { appliedAt: 'desc' }
        });

        return (apps || []).map(a => ({
          id: a.id,
          studentId: a.studentId,
          opportunityId: a.opportunityId,
          opportunityTitle: a.opportunity.title,
          organization: a.opportunity.organization,
          status: a.status,
          appliedAt: a.appliedAt.toISOString(),
          notes: a.notes || undefined
        }));
      }
      return [];
    } catch (e: any) {
      if (e.statusCode === 404) {
        return [];
      }
      const err: any = new Error(`Failed to retrieve applications: ${e.message || 'Database error'}`);
      err.statusCode = e.statusCode || 500;
      throw err;
    }
  }

  if (isProd) {
    return [];
  }

  // Development-only fallback when DB is genuinely unavailable:
  // Strictly filter by the supplied student ID so no other student's applications are exposed
  return inMemoryApplications.filter(app => app.studentId === studentId);
}

export async function getApplicationForOpportunity(
  opportunityId: string,
  studentId?: string
): Promise<ApplicationDTO | null> {
  if (!studentId) return null;
  const all = await getStudentApplications(studentId);
  return all.find(a => a.opportunityId === opportunityId) || null;
}
