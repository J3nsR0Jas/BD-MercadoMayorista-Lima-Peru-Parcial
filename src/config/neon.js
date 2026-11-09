import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_nEXhxmDkaK94@ep-divine-field-bd7on4fi-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(databaseUrl);

export default sql;