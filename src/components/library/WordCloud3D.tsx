import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { ImageryItem } from '../../types';
import { getFull, ImageryWord } from '../../services/imageryService';
import { addToPouch, inPouch } from '../../stores/pouchStore';

type WordState = 'normal' | 'highlight' | 'dim';

const wordMetadata = new WeakMap<THREE.Sprite, {
  word: string;
  freq: number;
  normFreq: number;
  baseScale: THREE.Vector3;
}>();

const WORD_STYLE = {
  normal:    { color: 'rgba(200,196,180,0.88)', shadow: 'rgba(217,188,122,0.25)', scale: 1 },
  highlight: { color: '#D9BC7A',                shadow: 'rgba(217,188,122,0.65)', scale: 1.35 },
  dim:       { color: 'rgba(200,196,180,0.06)', shadow: 'transparent',            scale: 0.8 },
};

const CLOUD_LOBES = [
  new THREE.Vector3(-2.25, 0.02, -0.08),
  new THREE.Vector3(-0.95, 0.42, 0.22),
  new THREE.Vector3(0.45, 0.08, -0.2),
  new THREE.Vector3(1.82, -0.2, 0.12),
  new THREE.Vector3(0.08, -0.56, 0.34),
];

interface WordCloud3DProps {
  imageryItems: ImageryItem[];
  onWordSelect?: (word: string) => void;
}

const SampleSlips: React.FC<{ samples: { s: string; a: string }[]; onClick: (text: string) => void }> = ({ samples, onClick }) => (
  <div className="starmap-slips" data-theme="day">
    <div className="slip-rail">
      {samples.map((x, i) => (
        <figure
          key={i}
          className="slip"
          style={{ transform: `rotate(${(i % 3 - 1) * 0.6}deg)` }}
          onClick={() => onClick(x.s)}
        >
          <blockquote className="slip-text">{x.s}</blockquote>
          <figcaption className="slip-author">{x.a}</figcaption>
        </figure>
      ))}
    </div>
  </div>
);

