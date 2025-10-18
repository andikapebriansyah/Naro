// Xendit Payment Module - Direct HTTP Implementation
// Lebih stabil dan mudah debug daripada SDK

function sanitizeEnv(v) {
  if (v == null) return v;
  return v.split('#')[0].trim();
}

const XENDIT_SECRET_KEY = sanitizeEnv(process.env.XENDIT_SECRET_KEY);

if (!XENDIT_SECRET_KEY) {
  console.warn('⚠️  XENDIT_SECRET_KEY not set. Xendit payment features disabled.');
} else {
  console.log('✓ XENDIT_SECRET_KEY found:', XENDIT_SECRET_KEY.substring(0, 20) + '...');
}

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
    throw new Error('Xendit not configured. Set XENDIT_SECRET_KEY in .env');
  }

  try {
    // Build payload sesuai Xendit API v2 spec
    const payload = {
      external_id: String(externalId),
      amount: Number(amount),
      payer_email: String(payerEmail || 'customer@example.com'),
      description: String(description || 'Payment'),
      invoice_duration: 86400,
      currency: 'IDR'
    };

    // Add optional fields
    if (successRedirectUrl) {
      payload.success_redirect_url = String(successRedirectUrl);
    }
    
    if (failureRedirectUrl) {
      payload.failure_redirect_url = String(failureRedirectUrl);
    }

    // Add items if present
    if (items && items.length > 0) {
      payload.items = items.map(item => ({
        name: String(item.name),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price)
      }));
    }

    console.log('📤 Creating invoice via Xendit HTTP API...');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Create Basic Auth header
    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

    // Call Xendit API
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Xendit Response Status:', response.status);
    console.log('Xendit Response:', responseText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error_code || errorMessage;
        console.error('Xendit Error Details:', errorData);
      } catch (e) {
        console.error('Failed to parse error response');
      }
      throw new Error(errorMessage);
    }

    const invoice = JSON.parse(responseText);
    
    console.log('✅ Invoice created successfully:', invoice.id);
    console.log('Invoice URL:', invoice.invoice_url);
    
    return {
      id: invoice.id,
      externalId: invoice.external_id,
      invoiceUrl: invoice.invoice_url,
      amount: invoice.amount,
      status: invoice.status,
      expiryDate: invoice.expiry_date
    };
  } catch (err) {
    console.error('❌ Error creating invoice:', err.message);
    throw err;
  }
}

export async function getInvoice(invoiceId) {
  if (!XENDIT_SECRET_KEY) {
    throw new Error('Xendit not configured');
  }

  try {
    const authString = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');
    
    const response = await fetch(`https://api.xendit.co/v2/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const invoice = await response.json();
    
    return {
      id: invoice.id,
      externalId: invoice.external_id,
      status: invoice.status,
      amount: invoice.amount,
      paidAmount: invoice.paid_amount || 0,
      invoiceUrl: invoice.invoice_url
    };
  } catch (err) {
    console.error('Error getting invoice:', err.message);
    throw err;
  }
}

export function isXenditEnabled() {
  return Boolean(XENDIT_SECRET_KEY);
}
