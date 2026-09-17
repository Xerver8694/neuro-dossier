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

RULES:
1. "codename" MUST be strictly a single capitalized word (e.g., "NEXUS", "FORGE", "SYNTH", "VECTOR", "ARCHITECT"). Never use multi-word titles here.
2. "strengths" must highlight mechanical, high-leverage cognitive advantages.
3. "weaknesses" must identify biological throttles and environmental failure states.
4. "areas_of_excellence" must list 3-5 concrete professional fields, creative mediums, or technical disciplines where their specific cognitive architecture naturally outperforms neurotypical defaults.

Respond strictly in valid JSON matching this schema:
{
  "codename": "WORD",
  "archetype_title": "Descriptive Systems Title",
  "classification": { "processing_style": "Style Name" },
  "tactical_breakdown": {
    "core_mechanic": "2-3 sentence analysis of how their mind synthesizes reality at peak efficiency.",
    "strengths": [
      { "trait_name": "Advantage Name", "lived_translation": "Direct translation into operational capability." }
    ],
    "weaknesses": [
      { "vulnerability_name": "System Throttle", "mitigation_protocol": "Concrete accommodation or loadout requirement to bypass friction." }
    ]
  },
  "areas_of_excellence": [
    { "discipline": "Field/Discipline Name", "rationale": "Why their specific cognitive wiring creates an unfair advantage here." }
  ],
  "ideal_operating_environment": {
    "workflow_architecture": "Optimal organizational and operational structure.",
    "sensory_loadout": ["Tool 1", "Tool 2", "Tool 3"]
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
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: profile }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `Upstream returned status ${response.status}` });
    }

    const data = await response.json();
    const rawChoice = data?.choices?.[0]?.message;
    if (!rawChoice || rawChoice.content === null) {
      return res.status(502).json({ error: 'Model returned an empty completion.' });
    }

    let rawContent = rawChoice.content.trim();
    if (rawContent.startsWith('```json')) {
      rawContent = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawContent.startsWith('```')) {
      rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedDossier = JSON.parse(rawContent);
    return res.status(200).json(parsedDossier);

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal parsing failure.' });
  }
};