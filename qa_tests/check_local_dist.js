import fs from 'fs';

const txt = fs.readFileSync('dist/assets/index-D2gvDRYk.js', 'utf8');
console.log('Includes supabase.co:', txt.includes('supabase.co'));
const matches = txt.match(/https:\/\/[^"']+\.supabase\.co/g);
console.log('Matches:', matches);
