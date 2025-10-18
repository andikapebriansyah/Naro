import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headersList = headers();
    const webhookToken = headersList.get('x-callback-token');

    // Verifikasi webhook token
    if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
      console.error('Invalid webhook token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Xendit webhook received:', body);

    // Handle invoice paid
    if (body.status === 'PAID' || body.status === 'SETTLED') {
      const externalId = body.external_id;
      const taskId = externalId.split('-')[1]; // Extract taskId from external_id format: task-{taskId}-{timestamp}

      console.log(`Payment successful for task ${taskId}`);

      // Update task status di database
      // TODO: Implement database update
      // await updateTaskPaymentStatus(taskId, 'paid', body);

      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully' 
      });
    }

    // Handle invoice expired
    if (body.status === 'EXPIRED') {
      console.log(`Invoice expired: ${body.id}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Invoice expired processed' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received' 
    });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: err.message },
      { status: 500 }
    );
  }
}
