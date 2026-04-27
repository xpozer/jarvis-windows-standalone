import type { GlobalNetworkSceneProps } from "./types";

const routeIds = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"];
const redRouteIds = ["rr1", "rr2", "rr3", "rr4"];

const cityClusters = [
  { x: 190, y: 255, rx: 95, ry: 55, count: 70 },
  { x: 330, y: 470, rx: 74, ry: 130, count: 64 },
  { x: 625, y: 220, rx: 110, ry: 45, count: 76 },
  { x: 790, y: 380, rx: 110, ry: 120, count: 92 },
  { x: 1040, y: 275, rx: 200, ry: 80, count: 120 },
  { x: 1250, y: 330, rx: 165, ry: 70, count: 98 },
  { x: 1330, y: 580, rx: 90, ry: 55, count: 68 },
  { x: 900, y: 510, rx: 70, ry: 90, count: 58 },
];

function seededRandom(seedValue: number) {
  let seed = seedValue;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function CityLights() {
  const rnd = seededRandom(42);
  const lights = cityClusters.flatMap((cluster, clusterIndex) =>
    Array.from({ length: cluster.count }, (_, index) => {
      const red = rnd() > 0.94;
      return {
        key: `${clusterIndex}-${index}`,
        x: cluster.x + (rnd() - 0.5) * cluster.rx * 2,
        y: cluster.y + (rnd() - 0.5) * cluster.ry * 2,
        r: 0.65 + rnd() * 1.35,
        opacity: 0.22 + rnd() * 0.76,
        red,
      };
    }),
  );

  return (
    <g className="boot-city-lights">
      {lights.map((light) => (
        <circle
          key={light.key}
          className={light.red ? "boot-city red" : "boot-city"}
          cx={light.x}
          cy={light.y}
          r={light.r}
          opacity={light.opacity}
        />
      ))}
    </g>
  );
}

function Packet({ route, index, red = false }: { route: string; index: number; red?: boolean }) {
  const duration = red ? 2.1 + (index % 3) * 0.28 : 1.85 + (index % 5) * 0.24;
  const delay = (index % 7) * 0.19;
  return (
    <circle className={red ? "boot-packet red" : index % 2 ? "boot-packet blue" : "boot-packet"} r={red ? 3.2 : 4.4}>
      <animateMotion dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
        <mpath href={`#${route}`} />
      </animateMotion>
    </circle>
  );
}

export function GlobalNetworkScene({ phase, progress }: GlobalNetworkSceneProps) {
  return (
    <div className={`jarvis-global-scene phase-${phase}`} style={{ "--boot-progress": `${progress}%` } as React.CSSProperties}>
      <div className="jarvis-frame" />
      <div className="jarvis-corner tl" />
      <div className="jarvis-corner tr" />
      <div className="jarvis-corner bl" />
      <div className="jarvis-corner br" />
      <div className="jarvis-radar r-tl" />
      <div className="jarvis-radar r-tr" />
      <div className="jarvis-radar r-bl" />
      <div className="jarvis-radar r-br" />

      <div className="jarvis-title-block">
        <h1>JARVIS</h1>
        <div>GLOBAL NETWORK OVERVIEW</div>
      </div>

      <div className="jarvis-top-pill left"><span>NETWORK STATUS</span><b>ONLINE</b></div>
      <div className="jarvis-top-pill right"><span>SYSTEM INTEGRITY</span><b>100%</b></div>

      <div className="jarvis-world-map">
        <svg viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <path id="r1" d="M90 255 C270 60 515 86 790 338" />
            <path id="r2" d="M210 415 C360 198 560 202 790 338" />
            <path id="r3" d="M400 350 C515 264 642 286 790 338" />
            <path id="r4" d="M330 630 C452 410 610 366 790 338" />
            <path id="r5" d="M890 655 C874 536 842 430 790 338" />
            <path id="r6" d="M1148 460 C1028 370 906 332 790 338" />
            <path id="r7" d="M1278 315 C1125 190 942 212 790 338" />
            <path id="r8" d="M1410 450 C1230 348 996 328 790 338" />
            <path id="r9" d="M1410 640 C1198 456 1012 406 790 338" />
            <path id="r10" d="M986 286 C914 246 845 266 790 338" />
            <path id="rr1" d="M145 420 C364 380 546 428 790 338" />
            <path id="rr2" d="M1365 346 C1160 276 980 300 790 338" />
            <path id="rr3" d="M310 245 C485 206 650 248 790 338" />
            <path id="rr4" d="M1035 275 C930 255 842 285 790 338" />
          </defs>

          <g className="jarvis-map-grid" opacity=".22" stroke="#0bbce8">
            <path d="M0 380h1600M800 0v760M230 0l420 380-420 380M1370 0 970 380l400 380" />
            <circle cx="790" cy="338" r="170" fill="none" />
            <circle cx="790" cy="338" r="260" fill="none" />
            <circle cx="790" cy="338" r="390" fill="none" />
            <circle cx="790" cy="338" r="520" fill="none" />
          </g>

          <g className="boot-continents">
            <path className="boot-land" d="M82 232 126 196 205 188 274 209 332 196 423 230 410 280 340 300 274 338 206 326 150 288 82 282z" />
            <path className="boot-land" d="M236 365 310 388 365 472 336 565 292 680 242 720 210 620 236 540 198 455z" />
            <path className="boot-land" d="M505 162 605 142 708 172 748 234 724 293 650 306 574 286 506 240z" />
            <path className="boot-land" d="M735 210 823 198 900 238 942 308 925 408 870 520 802 558 728 490 690 382 706 278z" />
            <path className="boot-land" d="M827 172 980 140 1090 172 1202 230 1390 225 1518 288 1476 364 1308 372 1146 340 1028 378 920 338 835 270z" />
            <path className="boot-land" d="M1220 500 1320 528 1420 620 1368 674 1248 640 1182 560z" />
            <path className="boot-land-soft" d="M620 330 704 354 738 418 704 500 630 520 580 454 596 374z" />
            <path className="boot-land-soft" d="M865 378 938 390 995 470 960 565 880 604 820 534 828 435z" />
          </g>

          <CityLights />

          <g className="boot-routes">
            {routeIds.map((route) => (
              <g key={route}>
                <use href={`#${route}`} className="boot-route glow" />
                <use href={`#${route}`} className="boot-route" />
              </g>
            ))}
            {redRouteIds.map((route) => (
              <use key={route} href={`#${route}`} className="boot-route red" />
            ))}
          </g>

          <g className="boot-nodes">
            {[
              [90, 255], [210, 415], [400, 350], [330, 630], [890, 655], [1148, 460], [1278, 315], [1410, 450], [1410, 640], [986, 286], [790, 338], [790, 525],
            ].map(([x, y], index) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <circle className="boot-node-core" r={index === 10 ? 11 : 7} />
                <circle className="boot-node-ring" r={index === 10 ? 50 : 30} />
                <circle className="boot-node-ring red" r={index === 10 ? 72 : 43} />
              </g>
            ))}
          </g>

          <g className="boot-packets">
            {routeIds.flatMap((route, routeIndex) => [
              <Packet key={`${route}-a`} route={route} index={routeIndex * 2} />,
              <Packet key={`${route}-b`} route={route} index={routeIndex * 2 + 1} />,
            ])}
            {redRouteIds.map((route, index) => <Packet key={`${route}-red`} route={route} index={index} red />)}
          </g>
        </svg>
      </div>

      <div className="jarvis-hub">
        <div className="hub-ring r1" />
        <div className="hub-ring r2" />
        <div className="hub-ring r3" />
        <div className="hub-cross" />
        <div className="hub-core" />
      </div>

      <section className="jarvis-panel left traffic">
        <h3>NETWORK TRAFFIC</h3>
        <div className="mini-chart" />
        <p><span>ONLINE</span><b>2.75 Tbps</b></p>
        <p><span>OUTLINE</span><b>3.31 Tbps</b></p>
      </section>

      <section className="jarvis-panel left nodes">
        <h3>NODE STATUS</h3>
        {['NORTH AMERICA', 'SOUTH AMERICA', 'EUROPE', 'AFRICA', 'MIDDLE EAST', 'ASIA', 'SOUTHEAST ASIA', 'AUSTRALIA'].map((item) => (
          <p key={item}><span>{item}</span><b>●</b></p>
        ))}
      </section>

      <section className="jarvis-panel left stream">
        <h3>DATA STREAM</h3>
        <div className="wave-chart" />
        <h3>PACKET FLOW</h3>
        <div className="bar-chart" />
      </section>

      <section className="jarvis-panel right regional">
        <h3>REGIONAL OVERVIEW</h3>
        <div className="mini-world" />
      </section>

      <section className="jarvis-panel right routes">
        <h3>CONNECTING ROUTES</h3>
        {[
          ['EUROPE', '1.36k'], ['N. AMERICA', '89%'], ['ASIA', '81%'], ['S. AMERICA', '63%'], ['AFRICA', '57%'], ['AUSTRALIA', '72%'], ['M. EAST', '35%'], ['SE ASIA', '78%'],
        ].map(([name, value]) => (
          <p key={name}><span>{name}</span><i /><b>{value}</b></p>
        ))}
      </section>

      <section className="jarvis-panel right log">
        <h3>SYSTEM LOG</h3>
        {['NODE SYNC', 'LINK OPTIMIZED', 'BANDWIDTH ALLOCATED', 'ROUTE VERIFIED', 'ENCRYPTION VERIFIED', 'BACKUP SYNC'].map((item, index) => (
          <p key={item}><span>14:32:{21 - index * 2}</span><b>{item}</b><em>OK</em></p>
        ))}
      </section>

      <section className="jarvis-panel right uptime">
        <h3>GLOBAL UPTIME</h3>
        <strong>122d 14h 36m 22s</strong>
        <div className="bar-chart" />
      </section>

      <div className="active-connections">
        <span>ACTIVE CONNECTIONS</span>
        <strong>1,247,893,456</strong>
        <em>LIVE NETWORK NODES</em>
      </div>

      <div className="jarvis-bottom-platform" />

      <div className="bottom-module bandwidth"><span>BANDWIDTH UTILIZATION</span><b>87%</b></div>
      <div className="bottom-module latency"><span>LATENCY</span><b>24.7 ms</b></div>
      <div className="bottom-module threat"><span>THREAT LEVEL</span><b>LOW</b></div>
      <div className="bottom-module encryption"><span>DATA ENCRYPTION</span><b>AES-256</b></div>
    </div>
  );
}
