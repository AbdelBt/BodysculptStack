require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const reserveRouter = require('./routes/reserve');
const indisponibilitiesRouter = require('./routes/indisponibilities');
const availabledatesRouter = require('./routes/availabledates');
const employeeRouter = require('./routes/employee');


const userRouter = require('./routes/user');
const serverRouter = require('./routes/service');


const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


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
        console.log('Reservation metaData:', reservationData);
        console.log('Amount:', amount);
        console.log('Currency:', currency);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'bancontact'],
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: `Reservation: ${reservationData.service}`,
                            images: ['https://i.imgur.com/g5EmQ1z.png'],

                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://bodysculptbymaya.com/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: 'https://bodysculptbymaya.com/cancel',
            metadata: {
                reservationData: JSON.stringify(reservationData),
            },
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Erreur lors de la création de la session de paiement:', error);
        res.status(500).json({ error: 'Échec de la création de la session de paiement' });
    }
});

app.get('/success', async (req, res) => {
    const { session_id } = req.query;

    try {
        // Récupérer les détails de la session de paiement depuis Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);


        // Vérifiez si la session a été payée avec succès
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Le paiement n\'a pas été effectué avec succès.' });
        } else {
            const reservationData = JSON.parse(session.metadata.reservationData);
            // Récupérer et traiter les données de réservation à partir des métadonnées
            const processedReservationData = {
                service: reservationData.service,
                description: reservationData.description,
                date: reservationData.date,
                timeSlot: reservationData.timeSlot,
                clientName: reservationData.clientName,
                clientFirstname: reservationData.clientFirstname,
                clientEmail: session.customer_details.email,
                phoneNumber: reservationData.phoneNumber,
                paymentIntentId: session.payment_intent,
            };

            // Renvoyer les données de réservation en réponse
            res.json({ reservation: processedReservationData });
        }


    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ error: 'Failed to fetch payment details' });
    }
});


app.get('/', async (req, res) => {
    res.send('Hello, Backend!');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
