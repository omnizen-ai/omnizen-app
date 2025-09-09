import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface StorageBucket {
  name: string;
  public: boolean;
  allowedMimeTypes: string[];
  maxFileSize: number; // in bytes
  retentionDays?: number;
}

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  bucketSize: Record<string, number>;
  recentUploads: number;
}

/**
 * Document Storage Service - Manages organized file storage in Supabase
 * Handles bucket creation, file organization, and storage policies
 */
export class DocumentStorageService {
  private readonly bucketConfigs: Record<string, StorageBucket> = {
    'documents': {
      name: 'documents',
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      retentionDays: 2555 // 7 years
    },
    'banking-statements': {
      name: 'banking-statements',
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      retentionDays: 2555 // 7 years for compliance
    },
    'invoices': {
      name: 'invoices',
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
      ],
      maxFileSize: 25 * 1024 * 1024, // 25MB
      retentionDays: 2555 // 7 years for tax compliance
    },
    'receipts': {
      name: 'receipts',
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
      ],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      retentionDays: 2555 // 7 years for tax compliance
    },
    'contracts': {
      name: 'contracts',
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      retentionDays: 3650 // 10 years for legal compliance
    },
    'temp-uploads': {
      name: 'temp-uploads',
      public: false,
      allowedMimeTypes: [
        '*/*' // Allow all file types for temporary processing
      ],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      retentionDays: 7 // Auto-cleanup after 1 week
    },
    'voice-messages': {
      name: 'voice-messages',
      public: false,
      allowedMimeTypes: [
        'audio/wav',
        'audio/mpeg', // mp3
        'audio/mp4',  // m4a
        'audio/webm',
        'audio/ogg',
        'audio/x-m4a',
        'video/mp4',  // for video messages
        'video/webm',
        'video/quicktime', // mov
      ],
      maxFileSize: 25 * 1024 * 1024, // 25MB - reasonable for voice messages
      retentionDays: 365 // 1 year retention for voice messages
    }
  };

  constructor() {
    this.initializeStorageBuckets();
  }

  /**
   * Initialize all required storage buckets
   */
  async initializeStorageBuckets(): Promise<void> {
    console.log('[DocumentStorage] Initializing storage buckets...');

    for (const [bucketName, config] of Object.entries(this.bucketConfigs)) {
      try {
        await this.createBucketIfNotExists(config);
        await this.updateBucketPolicies(config);
        console.log(`[DocumentStorage] ✓ Bucket '${bucketName}' ready`);
      } catch (error) {
        console.error(`[DocumentStorage] ✗ Failed to initialize bucket '${bucketName}':`, error);
      }
    }

    console.log('[DocumentStorage] Storage initialization complete');
  }

  /**
   * Create a bucket if it doesn't exist
   */
  private async createBucketIfNotExists(config: StorageBucket): Promise<void> {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`);
    }

    const existingBucket = buckets?.find(b => b.name === config.name);
    
    if (!existingBucket) {
      console.log(`[DocumentStorage] Creating bucket: ${config.name}`);
      const { error: createError } = await supabase.storage.createBucket(config.name, {
        public: config.public,
        allowedMimeTypes: config.allowedMimeTypes,
        fileSizeLimit: config.maxFileSize,
      });

      if (createError) {
        throw new Error(`Failed to create bucket '${config.name}': ${createError.message}`);
      }
    }
  }

  /**
   * Update bucket policies for Row Level Security and data isolation
   */
  private async updateBucketPolicies(config: StorageBucket): Promise<void> {
    try {
      // Create comprehensive RLS policies for each bucket
      const policies = this.generateBucketPolicies(config.name);
      
      for (const policy of policies) {
        await this.createOrUpdatePolicy(policy);
      }
      
      console.log(`[DocumentStorage] ✓ RLS policies updated for bucket: ${config.name}`);
    } catch (error) {
      console.error(`[DocumentStorage] ✗ Failed to update policies for ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive RLS policies for a bucket
   */
  private generateBucketPolicies(bucketName: string): Array<{
    name: string;
    definition: string;
    check?: string;
  }> {
    return [
      // SELECT policy - Users can only access files from their organization
      {
        name: `select_${bucketName}_policy`,
        definition: `
          CREATE OR REPLACE POLICY "select_${bucketName}_policy"
          ON storage.objects FOR SELECT
          USING (
            bucket_id = '${bucketName}' 
            AND (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
            AND (
              -- Organization members can access
              auth.jwt() ->> 'org_id' IS NOT NULL
              -- Service role can access everything
              OR auth.jwt() ->> 'role' = 'service_role'
            )
          );`
      },
      
      // INSERT policy - Users can only upload to their organization folder
      {
        name: `insert_${bucketName}_policy`,
        definition: `
          CREATE OR REPLACE POLICY "insert_${bucketName}_policy"
          ON storage.objects FOR INSERT
          WITH CHECK (
            bucket_id = '${bucketName}'
            AND (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
            AND auth.jwt() ->> 'org_id' IS NOT NULL
            AND (
              -- Only authenticated organization users can upload
              auth.jwt() ->> 'user_id' IS NOT NULL
              -- Service role can upload
              OR auth.jwt() ->> 'role' = 'service_role'
            )
          );`
      },
      
      // UPDATE policy - Users can only update files from their organization
      {
        name: `update_${bucketName}_policy`,
        definition: `
          CREATE OR REPLACE POLICY "update_${bucketName}_policy"
          ON storage.objects FOR UPDATE
          USING (
            bucket_id = '${bucketName}'
            AND (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
          )
          WITH CHECK (
            bucket_id = '${bucketName}'
            AND (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
            AND auth.jwt() ->> 'org_id' IS NOT NULL
          );`
      },
      
      // DELETE policy - Only admins or service role can delete
      {
        name: `delete_${bucketName}_policy`,
        definition: `
          CREATE OR REPLACE POLICY "delete_${bucketName}_policy"
          ON storage.objects FOR DELETE
          USING (
            bucket_id = '${bucketName}'
            AND (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
            AND (
              -- Organization admins can delete
              (auth.jwt() ->> 'role')::text IN ('admin', 'owner')
              -- Service role can delete
              OR auth.jwt() ->> 'role' = 'service_role'
            )
          );`
      }
    ];
  }

  /**
   * Create or update a storage policy
   */
  private async createOrUpdatePolicy(policy: { name: string; definition: string; check?: string }): Promise<void> {
    try {
      // Execute the policy creation SQL
      const { error } = await supabase.rpc('execute_sql', {
        sql: policy.definition
      });

      if (error) {
        console.warn(`[DocumentStorage] Policy creation warning for ${policy.name}:`, error.message);
        // Many policies might already exist, so we'll continue
      }
    } catch (error) {
      console.error(`[DocumentStorage] Failed to create policy ${policy.name}:`, error);
    }
  }

  /**
   * Upload a file to the appropriate bucket with comprehensive security validation
   */
  async uploadFile(
    organizationId: string,
    bucket: keyof typeof this.bucketConfigs,
    file: Buffer | File,
    options: {
      fileName: string;
      contentType: string;
      metadata?: Record<string, any>;
      overwrite?: boolean;
      category?: string;
      userId?: string;
      userRole?: string;
      validateAccess?: boolean;
    }
  ): Promise<UploadResult> {
    const { 
      fileName, 
      contentType, 
      metadata = {}, 
      overwrite = false, 
      category, 
      userId,
      userRole,
      validateAccess = true
    } = options;

    try {
      // Validate organization ID format
      if (!organizationId || !this.isValidUUID(organizationId)) {
        return {
          success: false,
          error: 'Invalid organization ID format'
        };
      }

      // Validate bucket
      const bucketConfig = this.bucketConfigs[bucket];
      if (!bucketConfig) {
        return {
          success: false,
          error: `Invalid bucket: ${bucket}`
        };
      }

      // Enhanced security validation
      if (validateAccess) {
        const accessValidation = await this.validateUserAccess(organizationId, userId, userRole, bucket);
        if (!accessValidation.allowed) {
          return {
            success: false,
            error: `Access denied: ${accessValidation.reason}`
          };
        }
      }

      // Content security validation
      const contentValidation = await this.validateFileContent(file, contentType, bucketConfig);
      if (!contentValidation.safe) {
        return {
          success: false,
          error: `Security violation: ${contentValidation.reason}`
        };
      }

      // Validate file type
      if (!this.isAllowedMimeType(contentType, bucketConfig.allowedMimeTypes)) {
        return {
          success: false,
          error: `File type '${contentType}' not allowed in bucket '${bucket}'`
        };
      }

      // Get file buffer
      let fileBuffer: Buffer;
      let fileSize: number;

      if (file instanceof Buffer) {
        fileBuffer = file;
        fileSize = file.length;
      } else {
        fileBuffer = Buffer.from(await file.arrayBuffer());
        fileSize = file.size;
      }

      // Validate file size
      if (fileSize > bucketConfig.maxFileSize) {
        return {
          success: false,
          error: `File size (${fileSize} bytes) exceeds limit (${bucketConfig.maxFileSize} bytes) for bucket '${bucket}'`
        };
      }

      // Generate organized file path
      const filePath = this.generateFilePath(organizationId, category, fileName);

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketConfig.name)
        .upload(filePath, fileBuffer, {
          contentType,
          metadata: {
            ...metadata,
            organizationId,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            category: category || 'general',
            originalName: fileName,
            ipAddress: metadata.ipAddress || 'unknown',
            userAgent: metadata.userAgent || 'unknown',
            securityChecked: true,
          },
          upsert: overwrite,
        });

      if (uploadError) {
        return {
          success: false,
          error: `Upload failed: ${uploadError.message}`
        };
      }

      // Get public URL if bucket is public
      let publicUrl: string | undefined;
      if (bucketConfig.public) {
        const { data: urlData } = supabase.storage
          .from(bucketConfig.name)
          .getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      return {
        success: true,
        filePath: uploadData.path,
        publicUrl,
        metadata: {
          bucket: bucketConfig.name,
          size: fileSize,
          contentType,
          uploadedAt: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error('[DocumentStorage] Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get a signed URL for private file access
   */
  async getSignedUrl(
    bucket: keyof typeof this.bucketConfigs,
    filePath: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const bucketConfig = this.bucketConfigs[bucket];
      if (!bucketConfig) {
        return {
          success: false,
          error: `Invalid bucket: ${bucket}`
        };
      }

      const { data, error } = await supabase.storage
        .from(bucketConfig.name)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return {
          success: false,
          error: `Failed to create signed URL: ${error.message}`
        };
      }

      return {
        success: true,
        url: data.signedUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create signed URL'
      };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(
    bucket: keyof typeof this.bucketConfigs,
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const bucketConfig = this.bucketConfigs[bucket];
      if (!bucketConfig) {
        return {
          success: false,
          error: `Invalid bucket: ${bucket}`
        };
      }

      const { error } = await supabase.storage
        .from(bucketConfig.name)
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: `Delete failed: ${error.message}`
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * List files in an organization's directory
   */
  async listFiles(
    organizationId: string,
    bucket: keyof typeof this.bucketConfigs,
    options: {
      category?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'created_at' | 'updated_at' | 'last_accessed_at';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const bucketConfig = this.bucketConfigs[bucket];
      if (!bucketConfig) {
        return {
          success: false,
          error: `Invalid bucket: ${bucket}`
        };
      }

      const { category, limit = 100, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = options;
      
      // Build path prefix
      let pathPrefix = `${organizationId}/`;
      if (category) {
        pathPrefix += `${category}/`;
      }

      const { data, error } = await supabase.storage
        .from(bucketConfig.name)
        .list(pathPrefix, {
          limit,
          offset,
          sortBy: { column: sortBy, order: sortOrder },
        });

      if (error) {
        return {
          success: false,
          error: `List failed: ${error.message}`
        };
      }

      return {
        success: true,
        files: data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed'
      };
    }
  }

  /**
   * Get storage statistics for an organization
   */
  async getStorageStats(organizationId: string): Promise<StorageStats> {
    const stats: StorageStats = {
      totalFiles: 0,
      totalSize: 0,
      bucketSize: {},
      recentUploads: 0
    };

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const [bucketName, bucketConfig] of Object.entries(this.bucketConfigs)) {
        const { data: files } = await supabase.storage
          .from(bucketConfig.name)
          .list(`${organizationId}/`, {
            limit: 1000, // Adjust as needed
          });

        if (files) {
          const bucketStats = files.reduce((acc, file) => {
            const size = file.metadata?.size || 0;
            const createdAt = new Date(file.created_at);
            
            acc.totalFiles += 1;
            acc.totalSize += size;
            
            if (createdAt >= oneWeekAgo) {
              acc.recentUploads += 1;
            }
            
            return acc;
          }, { totalFiles: 0, totalSize: 0, recentUploads: 0 });

          stats.totalFiles += bucketStats.totalFiles;
          stats.totalSize += bucketStats.totalSize;
          stats.recentUploads += bucketStats.recentUploads;
          stats.bucketSize[bucketName] = bucketStats.totalSize;
        }
      }
    } catch (error) {
      console.error('[DocumentStorage] Failed to get storage stats:', error);
    }

    return stats;
  }

  /**
   * Clean up expired files from temp-uploads bucket
   */
  async cleanupExpiredFiles(): Promise<void> {
    console.log('[DocumentStorage] Starting cleanup of expired files...');

    try {
      const tempBucket = this.bucketConfigs['temp-uploads'];
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - (tempBucket.retentionDays || 7));

      const { data: files, error } = await supabase.storage
        .from(tempBucket.name)
        .list('', { limit: 1000 });

      if (error) {
        console.error('[DocumentStorage] Failed to list temp files:', error);
        return;
      }

      const expiredFiles = files?.filter(file => {
        const createdAt = new Date(file.created_at);
        return createdAt < retentionDate;
      }) || [];

      if (expiredFiles.length > 0) {
        const filePaths = expiredFiles.map(f => f.name);
        const { error: deleteError } = await supabase.storage
          .from(tempBucket.name)
          .remove(filePaths);

        if (deleteError) {
          console.error('[DocumentStorage] Failed to delete expired files:', deleteError);
        } else {
          console.log(`[DocumentStorage] Cleaned up ${filePaths.length} expired files`);
        }
      }

    } catch (error) {
      console.error('[DocumentStorage] Cleanup error:', error);
    }
  }

  /**
   * Validate user access to bucket operations
   */
  private async validateUserAccess(
    organizationId: string, 
    userId: string | undefined, 
    userRole: string | undefined, 
    bucket: keyof typeof this.bucketConfigs
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Service role always has access
      if (userRole === 'service_role') {
        return { allowed: true };
      }

      // User ID is required for non-service operations
      if (!userId || !this.isValidUUID(userId)) {
        return { allowed: false, reason: 'Valid user ID required' };
      }

      // Check if user belongs to the organization
      const userOrgValidation = await this.validateUserOrganization(userId, organizationId);
      if (!userOrgValidation.valid) {
        return { allowed: false, reason: 'User does not belong to organization' };
      }

      // Check bucket-specific permissions
      const bucketPermissions = this.getBucketPermissions(bucket);
      const userRoleLevel = this.getUserRoleLevel(userRole);
      
      if (userRoleLevel < bucketPermissions.minRoleLevel) {
        return { 
          allowed: false, 
          reason: `Insufficient permissions. Required: ${bucketPermissions.minRole}, User: ${userRole}` 
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('[DocumentStorage] Access validation error:', error);
      return { allowed: false, reason: 'Access validation failed' };
    }
  }

  /**
   * Validate user belongs to organization
   */
  private async validateUserOrganization(userId: string, organizationId: string): Promise<{ valid: boolean }> {
    try {
      // Query the database to check user-organization relationship
      const { data, error } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (error || !data) {
        return { valid: false };
      }

      return { valid: true };
    } catch (error) {
      console.error('[DocumentStorage] User organization validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Validate file content for security threats
   */
  private async validateFileContent(
    file: Buffer | File, 
    contentType: string, 
    bucketConfig: StorageBucket
  ): Promise<{ safe: boolean; reason?: string }> {
    try {
      let fileBuffer: Buffer;
      
      if (file instanceof Buffer) {
        fileBuffer = file;
      } else {
        fileBuffer = Buffer.from(await file.arrayBuffer());
      }

      // Check for malicious file signatures
      const maliciousSignatures = [
        // Executable signatures
        Buffer.from([0x4D, 0x5A]), // PE/EXE
        Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF
        Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O
        
        // Script signatures that shouldn't be in documents
        Buffer.from('<?php'), // PHP
        Buffer.from('<script'), // JavaScript
        Buffer.from('javascript:'), // JS protocol
      ];

      for (const signature of maliciousSignatures) {
        if (fileBuffer.indexOf(signature) !== -1) {
          return { safe: false, reason: 'Potentially malicious file detected' };
        }
      }

      // Validate PDF structure if claiming to be PDF
      if (contentType === 'application/pdf') {
        if (!fileBuffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
          return { safe: false, reason: 'Invalid PDF file structure' };
        }
      }

      // Additional MIME type validation
      const actualMimeType = await this.detectMimeType(fileBuffer);
      if (actualMimeType && actualMimeType !== contentType) {
        // Allow some common variations
        const allowedVariations: Record<string, string[]> = {
          'text/plain': ['text/csv', 'application/csv'],
          'image/jpeg': ['image/jpg'],
        };

        const variations = allowedVariations[actualMimeType] || [];
        if (!variations.includes(contentType)) {
          return { 
            safe: false, 
            reason: `MIME type mismatch: claimed ${contentType}, detected ${actualMimeType}` 
          };
        }
      }

      return { safe: true };

    } catch (error) {
      console.error('[DocumentStorage] Content validation error:', error);
      return { safe: false, reason: 'Content validation failed' };
    }
  }

  /**
   * Detect actual MIME type from file buffer
   */
  private async detectMimeType(buffer: Buffer): Promise<string | null> {
    // Common file signatures
    const signatures: Array<{ signature: Buffer; mimeType: string }> = [
      { signature: Buffer.from([0xFF, 0xD8, 0xFF]), mimeType: 'image/jpeg' },
      { signature: Buffer.from([0x89, 0x50, 0x4E, 0x47]), mimeType: 'image/png' },
      { signature: Buffer.from([0x47, 0x49, 0x46]), mimeType: 'image/gif' },
      { signature: Buffer.from('%PDF'), mimeType: 'application/pdf' },
      { signature: Buffer.from([0x50, 0x4B, 0x03, 0x04]), mimeType: 'application/zip' },
      { signature: Buffer.from([0x50, 0x4B, 0x07, 0x08]), mimeType: 'application/zip' },
    ];

    for (const { signature, mimeType } of signatures) {
      if (buffer.subarray(0, signature.length).equals(signature)) {
        return mimeType;
      }
    }

    // Check for Office documents (which are ZIP-based)
    if (buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
      // Could be Office document, need deeper inspection
      const bufferStr = buffer.toString('ascii');
      if (bufferStr.includes('word/')) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      if (bufferStr.includes('xl/')) {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
    }

    return null;
  }

  /**
   * Get bucket permissions configuration
   */
  private getBucketPermissions(bucket: keyof typeof this.bucketConfigs): {
    minRole: string;
    minRoleLevel: number;
    allowedOperations: string[];
  } {
    const permissionsMap = {
      'documents': { minRole: 'user', minRoleLevel: 1, allowedOperations: ['read', 'write'] },
      'banking-statements': { minRole: 'manager', minRoleLevel: 2, allowedOperations: ['read', 'write'] },
      'invoices': { minRole: 'user', minRoleLevel: 1, allowedOperations: ['read', 'write'] },
      'receipts': { minRole: 'user', minRoleLevel: 1, allowedOperations: ['read', 'write'] },
      'contracts': { minRole: 'manager', minRoleLevel: 2, allowedOperations: ['read', 'write'] },
      'temp-uploads': { minRole: 'user', minRoleLevel: 1, allowedOperations: ['read', 'write', 'delete'] },
      'voice-messages': { minRole: 'user', minRoleLevel: 1, allowedOperations: ['read', 'write'] },
    };

    return permissionsMap[bucket] || { minRole: 'admin', minRoleLevel: 3, allowedOperations: [] };
  }

  /**
   * Get numeric role level for comparison
   */
  private getUserRoleLevel(role: string | undefined): number {
    const roleLevels: Record<string, number> = {
      'guest': 0,
      'user': 1,
      'manager': 2,
      'admin': 3,
      'owner': 4,
      'service_role': 5,
    };

    return roleLevels[role || 'guest'] || 0;
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate organized file path with enhanced security
   */
  private generateFilePath(organizationId: string, category: string | undefined, fileName: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const randomId = Math.random().toString(36).substring(2, 15);
    
    // Clean filename
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = cleanFileName.split('.').pop();
    const baseName = cleanFileName.replace(`.${fileExtension}`, '');
    
    // Create unique filename
    const uniqueFileName = `${baseName}_${randomId}.${fileExtension}`;
    
    // Build path: org/category/date/filename
    let path = `${organizationId}/`;
    if (category) {
      path += `${category}/`;
    }
    path += `${timestamp}/${uniqueFileName}`;
    
    return path;
  }

  /**
   * Check if mime type is allowed for bucket
   */
  private isAllowedMimeType(contentType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes('*/*') || allowedTypes.includes(contentType);
  }

  /**
   * Get bucket configuration
   */
  getBucketConfig(bucket: keyof typeof this.bucketConfigs): StorageBucket | null {
    return this.bucketConfigs[bucket] || null;
  }

  /**
   * List available buckets
   */
  getAvailableBuckets(): Array<{ name: string; config: StorageBucket }> {
    return Object.entries(this.bucketConfigs).map(([name, config]) => ({ name, config }));
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorageService();