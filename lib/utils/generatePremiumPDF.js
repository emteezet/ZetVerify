import PDFDocument from 'pdfkit';
import { generateQRBuffer } from './generateQR.js';
import { generateSerial } from './serial.js';
import path from 'path';
import fs from 'fs';

/**
 * Generate a Premium NIN Slip PDF (Landscape)
 * Returns { buffer, serialNumber }
 */
export async function generatePremiumPDF(user) {
    return new Promise(async (resolve, reject) => {
        try {
            const serialNumber = generateSerial();
            const qrBuffer = await generateQRBuffer(user.nin);

            const dobFormatted = new Date(user.dob).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).toUpperCase();

            const issueDate = new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).toUpperCase();

            // Create Landscape Document
            // Standard CR80 card size is 3.375" x 2.125" (approx 243 x 153 points)
            // But we want to render it on a printable page, so maybe standard A4 Landscape
            // A4 Landscape: 841.89 x 595.28 points
            const doc = new PDFDocument({
                size: [841.89, 595.28], // A4 Landscape
                margin: 0,
                info: {
                    Title: `Premium NIN Slip - ${user.firstName} ${user.lastName}`,
                    Author: 'NIN Platform',
                },
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve({ buffer: pdfBuffer, serialNumber });
            });
            doc.on('error', reject);

            // Centering Coordinates for the Card Graphic
            // The template is ~ 510x165 ratio. Let's make it 510x165
            const cardWidth = 510;
            const cardHeight = 165;

            // X and Y offset to center on A4 landscape
            const startX = (doc.page.width - cardWidth) / 2;
            const startY = (doc.page.height - cardHeight) / 2 - 100; // Move it slightly up

            // --- 1. Draw SVG Background Image (Optional/Best Effort) ---
            // PDFKit doesn't natively draw external complex SVGs easily. 
            // We'll embed it if we can, or render text onto a green backing.
            // Since we must rely on the background image provided: "sample PRemium plastic Data.jpg"
            const templatePath = path.join(process.cwd(), 'public', 'sample PRemium plastic Data.jpg');
            if (fs.existsSync(templatePath)) {
                doc.image(templatePath, startX, startY, { width: cardWidth, height: cardHeight });

                // --- 2. Overlay Text / Data on top to blank out/fill in ---
                // We don't have a blank JPG template available via filesystem except the SVG.
                // Let's draw text over the top. Since we don't have a perfect blank canvas... this might look messy if we overwrite "sample PRemium plastic Data" image.
            }

            // So we'll draw a simulated version...
            doc.rect(startX, startY, cardWidth, cardHeight).fill('#ffffff').stroke('#0d6b0d').stroke();

            // Card Header
            doc.rect(startX, startY, cardWidth, 25).fill('#e0f0e0');
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#0d6b0d')
                .text('FEDERAL REPUBLIC OF NIGERIA - DIGITAL NIN SLIP', startX + 10, startY + 8);

            // Personal Fields Overlay
            const detailsStartX = startX + 140; // Past the photo space
            let y = startY + 40;

            const fullName = [user.firstName, user.middleName].filter(Boolean).join(' ').toUpperCase();

            // Surname
            doc.fontSize(7).fillColor('#666666').text('SURNAME/NOM', detailsStartX, y);
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text((user.lastName || '').toUpperCase(), detailsStartX, y + 10);

            y += 30;
            // Given Names
            doc.fontSize(7).fillColor('#666666').text('GIVEN NAMES/PRENOMS', detailsStartX, y);
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#111').text(fullName, detailsStartX, y + 10);

            y += 30;
            // DOB, Sex, Issue Date
            doc.fontSize(7).fillColor('#666666').text('DATE OF BIRTH', detailsStartX, y);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#111').text(dobFormatted, detailsStartX, y + 10);

            doc.fontSize(7).fillColor('#666666').text('SEX/SEXE', detailsStartX + 80, y);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#111').text((user.gender === 'MALE' ? 'MALE' : 'FEMALE'), detailsStartX + 80, y + 10);

            doc.fontSize(7).fillColor('#666666').text('ISSUE DATE', detailsStartX + 140, y);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#111').text(issueDate, detailsStartX + 140, y + 10);

            // NIN
            const ninY = startY + cardHeight - 35;
            doc.fontSize(10).fillColor('#666666').text('National Identification Number (NIN)', detailsStartX - 100, ninY - 12);
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#000').text(user.nin, detailsStartX - 100, ninY);

            // Photo
            const photoX = startX + 20;
            const photoY = startY + 40;
            const photoW = 60;
            const photoH = 80;

            const photoPath = user.photo && user.photo !== '/uploads/default-avatar.png'
                ? path.join(process.cwd(), 'public', user.photo)
                : null;

            if (photoPath && fs.existsSync(photoPath)) {
                doc.image(photoPath, photoX, photoY, { width: photoW, height: photoH });
            } else {
                doc.rect(photoX, photoY, photoW, photoH).fill('#e8e8e8');
                doc.fontSize(8).fill('#999').text('PHOTO', photoX + 15, photoY + 35);
            }

            // QR Code
            const qrX = startX + cardWidth - 80;
            const qrY = startY + 15;
            doc.image(qrBuffer, qrX, qrY, { width: 60, height: 60 });

            // Disclaimer Side
            doc.fontSize(8).font('Helvetica').fillColor('#444')
                .text("DISCLAIMER: The details on the front of this NIN slip must EXACTLY match the verification result.", startX + cardWidth / 2 + 30, startY + 90, { width: 220, align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
