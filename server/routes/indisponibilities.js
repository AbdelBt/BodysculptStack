const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all indisponibilities /indisponibilities

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('indisponibilites')
            .select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update indisponibility
router.post('/', async (req, res) => {
    const { day, value } = req.body;
    try {
        const { data, error } = await supabase
            .from('indisponibilites')
            .update({ [day.toLowerCase()]: value })
            .match({ id: 1 }); // assuming single row for simplicity
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Update an indisponibility
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { day } = req.body;
    try {
        const { data, error } = await supabase
            .from('indisponibilites')
            .update({ day })
            .eq('id', id);
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
