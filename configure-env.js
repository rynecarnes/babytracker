const fs = require('fs');
const path = require('path');

// Ensure the directory exists
const dirPath = path.join(__dirname, 'src', 'environments');
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

const targetPath = path.join(dirPath, 'environment.prod.ts');

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL || ""}',
  supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY || ""}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Angular 19 environment variables injected successfully into ${targetPath}`);
