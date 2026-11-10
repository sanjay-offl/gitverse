export const STATUS_LABEL={sacred:'SACRED',active:'ACTIVE',absorbed:'ABSORBED',pruned:'PRUNED',unreadable:'UNREADABLE'};
export function commitsOf(branch){return Array.isArray(branch?.commits)?branch.commits:[]}
export function esc(value=''){return String(value).replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
export function universeNumber(sha=''){return String(Number.parseInt(sha.slice(0,6),16)%10000).padStart(4,'0')}
export function fmtDate(iso){return iso?new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—'}
export function initials(name=''){const parts=name.trim().split(/\s+/).filter(Boolean);return parts.length?parts.slice(0,2).map((part)=>part[0]).join('').toUpperCase():'?'}
