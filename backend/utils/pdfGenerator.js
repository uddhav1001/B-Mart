const puppeteer = require('puppeteer');

/**
 * Generates an Exact PDF Buffer from HTML/CSS
 * @param {Object} order - The order document from MongoDB
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
const generateInvoicePDF = async (order) => {
    try {
        // Prepare data inside the HTML
        const { id, items, total, paymentMethod, customerName, email, phoneNumber, createdAt } = order;
        
        // Calculate totals similar to frontend (mocking the subtotal logic)
        let subtotal = 0;
        let totalQty = 0;
        
        items.forEach(item => {
            subtotal += (item.price * item.quantity);
            totalQty += item.quantity;
        });
        
        // Exact styling replication
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${id}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: #eaedf2;
                    margin: 0;
                    padding: 2rem;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                * {
                    box-sizing: border-box;
                }

                .invoice-card {
                    max-width: 800px;
                    width: 100%;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 40px rgba(0,0,0,0.1);
                    margin: 0 auto;
                    position: relative;
                    overflow: hidden;
                    transform: scale(0.92);
                    transform-origin: top center;
                }

                .invoice-card::before {
                    content: '';
                    position: absolute; top: 0; left: 0; right: 0;
                    height: 5px;
                    background: linear-gradient(90deg, #0c831f, #22c55e);
                }

                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 2.5rem 3rem 2rem;
                    border-bottom: 1px solid #f0f0f0;
                }

                .invoice-brand { display: flex; align-items: center; gap: 1rem; }
                .invoice-brand-icon {
                    width: 52px; height: 52px;
                    background: linear-gradient(135deg, #0c831f, #22c55e);
                    color: white; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.7rem;
                    box-shadow: 0 4px 12px rgba(12,131,31,0.3);
                }
                .invoice-brand-name {
                    font-size: 1.9rem; font-weight: 900; letter-spacing: -0.5px;
                    color: #1f1f1f; line-height: 1;
                }
                .invoice-brand-tagline {
                    font-size: 0.78rem; color: #666666; margin-top: 4px;
                    font-weight: 500; font-style: italic;
                }

                .invoice-meta { text-align: right; }
                .invoice-title-badge {
                    display: inline-block;
                    background: #0f172a; color: white;
                    padding: 4px 12px; border-radius: 20px;
                    font-size: 0.72rem; font-weight: 800; letter-spacing: 1px;
                    margin-bottom: 12px;
                }
                .invoice-meta-row {
                    display: flex; gap: 8px; justify-content: flex-end;
                    font-size: 0.88rem; margin-bottom: 4px;
                }
                .invoice-meta-label { color: #666666; font-weight: 500; }
                .invoice-meta-value { color: #1f1f1f; font-weight: 700; }

                .invoice-success-banner {
                    background: #f0fdf4;
                    padding: 1.25rem 3rem;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex; align-items: center; gap: 1.25rem;
                }
                .invoice-success-icon {
                    background: #22c55e; color: white; width: 32px; height: 32px;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 50%; font-size: 1rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(34,197,94,0.3);
                }
                .invoice-success-title { color: #166534; font-weight: 800; font-size: 1.15rem; margin-bottom: 2px; }
                .invoice-success-sub { color: #15803d; font-size: 0.83rem; }

                .invoice-parties {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    border-bottom: 1px solid #f0f0f0; padding: 1.5rem 3rem;
                }
                .invoice-party { padding: 0 1.5rem; border-right: 1px solid #f0f0f0; }
                .invoice-party:first-child { padding-left: 0; }
                .invoice-party:last-child { border-right: none; padding-right: 0; }
                
                .invoice-party-label { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #999999; margin-bottom: 0.75rem; }
                .invoice-party-name { font-weight: 700; color: #1f1f1f; font-size: 1.05rem; margin-bottom: 0.3rem; }
                .invoice-party-detail { font-size: 0.83rem; color: #666666; line-height: 1.5; }

                .invoice-items-section { padding: 0 3rem 1.5rem; }
                .invoice-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .invoice-th {
                    text-align: left; padding: 1rem 0.75rem; border-bottom: 2px solid #e2e8f0;
                    color: #999999; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .invoice-td { padding: 1rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; color: #1f1f1f; }
                .invoice-tr:last-child .invoice-td { border-bottom: none; }
                .invoice-tr.even { background: #fafbfc; }
                
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: 800; }
                
                .invoice-item-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 600; }
                .invoice-item-img { width: 32px; height: 32px; object-fit: contain; background: white; border-radius: 6px; padding: 2px; border: 1px solid #e2e8f0; }

                .invoice-totals-wrapper { display: flex; justify-content: flex-end; padding: 0 3rem 1.5rem; }
                .invoice-totals { width: 320px; background: #f8fafc; padding: 1.25rem 1.5rem; border-radius: 12px; }
                .invoice-total-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.93rem; color: #666666; font-weight: 500; }
                .invoice-total-divider { height: 1px; background: #e2e8f0; margin: 1rem 0; }
                .invoice-total-row.grand { margin-bottom: 0; font-size: 1.25rem; font-weight: 900; color: #1f1f1f; }

                .invoice-footer { text-align: center; background: #f8fafc; border-top: 1px solid #f0f0f0; padding: 1.5rem 3rem; border-radius: 0 0 16px 16px; }
                .invoice-thank-you { font-weight: 800; font-size: 1.1rem; color: #1f1f1f; margin-bottom: 0.5rem; }
                .invoice-policy { font-size: 0.78rem; color: #666666; max-width: 500px; margin: 0 auto 1.25rem; line-height: 1.6; }
                .invoice-footer-brand { font-size: 0.72rem; font-weight: 700; color: #999999; text-transform: uppercase; letter-spacing: 1px; }
            </style>
        </head>
        <body>
            <div class="invoice-card">
                <div class="invoice-header">
                    <div class="invoice-brand">
                        <div class="invoice-brand-icon">🛒</div>
                        <div>
                            <div class="invoice-brand-name">B-Mart</div>
                            <div class="invoice-brand-tagline">Express Grocery Delivery</div>
                        </div>
                    </div>
                    <div class="invoice-meta">
                        <div class="invoice-title-badge">TAX INVOICE</div>
                        <div class="invoice-meta-row">
                            <span class="invoice-meta-label">Invoice No:</span>
                            <span class="invoice-meta-value">${id}</span>
                        </div>
                        <div class="invoice-meta-row">
                            <span class="invoice-meta-label">Date:</span>
                            <span class="invoice-meta-value">${new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <div class="invoice-success-banner">
                    <span class="invoice-success-icon">✓</span>
                    <div>
                        <div class="invoice-success-title">Payment Successful! Your order is confirmed.</div>
                        <div class="invoice-success-sub">Estimated delivery: <strong>within 10 minutes</strong> &middot; ${totalQty} items ordered</div>
                    </div>
                </div>

                <div class="invoice-parties">
                    <div class="invoice-party">
                        <div class="invoice-party-label">Bill To</div>
                        <div class="invoice-party-name">${customerName}</div>
                        <div class="invoice-party-detail">${email}</div>
                        <div class="invoice-party-detail" style="margin-top: 4px;">${phoneNumber}</div>
                    </div>
                    <div class="invoice-party">
                        <div class="invoice-party-label">From</div>
                        <div class="invoice-party-name">B-Mart Pvt. Ltd.</div>
                        <div class="invoice-party-detail">GSTIN: 29AABCU9603R1ZX</div>
                        <div class="invoice-party-detail">support@bmart.com</div>
                    </div>
                    <div class="invoice-party">
                        <div class="invoice-party-label">Payment Mode</div>
                        <div class="invoice-party-name" style="text-transform: uppercase;">${paymentMethod}</div>
                        <div class="invoice-party-detail">Status: <strong style="color: #22c55e;">PAID ✓</strong></div>
                    </div>
                </div>

                <div class="invoice-items-section">
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th class="invoice-th">Product</th>
                                <th class="invoice-th center">Qty</th>
                                <th class="invoice-th right">Unit Price</th>
                                <th class="invoice-th right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, idx) => `
                                <tr class="invoice-tr ${idx % 2 === 0 ? 'even' : ''}">
                                    <td class="invoice-td">
                                        <div class="invoice-item-cell">
                                            <span>${item.name}</span>
                                        </div>
                                    </td>
                                    <td class="invoice-td center" style="font-weight: 600;">${item.quantity}</td>
                                    <td class="invoice-td right" style="color: #666;">₹${item.price.toFixed(2)}</td>
                                    <td class="invoice-td right bold">₹${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="invoice-totals-wrapper">
                    <div class="invoice-totals">
                        <div class="invoice-total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                        <div class="invoice-total-row"><span>Delivery</span><span style="color: #166534; background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">FREE</span></div>
                        <div class="invoice-total-row"><span>GST @ 5%</span><span>₹${(total - subtotal).toFixed(2)}</span></div>
                        <div class="invoice-total-divider"></div>
                        <div class="invoice-total-row grand"><span>Grand Total</span><span>₹${total.toFixed(2)}</span></div>
                    </div>
                </div>

                <div class="invoice-footer">
                    <div class="invoice-thank-you">🎉 Thank you for shopping with B-Mart!</div>
                    <div class="invoice-policy">This is a computer-generated invoice and does not require a signature. Returns accepted within 7 days of delivery per our return policy.</div>
                    <div class="invoice-footer-brand">B-Mart &middot; Express Grocery Delivery &middot; www.bmart.com</div>
                </div>
            </div>
        </body>
        </html>
        `;

        // Launch puppeteer and generate PDF
        const browser = await puppeteer.launch({ 
            headless: 'new', 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        await browser.close();
        return pdfBuffer;

    } catch (err) {
        console.error("Error generating PDF:", err);
        throw err;
    }
};

module.exports = { generateInvoicePDF };
