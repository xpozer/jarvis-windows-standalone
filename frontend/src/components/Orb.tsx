import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface OrbProps {
  state: OrbState;
  heatmapActive?: boolean;
  typingActivity?: number; // 0-1, driven by InputBar
  onNodeClick?: (nodeId: number, state: OrbState) => void;
}

const NEURAL_CONTENT: Record<OrbState, Array<{ label: string; desc: string; active: number; conn: number; energy: number }>> = {
  idle: [
    { label: "Ruhepotenzial", desc: "Neuron hält Basismembranspannung.\nKeine aktive Signalübertragung.", active: 15, conn: 8, energy: 12 },
    { label: "Hintergrundtakt", desc: "Langwelliger Sync-Puls läuft\ndurch Ruhezustandscluster.", active: 22, conn: 14, energy: 18 },
    { label: "Speicher-Refresh", desc: "Kurzzeitspeicher wird zyklisch\ndurchlaufen und stabilisiert.", active: 30, conn: 20, energy: 25 },
    { label: "Thermisches Rauschen", desc: "Stochastische Grundaktivität\nohne semantischen Inhalt.", active: 8, conn: 5, energy: 9 },
  ],
  listening: [
    { label: "Auditory Cortex", desc: "Akustisches Signal wird in\nFrequenzbänder zerlegt.", active: 68, conn: 52, energy: 61 },
    { label: "Sprachfilter aktiv", desc: "Wortsegmentierung läuft.\nSignal/Rausch-Trennung aktiv.", active: 74, conn: 60, energy: 70 },
    { label: "Kontext-Matching", desc: "Eingehende Phrasen gegen\nbekannte Muster abgeglichen.", active: 55, conn: 48, energy: 58 },
    { label: "Aufmerksamkeit", desc: "Selektive Inhibition aktiv.\nIrrelevante Kanäle gedämpft.", active: 80, conn: 65, energy: 75 },
  ],
  thinking: [
    { label: "Inferenz-Cluster", desc: "Kausale Schlussfolgerungskette\nläuft. Mehrere Pfade parallel.", active: 92, conn: 88, energy: 95 },
    { label: "Arbeitsgedächtnis", desc: "Temporäre Repräsentation des\nProblems im Fokuspuffer.", active: 85, conn: 79, energy: 88 },
    { label: "Analogie-Suche", desc: "Semantische Ähnlichkeitssuche\nüber Langzeitgedächtnis.", active: 78, conn: 85, energy: 82 },
    { label: "Konflikt-Resolver", desc: "Widersprüchliche Hypothesen\nwerden abgewogen.", active: 88, conn: 91, energy: 90 },
    { label: "Token-Sampling", desc: "Wahrscheinlichkeitsverteilung\nüber Ausgabe-Tokens berechnet.", active: 96, conn: 94, energy: 97 },
    { label: "Attention-Head #7", desc: "Query/Key/Value-Transformation\naktiv auf aktuellem Kontext.", active: 90, conn: 87, energy: 93 },
  ],
  speaking: [
    { label: "Sprachgenerator", desc: "Token-Sequenz wird in\nAusgabesignal konvertiert.", active: 82, conn: 70, energy: 78 },
    { label: "Prosodie-Modul", desc: "Rhythmus und Betonung werden\ndem Inhalt angepasst.", active: 65, conn: 58, energy: 62 },
    { label: "Buffer-Flush", desc: "Ausgabepuffer wird geleert.\nNächste Sequenz wird geladen.", active: 75, conn: 60, energy: 71 },
    { label: "Feedback-Loop", desc: "Eigene Ausgabe wird überwacht\nund auf Kohärenz geprüft.", active: 70, conn: 65, energy: 68 },
  ],
};

interface NodePopup {
  nodeId: number; screenX: number; screenY: number;
  label: string; desc: string; active: number; conn: number; energy: number;
}
interface DualChannel {
  nodeA: number; nodeB: number;
  screenAX: number; screenAY: number; screenBX: number; screenBY: number;
  latency: number;
}

