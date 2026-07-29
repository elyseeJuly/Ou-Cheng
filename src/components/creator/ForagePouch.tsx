import React, { useEffect, useState, useRef } from 'react';
import { searchImagery, getFull, ImageryIndexEntry, ImageryWord } from '../../services/imageryService';
import { getPouch, addToPouch, removeFromPouch, subscribePouch, inPouch, PouchItem } from '../../stores/pouchStore';

interface Props {
  toneReq: 'P' | 'Z' | null;          // 来自当前聚焦字格
  onPick: (word: string) => void;      // 填入当前格（父级实现，同韵镜 onPick）
}

const CAT_NAMES: Record<string, string> = {
  tianwen: '天文', dili: '地理', caomu: '草木', niaoshou: '鸟兽', qiwu: '器物', qingsi: '情思', shiling: '时令',
};

const ForagePouch: React.FC<Props> = ({ toneReq, onPick }) => {
  const [q, setQ] = useState('');
  const [toneFilter, setToneFilter] = useState<'auto' | 'P' | 'Z' | 'off'>('auto');
  const [list, setList] = useState<ImageryIndexEntry[]>([]);
  const [expanded, setExpanded] = useState<ImageryWord | null>(null);
  const [pouch, setPouch] = useState<PouchItem[]>(getPouch());

  const effectiveTone = toneFilter === 'auto' ? toneReq : toneFilter === 'off' ? null : toneFilter;

  useEffect(() => subscribePouch(() => setPouch(getPouch())), []);
  useEffect(() => {
    let live = true;
    searchImagery(q.trim(), effectiveTone)
      .then(r => live && setList(r))
      .catch(() => live && setList([]));
    return () => { live = false; };
  }, [q, effectiveTone]);

  const expandReqRef = useRef<number>(0);
  const toggleExpand = async (w: string) => {
    if (expanded?.w === w) return setExpanded(null);
    const reqId = ++expandReqRef.current;
    try {
      const res = await getFull(w);
      if (reqId === expandReqRef.current) setExpanded(res);
    } catch (_) {
      if (reqId === expandReqRef.current) setExpanded(null);
    }
  };

  const handleFill = (word: string) => {
    onPick(word);
  };

  return (
    <div className="pouch">
      <input
        className="pouch-search"
        placeholder="寻字，如「月」"
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      <div className="pouch-tonefilter opt-group">
        {([['auto', '随格'], ['P', '平'], ['Z', '仄'], ['off', '不限']] as const).map(([v, l]) => (
          <button
            key={v}
            className={`opt-item ${toneFilter === v ? 'active' : ''}`}
            onClick={() => setToneFilter(v)}
          >{l}</button>
        ))}
        {toneFilter === 'auto' && toneReq && (
          <span className="pouch-tonehint">此格宜{toneReq === 'P' ? '平' : '仄'}</span>
        )}
      </div>

      <div className="pouch-list">
        {list.map(x => (
          <div key={x.w}>
            <button className="pouch-word" onClick={() => toggleExpand(x.w)}>
              <span>{x.w}</span>
              <span className="pouch-tone">
                {[...x.t].map(t => t === 'P' ? '○' : t === 'Z' ? '●' : '◐').join('')}
              </span>
            </button>
            {expanded?.w === x.w && (
              <div className="pouch-detail">
                <button className="pouch-fill" onMouseDown={e => { e.preventDefault(); handleFill(x.w); }}>
                  填入 ↴
                </button>
                {expanded.s?.slice(0, 3).map((sl, i) => (
                  <p key={i} className="pouch-sample">「{sl.s}」<span>{sl.a}</span></p>
                ))}
                <div className="pouch-related">
                  {expanded.r?.slice(0, 8).map(rw => (
                    <button key={rw} onClick={() => { setQ(rw); }}>{rw}</button>
                  ))}
                </div>
                {!inPouch(x.w) && (
                  <button
                    className="pouch-fill"
                    style={{ marginTop: 6 }}
                    onMouseDown={e => { e.preventDefault(); addToPouch({ word: x.w, category: x.c, freq: x.f, tone: x.t }); }}
                  >收藏到拾字囊</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {pouch.length > 0 && (
        <div className="pouch-mine">
          <div className="pouch-mine-title">拾字囊 · 点击词语填入当前格</div>
          {pouch.map(p => (
            <span key={p.word} className="pouch-mine-word">
              <button onMouseDown={e => { e.preventDefault(); handleFill(p.word); }}>{p.word}</button>
              <i onClick={() => removeFromPouch(p.word)}>×</i>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForagePouch;
