const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'User logged in successfully', data });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route POST to create a user account
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Create a user with Supabase Auth
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        // Define weekdays array
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Set each weekday as unavailable for the new user
        const { error: insertError } = await supabase
            .from('employee_days')
            .insert(weekdays.map(day => ({
                employee_email: email,
                day_of_week: day,
                available: false,
            })));

        if (insertError) {
            throw insertError;
        }

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error creating user or initializing availability:', error.message);
        res.status(500).json({ error: 'Failed to create user and initialize availability' });
    }
});




// Route GET pour récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) {
            throw error;
        }

        res.status(200).json({ users: data });
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});


module.exports = router;
