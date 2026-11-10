import {commitsOf} from '../ui/utils.js';
export const ROW_HEIGHT=42;const CENTER_X=480;const WIDTH=960;const LANE_GAP=95;
export function buildLayout(data){
  const trunk=data.trunk||[];const height=Math.max(trunk.length*ROW_HEIGHT+120,480);const yBySha=new Map(trunk.map((item,index)=>[item.sha,height-80-index*ROW_HEIGHT]));
  const trunkNodes=trunk.map((commit,index)=>({commit,x:CENTER_X,y:height-80-index*ROW_HEIGHT}));
  const trunkPath=`M ${CENTER_X} ${height-80} L ${CENTER_X} ${height-80-(Math.max(trunk.length-1,0)*ROW_HEIGHT)}`;
  const branches=(data.branches||[]).filter((branch)=>branch.status!=='sacred').map((branch,index)=>{
    const commits=commitsOf(branch);const side=index%2===0?-1:1;const level=Math.floor(index/2)+1;const laneX=Math.max(50,Math.min(WIDTH-50,CENTER_X+side*LANE_GAP*level));const forkY=yBySha.get(branch.forkPoint)||height/2;const endY=Math.max(70,forkY-(commits.length||1)*ROW_HEIGHT*.7);const path=`M ${CENTER_X} ${forkY} C ${CENTER_X+side*40} ${forkY}, ${laneX-side*40} ${endY}, ${laneX} ${endY}`;return {...branch,laneX,endY,side,path,forkRatio:trunk.length?1-(forkY-(height-80))/(Math.max(trunk.length-1,1)*ROW_HEIGHT):0,nodes:commits.map((commit,nodeIndex)=>({commit,x:CENTER_X+(laneX-CENTER_X)*(nodeIndex+1)/(Math.max(commits.length,1)+1),y:forkY+(endY-forkY)*(nodeIndex+1)/(Math.max(commits.length,1)+1)})),labelAnchor:{x:laneX,y:endY}}});
  return {width:WIDTH,height,trunkPath,trunkNodes,branches};
}
