import { ReportData } from '@/types/report';

export const generatePDFReport = async (reportData: ReportData, themeColor: string = '#1d4ed8') => {
  // This will dynamically import jsPDF and html2canvas on the client-side
  const jsPDF = (await import('jspdf')).default;
  const html2canvas = (await import('html2canvas')).default;

  // 1. Create a hidden, styled div that represents the A4 PDF Layout
  const reportContainer = document.createElement('div');
  Object.assign(reportContainer.style, {
    position: 'absolute',
    top: '-9999px',
    left: '0',
    width: '800px', // standard width for A4 proportion rendering
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '40px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    boxSizing: 'border-box'
  });

  // 2. Build the HTML structure mimicking a formal Ace Facades report

  reportContainer.innerHTML = `
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; border-bottom: 3px solid ${themeColor}; padding-bottom: 20px; margin-bottom: 30px;">
       <div>
          <h1 style="color: ${themeColor}; font-size: 28px; margin: 0 0 5px 0; font-weight: bold;">ACE FACADES</h1>
          <p style="margin: 0; color: #666; font-size: 14px;">Weekly Site Progress Report</p>
       </div>
       <div style="text-align: right; font-size: 12px; color: #444;">
          <p style="margin: 0 0 3px 0;"><strong>Project:</strong> ${reportData.projectDetails.projectName}</p>
          <p style="margin: 0 0 3px 0;"><strong>Code:</strong> ${reportData.projectDetails.projectCode}</p>
          <p style="margin: 0 0 3px 0;"><strong>Week:</strong> ${reportData.projectDetails.weekUnderReview}</p>
       </div>
    </div>

    <!-- Section 1: Overview -->
    <div style="margin-bottom: 30px;">
       <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor}; margin-top: 0;">1. Project Overview</h2>
       <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
         <tr>
           <td style="padding: 5px; width: 25%;"><strong>Site Manager:</strong></td>
           <td style="padding: 5px; width: 25%;">${reportData.projectDetails.siteManagerName}</td>
           <td style="padding: 5px; width: 25%;"><strong>Report Date:</strong></td>
           <td style="padding: 5px; width: 25%;">${reportData.projectDetails.date}</td>
         </tr>
         <tr>
           <td style="padding: 5px;"><strong>Weather:</strong></td>
           <td style="padding: 5px;">${reportData.projectDetails.weatherCondition}</td>
           <td style="padding: 5px;"></td>
           <td style="padding: 5px;"></td>
         </tr>
       </table>
       
       <h3 style="font-size: 14px; margin: 15px 0 5px 0;">Overall Status Summary</h3>
       <p style="font-size: 13px; line-height: 1.5; color: #333; margin: 0; padding: 10px; background-color: #fafafa; border: 1px solid #eee;">
          ${reportData.overallStatus}
       </p>
    </div>

    <!-- Section 2: Task Progress -->
    <div style="margin-bottom: 30px;">
       <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor};">2. Tracked Tasks</h2>
       <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
         <thead>
           <tr style="background-color: ${themeColor}; color: white;">
             <th style="padding: 8px; border: 1px solid #ccc;">Location</th>
             <th style="padding: 8px; border: 1px solid #ccc;">Description</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 15%;">Progress</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 20%;">Comments</th>
           </tr>
         </thead>
         <tbody>
            ${reportData.tasks.map(t => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">${t.location}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${t.description}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${t.percentageDone}% complete</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${t.comments || '-'}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 10px;">No tasks recorded.</td></tr>'}
         </tbody>
       </table>
    </div>

     <!-- Section 2b: Subcontractors -->
    <div style="margin-bottom: 30px;">
       <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor};">2b. Sub-Contractor Teams on Site</h2>
       <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
         <thead>
           <tr style="background-color: ${themeColor}; color: white;">
             <th style="padding: 8px; border: 1px solid #ccc; width: 15%;">Date</th>
             <th style="padding: 8px; border: 1px solid #ccc;">Company Name</th>
             <th style="padding: 8px; border: 1px solid #ccc;">Trade</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 12%;">Headcount</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 12%;">Hours</th>
           </tr>
         </thead>
         <tbody>
           ${reportData.subcontractors.length > 0 ? reportData.subcontractors.map(sub => `
             <tr>
               <td style="padding: 8px; border: 1px solid #ccc;">${sub.date}</td>
               <td style="padding: 8px; border: 1px solid #ccc;"><strong>${sub.companyName}</strong></td>
               <td style="padding: 8px; border: 1px solid #ccc;">${sub.trade}</td>
               <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${sub.headcount}</td>
               <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${sub.hoursWorked}</td>
             </tr>
           `).join('') : `
             <tr><td colspan="5" style="padding: 10px; border: 1px solid #ccc; text-align: center; color: #666; font-style: italic;">No sub-contractors logged for this period.</td></tr>
           `}
         </tbody>
       </table>
    </div>

    <!-- Section 3: Upcoming Work -->
    <div style="margin-bottom: 30px;">
       <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor};">3. Upcoming Work Schedule</h2>
       <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
         <thead>
           <tr style="background-color: ${themeColor}; color: white;">
             <th style="padding: 8px; border: 1px solid #ccc; width: 15%;">Date</th>
             <th style="padding: 8px; border: 1px solid #ccc;">Planned Activity</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 10%;">Labor</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 20%;">Notes</th>
           </tr>
         </thead>
         <tbody>
            ${reportData.upcomingWork.map(w => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">${w.date}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${w.description}</td>
                <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">${w.laborRequired}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${w.comments || '-'}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 10px;">No upcoming work recorded.</td></tr>'}
         </tbody>
       </table>
    </div>

    <!-- Section 4: Health & Safety (HSE) Tracking -->
    <div style="margin-bottom: 30px;">
       <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor};">4. Health, Safety & Environment (HSE)</h2>
       <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
         <thead>
           <tr style="background-color: ${themeColor}; color: white;">
             <th style="padding: 8px; border: 1px solid #ccc; width: 12%;">Date</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 15%;">Type</th>
             <th style="padding: 8px; border: 1px solid #ccc;">Description</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 30%;">Action Taken</th>
           </tr>
         </thead>
         <tbody>
            ${reportData.hse.map(h => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">${new Date(h.date).toLocaleDateString()}</td>
                <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">${h.type}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${h.description}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${h.actionTaken || '-'}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 10px;">No HSE records logged.</td></tr>'}
         </tbody>
       </table>
    </div>

    <!-- Section 5: Material Deliveries -->
    <div style="margin-bottom: 30px;">
       <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor};">5. Site Material Deliveries</h2>
       <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
         <thead>
           <tr style="background-color: ${themeColor}; color: white;">
             <th style="padding: 8px; border: 1px solid #ccc; width: 12%;">Date Recv.</th>
             <th style="padding: 8px; border: 1px solid #ccc;">Material Description</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 15%;">Quantity</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 12%;">Condition</th>
             <th style="padding: 8px; border: 1px solid #ccc; width: 20%;">Supplier</th>
           </tr>
         </thead>
         <tbody>
            ${reportData.materials.map(m => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ccc;">${new Date(m.dateReceived).toLocaleDateString()}</td>
                <td style="padding: 8px; border: 1px solid #ccc;"><strong>${m.materialName}</strong></td>
                <td style="padding: 8px; border: 1px solid #ccc;">${m.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ccc; color: ${m.condition === 'Good' ? '#15803d' : '#b91c1c'}">${m.condition}</td>
                <td style="padding: 8px; border: 1px solid #ccc;">${m.supplier || '-'}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 10px;">No materials delivered.</td></tr>'}
         </tbody>
       </table>
    </div>

    <!-- Section 5: Remarks & Sign-off -->
    <div style="margin-bottom: 30px; border-top: 1px solid #ccc; padding-top: 20px;">
       <h3 style="font-size: 14px; margin: 0 0 5px 0;">Final Remarks & Actions</h3>
       <p style="font-size: 13px; color: #333; margin: 0 0 20px 0;">${reportData.remarks || 'No additional remarks.'}</p>
       
       <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 45%; text-align: center;">
             <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
             <p style="margin: 0; font-size: 12px; font-weight: bold;">${reportData.preparerName || '________________'}</p>
             <p style="margin: 0; font-size: 11px; color: #555;">${reportData.preparerTitle || 'Site Manager'}</p>
          </div>
          <div style="width: 45%; text-align: center;">
             <div style="border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px;"></div>
             <p style="margin: 0; font-size: 12px; font-weight: bold;">Date</p>
             <p style="margin: 0; font-size: 11px; color: #555;">${reportData.signDate || '________________'}</p>
          </div>
       </div>
    </div>

    <!-- Section 6: Image Evidence (Rendered on sequential pages if needed) -->
    ${reportData.images.length > 0 ? `
     <div style="page-break-before: always; padding-top: 20px;">
        <h2 style="background-color: #f1f5f9; padding: 5px 10px; font-size: 16px; border-left: 4px solid ${themeColor};">Appendix: Photographic Evidence</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-top: 20px;">
           ${reportData.images.map(img => `
              <div style="width: 45%; border: 1px solid #ccc; padding: 10px; text-align: center;">
                 <img src="${img.url}" style="max-width: 100%; height: 200px; object-fit: cover; display: block; margin: 0 auto 10px auto;" />
                 <p style="font-size: 11px; color: #333; margin: 0;"><i>${img.caption || 'No caption provided'}</i></p>
              </div>
           `).join('')}
        </div>
     </div>
    ` : ''}

  `;

  document.body.appendChild(reportContainer);

  try {
    // 3. Render HTML to canvas
    const canvas = await html2canvas(reportContainer, {
      scale: 2, // higher resolution
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 4. Calculate heights and split across pages for PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Height of image in mm on the PDF page
    const ratio = pdfWidth / imgWidth;
    const renderedHeight = imgHeight * ratio;

    let heightLeft = renderedHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - renderedHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight);
      heightLeft -= pdfHeight;
    }

    // 5. Clean up and download
    document.body.removeChild(reportContainer);
    pdf.save(`AceTrack_Report_${reportData.projectDetails.projectName.replace(/\s+/g, '_')}_${reportData.projectDetails.date}.pdf`);

    return true;
  } catch (err) {
    console.error("Error generating PDF", err);
    document.body.removeChild(reportContainer);
    return false;
  }
};
