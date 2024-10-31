const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Assurez-vous d'utiliser la clé de service
const supabase = createClient(supabaseUrl, supabaseKey);

// Route POST pour ajouter ou mettre à jour les disponibilités d'un employé
router.post('/', async (req, res) => {
    const { from_date, to_date } = req.body;
    const email = req.body.employee_email; // Récupérer l'employee_id depuis le frontend

    try {
        // Vérifier s'il existe déjà des enregistrements de dates disponibles pour cet employé
        const { data: existingDates, error } = await supabase
            .from('available_employe')
            .select('id, from_date, to_date')
            .eq('employee_email', email);

        if (error) {
            throw error;
        }

        if (existingDates && existingDates.length > 0) {
            // S'il y a des enregistrements existants, mettre à jour le premier enregistrement trouvé
            const existingRecord = existingDates[0];
            const { data: updatedDates, error: updateError } = await supabase
                .from('available_employe')
                .update({ from_date, to_date })
                .eq('id', existingRecord.id)
                .single();

            if (updateError) {
                throw updateError;
            }

            res.status(200).json(updatedDates);
        } else {
            // Aucun enregistrement existant, insérer une nouvelle entrée
            const { data: newDates, error: insertError } = await supabase
                .from('available_employe')
                .insert([{ employee_email: email, from_date, to_date }])
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

// Route GET pour récupérer toutes les périodes de dates disponibles pour un employé
router.get('/', async (req, res) => {
    const email = req.query.employee_email; // Récupérer l'employee_id depuis le frontend

    try {
        const { data, error } = await supabase
            .from('available_employe')
            .select('*')
            .eq('employee_email', email);

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching available dates:', error.message);
        res.status(500).json({ error: 'Failed to fetch available dates' });
    }
});

router.get('/all', async (req, res) => {

    try {
        const { data, error } = await supabase
            .from('available_employe')
            .select('*')

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching available dates:', error.message);
        res.status(500).json({ error: 'Failed to fetch available dates' });
    }
});

router.post('/delete-availability', async (req, res) => {
    const { email } = req.body;

    try {
        const { data, error } = await supabase
            .from('available_employe')
            .delete()
            .eq('employee_email', email);

        if (error) {
            throw error;
        }

        console.log('Delete response data:', data);

        res.status(200).json({ message: 'Availability deleted successfully' });
    } catch (error) {
        console.error('Error deleting availability:', error.message);
        res.status(500).json({ error: 'Failed to delete availability' });
    }
});

router.get('/days-off/all', async (req, res) => {
    try {
        // Récupérer tous les jours de congé des employés depuis la table 'employee_days_off'
        const { data: daysOffData, error: daysOffError } = await supabase
            .from('employee_days_off')
            .select('*');

        if (daysOffError) {
            throw daysOffError;
        }

        // Récupérer tous les utilisateurs (employés) depuis Supabase Auth
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
            throw usersError;
        }

        // Obtenir la date actuelle
        const currentDate = new Date();

        // Filtrer les employés disponibles en excluant ceux qui ont un jour de congé pour une date future
        const availableEmployees = usersData.users.filter(user => {
            return !daysOffData.some(dayOff => {
                return dayOff.employee_id === user.id && new Date(dayOff.day_off_date) >= currentDate;
            });
        });

        // Renvoyer les jours de congé et les emails des employés disponibles
        res.status(200).json({ daysOff: daysOffData, availableEmployees: availableEmployees.map(user => user.email) });
    } catch (error) {
        console.error('Error fetching all employee days off:', error.message);
        res.status(500).json({ error: 'Failed to fetch all employee days off' });
    }
});

router.get('/days/all', async (req, res) => {
    try {
        // Récupérer tous les enregistrements de la table 'employee_days'
        const { data, error } = await supabase
            .from('employee_days')
            .select('*');

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching all employee days:', error.message);
        res.status(500).json({ error: 'Failed to fetch all employee days' });
    }
});



router.get('/days', async (req, res) => {
    try {
        const { email } = req.query;
        const { data, error } = await supabase
            .from('employee_days')
            .select('*')
            .eq('employee_email', email);

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching employee days:', error);
        res.status(500).json({ error: 'Failed to fetch employee days' });
    }
});

router.post('/days', async (req, res) => {
    try {
        const { email, day_of_week, available } = req.body;

        // Vérifier si l'entrée existe déjà pour cet employé et ce jour
        const { data: existingData, error: fetchError } = await supabase
            .from('employee_days')
            .select()
            .eq('employee_email', email)
            .eq('day_of_week', day_of_week);

        if (fetchError) {
            throw fetchError;
        }

        if (existingData.length > 0) {
            // Mettre à jour l'entrée existante
            const { data: updateData, error: updateError } = await supabase
                .from('employee_days')
                .update({ available })
                .eq('employee_email', email)
                .eq('day_of_week', day_of_week);

            if (updateError) {
                throw updateError;
            }

            res.status(200).json({ message: 'Employee day updated successfully', data: updateData });
        } else {
            // Insérer une nouvelle entrée si aucune n'existe pour cet employé et ce jour
            const { data: insertData, error: insertError } = await supabase
                .from('employee_days')
                .insert([{ employee_email: email, day_of_week, available }]);

            if (insertError) {
                throw insertError;
            }

            res.status(201).json({ message: 'Employee day added successfully', data: insertData });
        }
    } catch (error) {
        console.error('Error adding or updating employee day:', error);
        res.status(500).json({ error: 'Failed to add or update employee day' });
    }
});

// Endpoint pour supprimer un jour disponible pour un employé
router.delete('/days', async (req, res) => {
    try {
        const { email, day_of_week } = req.body;
        const { data, error } = await supabase
            .from('employee_days')
            .delete()
            .eq('employee_email', email)
            .eq('day_of_week', day_of_week);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Employee day deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee day:', error);
        res.status(500).json({ error: 'Failed to delete employee day' });
    }
});

router.post('/days-off', async (req, res) => {
    try {
        const { email, day_off_date } = req.body;

        const { data, error } = await supabase
            .from('employee_days_off')
            .insert([{ employee_email: email, day_off_date }]);

        if (error) {
            throw error;
        }

        res.status(201).json({ message: 'Employee day off added successfully', data });
    } catch (error) {
        console.error('Error adding employee day off:', error.message);
        res.status(500).json({ error: 'Failed to add employee day off' });
    }

});

router.get('/days-off', async (req, res) => {
    try {
        const { email } = req.query;

        const { data, error } = await supabase
            .from('employee_days_off')
            .select('*')
            .eq('employee_email', email);

        if (error) {
            throw error;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching employee days off:', error.message);
        res.status(500).json({ error: 'Failed to fetch employee days off' });
    }
});

router.delete('/days-off/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('employee_days_off')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Employee day off deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee day off:', error.message);
        res.status(500).json({ error: 'Failed to delete employee day off' });
    }
});






module.exports = router;
