module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed. Expected POST.` });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing OPENROUTER_API_KEY.' });
  }

  const { profile } = req.body || {};
  if (!profile) {
    return res.status(400).json({ error: 'Missing diagnostic profile payload.' });
  }

  const systemPrompt = `You are Cerebro-Core, an elite psychological reframing engine. 
Analyze the user's multi-vector neurodivergent profile across attention, execution, sensory limits, and social patterns.
Translate their lived experiences into an objective, tactical dossier using systems-engineering and neurodiversity paradigms.
Respond strictly in valid JSON matching this schema:
{
  "codename": "PRIMARY_CODENAME",
  "archetype_title": "Descriptive Systems Title",
  "classification": { "processing_style": "Style Name" },
  "tactical_breakdown": {
    "core_mechanic": "2-3 sentence precise analysis.",
    "super_traits": [
      { "trait_name": "Advantage Name", "lived_translation": "Operational capability." }
    ],
    "system_vulnerabilities": [
      { "vulnerability_name": "Throttle Name", "mitigation_protocol": "Accommodation protocol." }
    ]
  },
  "ideal_operating_environment": {
    "workflow_architecture": "Optimal organizational structure.",
    "sensory_loadout": ["Tool 1", "Tool 2"]
  }
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://cerebro-core.vercel.app',
        'X-Title': 'Neuro-Dossier'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: profile }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `Upstream returned status ${response.status}` });
    }

    const data = await response.json();

    // Guard against null or missing message payload
    const rawChoice = data?.choices?.[0]?.message;
    if (!rawChoice || rawChoice.content === null || rawChoice.content === undefined) {
      console.error('Empty payload received from model:', JSON.stringify(data));
      return res.status(502).json({ 
        error: `Model returned an empty completion. Reason: ${data?.choices?.[0]?.finish_reason || 'Unknown'}` 
      });
    }

    let rawContent = rawChoice.content.trim();

    // Strip Markdown codeblocks if present
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedDossier = JSON.parse(rawContent);
    return res.status(200).json(parsedDossier);

  } catch (error) {
    console.error('Execution failure:', error);
    return res.status(500).json({ error: error.message || 'Internal parsing failure.' });
  }
};