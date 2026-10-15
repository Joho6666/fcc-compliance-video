// Read-only: print metadata of one Douyin video via TikHub. Usage: node probe_video.mjs <aweme_id>
const { config } = await import('file:///D:/video-replicate-studio/apps/studio/lib/env.mjs');
const t = config.tikhub;
const r = await fetch(`${t.base}/api/v1/douyin/web/fetch_one_video?aweme_id=${process.argv[2]}`, { headers: { Authorization: `Bearer ${t.key}` } });
const j = await r.json();
const a = j.data?.aweme_detail;
if (!a) { console.log(r.status, JSON.stringify(j).slice(0, 300)); process.exit(); }
const s = a.statistics || {}, v = a.video || {};
console.log(JSON.stringify({
  id: a.aweme_id, desc: a.desc, author: a.author?.nickname, fans: a.author?.follower_count, signature: a.author?.signature,
  likes: s.digg_count, comments: s.comment_count, shares: s.share_count,
  dur_s: Math.round((v.duration || 0) / 1000), w: v.width, h: v.height, mb: +((v.play_addr?.data_size || 0) / 1e6).toFixed(1),
  music: a.music?.title, tags: (a.text_extra || []).map(x => x.hashtag_name).filter(Boolean),
  created: new Date((a.create_time || 0) * 1000).toISOString().slice(0, 10),
}, null, 1));
