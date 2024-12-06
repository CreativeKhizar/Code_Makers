const express = require('express');
const router = express.Router();
const pool = require('../config/internshipDbConfig'); // Database configuration
const fs = require('fs'); // For file system operations
const path = require('path'); // To work with file paths
const qr = require('qr-image'); // For QR code generation
const puppeteer = require('puppeteer');

const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options).replace(/(\d+)/, (match) => `${match}${getOrdinalSuffix(match)}`);
};

const getOrdinalSuffix = (day) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = parseInt(day);
    const index = (value > 3 && value < 21) ? 0 : (value % 10 > 0 && value % 10 < 4) ? value % 10 : 0;
    return suffixes[index];
};

// GET route to fetch unapproved applications
router.get('/applications', async (req, res) => {
    try {
        const [applications] = await pool.execute('SELECT * FROM internship_applications order by created_at desc');
        res.json(applications);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'There was an error fetching applications.' });
    }
});

router.get('/applications2', async (req, res) => {
  try {
      const [applications] = await pool.execute('SELECT * FROM internship_applications WHERE approval = true');
      res.json(applications);
  } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'There was an error fetching applications.' });
  }
});


// POST route to approve an application and generate certificate and QR code
router.post('/approve/:internship_id', async (req, res) => {
    const {internship_id}=req.params;
    const { task, amount, payment_id, date } = req.body;
    if(task)
    {
          try{
            await pool.execute('DELETE FROM internship_applications WHERE internship_id = ?', [internship_id]);
            return res.status(200).json({ message: 'Applicant Deleted Sucessfully' });

          }catch{
            return res.status(404).json({ message: 'Application not found.' });

          }
    }
    else{
    try {
        // Fetch the application details
        const [applications] = await pool.execute('SELECT * FROM internship_applications WHERE internship_id = ?', [internship_id]);
        const application = applications[0];

        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }
        function getYesterdayFormatted() {
          const today = new Date();
          today.setDate(today.getDate() - 1);
      
          // Format the date as YYYY-MM-DD
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const day = String(today.getDate()).padStart(2, '0');
      
          return `${year}-${month}-${day}`;
      }      
        let end_date=getYesterdayFormatted();
        if(application.end_date){
          end_date=application.end_date;
        }
        // Approve the application
        await pool.execute('UPDATE internship_applications SET approval = true WHERE internship_id = ?', [internship_id]);
        await pool.execute('Update internship_applications SET end_date = ? WHERE internship_id = ?', [end_date,internship_id]);
        const formattedStartDate = formatDate(application.start_date);
        const formattedEndDate = formatDate(end_date);
        function calculateWeeksBetweenDates(date1, date2) {
          // Parse the input dates
          const startDate = new Date(date1);
          const endDate = new Date(date2);
      
          // Validate the input dates
          if (isNaN(startDate) || isNaN(endDate)) {
              throw new Error("Invalid date format. Please use 'YYYY-MM-DD'.");
          }
      
          // Calculate the difference in milliseconds
          const differenceInMilliseconds = Math.abs(endDate - startDate);
      
          // Convert milliseconds to weeks
          const weeks = differenceInMilliseconds / (1000 * 60 * 60 * 24 * 7);
      
          return Math.floor(weeks); // Return the number of full weeks
      }
      
        // Generate the certificate HTML content
        function convertToThreeDigits(number) {
          return number.toString().padStart(3, '0');
      }
        let weeks=calculateWeeksBetweenDates(application.start_date,end_date);
        if(application.weeks){
          weeks=application.weeks;
        }
        await pool.execute('Update internship_applications SET weeks = ? WHERE internship_id = ?', [weeks,internship_id]);
        if(weeks>4 && weeks%4==0){
          application.weeks=weeks/4+" months";
        }else{
          application.weeks=weeks+" weeks";
        }
        const certificateHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Certificate of Recognition</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 p-6">

            <div class="bg-white max-w-4xl mx-auto p-8 border-4 border-gray-300 shadow-lg">

                <div class="text-center mb-8">
                    <img src="../img/logo.jpg" alt="Company Logo" class="w-40 h-auto mx-auto">
                </div>

                <!-- Certificate Title -->
                <h1 class="text-4xl font-bold text-center mb-8">Certificate of Recognition</h1>

                <!-- To Section -->
                <div class="text-lg text-gray-800 mb-8">
                    <p>Dear <strong>${application.name} (CM2024${convertToThreeDigits(internship_id)})</strong>,</p>
                </div>

                <!-- Body Text -->
                <div class="text-lg text-gray-800 space-y-6">
                    <p>
                        We would like to extend our heartfelt appreciation for your outstanding dedication and invaluable contributions throughout your internship at <strong>Code Makers Pvt Ltd</strong>.
                    </p>

                    <p>
                        In recognition of your exceptional performance as an <strong>${application.domain}</strong>, we are pleased to present you with this certificate.
                    </p>

                    <!-- Internship Details -->
                    <div class="bg-gray-100 p-4 border-l-4 border-blue-600">
                        <p><strong>Domain:</strong> ${application.domain}</p>
                        <p><strong>Internship Period:</strong> ${formattedStartDate} to ${formattedEndDate} (${application.weeks})</p>
                    </div>

                    <p>
                        During your time with us, you consistently demonstrated impressive technical skills, a strong work ethic, and unwavering professionalism. Your commitment to learning and active participation significantly contributed to the success of our team.
                    </p>

                    <p>
                        We congratulate you on the successful completion of your internship and wish you every success in your future career endeavors.
                    </p>
                </div>

                <!-- Signature Section -->
                <div class="mt-12 flex justify-between">
                    <div class="text-right">
                        <div class="text-center mb-8">
                            <img src="../img/logo_seal.png" alt="Company Logo" class="w-40 h-auto mx-auto">
                        </div>
                        <img src="../img/signature.png" alt="Ceo & Founder" class="w-40 h-auto mx-auto">
                        <p class="font-bold">CEO & Founder</p>
                    </div>
                </div>

            </div>

        </body>
        </html>`;

        // Save the certificate HTML to a file
        const certificatePath = path.join(__dirname, `../public/approval/approval_${internship_id}.html`);
        fs.writeFileSync(certificatePath, certificateHtml);

        // Generate the QR code
        const qrCodeUrl = `http://13.60.166.214/approval/approval_${internship_id}.html`;
        const qrCodeImage = qr.image(qrCodeUrl, { type: 'png' });
        const qrCodePath = path.join(__dirname, `../public/qr_codes/qr_${internship_id}.png`);

        // Save the QR code image
        const qrWriteStream = fs.createWriteStream(qrCodePath);
        qrCodeImage.pipe(qrWriteStream);

        qrWriteStream.on('finish', () => {
            // Respond once the QR code is generated
            res.status(200).json({ 
                message: 'Application approved and certificate generated successfully.',
                certificateUrl: `/approval/approval_${internship_id}.html`
            });
        });
        
        const main_certificateHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate of Internship</title>
  <link rel="icon" href="/img/logo.jpg" type="image/x-icon">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Watermark style */
    .watermark-bg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.1;
      width: 80%;
    }

    /* Custom Border Styles */
    .custom-border {
      position: relative;
      padding: 20px;
      border: 5px solid #4a5568;
      border-radius: 15px;
      background: #fff;
      box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);
    }

    .custom-border::before {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      border: 10px solid transparent;
      border-radius: 15px;
      background: linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet);
      z-index: -3;
    }

    .custom-border::after {
      content: '';
      position: absolute;
      top: 5px;
      left: 5px;
      right: 5px;
      bottom: 5px;
      border: 5px solid #9CA3AF;
      border-radius: 15px;
      z-index: -1;
    }

    /* Accreditation logos for responsiveness */
    @media (max-width: 640px) {
      .accreditation-logo {
        height: 5rem;
      }
      .h-24 {
        height: 6rem;
      }
      .large-logo {
        height: 7rem;
      }
    }

    @media (min-width: 641px) {
      .accreditation-logo {
        height: 4rem;
      }
      .h-24 {
        height: 8rem;
      }
      .large-logo {
        height: 6rem;
      }
    }
  </style>
