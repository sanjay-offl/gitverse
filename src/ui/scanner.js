import { scanRepo } from '../api/scan.js';
import { buildLayout } from '../graph/layout.js';
import { renderTimeline } from '../graph/render.js';
import { renderBranchIndex } from './branchIndex.js';
import { renderInsights } from './insights.js';
import { openDrawer, initDrawer } from './drawer.js';
import { animateTimeline } from '../animation/scroll.js';

const STAGES = ['cloning', 'reading branches', 'reading commits', 'building result'];

function labelForStage(stage) {
  return stage.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ensureProgressDetails(progress) {
  let stage = progress.querySelector('.scan-progress-stage');
  if (!stage) {
    stage = document.createElement('span');
    stage.className = 'scan-progress-stage';
    progress.prepend(stage);
  }
  return stage;
}

function renderUnreadableBranches(message, branches = []) {
  const existing = document.querySelector('#unreadable-branches');
  existing?.remove();
  if (!branches.length) return;
  const note = document.createElement('details');
  note.id = 'unreadable-branches';
  note.innerHTML = `<summary>${branches.length} branch${branches.length === 1 ? '' : 'es'} could not be read</summary><ul>${branches.map((branch) => `<li><strong>${branch.name}</strong>${branch.error ? `: ${branch.error}` : ''}</li>`).join('')}</ul>`;
  message.insertAdjacentElement('afterend', note);
}

export function initScanner({ reduced }) {
  initDrawer();
  const form = document.querySelector('#scan-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = document.querySelector('#repo-url').value.trim();
    const message = document.querySelector('#scan-message');
    const progress = document.querySelector('#scan-progress');
    const button = document.querySelector('#scan-submit');
    const unreadable = document.querySelector('#unreadable-branches');
    unreadable?.remove();
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/.test(url)) {
      message.textContent = 'Enter a valid URL like https://github.com/owner/repo';
      return;
    }

    button.disabled = true;
    progress.hidden = false;
    const stageElement = ensureProgressDetails(progress);
    let stageIndex = 0;
    const stageTimer = window.setInterval(() => {
      stageElement.textContent = `Stage: ${labelForStage(STAGES[stageIndex])}`;
      stageIndex = (stageIndex + 1) % STAGES.length;
    }, 1400);
    stageElement.textContent = `Stage: ${labelForStage(STAGES[0])}`;
    message.textContent = 'Reading every branch and commit. Large repositories take longer.';

    try {
      const data = await scanRepo(url);
      window.clearInterval(stageTimer);
      const completedStages = data.stages || [];
      stageElement.textContent = completedStages.length
        ? `Complete: ${labelForStage(completedStages[completedStages.length - 1].stage)}`
        : 'Complete';
      const unreadableBranches = (data.branches || []).filter((branch) => branch.status === 'unreadable');
      renderUnreadableBranches(message, unreadableBranches);
      document.querySelector('#timeline-meta').textContent = `Mapped ${data.branchesRendered} of ${data.branchesFound} branches${data.sampled ? ' · Showing a sampled trunk' : ''}${data.cached ? ' · cached' : ''}`;
      const layout = buildLayout(data);
      renderTimeline(document.querySelector('#timeline-stage'), layout, openDrawer);
      renderBranchIndex(data);
      renderInsights(data);
      animateTimeline(layout, { reduced });
      message.textContent = data.branchesFound === data.branchesRendered
        ? `Mapped ${data.branchesRendered} of ${data.branchesFound} branches${data.cached ? ' · cached' : ''}`
        : `Warning: mapped ${data.branchesRendered} of ${data.branchesFound} branches${data.cached ? ' · cached' : ''}`;
      document.querySelector('#timeline').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    } catch (error) {
      console.error('[GitVerse]', error);
      window.clearInterval(stageTimer);
      message.textContent = error.message;
    } finally {
      button.disabled = false;
      progress.hidden = true;
    }
  });
}
