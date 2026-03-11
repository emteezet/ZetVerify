import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { decryptIdentity } from '../lib/crypto/encryption';
import crypto from 'crypto';
import { Logger } from '../lib/utils/logger';
import { AppError, ErrorCodes } from '../lib/errors/AppError';

/**
 * @class PdfService
 * @description Handles multi-template PDF generation for identity slips and cards
 */
export class PdfService {
    /**
     * Generates an identity document based on a template
     * @param {object} userData Encrypted identity data
     * @param {string} templateId 'STANDARD' or 'PREMIUM_CARD'
     * @returns {Promise<Buffer>}
     */
    async generateIdentityDoc(userData, templateId = 'STANDARD') {
        Logger.info("Starting PDF generation", { templateId, user: userData.lastName });

        return new Promise(async (resolve, reject) => {
            try {
                const rawNin = decryptIdentity(userData.nin);
                const serialNumber = `SLIP-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
                const verifyUrl = `${baseUrl}/verify/${rawNin}`;

                const qrBuffer = await QRCode.toBuffer(verifyUrl, {
                    width: 150,
                    margin: 1,
                    color: { dark: '#000000', light: '#ffffff' },
                    errorCorrectionLevel: 'M',
                });

                const doc = new PDFDocument({
                    size: templateId === 'PREMIUM_CARD' ? [242, 153] : 'A4',
                    margin: 0,
                });

                const buffers = [];
                doc.on('data', (chunk) => buffers.push(chunk));
                doc.on('end', () => {
                    Logger.info("PDF generation complete", { templateId });
                    resolve(Buffer.concat(buffers));
                });
                doc.on('error', (err) => {
                    Logger.error("PDF internal streaming error", err);
                    reject(new AppError("Failed to render PDF document", ErrorCodes.PLATFORM_ERROR));
                });

                if (templateId === 'PREMIUM_CARD') {
                    await this._drawPremiumCard(doc, userData, rawNin, qrBuffer, serialNumber, verifyUrl);
                } else {
                    await this._drawStandardSlip(doc, userData, rawNin, qrBuffer, serialNumber, verifyUrl);
                }

                doc.end();
            } catch (error) {
                Logger.error("PDF generation failure", error);
                reject(new AppError("Could not generate document: " + error.message, ErrorCodes.PLATFORM_ERROR));
            }
        });
    }

    /**
     * Legacy Style: Standard NIN Slip (A4)
     */
    async _drawStandardSlip(doc, userData, rawNin, qrBuffer, serialNumber, verifyUrl) {
        const pageWidth = doc.page.width;

        // Header
        doc.rect(0, 0, pageWidth, 100).fill('#0d6b0d');
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff').text('FEDERAL REPUBLIC OF NIGERIA', 0, 20, { align: 'center' });
        doc.fontSize(11).font('Helvetica').fillColor('#d5ecd5').text('NATIONAL IDENTIFICATION NUMBER SLIP', 0, 45, { align: 'center' });
        doc.fontSize(9).fillColor('#a8d9a8').text('National Identity Management Commission', 0, 65, { align: 'center' });
        doc.rect(0, 100, pageWidth, 4).fill('#1a8c1a');

        // Body
        const bodyTop = 130;
        const detailsX = 170;
        let detailsY = bodyTop;

        // Photo Placeholder
        doc.rect(40, bodyTop, 110, 110).fill('#e8e8e8');
        doc.fontSize(9).fillColor('#999999').text('PHOTO', 75, bodyTop + 45);

        // Name
        const fullName = `${userData.firstName} ${userData.lastName}`.toUpperCase();
        this._drawField(doc, 'Full Name', fullName, detailsX, detailsY);
        detailsY += 42;

        // NIN
        this._drawField(doc, 'National Identification Number (NIN)', rawNin, detailsX, detailsY, true);
        detailsY += 45;

        // Grid Details
        this._drawField(doc, 'Date of Birth', userData.dob || '—', detailsX, detailsY);
        this._drawField(doc, 'Gender', userData.gender || '—', detailsX + 170, detailsY);
        detailsY += 40;

        this._drawField(doc, 'Slip Serial No.', serialNumber, detailsX, detailsY);
        this._drawField(doc, 'Issue Date', new Date().toLocaleDateString(), detailsX + 170, detailsY);

        // QR Code
        doc.image(qrBuffer, pageWidth - 190, detailsY + 40, { width: 130, height: 130 });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text('VERIFICATION', 40, detailsY + 40);
        doc.fontSize(8).font('Helvetica').fillColor('#666666').text('Scan QR code or visit:', 40, detailsY + 55);
        doc.fillColor('#0d6b0d').text(verifyUrl, 40, detailsY + 70);

        // Footer
        doc.fontSize(7).fillColor('#999999').text('DISCLAIMER: This is a simulation for educational purposes.', 0, doc.page.height - 40, { align: 'center' });
    }

    /**
     * Premium Style: CR80 Plastic ID Card Layout
     */
    async _drawPremiumCard(doc, userData, rawNin, qrBuffer, serialNumber, verifyUrl) {
        const w = doc.page.width;
        const h = doc.page.height;

        // Background Gradient (Simulated with layers)
        doc.rect(0, 0, w, h).fill('#ffffff');
        doc.rect(0, 0, w, 40).fill('#0d6b0d'); // Green Top Bar

        // Header Text
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text('FEDERAL REPUBLIC OF NIGERIA', 10, 8);
        doc.fontSize(6).font('Helvetica').text('National Identity Management Commission', 10, 18);

        // Photo
        doc.rect(10, 45, 50, 60).fill('#f3f4f6');
        doc.fillColor('#9ca3af').fontSize(6).text('PHOTO', 22, 72);

        // Name & NIN Section
        const textX = 65;
        doc.fillColor('#666666').fontSize(5).text('GIVEN NAMES', textX, 45);
        doc.fillColor('#111111').font('Helvetica-Bold').fontSize(8).text(userData.firstName.toUpperCase(), textX, 52);

        doc.fillColor('#666666').fontSize(5).text('SURNAME', textX, 65);
        doc.fillColor('#111111').font('Helvetica-Bold').fontSize(8).text(userData.lastName.toUpperCase(), textX, 72);

        doc.fillColor('#0d6b0d').fontSize(5).text('NATIONAL IDENTIFICATION NUMBER', textX, 85);
        doc.font('Helvetica-Bold').fontSize(10).text(rawNin.replace(/(.{4})/g, '$1 '), textX, 92);

        // Small Details Row
        doc.fillColor('#666666').fontSize(5).text('DATE OF BIRTH', textX, 108);
        doc.fillColor('#111111').font('Helvetica').fontSize(6).text(userData.dob || '—', textX, 115);

        doc.fillColor('#666666').fontSize(5).text('GENDER', textX + 60, 108);
        doc.fillColor('#111111').font('Helvetica').fontSize(6).text(userData.gender || '—', textX + 60, 115);

        // Footer with QR Code
        doc.rect(0, h - 25, w, 25).fill('#f9fafb');
        doc.image(qrBuffer, w - 30, h - 20, { width: 15, height: 15 });

        doc.fillColor('#9ca3af').fontSize(4).text(`SERIAL: ${serialNumber}`, 10, h - 18);
        doc.text(`ISSUED: ${new Date().toLocaleDateString()}`, 10, h - 12);

        // Security holographic pattern (Simulated)
        doc.opacity(0.1);
        doc.circle(w - 20, 40, 30).lineWidth(1).stroke('#0d6b0d');
        doc.opacity(1.0);
    }

    _drawField(doc, label, value, x, y, isLarge = false) {
        doc.fontSize(8).font('Helvetica').fillColor('#666666').text(label, x, y);
        doc.fontSize(isLarge ? 16 : 11).font('Helvetica-Bold').fillColor(isLarge ? '#0d6b0d' : '#111111').text(value, x, y + 12);
    }
}

export const pdfService = new PdfService();