export function Orb({ state, heatmapActive = false, typingActivity = 0, onNodeClick }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OrbState>(state);
  const heatmapRef = useRef(heatmapActive);
  const typingRef = useRef(typingActivity);
  const bootDoneRef = useRef(false);

  const [popup, setPopup] = useState<NodePopup | null>(null);
  const [dualChannel, setDualChannel] = useState<DualChannel | null>(null);

  const threeRef = useRef<{
    geo: THREE.BufferGeometry; camera: THREE.PerspectiveCamera;
    spinX: number; spinY: number; spinZ: number; cloudZ: number;
    selectIdxA: number; selectIdxB: number;
  } | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { heatmapRef.current = heatmapActive; }, [heatmapActive]);
  useEffect(() => { typingRef.current = typingActivity; }, [typingActivity]);

  const handleCanvasClick = useCallback((e: MouseEvent) => {
    const ref = threeRef.current;
    if (!ref || !bootDoneRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const a = ref.geo.getAttribute("position").array as Float32Array;
    const N = a.length / 3;
    let best = -1, bestDist = Infinity;
    for (let i = 0; i < N; i++) {
      const vec = new THREE.Vector3(a[i*3], a[i*3+1], a[i*3+2]);
      vec.applyEuler(new THREE.Euler(ref.spinX, ref.spinY, ref.spinZ));
      vec.z += ref.cloudZ; vec.project(ref.camera);
      const d = (vec.x-mx)**2 + (vec.y-my)**2;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    if (bestDist > 0.003) {
      ref.selectIdxA = -1; ref.selectIdxB = -1;
      setPopup(null); setDualChannel(null);
      const lc = lineCanvasRef.current;
      if (lc) lc.getContext("2d")?.clearRect(0, 0, lc.width, lc.height);
      return;
    }
    const st = stateRef.current;
    const content = NEURAL_CONTENT[st];
    const entry = content[best % content.length];
    const project = (idx: number) => {
      const vec = new THREE.Vector3(a[idx*3], a[idx*3+1], a[idx*3+2]);
      vec.applyEuler(new THREE.Euler(ref.spinX, ref.spinY, ref.spinZ));
      vec.z += ref.cloudZ; vec.project(ref.camera);
      return { x: (vec.x*.5+.5)*window.innerWidth, y: (-vec.y*.5+.5)*window.innerHeight };
    };
    if (ref.selectIdxA < 0) {
      ref.selectIdxA = best; ref.selectIdxB = -1;
      const sc = project(best);
      setDualChannel(null);
      setPopup({ nodeId:best, screenX:sc.x, screenY:sc.y, label:entry.label, desc:entry.desc,
        active:Math.min(100,entry.active+(best%13)), conn:Math.min(100,entry.conn+(best%7)), energy:Math.min(100,entry.energy+(best%11)) });
      onNodeClick?.(best, st);
    } else if (ref.selectIdxB < 0 && best !== ref.selectIdxA) {
      ref.selectIdxB = best;
      const scA = project(ref.selectIdxA); const scB = project(best);
      const dx=a[ref.selectIdxA*3]-a[best*3], dy=a[ref.selectIdxA*3+1]-a[best*3+1], dz=a[ref.selectIdxA*3+2]-a[best*3+2];
      setPopup(null);
      setDualChannel({ nodeA:ref.selectIdxA, nodeB:best, screenAX:scA.x, screenAY:scA.y, screenBX:scB.x, screenBY:scB.y,
        latency: Math.round(Math.sqrt(dx*dx+dy*dy+dz*dz)*1.8+12) });
    } else {
      ref.selectIdxA = best; ref.selectIdxB = -1;
      const sc = project(best);
      setDualChannel(null);
      setPopup({ nodeId:best, screenX:sc.x, screenY:sc.y, label:entry.label, desc:entry.desc,
        active:Math.min(100,entry.active+(best%13)), conn:Math.min(100,entry.conn+(best%7)), energy:Math.min(100,entry.energy+(best%11)) });
    }
  }, [onNodeClick]);

  // Hover trail
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ref = threeRef.current;
    if (!ref || !bootDoneRef.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX-rect.left)/rect.width)*2-1;
    const my = -((e.clientY-rect.top)/rect.height)*2+1;
    if ((ref as any).hoverMouse) { (ref as any).hoverMouse.x = mx; (ref as any).hoverMouse.y = my; }
  }, []);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const lineCanvasEl = lineCanvasRef.current;
    if (!canvasEl || !lineCanvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const lineCanvas: HTMLCanvasElement = lineCanvasEl;
    let destroyed = false;
    const N = 2000;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x050508, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth/canvas.clientHeight, 1, 1000);
    camera.position.z = 80;

    // ── Particles ──────────────────────────────────────────────
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const phase = new Float32Array(N);
    // Start all particles at center for boot animation
    for (let i = 0; i < N; i++) {
      pos[i*3]=0; pos[i*3+1]=0; pos[i*3+2]=0;
      phase[i] = Math.random() * 1000;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    // Target positions (sphere)
    const targetPos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const theta = Math.random()*Math.PI*2;
      const phi = Math.acos(2*Math.random()-1);
      const r = Math.pow(Math.random(), 0.5) * 25;
      targetPos[i*3]   = r*Math.sin(phi)*Math.cos(theta);
      targetPos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
      targetPos[i*3+2] = r*Math.cos(phi);
    }

    const mat = new THREE.PointsMaterial({
      color: 0x4ca8e8, size: 0.4, transparent: true, opacity: 0,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // ── Heatmap layer ──────────────────────────────────────────
    const heatColors = new Float32Array(N * 3);
    const heatPos = new Float32Array(N * 3);
    const heatGeo = new THREE.BufferGeometry();
    heatGeo.setAttribute("position", new THREE.BufferAttribute(heatPos, 3));
    const colorAttr = new THREE.BufferAttribute(heatColors, 3);
    heatGeo.setAttribute("color", colorAttr);
    const heatMat = new THREE.PointsMaterial({
      size: 0.5, transparent: true, opacity: 0.8,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexColors: true,
    });
    const heatPoints = new THREE.Points(heatGeo, heatMat);
    heatPoints.visible = false;
    scene.add(heatPoints);
    const heatValues = new Float32Array(N);
    const heatTargets = new Float32Array(N);
    for (let i=0;i<N;i++){heatValues[i]=Math.random();heatTargets[i]=Math.random();}
    let heatShiftTimer = 0;

    // ── Lines ──────────────────────────────────────────────────
    const MAX_LINES = 8000;
    const linePos2 = new Float32Array(MAX_LINES * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos2, 3));
    lineGeo.setDrawRange(0, 0);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4ca8e8, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Electrons ──────────────────────────────────────────────
    const MAX_ELECTRONS = 200;
    const electronGeo = new THREE.BufferGeometry();
    const electronPos2 = new Float32Array(MAX_ELECTRONS * 3);
    electronGeo.setAttribute("position", new THREE.BufferAttribute(electronPos2, 3));
    electronGeo.setDrawRange(0, 0);
    const electronMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.8, transparent: true, opacity: 1.0,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const electrons = new THREE.Points(electronGeo, electronMat);
    scene.add(electrons);

    // ── Hover trail ────────────────────────────────────────────
    const TRAIL_MAX = 40;
    const trailPos = new Float32Array(TRAIL_MAX * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setDrawRange(0, 0);
    const trailMat = new THREE.PointsMaterial({
      color: 0x8dd8ff, size: 0.6, transparent: true, opacity: 0.5,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(trailPoints);

    // ── Memory flash geo ───────────────────────────────────────
    // Persistent bright spots for memory events
    const MEM_MAX = 20;
    const memBrightness = new Float32Array(MEM_MAX); // 0-1
    const memPos = new Float32Array(MEM_MAX * 3);
    const memGeo = new THREE.BufferGeometry();
    memGeo.setAttribute("position", new THREE.BufferAttribute(memPos, 3));
    memGeo.setDrawRange(0, 0);
    const memMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 1.5, transparent: true, opacity: 0,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const memPoints = new THREE.Points(memGeo, memMat);
    scene.add(memPoints);
    let memCount = 0;

    // ── Highlights ─────────────────────────────────────────────
    const hlGeoA = new THREE.BufferGeometry();
    hlGeoA.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const hlMatA = new THREE.PointsMaterial({ color:0xffffff, size:2.4, transparent:true, opacity:0, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false });
    const hlA = new THREE.Points(hlGeoA, hlMatA); scene.add(hlA);
    const hlGeoB = new THREE.BufferGeometry();
    hlGeoB.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const hlMatB = new THREE.PointsMaterial({ color:0x4ce8a0, size:2.4, transparent:true, opacity:0, sizeAttenuation:true, blending:THREE.AdditiveBlending, depthWrite:false });
    const hlB = new THREE.Points(hlGeoB, hlMatB); scene.add(hlB);

    threeRef.current = { geo, camera, spinX:0, spinY:0, spinZ:0, cloudZ:0, selectIdxA:-1, selectIdxB:-1,
      hoverMouse: { x: -99, y: -99 } } as any;

    // ── Line canvas ────────────────────────────────────────────
    lineCanvas.width = canvas.clientWidth;
    lineCanvas.height = canvas.clientHeight;
    const lctx = lineCanvas.getContext("2d")!;

    // ── Anim state ─────────────────────────────────────────────
    let bootProgress = 0; // 0 → 1
    let targetRadius=28, currentRadius=28;
    let targetSpeed=0.2, currentSpeed=0.2;
    let targetBright=0.5, currentBright=0.5;
    let targetSize=0.35, currentSize=0.35;
    let lineAmount=0, targetLineAmount=0;
    let electronSpawnRate=0, targetElectronRate=0;
    let spinX=0, spinY=0, spinZ=0;
    let transitionEnergy=0, lastOrbState: OrbState="idle";
    let cloudZ=0, cloudZVel=0;
    let bass=0;
    const activeElectrons: Array<{sx:number;sy:number;sz:number;ex:number;ey:number;ez:number;t:number;speed:number}> = [];
    let lastElectronSpawn=0;
    let activeConnections: Array<{x1:number;y1:number;z1:number;x2:number;y2:number;z2:number}> = [];

    // Hover trail state
    const trailBuf: Array<{x:number;y:number;z:number;age:number}> = [];
    let lastHoverSample = 0;

    // Typing attention
    let currentTypingAttention = 0;

    function project3D(x: number, y: number, z: number) {
      const vec = new THREE.Vector3(x, y, z);
      vec.applyEuler(new THREE.Euler(spinX, spinY, spinZ));
      vec.z += cloudZ; vec.project(camera);
      return { x:(vec.x*.5+.5)*lineCanvas.width, y:(-vec.y*.5+.5)*lineCanvas.height };
    }

    function onResize() {
      const w=canvas.clientWidth, h=canvas.clientHeight;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
      lineCanvas.width=w; lineCanvas.height=h;
    }
    window.addEventListener("resize", onResize);
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    // Public: trigger memory flash
    (threeRef.current as any).triggerMemoryFlash = () => {
      const a = geo.getAttribute("position").array as Float32Array;
      const idx = Math.floor(Math.random() * N);
      const slot = memCount % MEM_MAX;
      memPos[slot*3]=a[idx*3]; memPos[slot*3+1]=a[idx*3+1]; memPos[slot*3+2]=a[idx*3+2];
      memBrightness[slot] = 1.0;
      memCount++;
      memGeo.setDrawRange(0, Math.min(memCount, MEM_MAX));
      (memGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    };

    const clock = new THREE.Clock();

    function animate() {
      if (destroyed) return;
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const st = stateRef.current;
      const hm = heatmapRef.current;
      const typing = typingRef.current;

      // ── Boot animation ───────────────────────────────────────
      if (bootProgress < 1) {
        bootProgress = Math.min(1, bootProgress + 0.006);
        const ease = 1 - Math.pow(1 - bootProgress, 3);
        const a = geo.getAttribute("position").array as Float32Array;
        for (let i=0;i<N;i++) {
          a[i*3]   = targetPos[i*3]   * ease;
          a[i*3+1] = targetPos[i*3+1] * ease;
          a[i*3+2] = targetPos[i*3+2] * ease;
        }
        (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
        mat.opacity = ease * 0.6;
        mat.size = 0.2 + ease * 0.2;
        lineMat.opacity = ease * 0.05;
        if (bootProgress >= 1) bootDoneRef.current = true;
        renderer.render(scene, camera);
        return; // skip physics during boot
      }

      // ── Typing attention ─────────────────────────────────────
      currentTypingAttention += (typing - currentTypingAttention) * 0.08;

      // ── State targets ────────────────────────────────────────
      switch (st) {
        case "idle":     targetRadius=28-currentTypingAttention*4; targetSpeed=0.2+currentTypingAttention*0.15; targetBright=0.5; targetSize=0.35; targetLineAmount=0.15+currentTypingAttention*0.2; targetElectronRate=0; break;
        case "listening":targetRadius=22; targetSpeed=0.3;  targetBright=0.65; targetSize=0.4;  targetLineAmount=0.4;  targetElectronRate=0; break;
        case "thinking": targetRadius=16; targetSpeed=0.5;  targetBright=0.7;  targetSize=0.3;  targetLineAmount=1.0;  targetElectronRate=0.015; break;
        case "speaking": targetRadius=18; targetSpeed=0.2;  targetBright=0.7;  targetSize=0.4;  targetLineAmount=0.8;  targetElectronRate=0; break;
      }

      const lf=0.02;
      currentRadius+=(targetRadius-currentRadius)*lf; currentSpeed+=(targetSpeed-currentSpeed)*lf;
      currentBright+=(targetBright-currentBright)*lf; currentSize+=(targetSize-currentSize)*lf;
      lineAmount+=(targetLineAmount-lineAmount)*lf; electronSpawnRate+=(targetElectronRate-electronSpawnRate)*lf;

      if (st!==lastOrbState){transitionEnergy=1.0;lastOrbState=st;}
      transitionEnergy*=0.985;
      if (transitionEnergy>0.05){spinX+=transitionEnergy*0.012*Math.sin(t*1.7);spinY+=transitionEnergy*0.015;spinZ+=transitionEnergy*0.008*Math.cos(t*1.3);}

      if (st==="speaking"){bass=0.3+Math.abs(Math.sin(t*4))*0.25+Math.random()*0.1;}
      else if (st==="thinking"){bass=0.1+Math.sin(t*2)*0.05;}
      else if (st==="listening"){bass=0.08+Math.random()*0.1;}
      else {bass=0.02+Math.sin(t*0.8)*0.02+currentTypingAttention*0.06;}

      let zTarget=Math.sin(t*0.12)*8;
      if (st==="thinking") zTarget=Math.sin(t*0.3)*15+Math.sin(t*0.9)*6;
      else if (st==="speaking") zTarget=Math.sin(t*0.15)*6-bass*10;
      else if (currentTypingAttention>0.1) zTarget=Math.sin(t*0.2)*4;
      cloudZVel+=(zTarget-cloudZ)*0.008; cloudZVel*=0.94; cloudZ+=cloudZVel;

      if (threeRef.current) { threeRef.current.spinX=spinX; threeRef.current.spinY=spinY; threeRef.current.spinZ=spinZ; threeRef.current.cloudZ=cloudZ; }
      [points,lines,electrons,hlA,hlB,trailPoints,memPoints].forEach(o=>{o.rotation.x=spinX;o.rotation.y=spinY;o.rotation.z=spinZ;o.position.z=cloudZ;});

      // ── Particle physics ─────────────────────────────────────
      const p=geo.getAttribute("position"); const a=p.array as Float32Array;
      for (let i=0;i<N;i++){
        const i3=i*3; const x=a[i3],y=a[i3+1],z=a[i3+2]; const px=phase[i];
        vel[i3]  +=Math.sin(t*0.05+px)*0.001*currentSpeed;
        vel[i3+1]+=Math.cos(t*0.06+px*1.3)*0.001*currentSpeed;
        vel[i3+2]+=Math.sin(t*0.055+px*0.7)*0.001*currentSpeed;
        const dist=Math.sqrt(x*x+y*y+z*z)||0.01;
        const pull=Math.max(0,dist-currentRadius)*0.002+0.0003;
        vel[i3]-=(x/dist)*pull; vel[i3+1]-=(y/dist)*pull; vel[i3+2]-=(z/dist)*pull;
        if (bass>0.05){vel[i3]+=(x/dist)*bass*0.02;vel[i3+1]+=(y/dist)*bass*0.02;vel[i3+2]+=(z/dist)*bass*0.02;}
        // Typing repulsion pulse
        if (currentTypingAttention>0.05&&Math.random()<0.002){
          const ang=Math.random()*Math.PI*2; vel[i3]+=Math.cos(ang)*currentTypingAttention*0.04; vel[i3+1]+=Math.sin(ang)*currentTypingAttention*0.04;
        }
        vel[i3]*=0.992; vel[i3+1]*=0.992; vel[i3+2]*=0.992;
        a[i3]+=vel[i3]; a[i3+1]+=vel[i3+1]; a[i3+2]+=vel[i3+2];
      }
      (p as THREE.BufferAttribute).needsUpdate=true;

      // ── Hover trail ───────────────────────────────────────────
      const hoverMouse = (threeRef.current as any)?.hoverMouse;
      if (hoverMouse && t - lastHoverSample > 0.04) {
        lastHoverSample = t;
        // Find nearest particle to mouse
        let bestI=-1, bestD=Infinity;
        for (let i=0;i<N;i+=4){
          const vec=new THREE.Vector3(a[i*3],a[i*3+1],a[i*3+2]);
          vec.applyEuler(new THREE.Euler(spinX,spinY,spinZ)); vec.z+=cloudZ; vec.project(camera);
          const d=(vec.x-hoverMouse.x)**2+(vec.y-hoverMouse.y)**2;
          if(d<bestD){bestD=d;bestI=i;}
        }
        if (bestI>=0 && bestD<0.05) {
          trailBuf.push({x:a[bestI*3],y:a[bestI*3+1],z:a[bestI*3+2],age:0});
          if (trailBuf.length>TRAIL_MAX) trailBuf.shift();
        }
      }
      // Age trail & write
      let alive=0;
      const tpa=trailGeo.getAttribute("position").array as Float32Array;
      for (let i=trailBuf.length-1;i>=0;i--){
        trailBuf[i].age+=0.025;
        if(trailBuf[i].age>1){trailBuf.splice(i,1);continue;}
        tpa[alive*3]=trailBuf[i].x; tpa[alive*3+1]=trailBuf[i].y; tpa[alive*3+2]=trailBuf[i].z; alive++;
      }
      trailGeo.setDrawRange(0,alive); (trailGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate=true;
      trailMat.opacity = 0.4 + Math.sin(t*3)*0.1;

      // ── Memory flash points ───────────────────────────────────
      let memAlive=0;
      const mpa=memGeo.getAttribute("position").array as Float32Array;
      for (let i=0;i<Math.min(memCount,MEM_MAX);i++){
        memBrightness[i]*=0.97; // slow fade, stays for a while
        if(memBrightness[i]>0.05){
          mpa[memAlive*3]=memPos[i*3]; mpa[memAlive*3+1]=memPos[i*3+1]; mpa[memAlive*3+2]=memPos[i*3+2]; memAlive++;
        }
      }
      memGeo.setDrawRange(0,memAlive); (memGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate=true;
      memMat.opacity=memAlive>0?0.9:0; memMat.size=1.8+Math.sin(t*2)*0.3;

      // ── Highlights ────────────────────────────────────────────
      const ref=threeRef.current;
      if(ref&&ref.selectIdxA>=0){
        const hi=ref.selectIdxA*3; const hp=hlGeoA.getAttribute("position");
        hp.array[0]=a[hi];hp.array[1]=a[hi+1];hp.array[2]=a[hi+2];(hp as THREE.BufferAttribute).needsUpdate=true;
        hlA.rotation.x=spinX;hlA.rotation.y=spinY;hlA.rotation.z=spinZ;hlA.position.z=cloudZ;
        hlMatA.opacity=0.85+Math.sin(t*5)*0.15;
      } else { hlMatA.opacity=0; }
      if(ref&&ref.selectIdxB>=0){
        const hi=ref.selectIdxB*3; const hp=hlGeoB.getAttribute("position");
        hp.array[0]=a[hi];hp.array[1]=a[hi+1];hp.array[2]=a[hi+2];(hp as THREE.BufferAttribute).needsUpdate=true;
        hlB.rotation.x=spinX;hlB.rotation.y=spinY;hlB.rotation.z=spinZ;hlB.position.z=cloudZ; hlMatB.opacity=0.85+Math.sin(t*5+1)*0.15;
        if(ref.selectIdxA>=0){
          const scA=project3D(a[ref.selectIdxA*3],a[ref.selectIdxA*3+1],a[ref.selectIdxA*3+2]);
          const scB=project3D(a[hi],a[hi+1],a[hi+2]);
          lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height);
          lctx.beginPath();lctx.moveTo(scA.x,scA.y);lctx.lineTo(scB.x,scB.y);
          lctx.strokeStyle="rgba(76,232,160,0.3)";lctx.lineWidth=1;lctx.setLineDash([4,8]);lctx.stroke();lctx.setLineDash([]);
          lctx.beginPath();lctx.arc(scA.x,scA.y,3,0,Math.PI*2);lctx.fillStyle="rgba(255,255,255,0.7)";lctx.fill();
          lctx.beginPath();lctx.arc(scB.x,scB.y,3,0,Math.PI*2);lctx.fillStyle="rgba(76,232,160,0.8)";lctx.fill();
        }
      } else {
        hlMatB.opacity=0;
        if(ref&&ref.selectIdxA>=0&&ref.selectIdxB<0){
          const hi=ref.selectIdxA*3; const sc=project3D(a[hi],a[hi+1],a[hi+2]);
          lctx.clearRect(0,0,lineCanvas.width,lineCanvas.height);
          lctx.beginPath();lctx.arc(sc.x,sc.y,4,0,Math.PI*2);
          lctx.strokeStyle="rgba(76,168,232,0.6)";lctx.lineWidth=1.5;lctx.stroke();
        }
      }

      // ── Synaptic lines ────────────────────────────────────────
      if(lineAmount>0.01){
        const lp=lineGeo.getAttribute("position"); const la=lp.array as Float32Array;
        let lc=0; const mds=(8*(1+bass*0.5))**2; const step=Math.max(1,Math.floor(N/600));
        for(let i=0;i<N&&lc<MAX_LINES;i+=step){
          const i3=i*3; const x1=a[i3],y1=a[i3+1],z1=a[i3+2];
          for(let j=i+step;j<N&&lc<MAX_LINES;j+=step){
            const j3=j*3; const dx=a[j3]-x1,dy=a[j3+1]-y1,dz=a[j3+2]-z1;
            if(dx*dx+dy*dy+dz*dz<mds){const idx=lc*6;la[idx]=x1;la[idx+1]=y1;la[idx+2]=z1;la[idx+3]=a[j3];la[idx+4]=a[j3+1];la[idx+5]=a[j3+2];lc++;}
          }
        }
        lineGeo.setDrawRange(0,lc*2);(lp as THREE.BufferAttribute).needsUpdate=true;lineMat.opacity=lineAmount*0.12;
        activeConnections=[];
        for(let c=0;c<Math.min(lc,500);c++){const ci=c*6;activeConnections.push({x1:la[ci],y1:la[ci+1],z1:la[ci+2],x2:la[ci+3],y2:la[ci+4],z2:la[ci+5]});}
      } else {lineGeo.setDrawRange(0,0);activeConnections=[];}

      if(activeConnections.length>0&&electronSpawnRate>0.005){
        if(activeElectrons.length<3&&t-lastElectronSpawn>1.0){
          const conn=activeConnections[Math.floor(Math.random()*activeConnections.length)];
          activeElectrons.push({sx:conn.x1,sy:conn.y1,sz:conn.z1,ex:conn.x2,ey:conn.y2,ez:conn.z2,t:0,speed:0.003+Math.random()*0.003});
          lastElectronSpawn=t;
        }
      }
      const ep=electronGeo.getAttribute("position"); const ea=ep.array as Float32Array; let eAlive=0;
      for(let e=activeElectrons.length-1;e>=0;e--){
        const el=activeElectrons[e];el.t+=el.speed;if(el.t>=1){activeElectrons.splice(e,1);continue;}
        const ei=eAlive*3;ea[ei]=el.sx+(el.ex-el.sx)*el.t;ea[ei+1]=el.sy+(el.ey-el.sy)*el.t;ea[ei+2]=el.sz+(el.ez-el.sz)*el.t;eAlive++;
      }
      electronGeo.setDrawRange(0,eAlive);(ep as THREE.BufferAttribute).needsUpdate=true;
      electrons.rotation.x=spinX;electrons.rotation.y=spinY;electrons.rotation.z=spinZ;electrons.position.z=cloudZ;

      // ── Heatmap ───────────────────────────────────────────────
      if(hm){
        points.visible=false; heatPoints.visible=true;
        heatPoints.rotation.x=spinX;heatPoints.rotation.y=spinY;heatPoints.rotation.z=spinZ;heatPoints.position.z=cloudZ;
        heatPos.set(a.subarray(0,N*3));(heatGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate=true;
        heatShiftTimer-=0.016;
        if(heatShiftTimer<=0){
          heatShiftTimer=1.2+Math.random()*1.5;
          for(let i=0;i<N;i++){if(Math.random()<0.25)heatTargets[i]=Math.random();}
          if(st==="thinking"||st==="speaking"){
            const clusters = st === "thinking" ? 5 : 2;
            const radius = st === "thinking" ? 9 : 7;
            for(let k=0;k<clusters;k++){
              const cx=(Math.random()-.5)*20,cy=(Math.random()-.5)*20,cz=(Math.random()-.5)*20;
              for(let i=0;i<N;i++){const dx=a[i*3]-cx,dy=a[i*3+1]-cy,dz=a[i*3+2]-cz;if(Math.sqrt(dx*dx+dy*dy+dz*dz)<radius)heatTargets[i]=(st==="thinking"?0.88:0.75)+Math.random()*(st==="thinking"?0.12:0.25);}
            }
          }
        }
        for(let i=0;i<N;i++)heatValues[i]+=(heatTargets[i]-heatValues[i])*0.035;
        for(let i=0;i<N;i++){
          const h=heatValues[i];let r,g,b;
          if(h<0.25){r=0.20;g=1.00;b=0.55;}else if(h<0.50){r=0.20;g=0.55;b=1.00;}else if(h<0.70){r=1.00;g=0.80;b=0.10;}else if(st==="thinking"){r=1.00;g=0.08;b=0.12;}else{r=1.00;g=0.18;b=0.18;}
          heatColors[i*3]=r;heatColors[i*3+1]=g;heatColors[i*3+2]=b;
        }
        colorAttr.array.set(heatColors);colorAttr.needsUpdate=true;
        heatMat.opacity=Math.max(0.7,currentBright+bass*0.1);heatMat.size=currentSize+bass*0.06;
      } else {
        heatPoints.visible=false; points.visible=true;
        mat.opacity=currentBright+bass*0.08; mat.size=currentSize+bass*0.05;
        if(st==="thinking"){mat.color.lerp(new THREE.Color(0xff3f67),0.02);lineMat.color.lerp(new THREE.Color(0xff3f67),0.02);}
        else if(st==="speaking"){mat.color.lerp(new THREE.Color(0x5ab8f0),0.015);lineMat.color.lerp(new THREE.Color(0x5ab8f0),0.015);}
        else{mat.color.lerp(new THREE.Color(0x4ca8e8),0.015);lineMat.color.lerp(new THREE.Color(0x4ca8e8),0.015);}
      }

      camera.position.x=Math.sin(t*0.02)*5; camera.position.y=Math.cos(t*0.03)*3;
      camera.lookAt(0,0,cloudZ*0.2);
      renderer.render(scene,camera);
    }

    animate();

    return () => {
      destroyed=true;
      canvas.removeEventListener("click",handleCanvasClick);
      canvas.removeEventListener("mousemove",handleMouseMove);
      window.removeEventListener("resize",onResize);
      renderer.dispose();
      [geo,lineGeo,electronGeo,heatGeo,hlGeoA,hlGeoB,trailGeo,memGeo].forEach(g=>g.dispose());
      [mat,lineMat,electronMat,heatMat,hlMatA,hlMatB,trailMat,memMat].forEach(m=>m.dispose());
    };
  }, [handleCanvasClick, handleMouseMove]);

  const getPopupStyle = (sx:number,sy:number): React.CSSProperties => {
    const pw=270,ph=170; let left=sx+20,top=sy-20;
    if(left+pw>window.innerWidth-10)left=sx-pw-20;
    if(top+ph>window.innerHeight-10)top=window.innerHeight-ph-10;
    if(top<60)top=60;
    return {position:"fixed",left,top,zIndex:25,pointerEvents:"none"};
  };
  const getDualStyle = (ax:number,ay:number,bx:number,by:number): React.CSSProperties => {
    const mx=(ax+bx)/2,my=(ay+by)/2; let left=mx-110,top=my-120;
    if(top<60)top=my+20; if(left<10)left=10; if(left+220>window.innerWidth-10)left=window.innerWidth-230;
    return {position:"fixed",left,top,zIndex:25,pointerEvents:"none"};
  };

  return (
    <>
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",cursor:"crosshair"}} />
      <canvas ref={lineCanvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:15}} />
      {popup&&!dualChannel&&(
        <div style={getPopupStyle(popup.screenX,popup.screenY)} className="orb-popup">
          <div className="orb-popup-inner">
            <div className="orb-popup-dot"/><div className="orb-popup-corner tl"/><div className="orb-popup-corner tr"/>
            <div className="orb-popup-corner bl"/><div className="orb-popup-corner br"/>
            <div className="orb-popup-nodeid">NODE #{String(popup.nodeId).padStart(4,"0")}</div>
            <div className="orb-popup-label">{popup.label}</div>
            <div className="orb-popup-desc">{popup.desc}</div>
            <div className="orb-popup-bar-row"><span className="orb-popup-bar-label">AKTIV</span><div className="orb-popup-bar-track"><div className="orb-popup-bar-fill" style={{width:`${popup.active}%`}}/></div></div>
            <div className="orb-popup-bar-row"><span className="orb-popup-bar-label">VERBDG</span><div className="orb-popup-bar-track"><div className="orb-popup-bar-fill" style={{width:`${popup.conn}%`}}/></div></div>
            <div className="orb-popup-bar-row"><span className="orb-popup-bar-label">ENERGIE</span><div className="orb-popup-bar-track"><div className="orb-popup-bar-fill" style={{width:`${popup.energy}%`}}/></div></div>
          </div>
        </div>
      )}
      {dualChannel&&(
        <div style={getDualStyle(dualChannel.screenAX,dualChannel.screenAY,dualChannel.screenBX,dualChannel.screenBY)} className="orb-dual-popup">
          <div className="orb-dual-inner">
            <div className="orb-dual-title">SYNAPTISCHER KANAL</div>
            <div className="orb-dual-nodes"><span>NODE #{String(dualChannel.nodeA).padStart(4,"0")}</span><span>NODE #{String(dualChannel.nodeB).padStart(4,"0")}</span></div>
            <div className="orb-dual-signal"><div className="orb-signal-pulse"/></div>
            <div className="orb-dual-signal"><div className="orb-signal-pulse reverse"/></div>
            <div className="orb-dual-latency">LATENZ: {dualChannel.latency} ms</div>
          </div>
        </div>
      )}
    </>
  );
}
