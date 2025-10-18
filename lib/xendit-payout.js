// Xendit Payout Module - Test Mode Only
// Untuk demo escrow dan payout pekerja
// Gunakan Xendit test API key dari: https://dashboard.xendit.co/settings/developers#api-keys

import Xendit from 'xendit-node';

// sanitize env helper
function sanitizeEnv(v) {
  if (v == null) return v;
  return v.split('#')[0].trim();
}

const XENDIT_SECRET_KEY = sanitizeEnv(process.env.XENDIT_SECRET_KEY);

if (!XENDIT_SECRET_KEY) {
  console.warn('XENDIT_SECRET_KEY not set. Xendit payout features disabled.');
}

let xenditClient = null;
if (XENDIT_SECRET_KEY) {
  try {
    xenditClient = new Xendit({ secretKey: XENDIT_SECRET_KEY });
  } catch (err) {
    console.error('Failed to initialize Xendit client:', err);
  }
}

// In-memory store: userId -> recipient data
const recipientStore = new Map();

export async function createRecipient(userId, bankCode, accountNumber, accountHolderName) {
  if (!xenditClient) {
    throw new Error('Xendit client not initialized. Set XENDIT_SECRET_KEY in .env');
  }

  if (recipientStore.has(userId)) {
    const existing = recipientStore.get(userId);
    console.log(`Recipient already exists for user ${userId}`);
    return existing;
  }

  const recipientData = {
    userId,
    bankCode: bankCode.toUpperCase(),
    accountNumber,
    accountHolderName,
    createdAt: new Date().toISOString()
  };

  recipientStore.set(userId, recipientData);
  console.log(`Recipient data saved for user ${userId}`);
  
  return recipientData;
}

export async function createPayout(userId, amount, description = 'Payout') {
  if (!xenditClient) {
    throw new Error('Xendit client not initialized. Set XENDIT_SECRET_KEY in .env');
  }

  if (amount < 10000) {
    throw new Error('Minimum payout amount is Rp 10.000');
  }

  const recipient = recipientStore.get(userId);
  if (!recipient) {
    throw new Error(`No recipient found for user ${userId}. Create recipient first.`);
  }

  try {
    const { Disbursement } = xenditClient;
    
    const disbursement = await Disbursement.create({
      externalID: `payout-${userId}-${Date.now()}`,
      bankCode: recipient.bankCode,
      accountHolderName: recipient.accountHolderName,
      accountNumber: recipient.accountNumber,
      description: description || `Payout to ${recipient.accountHolderName}`,
      amount: amount
    });

    console.log(`Payout created for user ${userId}:`, disbursement.id, `Rp ${amount}`);
    
    return {
      id: disbursement.id,
      userId: disbursement.user_id,
      externalID: disbursement.external_id,
      amount: disbursement.amount,
      bankCode: disbursement.bank_code,
      accountHolderName: disbursement.account_holder_name,
      accountNumber: disbursement.account_number,
      status: disbursement.status,
      disbursementDescription: disbursement.disbursement_description
    };
  } catch (err) {
    console.error('Error creating payout:', err.message);
    if (err.response) {
      console.error('Xendit API error response:', err.response.data);
    }
    throw new Error(`Failed to create payout: ${err.message}`);
  }
}

export async function getPayoutStatus(externalId) {
  if (!xenditClient) {
    throw new Error('Xendit client not initialized');
  }

  try {
    const { Disbursement } = xenditClient;
    const disbursement = await Disbursement.getByExternalID({ 
      externalID: externalId 
    });
    
    return {
      id: disbursement.id,
      externalID: disbursement.external_id,
      amount: disbursement.amount,
      status: disbursement.status,
      bankCode: disbursement.bank_code,
      accountNumber: disbursement.account_number,
      accountHolderName: disbursement.account_holder_name
    };
  } catch (err) {
    console.error('Error getting payout status:', err.message);
    throw new Error(`Failed to get payout status: ${err.message}`);
  }
}

export function isXenditEnabled() {
  return xenditClient !== null;
}
