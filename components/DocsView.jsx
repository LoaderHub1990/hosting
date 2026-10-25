'use client';
import { useEffect, useState } from 'react';
import { Icon, Tabs, CopyBtn } from './Fx';

function Parts({ parts }) {
  return parts.map((p, i) => p.t === 'code' ? <code key={i} className="i">{p.v}</code>
    : p.t === 'dot' ? <i key={i} className="dot" style={{ background: p.c }} />
    : <span key={i}>{p.v}</span>);
}

function Block({ b }) {
  if (b.t === 'h3') return <h3>{b.v}</h3>;
  if (b.t === 'p') return <p className="txt"><Parts parts={b.parts} /></p>;
  if (b.t === 'note') return <div className="note"><Icon n={b.icon === 'zap' ? 'zap' : 'warn'} s={16} /><p><Parts parts={b.parts} /></p></div>;
  if (b.t === 'code') {
    const raw = b.runs.map((r) => r[1]).join('');
    return (
      <div className="codebox rim">
        <div className="codebox-h"><span>{b.lang}</span><CopyBtn text={raw} label="Copy" /></div>
        <pre><code>{b.runs.map(([c, t], i) => (c ? <span key={i} className={c}>{t}</span> : t))}</code></pre>
      </div>
    );
  }
  if (b.t === 'table') {
    return (
      <div className="tbl"><table>
        <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Parts parts={c} /></td>)}</tr>)}</tbody>
      </table></div>
    );
  }
  return null;
}

export default function DocsView({ data }) {
  const { cats, pages } = data;
  const [cat, setCat] = useState('0');
  const [pid, setPid] = useState(pages[0].id);

  useEffect(() => { // จำหน้าไว้ใน #hash
    const h = location.hash.slice(1), p = pages.find((x) => x.id === h);
    if (p) { setPid(p.id); setCat(String(p.cat)); }
  }, [pages]);

  const inCat = pages.filter((p) => String(p.cat) === cat);
  const page = pages.find((p) => p.id === pid && String(p.cat) === cat) || inCat[0];
  const pick = (id) => { setPid(id); try { history.replaceState(null, '', '#' + id); } catch {} };
  const pickCat = (c) => { setCat(c); const f = pages.find((p) => String(p.cat) === c); if (f) pick(f.id); };

  return (
    <>
      <div className="pagehead">
        <div><span className="badge">Documentation</span><h1>128bitUI</h1><p>Roblox Lua UI Library สำหรับ script executor ดีไซน์เรียบ ปุ่มลอยสี่เหลี่ยมมน ธีมหลายสี และบันทึกค่าอัตโนมัติ</p></div>
      </div>
      <div className="docs-top"><Tabs tabs={cats.map((c, i) => [String(i), c.name, c.icon])} value={cat} onChange={pickCat} /></div>
      <div className="docs-grid">
        <aside className="docs-side rim" aria-label="หน้าเอกสาร">
          {inCat.map((p) => <button key={p.id} className={'rp' + (p.id === page.id ? ' on' : '')} onClick={() => pick(p.id)}>{p.title}</button>)}
        </aside>
        <article className="pn doc-main rim" key={page.id}>
          <div className="view">
            <div className="eyebrow">{cats[page.cat].name}</div>
            <h1>{page.title}</h1>
            <p className="lead">{page.lead}</p>
            {page.blocks.map((b, i) => <Block key={i} b={b} />)}
          </div>
        </article>
      </div>
    </>
  );
}
