const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Route to get all services
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to create a new service
router.post('/', async (req, res) => {
    const { name } = req.body;

    try {
        const { data, error } = await supabase
            .from('services')
            .insert([{ name }])
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to delete a  service
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Supprimer
        const { data, error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: 'service deleted successfully', data });
    } catch (error) {
        console.error('Error deleting services:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }

});

module.exports = router;
