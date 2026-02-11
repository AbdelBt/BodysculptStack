require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const reserveRouter = require('./routes/reserve');
const indisponibilitiesRouter = require('./routes/indisponibilities');
const availabledatesRouter = require('./routes/availabledates');
const employeeRouter = require('./routes/employee');

const { createMollieClient } = require('@mollie/api-client');
const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

const axios = require('axios');
const userRouter = require('./routes/user');
const serverRouter = require('./routes/service');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse requests as JSON
app.use(bodyParser.json());
app.use(cors());

// Define routes
app.use('/reserve', reserveRouter);
app.use('/user', userRouter);
app.use('/services', serverRouter);
app.use('/available-dates', availabledatesRouter);
app.use('/employee', employeeRouter);
app.use('/indisponibilities', indisponibilitiesRouter);

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { reservationData, amount, currency } = req.body;

        console.log('Reservation:', reservationData);
        console.log('Amount:', amount);

        const payment = await mollieClient.payments.create({
            amount: {
                value: amount.toFixed(2),
                currency,
            },
            description: `Reservation: ${reservationData.service}`,
            redirectUrl: 'https://bodysculptbymaya.com/success',
            webhookUrl: 'https://bodysculptstack.onrender.com/mollie-webhook',
            metadata: {
                reservationData: JSON.stringify(reservationData),
            },
        });

        console.log('Payment ID:', payment.id);
        res.json({ paymentUrl: payment._links.checkout.href, id: payment.id });
    } catch (error) {
        console.error('Error creating Mollie payment:', error);
        res.status(500).json({ error: 'Mollie payment creation failed' });
    }
});

app.get('/success', async (req, res) => {
    const { payment_id } = req.query;

    if (!payment_id) {
        return res.status(400).json({ error: 'Missing payment_id' });
    }

    try {
        const paymentDetails = await mollieClient.payments.get(payment_id);

        if (paymentDetails.status !== "paid") {
            return res.status(400).json({ error: 'Payment not completed' });
        }
        console.log('Payment status:', paymentDetails.status);

        const reservationData = JSON.parse(paymentDetails.metadata.reservationData);

        // Return reservation data for display
        // The actual reservation is created by the webhook
        res.json({ reservation: reservationData });

    } catch (err) {
        console.error('Error retrieving Mollie payment:', err);
        res.status(500).json({ error: 'Failed to retrieve payment details' });
    }
});

// Mollie webhook endpoint
app.post('/mollie-webhook', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        // Mollie sends the payment id in the POST body
        const paymentId = req.body.id || req.body.payment_id;

        if (!paymentId) {
            console.warn('Webhook received without payment id');
            return res.status(200).send('OK - Missing payment id');
        }

        console.log('Webhook received for payment:', paymentId);

        // Retrieve payment details from Mollie to verify the payment status
        const paymentDetails = await mollieClient.payments.get(paymentId);

        if (!paymentDetails) {
            console.warn('No payment details found for id', paymentId);
            return res.status(200).send('OK - Payment not found');
        }

        console.log('Payment status:', paymentDetails.status);

        // Only proceed when payment is paid
        if (paymentDetails.status !== 'paid') {
            console.log('Payment not paid yet, status:', paymentDetails.status);
            return res.status(200).send('OK - Payment not paid');
        }

        // Extract reservation data from metadata
        const raw = paymentDetails.metadata?.reservationData;
        if (!raw) {
            console.warn('Payment metadata missing reservationData for', paymentId);
            return res.status(200).send('OK - Missing reservation data');
        }

        const reservationData = typeof raw === 'string' ? JSON.parse(raw) : raw;

        console.log('Creating reservation from webhook:', reservationData);

        const response = await axios.post(
            `https://bodysculptstack.onrender.com/reserve`,
            reservationData,
            {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: function (status) {
                    return true;
                }
            }
        );

        if (response.status === 201) {
            console.log('Reservation created successfully via webhook');
        } else {
            console.error('Error creating reservation:', response.status, response.data);
        }

        res.status(200).send('OK');

    } catch (err) {
        console.error('Error handling Mollie webhook:', err?.message || err);
        res.status(200).send('OK');
    }
});

app.get('/', async (req, res) => {
    res.send('Hello, Backend!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});