// Xendit Payment Module - Direct HTTP (fallback jika SDK error)

function sanitizeEnv(v) {
  if (v == null) return v;
  return v.split('#')[0].trim();
}

const XENDIT_SECRET_KEY = sanitizeEnv(process.env.XENDIT_SECRET_KEY);

export async function createInvoice({
  externalId,
  amount,
  payerEmail,
  description,
  successRedirectUrl,
  failureRedirectUrl,
  items = []
}) {
  if (!XENDIT_SECRET_KEY) {
    throw new Error('Xendit not configured');
  }

  try {
    const payload = {
      external_id: externalId,
      amount: amount,
      payer_email: payerEmail || 'customer@example.com',
      description: description || 'Payment',
      invoice_duration: 86400,
      currency: 'IDR',
      reminder_time: 1
    };

    if (successRedirectUrl) payload.success_redirect_url = successRedirectUrl;
    if (failureRedirectUrl) payload.failure_redirect_url = failureRedirectUrl;
    if (items.length > 0) {
      payload.items = items.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price
      }));
    }

    console.log('📤 Creating invoice via HTTP...');
    
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const invoice = await response.json();
    
    console.log('✅ Invoice created:', invoice.id);
    
    return {
      id: invoice.id,
      externalId: invoice.external_id,
      invoiceUrl: invoice.invoice_url,
      amount: invoice.amount,
      status: invoice.status,
      expiryDate: invoice.expiry_date
    };
  } catch (err) {
    console.error('❌ HTTP Error:', err.message);
    throw err;
  }
}

export function isXenditEnabled() {
  return Boolean(XENDIT_SECRET_KEY);
}
