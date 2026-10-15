// TikHub Douyin video search by likes. Usage: node search_douyin.mjs <keyword> [<keyword> ...]
import { writeFile } from 'node:fs/promises';
const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const t = config.tikhub;
const all = [];
for (const keyword of process.argv.slice(2)) {
  const r = await fetch(`${t.base}/api/v1/douyin/search/fetch_video_search_v2`, {
    method: 'POST', headers: { Authorization: `Bearer ${t.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, cursor: 0, sort_type: '1', publish_time: '180', filter_duration: process.env.DUR || '0', content_type: '1', search_id: '', backtrace: '' }),
  });
  const j = await r.json();
  const items = (j.data?.business_data || j.data?.data || []).map(x => x.data?.aweme_info).filter(Boolean);
  console.log(`\n== ${keyword} (HTTP ${r.status}, ${items.length} items${items.length ? '' : ' ' + JSON.stringify(j).slice(0, 200)})`);
  for (const a of items.slice(0, 8)) {
    const s = a.statistics || {};
    const row = { keyword, id: a.aweme_id, likes: s.digg_count, comments: s.comment_count, shares: s.share_count, sec: Math.round((a.video?.duration || a.duration || 0) / 1000),
      author: a.author?.nickname, fans: a.author?.follower_count, desc: (a.desc || '').replace(/\s+/g, ' ').slice(0, 70), url: `https://www.douyin.com/video/${a.aweme_id}` };
    all.push(row);
    console.log(`${String(row.likes).padStart(7)}赞 ${String(row.sec).padStart(3)}s ${row.author} | ${row.desc}`);
  }
}
await writeFile(`douyin_search_${process.env.TAG||'a'}.json`, JSON.stringify(all, null, 1));
