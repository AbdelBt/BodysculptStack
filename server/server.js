require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const reserveRouter = require('./routes/reserve');
const indisponibilitiesRouter = require('./routes/indisponibilities');
const availabledatesRouter = require('./routes/availabledates');
const employeeRouter = require('./routes/employee');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const { reservationData, amount } = req.body;

        console.log("Reservation:", reservationData);
        console.log("Amount:", amount);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'bancontact'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Reservation: ${reservationData.service}`,

                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',

            metadata: {
                reservationData: JSON.stringify(reservationData),
            },
            success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173//cancel`,
        });

        console.log("Stripe session ID:", session.id);
        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating Stripe session:", error);
        res.status(500).json({ error: "Stripe session creation failed" });
    }
});

app.get('/success', async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: "Missing session_id" });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== "paid") {
            return res.status(400).json({ error: "Payment not completed" });
        }

        const reservationData = JSON.parse(session.metadata.reservationData);

        res.json({ reservation: reservationData });

    } catch (err) {
        console.error('Error retrieving session:', err);
        res.status(500).json({ error: 'Failed to retrieve payment details' });
    }
});



app.get('/', async (req, res) => {
    res.send('Hello, Backend!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
