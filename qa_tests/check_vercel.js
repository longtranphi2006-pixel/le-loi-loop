async function checkVercel() {
  const r = await fetch('https://le-loi-loop.vercel.app');
  const html = await r.text();
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  console.log('Bundle file on Vercel:', match ? match[1] : 'None');
  if (match) {
    const jsResp = await fetch('https://le-loi-loop.vercel.app' + match[1]);
    const js = await jsResp.text();
    console.log('Contains staging ynkhukeqdqewakrqtvtu:', js.includes('ynkhukeqdqewakrqtvtu'));
    console.log('Contains publishable key:', js.includes('sb_publishable_Uq2GNNl4Oj3PcWWRJpIUiQ_ew0XiUoX'));
  }
}
checkVercel();