</head>
<body class="bg-gray-100 relative">
  <div class="max-w-4xl mx-auto my-10 p-8 custom-border relative overflow-hidden">

    <!-- Watermark background image -->
    <img src="../img/logo_seal.png" alt="Watermark Logo" class="watermark-bg">

    <!-- Header with logos -->
    <div class="flex flex-col md:flex-row justify-between items-center pb-4 mb-6">
      <!-- Company logo -->
      <img src="../img/logo_seal.png" alt="Company Logo" class="h-32 md:h-32">

      <!-- Accreditation logos -->
      <div class="flex space-x-2 md:space-x-4">
        <img src="../img/aicte.jpg" alt="AICTE Accreditation Logo" class="accreditation-logo large-logo">
        <img src="../img/apsche.jpg" alt="APSCHE Accreditation Logo" class="accreditation-logo h-24">
        <img src="../img/msme.png" alt="MSME Accreditation Logo" class="accreditation-logo h-24">
        <img src="../img/iso.png" alt="ISO Accreditation Logo" class="accreditation-logo h-24">
      </div>
    </div>

    <!-- Certificate Header -->
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold uppercase">Certificate of Internship</h2>
      <p class="text-xl text-gray-700">Presented by CodeMakers</p>
    </div>

    <!-- Certificate Body -->
    <div class="text-center mb-8">
      <p class="text-lg text-justify">
        This is to certify that <strong class="text-4xl font-bold text-blue-900">${application.name}</strong>, <i class="text-2xl font-semibold text-gray-900">CM2024320${application.internship_id}</i> has successfully completed the <strong>${application.domain} Internship Program</strong> at <span class="font-semibold">CODEMAKERS</span> from ${formattedStartDate} to ${formattedEndDate} (${application.weeks}), with Roll No: ${application.rollnumber}, from <span class="font-semibold">${application.collegename}</span>.
        In recognition of your exceptional performance and dedication, we commend your hard work and contributions to our projects.
      </p>
    </div>

    <!-- Footer Section -->
    <div class="flex flex-col md:flex-row">
      <!-- Signature -->
      <div class="text-center md:mr-4">
        <img src="../img/signature.png" alt="Company Seal" class="h-24 mx-auto">
        <hr class="my-2 border-gray-300" style="width: 100%; margin: auto;">
        <p>CEO & FOUNDER</p>
      </div>

      <!-- Seal -->
      <div class="text-center md:mx-4">
        <img src="../img/logo_seal.png" alt="Company Seal" class="h-32 mx-auto">
      </div>

      <!-- QR Code -->
      <div class="text-center md:ml-4">
        <img src="../qr_codes/qr_${application.internship_id}.png" alt="QR Code" class="h-32 mx-auto">
      </div>

      <!-- Gold Seal -->
      <div class="text-center md:mx-6">
        <img src="../img/gold.png" alt="Company Seal" class="h-32 mx-auto">
      </div>
    </div>

  </div>
