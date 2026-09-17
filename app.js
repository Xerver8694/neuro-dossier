document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generateBtn');
  const focusInput = document.getElementById('focusInput');
  const executionInput = document.getElementById('executionInput');
  const sensoryInput = document.getElementById('sensoryInput');
  const socialInput = document.getElementById('socialInput');

  if (!generateBtn) return;

  generateBtn.addEventListener('click', async () => {
    const focus = focusInput.value.trim();
    const execution = executionInput.value.trim();
    const sensory = sensoryInput.value.trim();
    const social = socialInput.value.trim();

    if (!focus && !execution && !sensory && !social) {
      alert('Please complete at least one section before running diagnostic.');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'RUNNING MULTI-VECTOR DIAGNOSTIC...';

    const synthesizedProfile = `
[VECTOR 01: ATTENTION & HYPERFOCUS]
${focus || 'Not specified.'}

[VECTOR 02: PROBLEM-SOLVING & WORKFLOW ARCHITECTURE]
${execution || 'Not specified.'}

[VECTOR 03: SENSORY LANDSCAPE & SENSITIVITIES]
${sensory || 'Not specified.'}

[VECTOR 04: SOCIAL ARCHITECTURE & COMMUNICATION]
${social || 'Not specified.'}
`.trim();

    try {
      // Calls your own backend function; no API keys exposed here
      const response = await fetch('/api/diagnose.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: synthesizedProfile })
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `Server responded with status ${response.status}`);
      }

      const dossier = await response.json();
      renderDossier(dossier);

    } catch (err) {
      console.error('Execution failure:', err);
      alert(`Diagnostic Error: ${err.message}`);
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'INITIALIZE DIAGNOSTIC';
    }
  });

  function renderDossier(data) {
    // Defensively enforce single-word codename formatting
    let codename = (data.codename || 'UNKNOWN').trim().toUpperCase();
    if (codename.includes(' ')) {
      codename = codename.split(' ')[0];
    }

    document.getElementById('codenameDisplay').textContent = codename;
    document.getElementById('archetypeDisplay').textContent = data.archetype_title || '';
    document.getElementById('processingStyleBadge').textContent = data.classification?.processing_style || 'Standard';
    document.getElementById('coreMechanicDisplay').textContent = data.tactical_breakdown?.core_mechanic || '';

    // Strengths
    const traitsList = document.getElementById('traitsList');
    const strengths = data.tactical_breakdown?.strengths || data.tactical_breakdown?.super_traits || [];
    traitsList.innerHTML = strengths
      .map(t => `<li><strong>${t.trait_name}:</strong> ${t.lived_translation}</li>`).join('');

    // Weaknesses
    const vulnList = document.getElementById('vulnerabilitiesList');
    const weaknesses = data.tactical_breakdown?.weaknesses || data.tactical_breakdown?.system_vulnerabilities || [];
    vulnList.innerHTML = weaknesses
      .map(v => `<li><strong>${v.vulnerability_name}:</strong> ${v.mitigation_protocol}</li>`).join('');

    // Areas of Excellence
    const excellenceList = document.getElementById('excellenceList');
    excellenceList.innerHTML = (data.areas_of_excellence || [])
      .map(item => `<li><strong>${item.discipline}:</strong> ${item.rationale}</li>`).join('');

    // Workflow & Sensory Loadout
    document.getElementById('workflowDisplay').textContent = data.ideal_operating_environment?.workflow_architecture || '';

    const tagContainer = document.getElementById('sensoryLoadoutBadges');
    tagContainer.innerHTML = (data.ideal_operating_environment?.sensory_loadout || [])
      .map(item => `<span class="tag">${item}</span>`).join('');

    const resultCard = document.getElementById('resultCard');
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth' });
  }
});