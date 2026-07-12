import { z } from 'zod';

export const TenantIdSchema = z.string().uuid("Invalid tenant ID");

export const UploadSchema = z.object({
  file: z.any(), // Handled by FormData
  tenant_id: TenantIdSchema,
});

export const AnomalySchema = z.object({
  anomaly_id: z.string().min(5),
  type: z.string().min(3),
  variance: z.number().nonnegative(),
  severity: z.enum(["High", "Medium", "Low"]),
  description: z.string().min(10),
  bank: z.string().optional(),
  status: z.enum(["Open", "Investigating", "Resolved"]).default("Open"),
});

export const ProductAuditFilterSchema = z.object({
  product_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const AIInsightSchema = z.object({
  metric_type: z.enum(["accuracy", "totalLeakage", "riskScore", "root_cause", "product_audit"]),
  metrics: z.any(),
  tenant_id: TenantIdSchema.optional(),
});

// Edge Function Input Schemas
export const ProcessUploadSchema = z.object({
  tenant_id: TenantIdSchema,
});

export type UploadInput = z.infer<typeof UploadSchema>;
export type AnomalyInput = z.infer<typeof AnomalySchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;