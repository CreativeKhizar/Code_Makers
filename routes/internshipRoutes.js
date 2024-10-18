const express = require('express');
const router = express.Router();
const pool = require('../config/internshipDbConfig'); // Adjust the path as needed
const PDFDocument = require('pdfkit'); // Require pdfkit
const fs = require('fs'); // To work with the file system
const path = require('path'); // To resolve file paths

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
}

// POST route to handle internship application submission and PDF generation
router.post('/internship-applications', async (req, res) => {
    const { name, rollnumber, collegename, phonenumber, email, domain, start_date, end_date } = req.body;

    // SQL query to insert application details
    const query = `
        INSERT INTO internship_applications (name, rollnumber, collegename, phonenumber, email, domain, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        // Execute the query
        const [result] = await pool.execute(query, [name, rollnumber, collegename, phonenumber, email, domain, start_date, end_date]);

        // Create a PDF document for the offer letter
        const doc = new PDFDocument();

        // Path where the PDF will be saved temporarily
        const pdfPath = `./public/offer_letters/OfferLetter_${result.insertId}.pdf`;

        // Pipe the PDF to a writable stream
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Add images to the PDF (adjust the path based on your directory structure)
        const topImagePath = path.resolve(__dirname, '../public/img/top_Image.jpg');
        const bottomImagePath = path.resolve(__dirname, '../public/img/bottom_Image.jpg');

        // Scaling factors for images
        const maxWidth = 500; // Max width for the PDF content
        const topImageScaleFactor = maxWidth / 940; // Scale for top image
        const bottomImageScaleFactor = maxWidth / 942; // Scale for bottom image

        // Add the top image with appropriate scaling
        doc.image(topImagePath, {
            width: 940 * topImageScaleFactor, // Scale width
            height: 250 * topImageScaleFactor, // Scale height proportionally
            align: 'center',
            valign: 'top'
        });

        doc.moveDown(12); // Add space below the top image

        // PDF content (Offer Letter Details)
        doc.fontSize(12).text('TO WHOMSOEVER IT MAY CONCERN', { align: 'center', underline: true });
        doc.moveDown(1); // Add space after the title
        doc.text(`Dear ${name},`, { align: 'left' });
        doc.moveDown(1); // Add space after the greeting
        doc.text(`On behalf of Codemakers, we are excited to confirm your selection as an Intern under the ${domain} from ${formatDate(start_date)} to ${formatDate(end_date)}. We were impressed with your technical skills and knowledge during the assessment process, and we believe that you will be a valuable addition to our team.`, { align: 'left' });
        doc.moveDown(1); // Add space after the first paragraph
        doc.text(`Codemakers takes pride in providing this exceptional opportunity to young tech enthusiasts like you to make them Industry-ready. Your internship will emphasize learning new skills with a deeper understanding of concepts through hands-on application of the Industrial knowledge which you will gain as an Intern.`, { align: 'left' });
        doc.moveDown(1); // Add space after the second paragraph
        doc.text(`Please note that as a temporary employee, you will not be eligible for any of the employee benefits, and you will not receive any stipend during your internship.`, { align: 'left' });
        doc.moveDown(1); // Add space after the third paragraph
        doc.text(`This offer letter represents the full extent of the Internship Offer. Please review this letter in full and give acknowledgment.`, { align: 'left' });
        doc.moveDown(2); // Add space before the rewards section
        doc.fontSize(12).text('Rewards & Benefits', { align: 'left', underline: true });
        doc.moveDown(1); // Add space before the list
        doc.text('• Certificate of Internship');
        doc.text('• Webinars with Industry Experts');
        doc.text('• Expand your network');
        doc.moveDown(1); // Add space after the list
        doc.text('We look forward to a worthwhile and fruitful association which will make you equipped for future projects, wishing you the most enjoyable and truly meaningful Internship Program experience.');

        // Add the bottom image with appropriate scaling
        doc.image(bottomImagePath, {
            width: 942 * bottomImageScaleFactor, // Scale width
            height: 250 * bottomImageScaleFactor, // Scale height proportionally
            align: 'center',
            valign: 'bottom'
        });

        // Finalize the PDF document
        doc.end();

        // Wait for the PDF to be written and send the response
        writeStream.on('finish', () => {
            res.status(201).json({ 
                message: 'Application submitted successfully',
                applicationId: result.insertId,
                offerLetter: pdfPath  // Send the path or URL to the generated PDF
            });
        });

    } catch (error) {
        console.error('Error inserting application or generating PDF:', error);
        res.status(500).json({ message: 'There was an error submitting your application.' });
    }
});

module.exports = router;
