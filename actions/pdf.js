"use server";

import { pdfService } from "../services/PdfService";

/**
 * Server Action: Generates a PDF document from identity data
 * @param {object} userData Encrypted identity data
 * @param {string} templateId 'STANDARD' or 'PREMIUM_CARD'
 * @returns {Promise<object>}
 */
export async function generatePdfAction(userData, templateId = 'STANDARD') {
    try {
        const pdfBuffer = await pdfService.generateIdentityDoc(userData, templateId);

        // Convert Buffer to base64 for transport over Server Action
        const base64Pdf = pdfBuffer.toString('base64');

        return {
            success: true,
            data: {
                base64: base64Pdf,
                fileName: `${templateId}_${userData.lastName}.pdf`
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            code: error.code || 'PDF_ERROR'
        };
    }
}
