import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ImageryItem, ClassicPoem } from '../../types';

interface WordCloud3DProps {
  imageryItems: ImageryItem[];
  allPoems: ClassicPoem[];
  onWordSelect?: (word: string, poems: ClassicPoem[]) => void;
}

const WordCloud3D: React.FC<WordCloud3DProps> = ({ imageryItems, allPoems, onWordSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<Array<{ mesh: THREE.Mesh; word: string }>>([]);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotVelRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [relatedPoems, setRelatedPoems] = useState<ClassicPoem[]>([]);
  const [isExploded, setIsExploded] = useState(false);

  // ── 球坐标分布 ────────────────────────────────────────
  const getSphericalPosition = (index: number, total: number, radius: number) => {
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  };

  // ── 创建文字纹理 ──────────────────────────────────────
  const createTextSprite = useCallback((
    text: string,
    fontSize: number,
    color: string,
    bgAlpha: number = 0
  ): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    ctx.font = `bold ${fontSize}px "Ma Shan Zheng", "LXGW WenKai Lite", "Noto Serif SC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (bgAlpha > 0) {
      ctx.fillStyle = `rgba(247,241,227,${bgAlpha})`;
      ctx.fillRect(0, 0, 256, 128);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    return new THREE.Sprite(material);
  }, []);

  // ── 初始化 Three.js 场景 ──────────────────────────────
  useEffect(() => {
    if (!mountRef.current || imageryItems.length === 0) return;
    const el = mountRef.current;
    const W = el.clientWidth;
    const H = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Group for rotation
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // 添加粒子球背景
    const particleGeo = new THREE.SphereGeometry(3.2, 32, 32);
    const particleMat = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.015,
      transparent: true,
      opacity: 0.25,
    });
    group.add(new THREE.Points(particleGeo, particleMat));

    // 频率归一化
    const maxFreq = Math.max(...imageryItems.map(i => i.frequency));
    const minFreq = Math.min(...imageryItems.map(i => i.frequency));

    // 添加词语 Sprites
    const totalItems = imageryItems.length;
    const meshes: Array<{ mesh: THREE.Mesh; word: string }> = [];

    imageryItems.forEach((item, idx) => {
      const normFreq = (item.frequency - minFreq) / (maxFreq - minFreq);
      const fontSize = Math.round(28 + normFreq * 40); // 28-68px
      const alpha = 0.55 + normFreq * 0.45;

      // 颜色：高频暖红→低频淡金
      const r = Math.round(178 + (212 - 178) * (1 - normFreq));
      const g = Math.round(34 + (175 - 34) * (1 - normFreq));
      const b = Math.round(34 + (55 - 34) * (1 - normFreq));
      const color = `rgba(${r},${g},${b},${alpha})`;

      const sprite = createTextSprite(item.word, fontSize, color);
      const pos = getSphericalPosition(idx, totalItems, 2.8);
      sprite.position.copy(pos);
      sprite.scale.set(1.2 + normFreq * 0.8, 0.6 + normFreq * 0.4, 1);
      (sprite as any).__word = item.word;
      (sprite as any).__freq = normFreq;
      group.add(sprite);

      // 不可见的拾取碰撞体
      const hitGeo = new THREE.BoxGeometry(1.2 + normFreq * 0.8, 0.5, 0.1);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      group.add(hitMesh);
      meshes.push({ mesh: hitMesh, word: item.word });
    });

    meshesRef.current = meshes;

    // 动画循环
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!isDraggingRef.current) {
        group.rotation.y += 0.002;
        rotVelRef.current.x *= 0.95;
        rotVelRef.current.y *= 0.95;
        group.rotation.x += rotVelRef.current.x;
        group.rotation.y += rotVelRef.current.y;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize
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
      // Dispose all scene objects to prevent GPU memory leaks
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
  }, [imageryItems, createTextSprite]);

  // ── 鼠标/触摸交互 ──────────────────────────────────────
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

  // Raycaster for click detection
  const handleClick = (e: React.MouseEvent) => {
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
        const word = found.word;
        setSelectedWord(word);
        setIsExploded(true);

        // 过滤相关诗词
        const related = allPoems.filter(p =>
          p.content?.includes(word) || p.title?.includes(word)
        ).slice(0, 12);
        setRelatedPoems(related);
        onWordSelect?.(word, related);

        // 云雾消散效果：加速旋转
        if (groupRef.current) {
          rotVelRef.current = { x: 0.02, y: 0.04 };
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px' }}>
      {/* 3D 画布 */}
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%', cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
      />

      {/* 标题提示 */}
      {!selectedWord && (
        <div style={{
          position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center',
          color: 'rgba(178,34,34,0.6)', fontSize: '13px', fontFamily: '"Ma Shan Zheng", serif',
          letterSpacing: '4px', pointerEvents: 'none'
        }}>
          点击意象词语，展开相关诗词
        </div>
      )}

      {/* 选中词语标注 */}
      {selectedWord && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(178,34,34,0.9)', color: 'white',
          padding: '4px 20px', borderRadius: '20px',
          fontFamily: '"Ma Shan Zheng", serif', fontSize: '18px', letterSpacing: '4px',
          cursor: 'pointer',
        }} onClick={() => { setSelectedWord(null); setIsExploded(false); setRelatedPoems([]); }}>
          {selectedWord} ×
        </div>
      )}

      {/* 相关诗词列表（云雾消散后展开） */}
      {isExploded && relatedPoems.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(247,241,227,0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(178,34,34,0.2)',
          padding: '12px 20px',
          maxHeight: '160px',
          overflowY: 'auto',
          animation: 'cloudReveal 0.5s ease-out',
        }}>
          <div style={{
            display: 'flex', gap: '10px', flexWrap: 'wrap',
          }}>
            {relatedPoems.map((p, i) => (
              <div key={i} style={{
                fontSize: '13px', fontFamily: '"Ma Shan Zheng", serif',
                color: '#5a3a1a', background: 'rgba(178,34,34,0.08)',
                padding: '3px 10px', borderRadius: '12px',
                border: '1px solid rgba(178,34,34,0.2)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                《{p.title}》{p.author && `· ${p.author}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCloud3D;
