import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.js';
import { DEFAULT_DEMO_STUDENT } from '../services/studentService.js';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  college: z.string().min(1, 'College/University name is required'),
  branch: z.string().min(1, 'Branch is required'),
  currentYear: z.string().min(1, 'Current year is required'),
  cgpa: z.number().min(0).max(10, 'CGPA must be between 0 and 10'),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  preferredTypes: z.array(z.string()).default([]),
  preferredMode: z.string().default('Hybrid')
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Format student record to standard StudentProfile payload (excluding passwordHash)
 */
function formatStudentProfile(student: any) {
  return {
    id: student.id,
    fullName: student.fullName,
    email: student.email,
    college: student.college,
    branch: student.branch,
    currentYear: student.currentYear,
    cgpa: student.cgpa,
    skills: (student.skills || []).map((s: any) => s.skill || s),
    interests: (student.interests || []).map((i: any) => i.interest || i),
    preferredTypes: student.preferredTypes || [],
    preferredMode: student.preferredMode || 'Hybrid',
    updatedAt: student.updatedAt?.toISOString() || new Date().toISOString()
  };
}

/**
 * Register a new student account
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if email is already registered
    const existing = await prisma.student.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A student account with this email address already exists.'
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create student in Neon PostgreSQL
    const created = await prisma.student.create({
      data: {
        fullName: data.fullName.trim(),
        email: normalizedEmail,
        college: data.college.trim(),
        branch: data.branch.trim(),
        currentYear: data.currentYear.trim(),
        cgpa: data.cgpa,
        preferredTypes: data.preferredTypes,
        preferredMode: data.preferredMode,
        passwordHash,
        skills: {
          create: data.skills.map(skill => ({ skill: skill.trim() }))
        },
        interests: {
          create: data.interests.map(interest => ({ interest: interest.trim() }))
        }
      },
      include: {
        skills: true,
        interests: true
      }
    });

    const token = generateToken({ id: created.id, email: created.email });
    const profile = formatStudentProfile(created);

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully',
      token,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log in to an existing student account
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const student = await prisma.student.findUnique({
      where: { email: normalizedEmail },
      include: {
        skills: true,
        interests: true
      }
    });

    if (!student) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    // Never allow passwordless legacy login or unauthorized password initialization
    if (!student.passwordHash) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please use account recovery if needed.'
      });
      return;
    }

    // Verify password with bcrypt
    const isValid = await comparePassword(password, student.passwordHash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    const token = generateToken({ id: student.id, email: student.email });
    const profile = formatStudentProfile(student);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Convenient demo login for judging & offline testing
 * POST /api/auth/demo-login
 */
export async function demoLogin(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const demoEmail = DEFAULT_DEMO_STUDENT.email.toLowerCase();
    let student = await prisma.student.findUnique({
      where: { email: demoEmail },
      include: { skills: true, interests: true }
    });

    if (!student) {
      const passwordHash = await hashPassword('DemoPassword@2026');
      student = await prisma.student.create({
        data: {
          fullName: DEFAULT_DEMO_STUDENT.fullName,
          email: demoEmail,
          college: DEFAULT_DEMO_STUDENT.college,
          branch: DEFAULT_DEMO_STUDENT.branch,
          currentYear: DEFAULT_DEMO_STUDENT.currentYear,
          cgpa: DEFAULT_DEMO_STUDENT.cgpa,
          preferredTypes: DEFAULT_DEMO_STUDENT.preferredTypes,
          preferredMode: DEFAULT_DEMO_STUDENT.preferredMode,
          passwordHash,
          skills: {
            create: DEFAULT_DEMO_STUDENT.skills.map((s: string) => ({ skill: s }))
          },
          interests: {
            create: DEFAULT_DEMO_STUDENT.interests.map((i: string) => ({ interest: i }))
          }
        },
        include: { skills: true, interests: true }
      });
    }

    const token = generateToken({ id: student.id, email: student.email });
    const profile = formatStudentProfile(student);

    res.json({
      success: true,
      message: 'Demo student authenticated successfully',
      token,
      data: profile
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve the current authenticated student profile
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { skills: true, interests: true }
    });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student account not found.' });
      return;
    }

    res.json({
      success: true,
      data: formatStudentProfile(student)
    });
  } catch (error) {
    next(error);
  }
}
