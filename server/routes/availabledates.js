const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


router.post('/', async (req, res) => {
    const { from_date, to_date } = req.body;

    try {
        // Vérifier s'il existe déjà des enregistrements de dates disponibles
        const { data: existingDates, error } = await supabase
            .from('available_dates')
            .select('id, from_date, to_date');

        if (error) {
            throw error;
        }

        if (existingDates && existingDates.length > 0) {
            // S'il y a des enregistrements existants, gérer selon votre logique
            // Par exemple, vous pouvez mettre à jour le premier enregistrement trouvé
            const existingRecord = existingDates[0];
            const { data: updatedDates, error: updateError } = await supabase
                .from('available_dates')
                .update({ from_date, to_date })
                .eq('id', existingRecord.id)
                .single(); // Utilisez .single() pour mettre à jour uniquement un enregistrement

            if (updateError) {
                throw updateError;
            }

            res.status(200).json(updatedDates);
        } else {
            // Aucun enregistrement existant, insérer une nouvelle entrée
            const { data: newDates, error: insertError } = await supabase
                .from('available_dates')
                .insert([{ from_date, to_date }])
                .single();

            if (insertError) {
                throw insertError;
            }

            res.status(201).json(newDates);
        }
    } catch (error) {
        console.error('Error adding or updating available dates:', error.message);
        res.status(500).json({ error: 'Failed to add or update available dates' });
    }
});


// Route GET pour récupérer toutes les périodes de dates disponibles
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('available_dates').select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching available dates:', error.message);
        res.status(500).json({ error: 'Failed to fetch available dates' });
    }
});

router.get("/working-hours", async (req, res) => {
    try {
        // Récupérer les horaires de travail depuis la table
        const { data, error } = await supabase.from("working_hours").select("*");

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires de travail:', error.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Route POST pour ajouter ou mettre à jour les horaires de travail
router.post('/working-hours', async (req, res) => {
    const { day_of_week, start_hour, end_hour } = req.body;

    try {
        // Vérifier s'il existe déjà des enregistrements d'horaires de travail
        const { data: existingHours, error } = await supabase
            .from('working_hours')
            .select('id')
            .eq('day_of_week', day_of_week);

        if (error) {
            throw error;
        }

        if (existingHours && existingHours.length > 0) {
            // Si des horaires existent pour ce jour, on met à jour
            const existingRecord = existingHours[0];
            const { data: updatedHours, error: updateError } = await supabase
                .from('working_hours')
                .update({ start_hour, end_hour })
                .eq('id', existingRecord.id)
                .single(); // Utilisez .single() pour mettre à jour uniquement un enregistrement

            if (updateError) {
                throw updateError;
            }

            res.status(200).json(updatedHours);
        } else {
            // Aucun enregistrement existant, insérer une nouvelle entrée
            const { data: newHours, error: insertError } = await supabase
                .from('working_hours')
                .insert([{ day_of_week, start_hour, end_hour }])
                .single();

            if (insertError) {
                throw insertError;
            }

            res.status(201).json(newHours);
        }
    } catch (error) {
        console.error('Error adding or updating working hours:', error.message);
        res.status(500).json({ error: 'Failed to add or update working hours' });
    }
});

router.post('/special-days', async (req, res) => {
    const { date, opening_hour, closing_hour } = req.body;

    try {
        // Vérifier s'il existe déjà des enregistrements pour ce jour spécial
        const { data: existingSpecialDay, error } = await supabase
            .from('special_days')
            .select('id')
            .eq('date', date);

        if (error) {
            throw error;
        }

        if (existingSpecialDay && existingSpecialDay.length > 0) {
            // Si un enregistrement existe pour cette date, on met à jour
            const existingRecord = existingSpecialDay[0];
            const { data: updatedSpecialDay, error: updateError } = await supabase
                .from('special_days')
                .update({ opening_hour, closing_hour })
                .eq('id', existingRecord.id)
                .single();

            if (updateError) {
                throw updateError;
            }

            res.status(200).json(updatedSpecialDay);
        } else {
            // Aucun enregistrement existant, insérer une nouvelle entrée
            const { data: newSpecialDay, error: insertError } = await supabase
                .from('special_days')
                .insert([{ date, opening_hour, closing_hour }])
                .single();

            if (insertError) {
                throw insertError;
            }

            res.status(201).json(newSpecialDay);
        }
    } catch (error) {
        console.error('Error adding or updating special day:', error.message);
        res.status(500).json({ error: 'Failed to add or update special day' });
    }
});

// Route GET pour récupérer tous les jours spéciaux
router.get('/special-days', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('special_days')
            .select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching special days:', error.message);
        res.status(500).json({ error: 'Failed to fetch special days' });
    }
});

// Route GET pour supprimer un jour spéciale
router.delete('/special-days/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('special_days')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'special-days deleted successfully' });
    } catch (error) {
        console.error('Error fetching special days:', error.message);
        res.status(500).json({ error: 'Failed to fetch special days' });
    }
});



module.exports = router;
