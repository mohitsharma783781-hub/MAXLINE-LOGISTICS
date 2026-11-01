import { supabase } from '../lib/supabaseClient';
import { toValidTenantUUID, generateUUID } from '../utils/uuidHelper';

export interface UploadedKycDoc {
  id: string;
  merchantId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  publicUrl: string;
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export const KycService = {
  /**
   * Upload real KYC document file to Supabase Storage and record in merchant_kyc_documents table
   */
  async uploadDocument(
    tenantId: string,
    documentType: string,
    file: File
  ): Promise<{ success: boolean; message: string; doc?: UploadedKycDoc }> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const ext = file.name.split('.').pop() || 'pdf';
      const cleanType = documentType.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const storagePath = `${validTid}/${cleanType}_${Date.now()}.${ext}`;

      // 1. Upload to Supabase Storage bucket 'kyc-documents'
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('kyc-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'application/pdf',
        });

      if (uploadErr) {
        console.error('[KycService] Upload error:', uploadErr.message);
        return { success: false, message: `Storage upload failed: ${uploadErr.message}` };
      }

      // 2. Obtain Public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(uploadData.path || storagePath);

      const publicUrl = urlData.publicUrl;

      // 3. Record metadata in PostgreSQL merchant_kyc_documents
      const newId = generateUUID();
      const nowIso = new Date().toISOString();

      // Check if document of this type already exists for merchant
      const { data: existing } = await supabase
        .from('merchant_kyc_documents')
        .select('id')
        .eq('merchant_id', validTid)
        .eq('document_type', documentType)
        .maybeSingle();

      let rowId = newId;

      if (existing?.id) {
        rowId = existing.id;
        const { error: updateErr } = await supabase
          .from('merchant_kyc_documents')
          .update({
            document_file_name: file.name,
            document_storage_path: publicUrl,
            verification_status: 'PENDING',
            rejection_reason: null,
            updated_at: nowIso,
          })
          .eq('id', existing.id);

        if (updateErr) {
          console.warn('[KycService] Update record warning:', updateErr.message);
        }
      } else {
        const { error: insertErr } = await supabase
          .from('merchant_kyc_documents')
          .insert([
            {
              id: newId,
              merchant_id: validTid,
              document_type: documentType,
              document_file_name: file.name,
              document_storage_path: publicUrl,
              verification_status: 'PENDING',
              created_at: nowIso,
              updated_at: nowIso,
            },
          ]);

        if (insertErr) {
          console.warn('[KycService] Insert record warning:', insertErr.message);
        }
      }

      const docRecord: UploadedKycDoc = {
        id: rowId,
        merchantId: validTid,
        documentType,
        fileName: file.name,
        storagePath,
        publicUrl,
        status: 'Uploaded',
        uploadedAt: new Date().toLocaleDateString(),
      };

      return {
        success: true,
        message: `${documentType} uploaded successfully and queued for verification.`,
        doc: docRecord,
      };
    } catch (err: any) {
      console.error('[KycService] Exception:', err.message);
      return { success: false, message: err.message || 'Error uploading KYC document.' };
    }
  },

  /**
   * Fetch all uploaded documents for a merchant
   */
  async fetchMerchantDocuments(tenantId: string): Promise<UploadedKycDoc[]> {
    try {
      const validTid = toValidTenantUUID(tenantId);
      const { data, error } = await supabase
        .from('merchant_kyc_documents')
        .select('*')
        .eq('merchant_id', validTid)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((row: any): UploadedKycDoc => {
        let status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected' = 'Pending';
        const rawStatus = (row.verification_status || '').toUpperCase();
        if (rawStatus === 'VERIFIED' || rawStatus === 'APPROVED') status = 'Verified';
        else if (rawStatus === 'REJECTED') status = 'Rejected';
        else if (row.document_storage_path) status = 'Uploaded';

        return {
          id: row.id,
          merchantId: row.merchant_id,
          documentType: row.document_type,
          fileName: row.document_file_name || 'compliance_document.pdf',
          storagePath: row.document_storage_path,
          publicUrl: row.document_storage_path,
          status,
          rejectionReason: row.rejection_reason,
          uploadedAt: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Recent',
        };
      });
    } catch (err: any) {
      console.warn('[KycService] Fetch exception:', err.message);
      return [];
    }
  },

  /**
   * Admin: Update KYC document verification status
   */
  async updateDocumentStatus(
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('merchant_kyc_documents')
        .update({
          verification_status: status,
          rejection_reason: status === 'REJECTED' ? rejectionReason || 'Document requires re-upload' : null,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: `Document marked as ${status}.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error updating status.' };
    }
  },
};
