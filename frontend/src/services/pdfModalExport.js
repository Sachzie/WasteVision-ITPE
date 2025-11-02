import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getLogoPath = (logoName) => {
  try {
    return new URL(`../assets/img/${logoName}`, import.meta.url).href;
  } catch {
    return null;
  }
};

// Convert image URL to base64
const getBase64FromUrl = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

export const exportRecordDetailToPDF = async (record, userInfo) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header Section with logos
    const logoSize = 25;
    const logoY = 10;
    const leftLogoX = 20;
    const rightLogoX = pageWidth - 20 - logoSize;
    
    // Try to add logos
    const wastevisionLogo = getLogoPath('wastevision-logo.png');
    const tupLogo = getLogoPath('tup-logo.png');
    
    if (wastevisionLogo) {
      try {
        doc.addImage(wastevisionLogo, 'PNG', leftLogoX, logoY, logoSize, logoSize);
      } catch (error) {
        console.warn('WasteVision logo not found');
      }
    }
    
    if (tupLogo) {
      try {
        doc.addImage(tupLogo, 'PNG', rightLogoX, logoY, logoSize, logoSize);
      } catch (error) {
        console.warn('TUP logo not found');
      }
    }
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WasteVision Classification Report', pageWidth / 2, 23, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Detailed Waste Classification Record', pageWidth / 2, 29, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(15, 37, pageWidth - 15, 37);
    
    // Record Information
    let yPos = 47;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Record Information', 15, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const recordInfo = [
      ['Classification Date:', new Date(record.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['User:', userInfo?.name || 'N/A'],
      ['Email:', userInfo?.email || 'N/A'],
      ['Record ID:', record._id || 'N/A']
    ];
    
    recordInfo.forEach(([label, value]) => {
      doc.text(label, 15, yPos);
      doc.text(value, 65, yPos);
      yPos += 7;
    });
    
    // Classification Details
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Classification Details', 15, yPos);
    yPos += 10;
    
    // Items table
    if (record.items && record.items.length > 0) {
      const itemsData = record.items.map((item, index) => [
        (index + 1).toString(),
        item.item || 'Unknown',
        item.type || 'Unknown',
        `${Math.round((item.confidence || 0) * 100)}%`,
        item.recyclable ? 'Yes ✓' : 'No ✗',
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Item Name', 'Category', 'Confidence', 'Recyclable']],
        body: itemsData,
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 9 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Disposal Methods and Descriptions
      record.items.forEach((item, index) => {
        if (item.disposalMethod || item.description) {
          // Check if we need a new page
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`Item ${index + 1}: ${item.item}`, 15, yPos);
          yPos += 8;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          
          if (item.disposalMethod) {
            doc.setFont('helvetica', 'bold');
            doc.text('Disposal Method:', 15, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 6;
            const disposalText = doc.splitTextToSize(item.disposalMethod, pageWidth - 30);
            doc.text(disposalText, 15, yPos);
            yPos += disposalText.length * 5 + 5;
          }
          
          if (item.description) {
            doc.setFont('helvetica', 'bold');
            doc.text('Description:', 15, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 6;
            const descText = doc.splitTextToSize(item.description, pageWidth - 30);
            doc.text(descText, 15, yPos);
            yPos += descText.length * 5 + 10;
          }
        }
      });
    }
    
    // Add images on new page
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Classification Images', 15, yPos);
    yPos += 15;
    
    // Original Image
    if (record.image && record.image.url) {
      try {
        const originalImageBase64 = await getBase64FromUrl(record.image.url);
        if (originalImageBase64) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Original Image:', 15, yPos);
          yPos += 10;
          
          const imgWidth = pageWidth - 30;
          const imgHeight = 80;
          doc.addImage(originalImageBase64, 'JPEG', 15, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 15;
        }
      } catch (error) {
        console.error('Error adding original image:', error);
      }
    }
    
    // Detected Image with bounding boxes
    if (record.detectedImage && record.detectedImage.url) {
      try {
        // Check if we need a new page
        if (yPos > pageHeight - 100) {
          doc.addPage();
          yPos = 20;
        }
        
        const detectedImageBase64 = await getBase64FromUrl(record.detectedImage.url);
        if (detectedImageBase64) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Detected Image (with bounding boxes):', 15, yPos);
          yPos += 10;
          
          const imgWidth = pageWidth - 30;
          const imgHeight = 80;
          doc.addImage(detectedImageBase64, 'JPEG', 15, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 15;
        }
      } catch (error) {
        console.error('Error adding detected image:', error);
      }
    }
    
    // Environmental Impact Note
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const envMessage = 'This classification was performed using AI-powered waste detection technology. Proper waste segregation helps protect our environment and promotes sustainable waste management practices.';
    const splitEnvMessage = doc.splitTextToSize(envMessage, pageWidth - 30);
    doc.text(splitEnvMessage, 15, yPos);
    
    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'Generated by WasteVision - AI-Powered Waste Management System',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
    
    // Save the PDF
    const fileName = `wastevision-record-${record._id}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};