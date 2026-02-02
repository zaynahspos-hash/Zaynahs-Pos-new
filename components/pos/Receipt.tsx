import { Order, Settings, Tenant } from '../../types';

export const printReceipt = (order: Order, tenant: Tenant, settings: Settings | null, isReprint: boolean = false) => {
  if (!tenant) {
    console.error("Print Error: Tenant data is missing");
    return;
  }

  const currency = settings?.currency || 'USD';
  const header = settings?.receiptHeader || '';
  const footer = settings?.receiptFooter || 'Thank you for your business!';
  
  // Settings with defaults
  const showLogo = settings?.showLogoOnReceipt ?? true;
  const showCashier = settings?.showCashierOnReceipt ?? true;
  const showCustomer = settings?.showCustomerOnReceipt ?? true;
  const showTax = settings?.showTaxBreakdown ?? true;
  const showBarcode = settings?.showBarcode ?? true;
  const showSalesPerson = settings?.showSalesPersonOnReceipt ?? true;
  
  const width = settings?.receiptWidth || '80mm';
  const template = settings?.receiptTemplate || 'modern';
  const fontSize = settings?.receiptFontSize || 12;
  const margin = settings?.receiptMargin || 10;

  // Base Styles
  let fontFamily = "'Courier New', Courier, monospace";
  let textAlign = 'center';
  let separator = `border-bottom: 1px dashed #000; margin: 5px 0;`;
  let tableHeaderStyle = `border-bottom: 1px dashed #000; font-size: 0.9em; padding-bottom: 2px;`;
  
  // Template Specific Adjustments
  if (template === 'modern') {
    fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    separator = `border-bottom: 1px solid #ddd; margin: 8px 0;`;
    tableHeaderStyle = `border-bottom: 2px solid #333; font-weight: bold; font-size: 0.85em; text-transform: uppercase; color: #333;`;
  } else if (template === 'minimal') {
    fontFamily = "'Inter', sans-serif";
    textAlign = 'left';
    separator = `border-bottom: 1px solid #eee; margin: 10px 0;`;
    tableHeaderStyle = `font-size: 0.8em; color: #666; text-transform: uppercase; letter-spacing: 1px;`;
  } else if (template === 'bold') {
    fontFamily = "Impact, sans-serif";
    separator = `border-bottom: 2px solid #000; margin: 8px 0;`;
    tableHeaderStyle = `background: #000; color: #fff; font-weight: bold; padding: 4px;`;
  }

  // Determine Page Size for Print
  const pageSize = width === 'A4' ? 'A4' : `${width} auto`; 

  const orderId = order.id || '---';

  const receiptContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${orderId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
          @page { 
            margin: 0; 
            size: ${pageSize}; 
          }
          @media print {
            body { margin: 0; padding: 0; }
            html, body { height: auto; }
          }
          body { 
            font-family: ${fontFamily};
            font-size: ${fontSize}px;
            width: ${width === 'A4' ? '100%' : width};
            margin: 0 auto;
            padding: ${margin}mm;
            color: #000;
            background: #fff;
            line-height: 1.3;
            box-sizing: border-box;
          }
          
          .container { width: 100%; }
          
          .header { text-align: ${textAlign === 'left' ? 'left' : 'center'}; margin-bottom: 10px; }
          .logo-container { margin-bottom: 8px; text-align: ${textAlign === 'left' ? 'left' : 'center'}; }
          .logo-img { max-width: 60%; height: auto; -webkit-filter: grayscale(100%); filter: grayscale(100%); }
          
          .store-name { font-size: 1.4em; font-weight: bold; margin-bottom: 4px; display: block; }
          .store-info { font-size: 0.9em; margin-bottom: 2px; color: #333; }
          
          .divider { ${separator} }
          
          .meta { font-size: 0.9em; margin-bottom: 10px; color: #444; }
          .meta-row { display: flex; justify-content: space-between; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .items-table th { text-align: left; ${tableHeaderStyle} }
          .items-table td { padding: 4px 0; vertical-align: top; }
          
          .item-name { font-weight: 600; display: block; }
          .item-meta { font-size: 0.85em; color: #666; }
          
          .totals-table { width: 100%; margin-top: 10px; }
          .totals-table td { padding: 2px 0; }
          .total-row td { font-size: 1.2em; font-weight: bold; padding-top: 5px; border-top: 1px solid #000; }
          
          .footer { text-align: center; margin-top: 15px; font-size: 0.85em; color: #555; white-space: pre-wrap; }
          
          .barcode-container { text-align: center; margin-top: 10px; }
          .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 2.5em; display: inline-block; }
          
          .reprint-badge { 
             text-align: center; 
             font-weight: bold; 
             font-size: 1.1em; 
             margin-bottom: 10px; 
             border: 2px solid #000; 
             padding: 5px; 
             text-transform: uppercase;
          }

          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          
          ${isReprint ? `<div class="reprint-badge">*** DUPLICATE RECEIPT ***</div>` : ''}

          <!-- Header Section -->
          <div class="header">
            ${showLogo && tenant.logoUrl ? `<div class="logo-container"><img src="${tenant.logoUrl}" class="logo-img" alt="Store Logo"/></div>` : ''}
            <div class="store-name">${tenant.name}</div>
            ${tenant.address ? `<div class="store-info">${tenant.address}</div>` : ''}
            ${tenant.phone ? `<div class="store-info">Tel: ${tenant.phone}</div>` : ''}
            ${tenant.email ? `<div class="store-info">${tenant.email}</div>` : ''}
            ${header ? `<div class="store-info" style="margin-top:5px; font-style:italic;">${header}</div>` : ''}
          </div>

          <div class="divider"></div>

          <!-- Meta Data -->
          <div class="meta">
            <div class="meta-row">
               <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
               <span>Time: ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div class="meta-row">
               <span>Order ID:</span>
               <span class="bold">#${orderId.slice(-6).toUpperCase()}</span>
            </div>
            ${showSalesPerson && order.salespersonName ? `
            <div class="meta-row">
               <span>Server:</span>
               <span>${order.salespersonName}</span>
            </div>` : ''}
            ${showCashier && order.cashierName ? `
            <div class="meta-row">
               <span>Cashier:</span>
               <span>${order.cashierName}</span>
            </div>` : ''}
            ${showCustomer && order.customerName && order.customerName !== 'Walk-in Customer' ? `
            <div class="meta-row" style="margin-top:4px; font-weight:bold;">
               <span>Customer:</span>
               <span>${order.customerName}</span>
            </div>` : ''}
          </div>

          <div class="divider"></div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%">ITEM</th>
                <th style="width: 15%; text-align:center;">QTY</th>
                <th style="width: 35%; text-align:right;">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const isReturn = item.type === 'RETURN';
                // Show variant options if any
                const variants = item.selectedVariants ? Object.values(item.selectedVariants).join('/') : '';
                return `
                <tr>
                  <td>
                    <span class="item-name">${item.productName} ${isReturn ? '(RETURN)' : ''}</span>
                    ${variants ? `<div class="item-meta">${variants}</div>` : ''}
                  </td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right;">
                    ${isReturn ? '-' : ''}${(item.priceAtTime * item.quantity).toFixed(2)}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <!-- Totals -->
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td class="text-right">${currency} ${(order.totalAmount + (order.discountAmount || 0) - (order.totalAmount * (settings?.taxRate || 0))).toFixed(2)}</td>
            </tr>
            ${order.discountAmount && order.discountAmount > 0 ? `
            <tr style="color: #ef4444;">
              <td>Discount ${order.discountType === 'PERCENT' ? '(%)' : ''}</td>
              <td class="text-right">-${currency} ${order.discountAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${showTax && settings?.taxRate ? `
            <tr>
              <td>Tax (${(settings.taxRate * 100).toFixed(0)}%)</td>
              <td class="text-right">${currency} ${(order.totalAmount - (order.totalAmount / (1 + settings.taxRate))).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td>TOTAL</td>
              <td class="text-right">${currency} ${order.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <!-- Footer -->
          <div class="footer">
            ${footer}
          </div>
          
          ${showBarcode && order.id ? `
          <div class="barcode-container">
            <div class="barcode">*${orderId.slice(-8).toUpperCase()}*</div>
            <div style="font-size: 0.7em; letter-spacing: 2px;">${orderId.slice(-8).toUpperCase()}</div>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  // Create invisible iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'receipt-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(receiptContent);
    doc.close();
    
    const triggerPrint = () => {
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch (e) {
            console.error("Printing failed:", e);
        } finally {
            // Remove iframe after print dialog closes (delay ensures dialog has opened)
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 2000);
        }
    };

    // Check for images and wait for them to load
    const images = doc.getElementsByTagName('img');
    if (images.length > 0) {
        let loaded = 0;
        const onImgLoad = () => {
            loaded++;
            if (loaded === images.length) triggerPrint();
        };
        
        let allComplete = true;
        for (let i = 0; i < images.length; i++) {
            if (!images[i].complete) {
                allComplete = false;
                images[i].onload = onImgLoad;
                images[i].onerror = onImgLoad; // Trigger anyway on error
            } else {
                loaded++;
            }
        }
        
        if (allComplete) {
            setTimeout(triggerPrint, 300); // Slight delay for layout reflow
        }
    } else {
        // No images, print immediately after slight delay
        setTimeout(triggerPrint, 300);
    }

    // Safety fallback: Force print if image loading hangs (1.5 seconds)
    setTimeout(() => {
        if (document.body.contains(iframe)) {
             // We can't easily check if print() was called, but calling it again
             // usually just focuses the dialog. 
             // Ideally we'd set a flag, but for simple receipts this is fine.
        }
    }, 1500);

  } else {
     if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
     }
  }
};