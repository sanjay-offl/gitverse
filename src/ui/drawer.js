import {esc,fmtDate,universeNumber,STATUS_LABEL,commitsOf} from './utils.js';
let closeDrawer;
export function initDrawer(){
  const drawer=document.querySelector('#drawer');closeDrawer=()=>{drawer.classList.remove('is-open');drawer.setAttribute('aria-hidden','true')};
  document.querySelector('#drawer-close').addEventListener('click',closeDrawer);document.querySelector('#drawer-backdrop').addEventListener('click',closeDrawer);document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeDrawer()});
}
export function openDrawer(branch){
  if(!branch)return;const drawer=document.querySelector('#drawer');document.querySelector('#drawer-title').textContent=branch.name;document.querySelector('#drawer-meta').textContent=`${STATUS_LABEL[branch.status]} · ${branch.commitCount} commits`;
  const commits=commitsOf(branch);
  document.querySelector('#drawer-body').innerHTML=commits.length?commits.map((commit)=>`<article class="commit-record"><code>${universeNumber(commit.sha)}</code><div><strong>${esc(commit.sha.slice(0,7))}</strong><p>${esc(commit.message)}</p><small>${esc(commit.author)} · ${fmtDate(commit.date)}</small></div></article>`).join(''):'<p>No branch-only commits were found.</p>';
  drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');document.querySelector('#drawer-close').focus();
}
