export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY niet ingesteld' });
  try {
    const { image_base64, media_type } = req.body || {};
    if (!image_base64) return res.status(400).json({ error: 'Geen afbeeldingsdata' });
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': apiKey },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: media_type || 'image/jpeg', data: image_base64 } },
        { type: 'text', text: 'Lees alle ingrediënten en hoeveelheden letterlijk over uit dit recept. Geef alleen de ingrediëntenlijst terug, geen andere tekst.' }
      ]}]})
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API fout' });
    return res.status(200).json({ text: data.content?.find(b => b.type === 'text')?.text || '' });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
