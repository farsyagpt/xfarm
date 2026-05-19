import { z } from 'zod';

export const UserStatusSchema = z.enum(['pending_payment', 'active', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const JobTypeSchema = z.enum(['infinity', 'trendline', 'xfarm']);
export type JobType = z.infer<typeof JobTypeSchema>;

export const JobStatusSchema = z.enum(['queued', 'running', 'done', 'failed']);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const AuthSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(2).max(128),
});
export type AuthSignupInput = z.infer<typeof AuthSignupSchema>;

export const AuthLoginSchema = AuthSignupSchema;
export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;

export const CreateJobSchema = z.object({
  type: JobTypeSchema,
  payload: z.record(z.any()).default({}),
});
export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const CreateJobResultSchema = z.object({
  jobId: z.string(),
});
export type CreateJobResult = z.infer<typeof CreateJobResultSchema>;

export const MeSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  status: UserStatusSchema,
});
export type Me = z.infer<typeof MeSchema>;

export const JobSchema = z.object({
  id: z.string(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  outputKey: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});
export type Job = z.infer<typeof JobSchema>;