function makeWordTexture(word: string, state: WordState, freq: number): THREE.CanvasTexture {
  const st = WORD_STYLE[state];
  const fontSize = Math.round((28 + Math.min(freq / 50, 1) * 20) * st.scale);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px "LXGW WenKai Lite", "Kaiti SC", serif`;
  const w = Math.ceil(ctx.measureText(word).width) + 24;
  canvas.width = w * 2; canvas.height = (fontSize + 24) * 2;
  ctx.scale(2, 2);
  ctx.font = `${fontSize}px "LXGW WenKai Lite", "Kaiti SC", serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = st.shadow; ctx.shadowBlur = 12;
  ctx.fillStyle = st.color;
  ctx.fillText(word, w / 2, (fontSize + 24) / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function makeLink(from: THREE.Vector3, to: THREE.Vector3, strength: number): THREE.Line {
  const mid = from.clone().add(to).multiplyScalar(0.5).multiplyScalar(1.25);
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
  const mat = new THREE.LineDashedMaterial({
    color: 0xD9BC7A, transparent: true,
    opacity: 0.15 + Math.min(strength / 30, 1) * 0.45,
    dashSize: 2.2, gapSize: 1.4,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

function hash01(index: number, salt: number): number {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function getCloudPosition(index: number, total: number, normFreq = 0): THREE.Vector3 {
  const lobe = CLOUD_LOBES[index % CLOUD_LOBES.length];
  const angle = index * 2.399963229728653 + hash01(index, 1) * 0.7;
  const localRadius = Math.sqrt(((Math.floor(index / CLOUD_LOBES.length) + 0.5) / Math.max(1, Math.ceil(total / CLOUD_LOBES.length))));
  const softEdge = 0.38 + localRadius * (0.62 + hash01(index, 2) * 0.28);
  const freqPull = 1 - normFreq * 0.24;

  return new THREE.Vector3(
    (lobe.x + Math.cos(angle) * softEdge * 1.05 + (hash01(index, 3) - 0.5) * 0.36) * freqPull,
    lobe.y + Math.sin(angle * 1.37) * softEdge * 0.48 + (hash01(index, 4) - 0.5) * 0.38,
    lobe.z + Math.sin(angle) * softEdge * 0.62 + (hash01(index, 5) - 0.5) * 0.52
  );
}

function makeCloudParticleGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const pos = getCloudPosition(i, count, 0).multiplyScalar(1.08);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geo;
}

const WordCloud3D: React.FC<WordCloud3DProps> = ({ imageryItems, onWordSelect }) => {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<Array<{ mesh: THREE.Mesh; sprite: THREE.Sprite; word: string; freq: number; targetOpacity: number }>>([]);
  const activeLinksRef = useRef<THREE.Line[]>([]);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotVelRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [fullWord, setFullWord] = useState<ImageryWord | null>(null);

  // ── 初始化 Three.js 场景 ──────────────────────────────
  useEffect(() => {
    if (!mountRef.current || imageryItems.length === 0) return;
    const el = mountRef.current;
    const W = el.clientWidth;
    const H = el.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 6.2;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const linesGroup = new THREE.Group();
    group.add(linesGroup);
    linesGroupRef.current = linesGroup;

    // 淡淡粒子云背景，避免词云呈现球壳轮廓。
    const particleGeo = makeCloudParticleGeometry(260);
    const particleMat = new THREE.PointsMaterial({
      color: 0xD9BC7A, size: 0.018, transparent: true, opacity: 0.12,
    });
    group.add(new THREE.Points(particleGeo, particleMat));

    const frequencies = imageryItems.map(i => i.frequency);
    const maxFreq = frequencies.length > 0 ? Math.max(...frequencies) : 1;
    const minFreq = frequencies.length > 0 ? Math.min(...frequencies) : 0;
    const range = maxFreq - minFreq;

    const totalItems = imageryItems.length;
    const meshes: typeof meshesRef.current = [];

    imageryItems.forEach((item, idx) => {
      const normFreq = range > 0 ? (item.frequency - minFreq) / range : 0.5;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeWordTexture(item.word, 'normal', item.frequency),
        transparent: true,
        depthWrite: false,
        opacity: WORD_STYLE.normal.color.match(/[\d.]+$/) ? parseFloat(WORD_STYLE.normal.color.match(/[\d.]+$/)![0]) : 0.88,
      }));
      const pos = getCloudPosition(idx, totalItems, normFreq);
      sprite.position.copy(pos);
      const baseScale = new THREE.Vector3(0.86 + normFreq * 0.58, 0.43 + normFreq * 0.3, 1);
      sprite.scale.copy(baseScale);
      wordMetadata.set(sprite, {
        word: item.word,
        freq: item.frequency,
        normFreq,
        baseScale: baseScale.clone(),
      });
      group.add(sprite);

      const hitGeo = new THREE.BoxGeometry(baseScale.x, baseScale.y, 0.1);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      group.add(hitMesh);

      meshes.push({ mesh: hitMesh, sprite, word: item.word, freq: item.frequency, targetOpacity: 0.88 });
    });

    meshesRef.current = meshes;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!isDraggingRef.current) {
        group.rotation.y += 0.002;
        rotVelRef.current.x *= 0.95;
        rotVelRef.current.y *= 0.95;
        group.rotation.x += rotVelRef.current.x;
        group.rotation.y += rotVelRef.current.y;
      }
      // opacity lerp
      meshes.forEach(m => {
        const mat = m.sprite.material as THREE.SpriteMaterial;
        mat.opacity += (m.targetOpacity - mat.opacity) * 0.12;
      });
      // dashOffset flow
      activeLinksRef.current.forEach(l => {
        const mat = l.material as THREE.LineDashedMaterial;
        (mat as THREE.LineDashedMaterial & { dashOffset: number }).dashOffset -= 0.03;
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameRef.current);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat.dispose();
        }
        if ((obj as THREE.Sprite).material?.map) {
          (obj as THREE.Sprite).material.map!.dispose();
        }
      });
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [imageryItems]);

function setTexture(sprite: THREE.Sprite, newTexture: THREE.CanvasTexture) {
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.map = newTexture;
  mat.needsUpdate = true;
}

  // ── 状态切换：高亮 / 弱化 ─────────────────────────────
  useEffect(() => {
    if (!linesGroupRef.current) return;
    const linesGroup = linesGroupRef.current;

    // 清旧线
    while (linesGroup.children.length > 0) {
      const child = linesGroup.children[0] as THREE.Line;
      linesGroup.remove(child);
      child.geometry?.dispose();
      (child.material as THREE.Material)?.dispose();
    }
    activeLinksRef.current = [];

    if (!selectedWord) {
      setFullWord(null);
      meshesRef.current.forEach(m => {
        m.targetOpacity = 0.88;
        setTexture(m.sprite, makeWordTexture(m.word, 'normal', m.freq));
        const meta = wordMetadata.get(m.sprite);
        if (meta) m.sprite.scale.copy(meta.baseScale);
      });
      return;
    }

    setFullWord(null);
    let cancelled = false;
    getFull(selectedWord).then(res => {
      if (!cancelled && res?.w === selectedWord) {
        setFullWord(res);
      }
    }).catch(() => {
      if (!cancelled) setFullWord(null);
    });

    const center = meshesRef.current.find(m => m.word === selectedWord);
    if (!center) return;

    meshesRef.current.forEach(m => {
      const isCenter = m.word === selectedWord;
      const meta = wordMetadata.get(m.sprite);
      if (isCenter) {
        m.targetOpacity = 1;
        setTexture(m.sprite, makeWordTexture(m.word, 'highlight', m.freq));
        if (meta) m.sprite.scale.copy(meta.baseScale).multiplyScalar(WORD_STYLE.highlight.scale);
      } else {
        m.targetOpacity = WORD_STYLE.dim.color.match(/[\d.]+$/) ? parseFloat(WORD_STYLE.dim.color.match(/[\d.]+$/)![0]) : 0.06;
        setTexture(m.sprite, makeWordTexture(m.word, 'dim', m.freq));
        if (meta) m.sprite.scale.copy(meta.baseScale).multiplyScalar(WORD_STYLE.dim.scale);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedWord]);

  useEffect(() => {
    if (!fullWord || !linesGroupRef.current || fullWord.w !== selectedWord) return;
    const linesGroup = linesGroupRef.current;
    const center = meshesRef.current.find(m => m.word === selectedWord);
    if (!center) return;

    const startPos = center.mesh.position;
    fullWord.r?.slice(0, 12).forEach((rw, idx) => {
      const target = meshesRef.current.find(m => m.word === rw);
      if (!target) return;
      const strength = Math.max(5, 30 - idx * 2);
      const line = makeLink(startPos, target.mesh.position, strength);
      linesGroup.add(line);
      activeLinksRef.current.push(line);
    });
  }, [fullWord, selectedWord]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !groupRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    rotVelRef.current = { x: dy * 0.003, y: dx * 0.003 };
    groupRef.current.rotation.x += dy * 0.005;
    groupRef.current.rotation.y += dx * 0.005;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const hits = raycaster.intersectObjects(meshesRef.current.map(m => m.mesh));

    if (hits.length > 0) {
      const hit = hits[0].object;
      const found = meshesRef.current.find(m => m.mesh === hit);
      if (found) {
        setSelectedWord(found.word);
        onWordSelect?.(found.word);
        if (groupRef.current) rotVelRef.current = { x: 0.02, y: 0.04 };
      }
    }
  }, [onWordSelect]);

  const handleAddToPouch = () => {
    if (!selectedWord || !fullWord) return;
    addToPouch({ word: fullWord.w, category: fullWord.c, freq: fullWord.f, tone: fullWord.t });
  };

  const handleSlipClick = (text: string) => {
    navigate(`/classics?search=${encodeURIComponent(text)}`);
  };

  const samples = fullWord?.s?.slice(0, 8) || [];

  return (
    <div className="starmap-container">
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%', cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      />

      {/* 无障碍（A11y）键盘与屏幕阅读器替代列表 */}
      <div className="sr-only" aria-label="意象星图词条列表" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        <ul>
          {imageryItems.map(item => (
            <li key={item.word}>
              <button onClick={() => setSelectedWord(item.word)}>
                {item.word} (词频: {item.frequency})
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!selectedWord && (
        <div className="starmap-hint">点击意象词语，展开相关诗词</div>
      )}

      {selectedWord && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 2 }}>
          <button className="starmap-selected" onClick={() => { setSelectedWord(null); setFullWord(null); }}>
            {selectedWord}
            <span className="close">×</span>
          </button>
          <div style={{ marginTop: 8 }}>
            <button className="starmap-pouch-add" onClick={handleAddToPouch}>
              {inPouch(selectedWord) ? '已在拾字囊' : '收藏到拾字囊'}
            </button>
          </div>
        </div>
      )}

      {selectedWord && samples.length > 0 && (
        <SampleSlips samples={samples} onClick={handleSlipClick} />
      )}
    </div>
  );
};

export default WordCloud3D;
