import { NextResponse } from 'next/server';
import { createInvoice, isXenditEnabled } from '../../../../../scripts/xendit-payment.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 Create invoice request received');
    
    const { taskId, amount, payerEmail, description, items } = body;

    // Validasi
    if (!taskId) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'taskId is required' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'invalid_amount', message: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    if (amount < 10000) {
      return NextResponse.json(
        { error: 'amount_too_low', message: 'Minimum payment amount is Rp 10,000' },
        { status: 400 }
      );
    }

    // Check Xendit
    if (!isXenditEnabled()) {
      return NextResponse.json(
        {
          error: 'xendit_not_configured',
          message: 'Xendit not configured. Set XENDIT_SECRET_KEY in .env'
        },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Format items
    const formattedItems: Array<{name: string; quantity: number; price: number}> = Array.isArray(items) 
      ? items.filter((item: any) => item.name && item.price > 0).map((item: any) => ({
          name: String(item.name),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price)
        }))
      : [];

    const externalId = `task-${taskId}-${Date.now()}`;
    
    console.log('Creating invoice for task:', taskId);
    console.log('Amount:', amount);
    console.log('Items:', formattedItems.length);
    
    const invoice = await createInvoice({
      externalId: externalId,
      amount: amount,
      payerEmail: payerEmail || 'customer@example.com',
      description: description || `Pembayaran untuk tugas #${taskId}`,
      successRedirectUrl: `${appUrl}/tugas/${taskId}/pembayaran/success`,
      failureRedirectUrl: `${appUrl}/tugas/${taskId}/pembayaran/failed`,
      items: formattedItems as any
    });

    console.log('✅ Invoice created:', invoice.id);

    return NextResponse.json({
      success: true,
      data: invoice
    });
  } catch (err: any) {
    console.error('❌ Create invoice error:', err);
    
    return NextResponse.json(
      {
        error: 'invoice_creation_failed',
        message: err.message || 'Failed to create invoice',
        hint: 'Check server logs for details'
      },
      { status: 500 }
    );
  }
}
