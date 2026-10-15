// Download the reference Douyin video (analysis only, never used in the deliverable).
import { execFileSync } from 'node:child_process';
const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const t = config.tikhub;
const j = await (await fetch(`${t.base}/api/v1/douyin/web/fetch_one_video?aweme_id=7621723154481728774`, { headers: { Authorization: `Bearer ${t.key}` } })).json();
const v = j.data?.aweme_detail?.video;
const urls = [...(v?.play_addr?.url_list || []), ...(v?.bit_rate || []).flatMap(b => b.play_addr?.url_list || [])].filter(u => /^https?:/.test(u));
console.log('candidate urls:', urls.length, 'size hint', v?.play_addr?.data_size);
for (const u of urls.slice(0, 4)) {
  try {
    execFileSync('curl', ['-sS', '-L', '-m', '300', '--retry', '3', '-x', 'http://127.0.0.1:7890', '-H', 'Referer: https://www.douyin.com/', '-o', 'ref/ref.mp4', u], { stdio: 'inherit' });
    console.log('downloaded from', new URL(u).host); break;
  } catch (e) { console.log('failed', new URL(u).host); }
}
