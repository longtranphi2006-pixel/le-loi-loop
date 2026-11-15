async function check() {
  const r = await fetch('https://le-loi-loop.vercel.app/assets/index-D2fmbufr.js');
  const txt = await r.text();
  console.log('Bundle length:', txt.length);
  const matches = txt.match(/https:\/\/[^"']+\.supabase\.co/g);
  console.log('Matches:', matches);

  // Check how supabaseUrl is defined
  const idx = txt.indexOf('supabaseUrl');
  if (idx !== -1) {
    console.log('supabaseUrl snippet:', txt.slice(idx - 50, idx + 200));
  } else {
    console.log('supabaseUrl not found verbatim');
  }

  // Search for VITE_SUPABASE
  const vIdx = txt.indexOf('VITE_SUPABASE');
  if (vIdx !== -1) {
    console.log('VITE_SUPABASE snippet:', txt.slice(vIdx - 50, vIdx + 200));
  }
}
check();
