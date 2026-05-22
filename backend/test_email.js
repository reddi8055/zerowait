import dotenv from 'dotenv';
dotenv.config();

import { sendConfirmationEmail } from './utils/notifications.js';

async function test() {
  console.log('Testing Email...');
  await sendConfirmationEmail({
    ownerEmail: 'madduri.adith505@gmail.com',
    restaurantName: 'Test Restaurant',
    customerEmail: 'madduri.adith505@gmail.com', // Sending to yourself
    customerName: 'Adith',
    city: 'Hyderabad',
    bookingTime: new Date().toISOString(),
    waitingTimeStatus: '15-20 mins waiting time',
    bookingId: 'TEST_BOOKING_123'
  });
  console.log('Test finished.');
}

test();
