import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;

    if (!email) {
      return new Response('Error: No email provided', {
        status: 400
      });
    }

    try {
      // Create user in database
      await db.user.create({
        data: {
          clerkUserId: id,
          email: email,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'New User',
          imageUrl: image_url,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error creating user:', error);
      return new Response('Error creating user', {
        status: 500
      });
    }
  }

  return NextResponse.json({ success: true });
} 