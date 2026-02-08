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

        const reservationData = JSON.parse(paymentDetails.metadata.reservationData);

        res.json({ reservation: reservationData });

    } catch (err) {
        console.error('Error retrieving Mollie payment:', err);
        res.status(500).json({ error: 'Failed to retrieve payment details' });
    }
});



app.get('/', async (req, res) => {
    res.send('Hello, Backend!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
