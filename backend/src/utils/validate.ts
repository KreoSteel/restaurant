import dotenv from 'dotenv'

const requiredEnv = ['SUPABASE_URL', 'PUBLISH_KEY', 'SECRET_KEY']

dotenv.config()
const config: Record<string, string> = {};
function validateEnv() {
    console.log('Loading environment variables...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('PUBLISH_KEY:', process.env.PUBLISH_KEY ? 'SET' : 'NOT SET');
    console.log('SECRET_KEY:', process.env.SECRET_KEY ? 'SET' : 'NOT SET');
    
    for (const env of requiredEnv) {
        if (!process.env[env]) {
            throw new Error(`Environment variable ${env} is not set`);
        }
        config[env] = process.env[env] as string;
        console.log(`${env} loaded successfully`);
    }
}

export { config, validateEnv }
