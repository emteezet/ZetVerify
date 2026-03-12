const { createClient } = require('@supabase/supabase-js');

// Using process.env directly, assuming --env-file will be used
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in process.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);

    try {
        const { data: users, error: usersError } = await supabase.from('profiles').select('*').limit(1);
        if (usersError) console.error('Error fetching from users table:', usersError.message);
        else console.log('Successfully connected to Supabase "users" table!');

        const { data: wallets, error: walletsError } = await supabase.from('wallets').select('*').limit(1);
        if (walletsError) console.error('Error fetching from wallets table:', walletsError.message);
        else console.log('Successfully connected to Supabase "wallets" table!');

        const { data: transactions, error: transactionsError } = await supabase.from('transactions').select('*').limit(1);
        if (transactionsError) console.error('Error fetching from transactions table:', transactionsError.message);
        else console.log('Successfully connected to Supabase "transactions" table!');

    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

checkSupabase();