</body>
</html>

`;

        const htmlFilePath = path.join(__dirname, `../public/certificates/certificate_${internship_id}.html`);
const pdfFilePath = path.join(__dirname, `../public/certificates/certificate_${internship_id}.pdf`);

// Save the certificate HTML to a file
fs.writeFileSync(htmlFilePath, main_certificateHtml); // Use htmlFilePath consistently

// Read the saved HTML file
const html=`http://localhost/certificates/certificate_${internship_id}.html`;
const convertHtmlPageToPdf = async () => {
  try {
      // Launch Puppeteer
      const browser = await puppeteer.launch({
        executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
       });
      const page = await browser.newPage();

      // Navigate to the HTML page
      await page.goto(html, { waitUntil: 'networkidle0' });

      // Generate PDF from the page
      await page.pdf({
          path: pdfFilePath,
          format: 'A4', // Paper size
          landscape: true, // Set to true for landscape mode
          printBackground: true, // Include background colors/images
      });

      // Close the browser
      await browser.close();

      console.log('PDF generated successfully:', pdfFilePath);

//       const receipt=`<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Payment Receipt</title>
//     <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
// </head>
// <body class="bg-gray-50 p-8">
//     <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
//         <!-- Header Section -->
//         <div class="flex justify-between items-center border-b pb-4 mb-4">
//             <div>
//                 <img src="img/logo.jpg" alt="Code Makers Logo" class="w-24">
//                 <h2 class="text-xl font-semibold">CODE MAKERS Private Limited</h2>
//             </div>
//         </div>

//         <!-- Payment Details -->
//         <div class="mb-6">
//             <h3 class="text-lg font-semibold">Payment Receipt</h3>
//             <p class="text-sm text-gray-500">Transaction Reference: <span class="text-gray-800">${payment_id}</span></p>
//             <p class="text-gray-600 mt-1">This is a payment receipt for your transaction on <strong>CODEMAKERS</strong>-Internships</p>
//         </div>

//         <!-- Amount Paid -->
//         <div class="text-2xl font-bold text-gray-800 border-b pb-4 mb-4">
//             <p>AMOUNT PAID <span class="text-blue-600">${amount}</span></p>
//         </div>

//         <!-- Issued To and Date -->
//         <div class="flex justify-between mb-6">
//             <div>
//                 <p class="text-sm text-gray-500">ISSUED TO</p>
//                 <p class="text-gray-800">${applicant.name}</p>
//                 <p class="text-gray-800">${applicant.phonenumber[0]=='+'?applicant.phonenumber:'+91'+applicant.phonenumber}</p>
//             </div>
//             <div class="text-right">
//                 <p class="text-sm text-gray-500">PAID ON</p>
//                 <p class="text-gray-800">${date}</p>
//             </div>
//         </div>

//         <!-- Payment Breakdown Table -->
//         <div class="overflow-x-auto">
//             <table class="w-full text-left border-collapse">
//                 <thead>
//                     <tr class="border-b">
//                         <th class="py-2 text-gray-500">DESCRIPTION</th>
//                         <th class="py-2 text-gray-500">UNIT PRICE</th>
//                         <th class="py-2 text-gray-500">AMOUNT</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr class="border-b">
//                         <td class="py-2">Fee</td>
//                         <td class="py-2">${amount}</td>
//                         <td class="py-2">1</td>
//                         <td class="py-2">${amount}</td>
//                     </tr>
       
//                 </tbody>
//                 <tfoot>
//                     <tr class="border-t font-semibold">
//                         <td class="py-2">Total</td>
//                         <td></td>
//                         <td></td>
//                         <td class="py-2">${account}</td>
//                     </tr>
//                 </tfoot>
//             </table>
//         </div>

//         <!-- Total Amount -->
//         <div class="text-right mt-6">
//             <p class="text-lg font-semibold text-green-600">Amount Paid</p>
//             <p class="text-2xl font-bold text-gray-800">${account}</p>
//         </div>
//     </div>
// </body>
// </html>`;

      
//   const receiptPath = path.join(__dirname, `../public/receipts/receipt_${internship_id}.html`);
//   fs.writeFileSync(receiptPath, receipt);

  } catch (error) {
      console.error('Error generating PDF:', error);
  }
};

// Execute the conversion function
convertHtmlPageToPdf();

    } catch (error) {
        console.error('Error approving application and generating certificate:', error);
        res.status(500).json({ message: 'There was an error processing the approval.' });
    }
  }
});


module.exports = router;
