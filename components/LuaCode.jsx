// แสดงโค้ด Lua ตรงตัวอักษรทุกตัว (ไม่แก้ ไม่ตัด) พร้อมไฮไลต์สี + เลขบรรทัด
const KW = new Set(['local', 'function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'while', 'do', 'return', 'in', 'and', 'or', 'not', 'nil', 'true', 'false']);

function tokenize(line) {
  const out = [];
  const re = /(--.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_]*)|(\s+|.)/g;
  let m;
  while ((m = re.exec(line))) {
    if (m[1]) out.push(['lc', m[1]]);
    else if (m[2]) out.push(['ls', m[2]]);
    else if (m[3]) out.push(['ln', m[3]]);
    else if (m[4]) out.push([KW.has(m[4]) ? 'lk' : 'lf', m[4]]);
    else if (m[5]) out.push([KW.has(m[5]) ? 'lk' : 'lv', m[5]]);
    else out.push([m[6].trim() ? 'lp' : '', m[6]]);
  }
  return out;
}

export default function LuaCode({ code }) {
  const lines = String(code).split('\n');
  return (
    <div className="lua">
      <div className="lua-gut" aria-hidden="true">{lines.map((_, i) => <span key={i}>{i + 1}</span>)}</div>
      <pre className="lua-pre"><code>
        {lines.map((ln, i) => (
          <span className="lua-ln" key={i}>
            {tokenize(ln).map(([c, t], j) => (c ? <span key={j} className={c}>{t}</span> : t))}
            {i < lines.length - 1 ? '\n' : <i className="lua-caret" />}
          </span>
        ))}
      </code></pre>
    </div>
  );
}
