import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ShieldMascot, type ShieldPose} from './ShieldMascot';

// Comparison sheet: client's polished pose sheet (top) vs the SVG rebuild in the same layout (bottom).
const BIG: ShieldPose[] = ['point', 'present'];
const ROW: ShieldPose[] = ['idle', 'wave', 'cheer', 'think', 'surprised'];

export const ShieldTest: React.FC = () => (
  <AbsoluteFill style={{background: '#fff', fontFamily: 'Microsoft YaHei'}}>
    <Img src={staticFile('ref/client_mascot_sheet.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1536, height: 1024}} />
    <div style={{position: 'absolute', left: 0, top: 1040, width: 1536, height: 1024}}>
      {BIG.map((p, i) => (
        <div key={p} style={{position: 'absolute', left: 60 + i * 700, top: 10}}><ShieldMascot frame={12} height={560} pose={p} talk={0.55} /></div>
      ))}
      {ROW.map((p, i) => (
        <div key={p} style={{position: 'absolute', left: 30 + i * 300, top: 640, textAlign: 'center', fontSize: 28, color: '#888'}}>
          <ShieldMascot frame={12} height={260} pose={p} talk={p === 'cheer' ? 0.8 : 0.3} glow={p === 'cheer' ? 1 : 0} />
          <div>{p}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
