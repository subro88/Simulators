/**
 * ══════════════════════════════════════════════════════════════════════════════
 * COMPUTER NETWORKS VIRTUAL LAB ENGINE — VisualLab V2 Standard
 * Strict 3:2 Dual Viewport, IPv4 Subnetting & VLSM Bit Calculator,
 * OSI 7-Layer Encapsulation, Topology Routing, Wireshark PCAP & 3D WebGL Model
 * ══════════════════════════════════════════════════════════════════════════════
 */

(() => {
  'use strict';

  // ════════════════════════════════════════════════════════════════════════════
  // 1. TACTILE SOUND SYNTHESIZER (Web Audio API)
  // ════════════════════════════════════════════════════════════════════════════
  class SoundSynthesizer {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    }

    playPacketChirp() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    }

    playPingSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [587.33, 880.00]; // D5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.22);
      });
    }

    playAlertTone() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.setValueAtTime(240, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    }

    playCutSnap() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.055);
    }

    playSuccessChord() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.36);
      });
    }
  }

  const sound = new SoundSynthesizer();

  // ════════════════════════════════════════════════════════════════════════════
  // 2. IPV4 BITWISE SUBNETTING & VLSM ENGINE
  // ════════════════════════════════════════════════════════════════════════════
  class IPv4SubnetEngine {
    constructor() {
      this.ipStr = '192.168.10.65';
      this.prefix = 26;
      this.vlsmRequirements = [
        { name: 'Engineering', hostsNeeded: 60 },
        { name: 'Operations', hostsNeeded: 28 },
        { name: 'Admin / HR', hostsNeeded: 12 },
        { name: 'WAN Link', hostsNeeded: 2 }
      ];
    }

    // Convert dotted quad to 32-bit unsigned integer
    ipToInt(ipStr) {
      const parts = ipStr.trim().split('.').map(p => parseInt(p, 10) || 0);
      if (parts.length !== 4) return 0;
      return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
    }

    // Convert 32-bit unsigned integer to dotted quad
    intToIp(intVal) {
      const v = intVal >>> 0;
      return [
        (v >>> 24) & 0xFF,
        (v >>> 16) & 0xFF,
        (v >>> 8) & 0xFF,
        v & 0xFF
      ].join('.');
    }

    calculate(ipStr, prefix) {
      const ip = this.ipToInt(ipStr);
      const p = Math.max(0, Math.min(32, prefix));

      // Subnet Mask M
      const mask = p === 0 ? 0 : ((0xFFFFFFFF << (32 - p)) >>> 0);
      // Wildcard Mask W
      const wildcard = (~mask) >>> 0;
      // Network Address N
      const network = (ip & mask) >>> 0;
      // Broadcast Address B
      const broadcast = (network | wildcard) >>> 0;

      // Usable Host Ranges
      let usableHosts = 0;
      let firstHost = network;
      let lastHost = broadcast;

      if (p <= 30) {
        usableHosts = Math.pow(2, 32 - p) - 2;
        firstHost = (network + 1) >>> 0;
        lastHost = (broadcast - 1) >>> 0;
      } else if (p === 31) {
        // RFC 3021 Point-to-Point link: 2 usable hosts
        usableHosts = 2;
        firstHost = network;
        lastHost = broadcast;
      } else if (p === 32) {
        // Host route: 1 host
        usableHosts = 1;
        firstHost = network;
        lastHost = network;
      }

      const totalAddresses = Math.pow(2, 32 - p);

      return {
        ipInt: ip,
        ipStr: this.intToIp(ip),
        prefix: p,
        maskInt: mask,
        maskStr: this.intToIp(mask),
        wildcardInt: wildcard,
        wildcardStr: this.intToIp(wildcard),
        networkInt: network,
        networkStr: this.intToIp(network),
        broadcastInt: broadcast,
        broadcastStr: this.intToIp(broadcast),
        firstHostStr: this.intToIp(firstHost),
        lastHostStr: this.intToIp(lastHost),
        usableHosts,
        totalAddresses
      };
    }

    // VLSM Allocation Calculation
    computeVLSM(baseIpStr, basePrefix, departments) {
      const baseIp = this.ipToInt(baseIpStr);
      const baseCalc = this.calculate(baseIpStr, basePrefix);
      const baseNet = baseCalc.networkInt;
      const baseCap = baseCalc.totalAddresses;

      // Sort requirements descending
      const sorted = [...departments].sort((a, b) => b.hostsNeeded - a.hostsNeeded);
      const allocations = [];
      let currentNet = baseNet;
      let totalUsed = 0;

      for (const dept of sorted) {
        // Needed host bits h = ceil(log2(needed + 2))
        const h = Math.max(1, Math.ceil(Math.log2(dept.hostsNeeded + 2)));
        const p = 32 - h;
        const blockSize = Math.pow(2, h);

        const subCalc = this.calculate(this.intToIp(currentNet), p);
        allocations.push({
          name: dept.name,
          hostsNeeded: dept.hostsNeeded,
          prefix: p,
          blockSize,
          maskStr: subCalc.maskStr,
          networkStr: subCalc.networkStr,
          firstHostStr: subCalc.firstHostStr,
          lastHostStr: subCalc.lastHostStr,
          broadcastStr: subCalc.broadcastStr,
          startOffset: currentNet - baseNet,
          sizeRatio: blockSize / baseCap
        });

        currentNet = (currentNet + blockSize) >>> 0;
        totalUsed += blockSize;
      }

      const overflow = totalUsed > baseCap;
      return { allocations, baseCap, totalUsed, overflow };
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. OSI 7-LAYER ENCAPSULATION & HEADER ENGINE
  // ════════════════════════════════════════════════════════════════════════════
  class OsiStackEngine {
    constructor() {
      this.currentLayer = 7; // 7..1
      this.direction = 'DOWN'; // 'DOWN' (Encapsulation) or 'UP' (Decapsulation)
      this.payload = 'GET /index.html HTTP/1.1';
      this.payloadSize = 1200; // Bytes
      this.mtu = 1500; // Bytes
      this.protocol = 'TCP'; // TCP, UDP, ICMP

      this.headers = {
        app: { name: 'HTTP Payload', size: 1200, fields: { method: 'GET', uri: '/index.html', host: 'web.nhit.ac.in', agent: 'VisualLab-Client/2.0' } },
        transport: { name: 'TCP Header', size: 20, fields: { srcPort: 54321, dstPort: 80, seqNum: '1000142', ackNum: '0', flags: 'SYN', winSize: 64240 } },
        network: { name: 'IPv4 Header', size: 20, fields: { version: 4, ihl: 5, totalLen: 1240, ttl: 64, proto: '6 (TCP)', srcIP: '192.168.1.10', dstIP: '10.0.50.5' } },
        dataLink: { name: 'Ethernet II Header', size: 18, fields: { dstMAC: 'CC:01:23:45:67:89', srcMAC: 'AA:01:BB:22:33:44', etherType: '0x0800 (IPv4)', fcs: '0x8F3D12A4' } },
        physical: { name: 'Physical Bits', size: 0, fields: { lineCoding: 'NRZ-I / 4B5B', medium: '1000BASE-T Cat6 Copper', delay: '0.45 ms' } }
      };
    }

    // CRC-32 Calculator (IEEE 802.3 Ethernet Standard)
    calcCRC32(str) {
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < str.length; i++) {
        const byte = str.charCodeAt(i);
        crc ^= byte;
        for (let j = 0; j < 8; j++) {
          crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
        }
      }
      return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
    }

    // MTU Fragmentation calculation
    calculateFragmentation() {
      const dataSize = this.payloadSize;
      const effectiveMtu = this.mtu - 20; // 20B IP header
      // Frag payload must be multiple of 8 bytes except last
      const maxPayloadPerFrag = Math.floor(effectiveMtu / 8) * 8;
      const numFragments = Math.ceil(dataSize / maxPayloadPerFrag);

      const fragments = [];
      let offset = 0;
      for (let i = 0; i < numFragments; i++) {
        const currentLen = Math.min(dataSize - offset, maxPayloadPerFrag);
        const isLast = (i === numFragments - 1);
        fragments.push({
          fragId: i + 1,
          totalLen: currentLen + 20,
          payloadLen: currentLen,
          offsetBytes: offset,
          offsetField: offset / 8,
          moreFragments: isLast ? 0 : 1
        });
        offset += currentLen;
      }
      return fragments;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. TOPOLOGY, L2 SWITCHING & L3 DYNAMIC ROUTING ENGINE
  // ════════════════════════════════════════════════════════════════════════════
  class NetworkTopologyEngine {
    constructor() {
      this.nodes = [];
      this.links = [];
      this.packets = []; // Flying animated packet envelopes
      this.nextPacketId = 1;
      this.routingProto = 'OSPF'; // 'STATIC', 'RIP', 'OSPF'
      this.selectedNodeId = 'PC1';
      this.cutToolActive = false;

      this.loadDualRouterWAN();
    }

    loadDualRouterWAN() {
      this.nodes = [
        { id: 'PC1', label: 'PC1', type: 'PC', x: 90, y: 160, ip: '192.168.1.10', mask: '255.255.255.0', gw: '192.168.1.1', mac: 'AA:01:11:11:11:11', arp: { '192.168.1.1': 'CC:01:00:00:00:01' } },
        { id: 'SW1', label: 'Switch 1', type: 'SWITCH', x: 230, y: 160, macTable: [{ vlan: 1, mac: 'AA:01:11:11:11:11', port: 'Fa0/1', age: 290 }, { vlan: 1, mac: 'CC:01:00:00:00:01', port: 'Fa0/2', age: 295 }] },
        { id: 'R1', label: 'Router R1', type: 'ROUTER', x: 380, y: 160, eth0: { ip: '192.168.1.1', mac: 'CC:01:00:00:00:01' }, eth1: { ip: '10.0.0.1', mac: 'CC:01:00:00:00:02' }, routes: [
          { type: 'C', dest: '192.168.1.0/24', nextHop: 'Direct', iface: 'eth0', metric: 0 },
          { type: 'C', dest: '10.0.0.0/30', nextHop: 'Direct', iface: 'eth1', metric: 0 },
          { type: 'O', dest: '192.168.2.0/24', nextHop: '10.0.0.2', iface: 'eth1', metric: 10 }
        ]},
        { id: 'R2', label: 'Router R2', type: 'ROUTER', x: 530, y: 160, eth0: { ip: '10.0.0.2', mac: 'CC:02:00:00:00:01' }, eth1: { ip: '192.168.2.1', mac: 'CC:02:00:00:00:02' }, routes: [
          { type: 'C', dest: '10.0.0.0/30', nextHop: 'Direct', iface: 'eth0', metric: 0 },
          { type: 'C', dest: '192.168.2.0/24', nextHop: 'Direct', iface: 'eth1', metric: 0 },
          { type: 'O', dest: '192.168.1.0/24', nextHop: '10.0.0.1', iface: 'eth0', metric: 10 }
        ]},
        { id: 'SW2', label: 'Switch 2', type: 'SWITCH', x: 670, y: 160, macTable: [{ vlan: 1, mac: 'CC:02:00:00:00:02', port: 'Fa0/1', age: 298 }, { vlan: 1, mac: 'BB:02:22:22:22:22', port: 'Fa0/2', age: 285 }] },
        { id: 'PC2', label: 'PC2', type: 'PC', x: 800, y: 160, ip: '192.168.2.20', mask: '255.255.255.0', gw: '192.168.2.1', mac: 'BB:02:22:22:22:22', arp: { '192.168.2.1': 'CC:02:00:00:00:02' } }
      ];

      this.links = [
        { id: 'L1', from: 'PC1', to: 'SW1', speed: '100M', cost: 1, severed: false },
        { id: 'L2', from: 'SW1', to: 'R1', speed: '1G', cost: 1, severed: false },
        { id: 'L3', from: 'R1', to: 'R2', speed: '10M', cost: 10, severed: false },
        { id: 'L4', from: 'R2', to: 'SW2', speed: '1G', cost: 1, severed: false },
        { id: 'L5', from: 'SW2', to: 'PC2', speed: '100M', cost: 1, severed: false }
      ];

      this.packets = [];
    }

    loadStarLAN() {
      this.nodes = [
        { id: 'SW1', label: 'Core Switch', type: 'SWITCH', x: 440, y: 220, macTable: [] },
        { id: 'PC1', label: 'Finance PC', type: 'PC', x: 200, y: 100, ip: '192.168.1.10', mask: '255.255.255.0', gw: '192.168.1.1', mac: 'AA:11:00:00:00:01', arp: {} },
        { id: 'PC2', label: 'Sales PC', type: 'PC', x: 680, y: 100, ip: '192.168.1.20', mask: '255.255.255.0', gw: '192.168.1.1', mac: 'AA:22:00:00:00:02', arp: {} },
        { id: 'PC3', label: 'Dev PC', type: 'PC', x: 200, y: 340, ip: '192.168.1.30', mask: '255.255.255.0', gw: '192.168.1.1', mac: 'AA:33:00:00:00:03', arp: {} },
        { id: 'PC4', label: 'HR PC', type: 'PC', x: 680, y: 340, ip: '192.168.1.40', mask: '255.255.255.0', gw: '192.168.1.1', mac: 'AA:44:00:00:00:04', arp: {} }
      ];

      this.links = [
        { id: 'L1', from: 'PC1', to: 'SW1', speed: '1G', cost: 1, severed: false },
        { id: 'L2', from: 'PC2', to: 'SW1', speed: '1G', cost: 1, severed: false },
        { id: 'L3', from: 'PC3', to: 'SW1', speed: '1G', cost: 1, severed: false },
        { id: 'L4', from: 'PC4', to: 'SW1', speed: '1G', cost: 1, severed: false }
      ];
      this.packets = [];
    }

    loadMeshOSPF() {
      this.nodes = [
        { id: 'R1', label: 'Router A', type: 'ROUTER', x: 240, y: 120, eth0: { ip: '10.1.1.1', mac: 'RA:01' }, routes: [] },
        { id: 'R2', label: 'Router B', type: 'ROUTER', x: 640, y: 120, eth0: { ip: '10.1.1.2', mac: 'RB:01' }, routes: [] },
        { id: 'R3', label: 'Router C', type: 'ROUTER', x: 240, y: 320, eth0: { ip: '10.2.2.1', mac: 'RC:01' }, routes: [] },
        { id: 'R4', label: 'Router D', type: 'ROUTER', x: 640, y: 320, eth0: { ip: '10.2.2.2', mac: 'RD:01' }, routes: [] }
      ];

      this.links = [
        { id: 'L1', from: 'R1', to: 'R2', speed: '10M', cost: 10, severed: false },
        { id: 'L2', from: 'R1', to: 'R3', speed: '1G', cost: 1, severed: false },
        { id: 'L3', from: 'R3', to: 'R4', speed: '1G', cost: 1, severed: false },
        { id: 'L4', from: 'R2', to: 'R4', speed: '100M', cost: 2, severed: false },
        { id: 'L5', from: 'R1', to: 'R4', speed: '10M', cost: 15, severed: false }
      ];
      this.packets = [];
    }

    // Trigger a Ping Packet from Source to Target
    triggerPing(srcId = 'PC1', dstIp = '192.168.2.20') {
      const srcNode = this.nodes.find(n => n.id === srcId);
      if (!srcNode) return { success: false, reason: 'Source node not found' };

      sound.playPacketChirp();

      // Dynamic Dijkstra graph search for shortest active path
      const path = this.findPathTo(srcId, dstIp);
      if (!path || path.length < 2) {
        sound.playAlertTone();
        return { success: false, reason: 'Destination Host Unreachable (No Route or Link Cut)' };
      }

      const speedMultiplier = this.simSpeed || 1.0;
      const pkt = {
        id: this.nextPacketId++,
        type: 'ICMP_ECHO_REQ',
        protocol: 'ICMP Echo',
        srcNodeId: srcId,
        dstIp,
        srcIp: srcNode.ip || (srcNode.eth0 ? srcNode.eth0.ip : '192.168.1.10'),
        ttl: 64,
        path, // Array of node IDs: ['PC1', 'SW1', 'R1', 'R2', 'SW2', 'PC2']
        currentHopIndex: 0,
        progress: 0.0,
        speed: 0.02 * speedMultiplier,
        info: `Echo Request (id=${this.nextPacketId}, seq=1)`
      };

      this.packets.push(pkt);
      return { success: true, pkt };
    }

    findPathTo(srcId, dstIp) {
      // 1. Resolve destination node by IP or ID
      let dstNode = this.nodes.find(n => n.ip === dstIp || (n.eth0 && n.eth0.ip === dstIp));
      if (!dstNode) {
        dstNode = this.nodes.find(n => n.id === dstIp);
      }
      if (!dstNode) return null;
      const dstId = dstNode.id;
      if (srcId === dstId) return [srcId];

      // 2. Build graph adjacency list from active (non-severed) links
      const adj = {};
      this.nodes.forEach(n => { adj[n.id] = []; });

      this.links.forEach(l => {
        if (!l.severed) {
          const cost = (l.speed === '1G') ? 1 : ((l.speed === '100M') ? 10 : 100);
          if (adj[l.from]) adj[l.from].push({ to: l.to, cost });
          if (adj[l.to]) adj[l.to].push({ to: l.from, cost });
        }
      });

      // 3. Dijkstra Shortest Path Search
      const dist = {};
      const prev = {};
      const unvisited = new Set(this.nodes.map(n => n.id));

      this.nodes.forEach(n => { dist[n.id] = Infinity; });
      dist[srcId] = 0;

      while (unvisited.size > 0) {
        let minNode = null;
        let minDist = Infinity;
        for (const u of unvisited) {
          if (dist[u] < minDist) {
            minDist = dist[u];
            minNode = u;
          }
        }
        if (minNode === null || minDist === Infinity) break;
        if (minNode === dstId) break;

        unvisited.delete(minNode);

        (adj[minNode] || []).forEach(edge => {
          if (unvisited.has(edge.to)) {
            const alt = dist[minNode] + edge.cost;
            if (alt < dist[edge.to]) {
              dist[edge.to] = alt;
              prev[edge.to] = minNode;
            }
          }
        });
      }

      if (dist[dstId] === Infinity) return null;

      const path = [];
      let curr = dstId;
      while (curr) {
        path.unshift(curr);
        curr = prev[curr];
      }
      return path.length > 1 ? path : null;
    }

    // Step packet simulation forward with round-trip Echo Reply
    updatePackets(onPacketHopCallback, onPacketArrivalCallback) {
      const speedMultiplier = this.simSpeed || 1.0;
      for (let i = this.packets.length - 1; i >= 0; i--) {
        const pkt = this.packets[i];
        pkt.progress += (pkt.speed || 0.02) * speedMultiplier;

        if (pkt.progress >= 1.0) {
          pkt.progress = 0.0;
          pkt.currentHopIndex++;

          const currentNodeId = pkt.path[pkt.currentHopIndex];
          const currentNode = this.nodes.find(n => n.id === currentNodeId);

          if (currentNode && currentNode.type === 'ROUTER') {
            pkt.ttl -= 1;
            sound.playPacketChirp();
            if (pkt.ttl <= 0) {
              sound.playAlertTone();
              this.packets.splice(i, 1);
              if (onPacketHopCallback) onPacketHopCallback(pkt, 'TTL_EXPIRED', currentNode);
              continue;
            }
          }

          if (pkt.currentHopIndex >= pkt.path.length - 1) {
            // Arrived at destination!
            this.packets.splice(i, 1);
            if (onPacketArrivalCallback) onPacketArrivalCallback(pkt, currentNode);

            if (pkt.type === 'ICMP_ECHO_REQ') {
              // Send ICMP Echo Reply back along reverse path
              sound.playPacketChirp();
              const replyPath = pkt.path.slice().reverse();
              const replyPkt = {
                id: this.nextPacketId++,
                type: 'ICMP_ECHO_REPLY',
                protocol: 'ICMP Reply',
                srcNodeId: currentNodeId,
                dstIp: pkt.srcIp,
                srcIp: pkt.dstIp,
                ttl: 64,
                path: replyPath,
                currentHopIndex: 0,
                progress: 0.0,
                speed: 0.02 * speedMultiplier,
                info: `Echo Reply (id=${pkt.id}, seq=1, time<1ms)`
              };
              this.packets.push(replyPkt);
            } else if (pkt.type === 'ICMP_ECHO_REPLY') {
              sound.playPingSuccess();
            }
          } else {
            if (onPacketHopCallback) onPacketHopCallback(pkt, 'HOP', currentNode);
          }
        }
      }
    }
  }

  // 5. UNIFIED DYNAMIC CANVAS RENDERER (High-Fidelity 2.5D Skeuomorphic Hardware)
  // ════════════════════════════════════════════════════════════════════════════
  class UnifiedCanvasRenderer {
    constructor(canvas, netEngine, subnetEngine, osiEngine) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.netEngine = netEngine;
      this.subnetEngine = subnetEngine;
      this.osiEngine = osiEngine;

      this.activeModule = 'subnetting'; // 'subnetting', 'osi', 'topology'
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.isPanning = false;
      this.panStartX = 0;
      this.panStartY = 0;
      this.showGrid = true;
      this.spacePressed = false;

      // Interaction
      this.draggedNode = null;
      this.hoveredNode = null;
      this.hoveredLink = null;
      this.mouseCanvasX = 0;
      this.mouseCanvasY = 0;

      // Animation parameters
      this.animTime = 0;
      this.fanAngle = 0;
      this.activeCallout = 'Topology Ready • Send Ping (PC1 → PC2) or Drag Nodes to reconfigure.';

      this.cachedBitBoxes = [];
      this.initEvents();
    }

    initEvents() {
      // Mouse Move with canvas resolution scaling
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const clientX = (e.clientX - rect.left) * scaleX;
        const clientY = (e.clientY - rect.top) * scaleY;
        const mx = (clientX - this.panX) / this.zoom;
        const my = (clientY - this.panY) / this.zoom;
        this.mouseCanvasX = clientX;
        this.mouseCanvasY = clientY;

        if (this.isPanning) {
          this.panX = clientX - this.panStartX;
          this.panY = clientY - this.panStartY;
          this.canvas.style.cursor = 'grabbing';
          return;
        }

        if (this.activeModule === 'topology') {
          if (this.draggedNode) {
            this.draggedNode.x = Math.round(mx);
            this.draggedNode.y = Math.round(my);
            this.canvas.style.cursor = 'grabbing';
            return;
          }

          // Check node hover (radius 48px)
          const foundNode = this.netEngine.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 48);
          this.hoveredNode = foundNode || null;

          // Check link hover
          const foundLink = this.findLinkAt(mx, my);
          this.hoveredLink = foundLink || null;

          if (this.hoveredNode || this.hoveredLink) {
            this.canvas.style.cursor = 'pointer';
          } else if (this.spacePressed) {
            this.canvas.style.cursor = 'grab';
          } else {
            this.canvas.style.cursor = 'grab';
          }
        } else {
          this.canvas.style.cursor = 'default';
        }
      });

      // Mouse Down
      this.canvas.addEventListener('mousedown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const clientX = (e.clientX - rect.left) * scaleX;
        const clientY = (e.clientY - rect.top) * scaleY;
        const mx = (clientX - this.panX) / this.zoom;
        const my = (clientY - this.panY) / this.zoom;

        if (this.activeModule === 'topology') {
          // If cut tool active, sever/restore clicked link
          if (this.netEngine.cutToolActive) {
            const hitLink = this.findLinkAt(mx, my);
            if (hitLink) {
              hitLink.severed = !hitLink.severed;
              sound.playCutSnap();
              this.activeCallout = hitLink.severed ?
                `⚠️ Cable Severed between ${hitLink.from} and ${hitLink.to} (Dynamic Routing recalculating...)` :
                `✅ Cable Restored between ${hitLink.from} and ${hitLink.to} (Convergence in progress)`;
              syncUI();
              return;
            }
          }

          // Check if clicked a node
          const hitNode = this.netEngine.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 48);
          if (hitNode && !this.spacePressed) {
            this.draggedNode = hitNode;
            this.netEngine.selectedNodeId = hitNode.id;
            sound.playClick();
            const nodeSel = document.getElementById('table-node-select');
            if (nodeSel) nodeSel.value = hitNode.id;
            updateRoutingAndMacTables();
            this.activeCallout = `Selected ${hitNode.id} (${hitNode.type}): IP ${hitNode.ip}, MAC ${hitNode.mac}`;
            return;
          }
        }

        // Otherwise initiate pan
        this.isPanning = true;
        this.panStartX = clientX - this.panX;
        this.panStartY = clientY - this.panY;
        this.canvas.style.cursor = 'grabbing';
      });

      // Mouse Up & Leave
      window.addEventListener('mouseup', () => {
        if (this.isPanning) {
          this.isPanning = false;
          this.canvas.style.cursor = 'grab';
        }
        if (this.draggedNode) {
          this.draggedNode = null;
          this.canvas.style.cursor = 'grab';
        }
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoveredNode = null;
        this.hoveredLink = null;
      });

      // Mouse Wheel Zoom centered under mouse
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        this.setZoomAt(this.zoom * factor, mouseX, mouseY);
      }, { passive: false });

      // Click on Subnetting bits in Module 1
      this.canvas.addEventListener('click', (e) => {
        if (this.activeModule !== 'subnetting') return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const clientX = (e.clientX - rect.left) * scaleX;
        const clientY = (e.clientY - rect.top) * scaleY;
        const mx = (clientX - this.panX) / this.zoom;
        const my = (clientY - this.panY) / this.zoom;

        if (this.cachedBitBoxes) {
          const hit = this.cachedBitBoxes.find(b => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h);
          if (hit) {
            sound.playClick();
            this.subnetEngine.toggleBit(hit.bitIndex);
            const ipIn = document.getElementById('ip-input');
            if (ipIn) ipIn.value = this.subnetEngine.ipStr;
            syncUI();
          }
        }
      });
    }

    // ── Zoom & Viewport Facilities ─────────────────────────────────────────
    zoomIn() {
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      this.setZoomAt(this.zoom * 1.25, cx, cy);
    }

    zoomOut() {
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      this.setZoomAt(this.zoom * 0.8, cx, cy);
    }

    resetZoom() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.updateZoomHUD();
      this.render();
    }

    fitView() {
      if (this.activeModule === 'topology' && this.netEngine.nodes.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.netEngine.nodes.forEach(n => {
          minX = Math.min(minX, n.x - 70);
          maxX = Math.max(maxX, n.x + 70);
          minY = Math.min(minY, n.y - 60);
          maxY = Math.max(maxY, n.y + 60);
        });
        const w = Math.max(100, maxX - minX);
        const h = Math.max(100, maxY - minY);
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const fitZoom = Math.max(0.4, Math.min(2.0, Math.min((cw - 100) / w, (ch - 100) / h)));
        this.zoom = fitZoom;
        this.panX = (cw - w * fitZoom) / 2 - minX * fitZoom;
        this.panY = (ch - h * fitZoom) / 2 - minY * fitZoom;
      } else {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
      }
      this.updateZoomHUD();
      this.render();
    }

    toggleGrid() {
      this.showGrid = !this.showGrid;
      this.render();
    }

    updateZoomHUD() {
      const hud = document.getElementById('hud-zoom-level');
      if (hud) hud.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    setZoomAt(targetZoom, screenX, screenY) {
      const newZoom = Math.max(0.4, Math.min(3.0, targetZoom));
      this.panX = screenX - (screenX - this.panX) * (newZoom / this.zoom);
      this.panY = screenY - (screenY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;
      this.updateZoomHUD();
      this.render();
    }

    findLinkAt(x, y) {
      return this.netEngine.links.find(link => {
        const fromNode = this.netEngine.nodes.find(n => n.id === link.from);
        const toNode = this.netEngine.nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) return false;

        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return false;

        const t = Math.max(0, Math.min(1, ((x - fromNode.x) * dx + (y - fromNode.y) * dy) / lenSq));
        const projX = fromNode.x + t * dx;
        const projY = fromNode.y + t * dy;
        return Math.hypot(x - projX, y - projY) < 16;
      });
    }

    // ── Main Render Pass ──────────────────────────────────────────────────
    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      this.animTime = performance.now();
      this.fanAngle = (this.animTime * 0.007) % (Math.PI * 2);

      // Deep Space Engineering Background
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, w, h);

      // Subtle Dot-Matrix Grid
      if (this.showGrid) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        const step = 32 * this.zoom;
        const offsetX = (this.panX % step + step) % step;
        const offsetY = (this.panY % step + step) % step;
        for (let x = offsetX; x < w; x += step) {
          for (let y = offsetY; y < h; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      if (this.activeModule === 'subnetting') {
        this.renderSubnettingCanvas(ctx, w, h);
      } else if (this.activeModule === 'osi') {
        this.renderOsiTowerCanvas(ctx, w, h);
      } else if (this.activeModule === 'topology') {
        this.renderTopologyCanvas(ctx, w, h);
      }

      ctx.restore();

      // Overlays (Non-scaled HUD elements)
      if (this.activeModule === 'topology') {
        this.drawPedagogicalCallout(ctx, w, h);
        if (this.hoveredNode) {
          this.drawNodeHoverTelemetry(ctx, this.hoveredNode);
        }
      }
    }

    renderSubnettingCanvas(ctx, w, h) {
      const calc = this.subnetEngine.calculate(this.subnetEngine.ipStr, this.subnetEngine.prefix);
      this.cachedBitBoxes = [];

      // Frame Box
      ctx.strokeStyle = '#162238';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#060d1c';
      ctx.roundRect(40, 25, 800, 465, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText('32-BIT BINARY IPV4 ADDRESS & CIDR PREFIX MASK MATRIX', 55, 50);

      // 32 Bit Boxes grouped into 4 octets
      const octetSpacing = 192;
      const boxW = 20;
      const boxH = 34;
      const startX = 60;
      const startY = 82;

      const ipInt = calc.ipInt;
      const p = calc.prefix;

      for (let o = 0; o < 4; o++) {
        const octetX = startX + o * octetSpacing;
        const octetVal = (ipInt >>> (24 - o * 8)) & 0xFF;

        // Octet Decimal Header
        ctx.fillStyle = '#0f1b33';
        ctx.roundRect(octetX, startY - 22, 168, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`Octet ${o + 1}: ${octetVal} (0x${octetVal.toString(16).toUpperCase().padStart(2, '0')})`, octetX + 10, startY - 9);

        for (let b = 0; b < 8; b++) {
          const bitIdx = o * 8 + b;
          const bitX = octetX + b * 21;
          const bitVal = (ipInt >>> (31 - bitIdx)) & 1;
          const isNetBit = bitIdx < p;

          // Color Scheme: Net bits (Blue/Cyan), Host bits (Emerald)
          ctx.fillStyle = isNetBit ? '#0f2445' : '#063829';
          ctx.strokeStyle = isNetBit ? '#2563eb' : '#059669';
          ctx.lineWidth = 1.2;
          ctx.roundRect(bitX, startY, boxW, boxH, 4);
          ctx.fill();
          ctx.stroke();

          // Bit Value
          ctx.fillStyle = isNetBit ? '#38bdf8' : '#34d399';
          ctx.font = 'bold 14px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(bitVal.toString(), bitX + boxW / 2, startY + 22);

          // Bit Index
          ctx.fillStyle = '#64748b';
          ctx.font = '8px JetBrains Mono';
          ctx.fillText((31 - bitIdx).toString(), bitX + boxW / 2, startY + 44);

          this.cachedBitBoxes.push({ x: bitX, y: startY, w: boxW, h: boxH, bitIndex: bitIdx });
        }
      }
      ctx.textAlign = 'left';

      // CIDR Split Marker line
      const splitOctet = Math.floor(p / 8);
      const splitBit = p % 8;
      const markerX = startX + splitOctet * octetSpacing + splitBit * 21 - 1;
      if (p > 0 && p < 32) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(markerX, startY - 24);
        ctx.lineTo(markerX, startY + boxH + 12);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`/${p} DIVIDER`, markerX - 30, startY + boxH + 26);
      }

      // Legend
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText('Legend: [ Blue = Network Bits (/p) ]  [ Green = Interactive Toggleable Host Bits ]', startX, startY + 84);

      // VLSM Memory Map Allocation Bar
      const vlsmY = startY + 116;
      ctx.fillStyle = '#0f1a30';
      ctx.roundRect(startX, vlsmY, 760, 26, 4);
      ctx.fill();
      ctx.strokeStyle = '#1e2d4d';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('VLSM ADDRESS SPACE UTILIZATION BAR (Parent Block Allocation):', startX, vlsmY - 8);

      const vlsmRes = this.subnetEngine.computeVLSM(this.subnetEngine.ipStr, this.subnetEngine.prefix, this.subnetEngine.vlsmRequirements);
      let curBarX = startX;
      const palette = ['#2563eb', '#10b981', '#f59e0b', '#c084fc', '#06b6d4'];

      vlsmRes.allocations.forEach((alloc, idx) => {
        const segW = Math.max(35, alloc.sizeRatio * 760);
        ctx.fillStyle = palette[idx % palette.length];
        ctx.globalAlpha = 0.45;
        ctx.fillRect(curBarX, vlsmY, segW, 26);
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = palette[idx % palette.length];
        ctx.strokeRect(curBarX, vlsmY, segW, 26);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`${alloc.name} (/${alloc.prefix})`, curBarX + 6, vlsmY + 17);

        curBarX += segW;
      });

      // Free space
      if (curBarX < startX + 760) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curBarX, vlsmY, startX + 760 - curBarX, 26);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText('Unallocated Host Pool', curBarX + 10, vlsmY + 17);
      }

      // Bitwise AND Diagnostic Card
      const diagY = vlsmY + 54;
      ctx.fillStyle = '#081226';
      ctx.strokeStyle = '#1d325c';
      ctx.roundRect(startX, diagY, 760, 160, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText('BITWISE AND COMPUTATION DEMONSTRATOR:', startX + 16, diagY + 24);

      ctx.fillStyle = '#cdd7ee';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`IP Address (A):   ${calc.ipStr.padEnd(16)} = ${calc.ipBin.match(/.{1,8}/g).join('.')}`, startX + 16, diagY + 52);
      ctx.fillText(`Subnet Mask (M):  ${calc.maskStr.padEnd(16)} = ${calc.maskBin.match(/.{1,8}/g).join('.')}`, startX + 16, diagY + 74);

      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(startX + 16, diagY + 86);
      ctx.lineTo(startX + 740, diagY + 86);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText(`Network ID (N):   ${calc.networkStr.padEnd(16)} = ${calc.netBin.match(/.{1,8}/g).join('.')}   (Bitwise A & M)`, startX + 16, diagY + 106);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`Broadcast (B):    ${calc.broadcastStr.padEnd(16)} = (Network ID | Wildcard Mask ~M)`, startX + 16, diagY + 128);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Usable Host IP Range: ${calc.firstHostStr} — ${calc.lastHostStr} (${calc.usableHosts.toLocaleString()} valid hosts)`, startX + 16, diagY + 148);
    }

    // ── Module 2 Canvas: High-End OSI 7-Layer Visual Pipeline ──────────────
    renderOsiTowerCanvas(ctx, w, h) {
      ctx.strokeStyle = '#162238';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#060d1c';
      ctx.roundRect(40, 25, 800, 465, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText('OSI 7-LAYER PROTOCOL ENCAPSULATION & DECAPSULATION PIPELINE', 55, 50);

      const layers = [
        { num: 7, name: 'Application', pdu: 'Data', color: '#38bdf8' },
        { num: 6, name: 'Presentation', pdu: 'Data', color: '#60a5fa' },
        { num: 5, name: 'Session', pdu: 'Data', color: '#818cf8' },
        { num: 4, name: 'Transport', pdu: 'Segment (TCP)', color: '#a78bfa' },
        { num: 3, name: 'Network', pdu: 'Packet (IPv4)', color: '#f43f5e' },
        { num: 2, name: 'Data Link', pdu: 'Frame (Ethernet II)', color: '#f59e0b' },
        { num: 1, name: 'Physical', pdu: 'Bits (Signals)', color: '#10b981' }
      ];

      // Sender Host (Workstation PC)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText('💻 TRANSMITTER HOST A (Encapsulation)', 80, 80);

      // Receiver Host (Server Rack)
      ctx.fillStyle = '#10b981';
      ctx.fillText('🖥️ RECEIVER SERVER B (Decapsulation)', 540, 80);

      const towerY = 96;
      const rowH = 38;

      layers.forEach((l, idx) => {
        const y = towerY + idx * (rowH + 6);
        const isActiveSender = (this.osiEngine.currentLayer === l.num && this.osiEngine.direction === 'DOWN');
        const isActiveReceiver = (this.osiEngine.currentLayer === l.num && this.osiEngine.direction === 'UP');

        // Sender Layer Block
        ctx.fillStyle = isActiveSender ? 'rgba(56, 189, 248, 0.28)' : '#0a1426';
        ctx.strokeStyle = isActiveSender ? '#38bdf8' : '#1c2844';
        ctx.lineWidth = isActiveSender ? 2 : 1;
        ctx.roundRect(80, y, 230, rowH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = l.color;
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`L${l.num} ${l.name}`, 92, y + 17);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`PDU: ${l.pdu}`, 92, y + 30);

        // Receiver Layer Block
        ctx.fillStyle = isActiveReceiver ? 'rgba(16, 185, 129, 0.28)' : '#0a1426';
        ctx.strokeStyle = isActiveReceiver ? '#10b981' : '#1c2844';
        ctx.lineWidth = isActiveReceiver ? 2 : 1;
        ctx.roundRect(540, y, 230, rowH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = l.color;
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`L${l.num} ${l.name}`, 552, y + 17);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`PDU: ${l.pdu}`, 552, y + 30);
      });

      // Physical Transmission Wire (Connecting L1 to L1)
      const wireY = towerY + 6 * (rowH + 6) + 19;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(310, wireY);
      ctx.lineTo(540, wireY);
      ctx.stroke();

      // Oscilloscopic Square Wave line coding across wire
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const waveStartX = 320;
      const waveEndX = 530;
      const waveY = wireY - 12;
      const t = (this.animTime * 0.005) % 1;
      for (let x = waveStartX; x < waveEndX; x += 16) {
        const bit = Math.floor((x - waveStartX) / 16 + t * 4) % 2;
        const yOff = bit ? -6 : 6;
        ctx.lineTo(x, waveY + yOff);
        ctx.lineTo(x + 16, waveY + yOff);
      }
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText('1000BASE-T Cat6 Medium (NRZ-I Line Coding)', 320, wireY - 24);

      // Central Header Clamping & PDU Capsule
      ctx.fillStyle = '#0c172d';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.roundRect(330, towerY + 30, 190, 170, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('ACTIVE PACKET FRAME PDU', 342, towerY + 50);

      // Header slices inside frame
      const headers = [
        { tag: '[ETH II] 14B MACs', col: '#f59e0b' },
        { tag: '[IPv4] 20B Header', col: '#f43f5e' },
        { tag: '[TCP] 20B Ports', col: '#a78bfa' },
        { tag: '[DATA] "GET /index.html"', col: '#38bdf8' },
        { tag: '[FCS] 4B CRC-32', col: '#10b981' }
      ];
      headers.forEach((hObj, idx) => {
        ctx.fillStyle = hObj.col;
        ctx.fillRect(342, towerY + 62 + idx * 21, 166, 17);
        ctx.fillStyle = '#020712';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(hObj.tag, 348, towerY + 74 + idx * 21);
      });
    }

    // ── Module 3 Canvas: High-Fidelity 2.5D Skeuomorphic Topology ───────────
    renderTopologyCanvas(ctx, w, h) {
      // 1. Draw Cables (Natural Catenary Curve with Molded RJ45 Boots)
      this.netEngine.links.forEach(link => {
        const fromNode = this.netEngine.nodes.find(n => n.id === link.from);
        const toNode = this.netEngine.nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) return;

        this.drawRealisticCable(ctx, link, fromNode, toNode);
      });

      // 2. Draw Flying Energy Packets with Glowing Trails & Protocol Badges
      this.drawRealisticPackets(ctx, this.netEngine.packets);

      // 3. Draw Nodes as High-End Realistic Hardware Units
      this.netEngine.nodes.forEach(node => {
        const isSelected = (node.id === this.netEngine.selectedNodeId);
        const isHovered = (this.hoveredNode && this.hoveredNode.id === node.id);

        if (node.type === 'PC') {
          this.drawRealisticPC(ctx, node, isSelected, isHovered);
        } else if (node.type === 'SWITCH') {
          this.drawRealisticSwitch(ctx, node, isSelected, isHovered);
        } else if (node.type === 'ROUTER') {
          this.drawRealisticRouter(ctx, node, isSelected, isHovered);
        }
      });
    }

    // ── Skeuomorphic PC Workstation ───────────────────────────────────────
    drawRealisticPC(ctx, node, isSelected, isHovered) {
      const x = node.x;
      const y = node.y;

      // Selection Halo
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(x, y, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 1. Monitor Screen
      const monX = x - 26;
      const monY = y - 28;
      const monW = 52;
      const monH = 34;

      // Monitor Bezel
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.roundRect(monX, monY, monW, monH, 4);
      ctx.fill();
      ctx.stroke();

      // Screen Display (Glowing Terminal)
      ctx.fillStyle = '#020f1e';
      ctx.fillRect(monX + 3, monY + 3, monW - 6, monH - 6);

      // Terminal Lines
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 7px JetBrains Mono';
      ctx.fillText(`root@${node.id.toLowerCase()}:~#`, monX + 6, monY + 12);
      ctx.fillStyle = '#34d399';
      ctx.font = '6px JetBrains Mono';
      ctx.fillText(`IP:${node.ip.split('.').slice(-2).join('.')}`, monX + 6, monY + 20);

      // Cursor blink
      if (Math.floor(this.animTime / 400) % 2 === 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(monX + 40, monY + 15, 3, 5);
      }

      // Stand Neck & Base
      ctx.fillStyle = '#475569';
      ctx.fillRect(x - 4, monY + monH, 8, 8);
      ctx.fillStyle = '#334155';
      ctx.roundRect(x - 14, monY + monH + 8, 28, 4, 2);
      ctx.fill();

      // 2. Desktop Tower Chassis (Right side)
      const towX = x + 28;
      const towY = y - 24;
      const towW = 16;
      const towH = 42;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.roundRect(towX, towY, towW, towH, 2);
      ctx.fill();
      ctx.stroke();

      // Power Button & Blue LED
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(towX + 8, towY + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Drive bay slits
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(towX + 3, towY + 15);
      ctx.lineTo(towX + 13, towY + 15);
      ctx.moveTo(towX + 3, towY + 20);
      ctx.lineTo(towX + 13, towY + 20);
      ctx.stroke();

      // Rear NIC Green Link LED
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(towX + 8, towY + 34, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Mini Keyboard & Optical Mouse
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(x - 22, y + 18, 30, 4, 1);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(x + 16, y + 20, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Device Tag Badge (Pill below)
      ctx.fillStyle = '#020712';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.roundRect(x - 42, y + 28, 84, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.id}: ${node.ip}`, x, y + 39);
      ctx.textAlign = 'left';
    }

    // ── Skeuomorphic 24-Port Managed Switch (1U Rack Unit) ─────────────────
    drawRealisticSwitch(ctx, node, isSelected, isHovered) {
      const x = node.x;
      const y = node.y;
      const swW = 104;
      const swH = 32;
      const swX = x - swW / 2;
      const swY = y - swH / 2;

      // Selection Glow
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(swX - 4, swY - 4, swW + 8, swH + 8, 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Metallic Faceplate Gradient
      const grad = ctx.createLinearGradient(swX, swY, swX, swY + swH);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#080e1a');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.roundRect(swX, swY, swW, swH, 3);
      ctx.fill();
      ctx.stroke();

      // Rack Ears with Screw Holes
      ctx.fillStyle = '#475569';
      ctx.fillRect(swX - 7, swY, 7, swH);
      ctx.fillRect(swX + swW, swY, 7, swH);
      ctx.fillStyle = '#020712';
      ctx.beginPath();
      ctx.arc(swX - 3.5, swY + 8, 1.8, 0, Math.PI * 2);
      ctx.arc(swX - 3.5, swY + swH - 8, 1.8, 0, Math.PI * 2);
      ctx.arc(swX + swW + 3.5, swY + 8, 1.8, 0, Math.PI * 2);
      ctx.arc(swX + swW + 3.5, swY + swH - 8, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Brand Silkscreen
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 6px JetBrains Mono';
      ctx.fillText('NHIT-SW24-G', swX + 6, swY + 9);

      // Status LEDs on left
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(swX + 8, swY + 18, 1.6, 0, Math.PI * 2); // PWR
      ctx.arc(swX + 8, swY + 25, 1.6, 0, Math.PI * 2); // STAT
      ctx.fill();

      // Console Port
      ctx.fillStyle = '#020612';
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(swX + 16, swY + 16, 8, 10);
      ctx.fillRect(swX + 16, swY + 16, 8, 10);

      // 16 RJ45 Jack Receptacles (2 Rows of 8)
      const portStartX = swX + 32;
      const isSwitchActive = this.netEngine.packets.some(p => p.path[p.currentHopIndex] === node.id);

      for (let r = 0; r < 2; r++) {
        for (let p = 0; p < 8; p++) {
          const px = portStartX + p * 8.4;
          const py = swY + 7 + r * 12;

          // Jack housing
          ctx.fillStyle = '#020712';
          ctx.fillRect(px, py, 6, 8);

          // Copper Pin Contacts inside
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(px + 1.5, py + 1.5, 3, 2);

          // Dynamic Link/Activity LED
          const isBlinking = isSwitchActive && (Math.floor(this.animTime / 120 + p) % 2 === 0);
          ctx.fillStyle = isBlinking ? '#f59e0b' : '#10b981';
          ctx.beginPath();
          ctx.arc(px + 3, py - 2.5, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Device Tag Badge (Pill below)
      ctx.fillStyle = '#020712';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.roundRect(x - 52, y + 22, 104, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.id}: ${node.mac}`, x, y + 33);
      ctx.textAlign = 'left';
    }

    // ── Skeuomorphic Core L3 Enterprise Router (2U Rack Unit) ──────────────
    drawRealisticRouter(ctx, node, isSelected, isHovered) {
      const x = node.x;
      const y = node.y;
      const rtW = 104;
      const rtH = 40;
      const rtX = x - rtW / 2;
      const rtY = y - rtH / 2;

      // Selection Glow
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(rtX - 4, rtY - 4, rtW + 8, rtH + 8, 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Deep Metallic Chassis Gradient
      const grad = ctx.createLinearGradient(rtX, rtY, rtX, rtY + rtH);
      grad.addColorStop(0, '#1e3a5f');
      grad.addColorStop(0.5, '#0d2238');
      grad.addColorStop(1, '#05111c');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.roundRect(rtX, rtY, rtW, rtH, 3);
      ctx.fill();
      ctx.stroke();

      // Rack Mount Ears
      ctx.fillStyle = '#475569';
      ctx.fillRect(rtX - 7, rtY, 7, rtH);
      ctx.fillRect(rtX + rtW, rtY, 7, rtH);
      ctx.fillStyle = '#020712';
      ctx.beginPath();
      ctx.arc(rtX - 3.5, rtY + 10, 1.8, 0, Math.PI * 2);
      ctx.arc(rtX - 3.5, rtY + rtH - 10, 1.8, 0, Math.PI * 2);
      ctx.arc(rtX + rtW + 3.5, rtY + 10, 1.8, 0, Math.PI * 2);
      ctx.arc(rtX + rtW + 3.5, rtY + rtH - 10, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Brand Silkscreen
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 6.5px JetBrains Mono';
      ctx.fillText('NHIT-R3800 CORE', rtX + 8, rtY + 10);

      // Status Cluster (PWR, SYS, ACT)
      const isRouterActive = this.netEngine.packets.some(p => p.path[p.currentHopIndex] === node.id);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(rtX + 8, rtY + 20, 1.6, 0, Math.PI * 2); // PWR
      ctx.arc(rtX + 8, rtY + 28, 1.6, 0, Math.PI * 2); // SYS
      ctx.fill();

      ctx.fillStyle = (isRouterActive && Math.floor(this.animTime / 100) % 2 === 0) ? '#f59e0b' : '#334155';
      ctx.beginPath();
      ctx.arc(rtX + 8, rtY + 34, 1.6, 0, Math.PI * 2); // ACT
      ctx.fill();

      // Modular WIC Expansion Bays (Center)
      ctx.fillStyle = '#091524';
      ctx.strokeStyle = '#1e3352';
      ctx.strokeRect(rtX + 20, rtY + 14, 28, 20);
      ctx.fillRect(rtX + 20, rtY + 14, 28, 20);
      ctx.fillStyle = '#64748b';
      ctx.font = '5.5px JetBrains Mono';
      ctx.fillText('WIC-1T', rtX + 23, rtY + 26);

      // Gigabit LAN Ports (GE0/0, GE0/1)
      ctx.fillStyle = '#020612';
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(rtX + 54, rtY + 18, 9, 12);
      ctx.fillRect(rtX + 54, rtY + 18, 9, 12);
      ctx.strokeRect(rtX + 66, rtY + 18, 9, 12);
      ctx.fillRect(rtX + 66, rtY + 18, 9, 12);

      // Circular Cooling Fan Exhaust with ROTATING Blades
      const fanCenterX = rtX + 88;
      const fanCenterY = rtY + 24;
      const fanRadius = 10;

      ctx.fillStyle = '#020712';
      ctx.beginPath();
      ctx.arc(fanCenterX, fanCenterY, fanRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Spinning 4 Blades
      ctx.save();
      ctx.translate(fanCenterX, fanCenterY);
      ctx.rotate(this.fanAngle);
      ctx.fillStyle = '#475569';
      for (let b = 0; b < 4; b++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-2, 1, 4, 7);
      }
      ctx.restore();

      // Fan Grille Wire
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.beginPath();
      ctx.arc(fanCenterX, fanCenterY, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Device Tag Badge (Pill below)
      ctx.fillStyle = '#020712';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.roundRect(x - 56, y + 26, 112, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.id}: ${node.ip}`, x, y + 37);
      ctx.textAlign = 'left';
    }

    // ── Realistic Catenary Cables with Molded RJ45 Boots ────────────────────
    drawRealisticCable(ctx, link, fromNode, toNode) {
      const x1 = fromNode.x;
      const y1 = fromNode.y;
      const x2 = toNode.x;
      const y2 = toNode.y;

      const midX = (x1 + x2) / 2;
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const sag = Math.min(22, dist * 0.08);
      const midY = (y1 + y2) / 2 + sag;

      // Color scheme
      let mainColor = '#1d4ed8'; // Cat6 Blue
      let highlightColor = '#38bdf8';
      if (link.speed === '100M') {
        mainColor = '#047857';
        highlightColor = '#10b981';
      } else if (link.speed === '10M') {
        mainColor = '#b45309';
        highlightColor = '#f59e0b';
      }

      if (link.severed) {
        // Severed Cable with Jagged Ends & Warning Sparks
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX - 20, midY, midX - 10, midY - 6);
        ctx.moveTo(midX + 10, midY - 6);
        ctx.quadraticCurveTo(midX + 20, midY, x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Spark explosion icon at cut point
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ SEVERED', midX, midY - 12);
        return;
      }

      // Cable Drop Shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 3);
      ctx.quadraticCurveTo(midX, midY + 4, x2, y2 + 3);
      ctx.stroke();

      // Main Outer Cable Stroke
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(midX, midY, x2, y2);
      ctx.stroke();

      // Top Highlight Spine
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x1, y1 - 0.5);
      ctx.quadraticCurveTo(midX, midY - 0.5, x2, y2 - 0.5);
      ctx.stroke();

      // RJ45 Molded Boots at endpoints
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x1, y1, 5, 0, Math.PI * 2);
      ctx.arc(x2, y2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Link Speed Badge in center
      ctx.fillStyle = '#030816';
      ctx.strokeStyle = '#1e293b';
      ctx.roundRect(midX - 22, midY - 8, 44, 16, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = highlightColor;
      ctx.font = 'bold 8.5px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(link.speed, midX, midY + 4);
      ctx.textAlign = 'left';
    }

    // ── Glowing Energy Packets with Live TTL & Protocol Badges ──────────────
    drawRealisticPackets(ctx, packets) {
      packets.forEach(pkt => {
        const fromId = pkt.path[pkt.currentHopIndex];
        const toId = pkt.path[pkt.currentHopIndex + 1];
        const fromNode = this.netEngine.nodes.find(n => n.id === fromId);
        const toNode = this.netEngine.nodes.find(n => n.id === toId);

        if (fromNode && toNode) {
          // Compute curve position
          const x1 = fromNode.x;
          const y1 = fromNode.y;
          const x2 = toNode.x;
          const y2 = toNode.y;
          const dist = Math.hypot(x2 - x1, y2 - y1);
          const sag = Math.min(22, dist * 0.08);
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2 + sag;

          const p = pkt.progress;
          // Quadratic bezier formula: (1-p)^2 P0 + 2(1-p)p P1 + p^2 P2
          const px = (1 - p) * (1 - p) * x1 + 2 * (1 - p) * p * midX + p * p * x2;
          const py = (1 - p) * (1 - p) * y1 + 2 * (1 - p) * p * midY + p * p * y2;

          // Glowing Photon Orb
          const radGrad = ctx.createRadialGradient(px, py, 1, px, py, 10);
          radGrad.addColorStop(0, '#fff');
          radGrad.addColorStop(0.4, '#f59e0b');
          radGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.fill();

          // Core Orb
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Floating Protocol Badge & TTL
          ctx.fillStyle = '#030816';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.roundRect(px - 34, py - 24, 68, 16, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 7.5px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(`${pkt.protocol} • TTL:${pkt.ttl}`, px, py - 13);
          ctx.textAlign = 'left';
        }
      });
    }

    // ── Floating Pedagogical Explanation Callout Balloon ───────────────────
    drawPedagogicalCallout(ctx, w, h) {
      const pad = 14;
      const calloutW = 420;
      const calloutH = 34;
      const x = pad;
      const y = h - calloutH - pad;

      ctx.fillStyle = 'rgba(4, 10, 24, 0.9)';
      ctx.strokeStyle = '#1e3358';
      ctx.lineWidth = 1;
      ctx.roundRect(x, y, calloutW, calloutH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText('📡 LAB TELEMETRY:', x + 10, y + 14);

      ctx.fillStyle = '#cdd7ee';
      ctx.font = '8.5px JetBrains Mono';
      const text = this.activeCallout.length > 58 ? this.activeCallout.slice(0, 55) + '...' : this.activeCallout;
      ctx.fillText(text, x + 10, y + 26);
    }

    // ── Node Hover Inspection Telemetry Card ──────────────────────────────
    drawNodeHoverTelemetry(ctx, node) {
      const cardW = 190;
      const cardH = 84;
      let cardX = this.mouseCanvasX + 16;
      let cardY = this.mouseCanvasY + 16;

      if (cardX + cardW > this.canvas.width - 10) cardX = this.mouseCanvasX - cardW - 16;
      if (cardY + cardH > this.canvas.height - 10) cardY = this.mouseCanvasY - cardH - 16;

      ctx.fillStyle = 'rgba(3, 9, 23, 0.94)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.roundRect(cardX, cardY, cardW, cardH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(`DEVICE: ${node.id} (${node.type})`, cardX + 10, cardY + 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8.5px JetBrains Mono';
      ctx.fillText(`IPv4: ${node.ip}/24`, cardX + 10, cardY + 34);
      ctx.fillText(`MAC:  ${node.mac}`, cardX + 10, cardY + 48);
      ctx.fillText(`GW:   ${node.gateway || '0.0.0.0'}`, cardX + 10, cardY + 62);
      ctx.fillText(`L2 CAM Entries: ${node.macTable ? node.macTable.length : 'N/A'}`, cardX + 10, cardY + 76);
    }
  }

  // 6. PROGRESSIVE TROUBLESHOOTING TICKETS & MASTER ASSESSMENT
  // ════════════════════════════════════════════════════════════════════════════
  const troubleshootingTickets = [
    {
      id: 'ticket1',
      title: 'Ticket #01: "Host A Cannot Ping Remote Server B"',
      topology: 'PC1 (192.168.1.10) ── SW1 ── R1 ── R2 ── SW2 ── PC2 (192.168.2.20)',
      symptom: 'PC1 can ping local gateway 192.168.1.1, but pinging remote host 192.168.2.20 fails with Destination Host Unreachable.',
      options: [
        'PC1 has an incorrect default gateway configured (e.g. 192.168.1.254)',
        'Switch SW1 MAC table has a duplex mismatch',
        'Router R1 lacks a route to subnet 192.168.2.0/24',
        'PC2 has an inverted Ethernet FCS CRC-32 checksum'
      ],
      answer: 2,
      fix: (net) => {
        const r1 = net.nodes.find(n => n.id === 'R1');
        if (r1) {
          r1.routes = [
            { type: 'C', dest: '192.168.1.0/24', nextHop: 'Direct', iface: 'eth0', metric: 0 },
            { type: 'C', dest: '10.0.0.0/30', nextHop: 'Direct', iface: 'eth1', metric: 0 },
            { type: 'O', dest: '192.168.2.0/24', nextHop: '10.0.0.2', iface: 'eth1', metric: 10 }
          ];
        }
      },
      audit: (net) => {
        const r1 = net.nodes.find(n => n.id === 'R1');
        return r1 && r1.routes.some(r => r.dest.includes('192.168.2.0'));
      }
    },
    {
      id: 'ticket2',
      title: 'Ticket #02: "Mismatched Subnet Mask Breaking Local ARP"',
      topology: 'PC1 (192.168.1.10/24) and PC2 (192.168.1.70/26) on same Switch SW1',
      symptom: 'PC1 pings PC2 successfully, but PC2 cannot ping PC1 back because PC2 believes 192.168.1.10 is on an external network.',
      options: [
        'PC2 has /26 subnet mask (0–63 block), isolating 192.168.1.70 from 192.168.1.10',
        'Switch port is in administrative shutdown',
        'ARP cache poisoning attack is flooding the broadcast domain',
        'Cat6 cable propagation delay exceeds standard MTU'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    },
    {
      id: 'ticket3',
      title: 'Ticket #03: "Asymmetric Routing Blackhole (Missing Return Path)"',
      topology: 'PC1 ── R1 ── R2 ── PC2',
      symptom: 'Packets from PC1 arrive at PC2, but echo replies vanish into a blackhole at Router R2.',
      options: [
        'Router R2 lacks a routing entry back to source subnet 192.168.1.0/24',
        'PC1 firewall dropped the SYN packet',
        'Ethernet preamble length mismatch on WAN serial link',
        'TCP sliding window size shrunk to zero'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    },
    {
      id: 'ticket4',
      title: 'Ticket #04: "RIPv2 Hop-Count Infinity (16 Hops) Route Poisoning"',
      topology: 'Ring Topology with 16 cascaded router hops',
      symptom: 'Destination subnet is flagged as 16 hops in RIP table and dropped as unreachable.',
      options: [
        'RIP maximum valid hop count is 15; 16 represents infinity / unreachable destination',
        'Link MTU size dropped below 576 bytes',
        'Split Horizon was disabled on the core interface',
        'BGP Autonomous System path loop detected'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    },
    {
      id: 'ticket5',
      title: 'Ticket #05: "Suboptimal OSPF Cost Routing onto Slow 10M Backup"',
      topology: 'R1 ── (1G Fiber) ── R2 and R1 ── (10M Backup) ── R2',
      symptom: 'High-speed traffic is routing over the 10 Mbps link causing severe congestion.',
      options: [
        'OSPF interface cost on the 1G link was manually misconfigured higher than 10M link',
        'Dijkstra SPF algorithm does not support redundant links',
        'Switch CAM table learned conflicting MAC addresses',
        'TTL expired during packet transmission'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    },
    {
      id: 'ticket6',
      title: 'Ticket #06: "Path MTU Blackhole (DF Bit Set & Packet Exceeds MTU)"',
      topology: 'Sender (1500B MTU) ── Router (1400B MTU) ── Receiver',
      symptom: 'Packets larger than 1400B are dropped silently with no ICMP fragmentation needed replies.',
      options: [
        'Packet size exceeds link MTU while IPv4 Don\'t Fragment (DF) bit is set to 1',
        'TCP 3-way handshake sequence number wrap-around',
        'VLAN tag added 4 bytes pushing frame over standard Ethernet size',
        'DNS query timeout'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    },
    {
      id: 'ticket7',
      title: 'Ticket #07: "Switch CAM Table Saturation & Broadcast Storm"',
      topology: 'Switch with looped redundant links without Spanning Tree (STP)',
      symptom: 'Switch CPU spikes to 100% and broadcast frames continuously circulate in an endless loop.',
      options: [
        'Absence of Spanning Tree Protocol (STP) causing Layer-2 broadcast loop',
        'Router default route set to 0.0.0.0/0',
        'Subnet mask wildcard set incorrectly',
        'ARP request missing hardware address'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    },
    {
      id: 'ticket8',
      title: 'Ticket #08: "Duplicate IP Address Conflict in Subnet Scope"',
      topology: 'LAN subnet 192.168.1.0/24 with static PC and DHCP pool',
      symptom: 'Two workstations randomly lose connectivity and log Windows IP Address Conflict alerts.',
      options: [
        'A static IP was assigned inside the active DHCP dynamic allocation pool',
        'Default gateway MAC address changed',
        'Switch port VLAN tag mismatch',
        'DNS server IP address unreachable'
      ],
      answer: 0,
      fix: (net) => {},
      audit: () => true
    }
  ];

  // 10 Certification Quiz Questions
  const quizQuestions = [
    {
      q: 'For the IPv4 network 172.16.45.130/26, what are the Network Address and Directed Broadcast Address?',
      options: [
        'Network: 172.16.45.128, Broadcast: 172.16.45.191',
        'Network: 172.16.45.0, Broadcast: 172.16.45.255',
        'Network: 172.16.45.128, Broadcast: 172.16.45.255',
        'Network: 172.16.45.64, Broadcast: 172.16.45.127'
      ],
      answer: 0,
      explanation: 'Prefix /26 implies block size $2^{32-26} = 2^6 = 64$. Subnets start at $0, 64, 128, 192$. Since $130 \\in [128, 191]$, Network ID is $172.16.45.128$ and Broadcast is $172.16.45.191$.'
    },
    {
      q: 'Which protocol data unit (PDU) is handled at Layer 4 (Transport Layer) of the OSI model?',
      options: ['Bits', 'Frame', 'Packet', 'Segment / Datagram'],
      answer: 3,
      explanation: 'Layer 4 (Transport) encapsulates data into Segments (TCP) or Datagrams (UDP), adding source and destination port numbers.'
    },
    {
      q: 'What happens to the Time-To-Live (TTL) field of an IPv4 packet when forwarded by a Layer-3 Router?',
      options: [
        'TTL is decremented by 1; if it hits 0, packet is dropped and ICMP Time Exceeded is sent',
        'TTL is incremented by 1 to track hop count',
        'TTL remains unchanged across routers',
        'TTL is reset to 255 at each router hop'
      ],
      answer: 0,
      explanation: 'Routers decrement TTL by 1 to prevent packets from endlessly looping. When $\\text{TTL} = 0$, the packet is discarded and an ICMP Time Exceeded message is returned.'
    },
    {
      q: 'How does an Ethernet switch populate its Content Addressable Memory (CAM) table?',
      options: [
        'By inspecting the Destination MAC address of incoming frames',
        'By inspecting the Source MAC address of incoming frames',
        'Via periodic OSPF Link State Advertisements',
        'Via manual static configuration only'
      ],
      answer: 1,
      explanation: 'A switch learns source MAC addresses by mapping the incoming frame\'s Source MAC address to the ingress port in its CAM table.'
    },
    {
      q: 'What is the maximum hop count allowed in the Routing Information Protocol (RIPv2) before a route is considered unreachable?',
      options: ['15 hops (16 = infinity)', '30 hops', '255 hops', 'Unlimited hops'],
      answer: 0,
      explanation: 'RIP uses hop count as its metric, with 15 as the maximum valid hops. A metric of 16 represents infinity / unreachable network.'
    },
    {
      q: 'If a packet payload of 1480 bytes must traverse a link with an MTU of 576 bytes (including 20B IP header), how many fragments are generated?',
      options: ['1 fragment', '2 fragments', '3 fragments', '4 fragments'],
      answer: 2,
      explanation: 'Max payload per fragment $= \\lfloor (576 - 20) / 8 \\rfloor \\times 8 = 552$ bytes. For $1480$ bytes: Frag 1 = 552B, Frag 2 = 552B, Frag 3 = 376B. Total $= 3$ fragments.'
    },
    {
      q: 'Which algorithm is executed by routers running OSPF to compute the shortest-path tree to all subnets?',
      options: ['Bellman-Ford algorithm', 'Dijkstra\'s Shortest Path First (SPF) algorithm', 'Floyd-Warshall algorithm', 'Kruskal\'s Minimum Spanning Tree algorithm'],
      answer: 1,
      explanation: 'OSPF routers build an identical Link State Database (LSDB) and run Dijkstra\'s SPF algorithm to compute the loop-free shortest path tree.'
    },
    {
      q: 'What is the function of the Address Resolution Protocol (ARP)?',
      options: [
        'Resolves an IP address (Layer 3) to a physical MAC address (Layer 2)',
        'Resolves a domain name to an IP address',
        'Assigns dynamic IP addresses to workstations',
        'Translates private IP addresses to public IPs'
      ],
      answer: 0,
      explanation: 'ARP resolves known Layer-3 IP addresses to physical Layer-2 MAC addresses on local broadcast networks.'
    },
    {
      q: 'Which flags are exchanged in the correct sequence during a standard TCP 3-way handshake connection establishment?',
      options: ['SYN -> SYN+ACK -> ACK', 'ACK -> SYN -> FIN', 'SYN -> ACK -> DATA', 'RST -> SYN -> ACK'],
      answer: 0,
      explanation: 'A client initiates TCP connection with SYN; the server responds with SYN+ACK; the client acknowledges with ACK.'
    },
    {
      q: 'Under RFC 3021, how many usable host IP addresses are provided by a /31 subnet mask (255.255.255.254)?',
      options: ['0 usable hosts', '2 usable hosts (point-to-point router links)', '4 usable hosts', '6 usable hosts'],
      answer: 1,
      explanation: 'RFC 3021 allows /31 subnets for point-to-point links, treating the two addresses as usable endpoints without dedicated network or broadcast addresses.'
    }
  ];

  // ════════════════════════════════════════════════════════════════════════════
  
  // 7. THREE.JS 3D MODEL WORKBENCH (42U Enterprise Server Rack & Gigabit Switch)
  // ════════════════════════════════════════════════════════════════════════════
  function initThree3DModel() {
    if (window.three3DInitialized) {
      if (window.three3DResize) window.three3DResize();
      return;
    }
    window.three3DInitialized = true;

    const canvas = document.getElementById('sim3d-canvas');
    const compAside = document.getElementById('sim3d-components');
    if (!canvas || !compAside) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020712);

    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(3.8, 3.2, 4.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);

    // Dynamic Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 15, 10);
    scene.add(dirLight);

    // Interior Rack LED Strip
    const rackInteriorLight = new THREE.PointLight(0x38bdf8, 2.5, 6.0);
    rackInteriorLight.position.set(0, 1.0, 0.5);
    scene.add(rackInteriorLight);

    const rackGroup = new THREE.Group();

    // 1. 42U Steel Server Cabinet Frame (19-inch standard)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x09101f, roughness: 0.35, metalness: 0.85 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1f2e4d, roughness: 0.25, metalness: 0.9 });

    // Upright corner pillars
    for (let px of [-1.15, 1.15]) {
      for (let pz of [-0.95, 0.95]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.8, 0.08), steelMat);
        pillar.position.set(px, 0.5, pz);
        rackGroup.add(pillar);
      }
    }

    // Top and Bottom Plates
    const plateGeo = new THREE.BoxGeometry(2.4, 0.1, 2.0);
    const topPlate = new THREE.Mesh(plateGeo, steelMat);
    topPlate.position.set(0, 2.9, 0);
    const btmPlate = new THREE.Mesh(plateGeo, steelMat);
    btmPlate.position.set(0, -1.9, 0);
    rackGroup.add(topPlate);
    rackGroup.add(btmPlate);

    // Side Panels
    const sideGeo = new THREE.BoxGeometry(0.04, 4.7, 1.8);
    const leftSide = new THREE.Mesh(sideGeo, steelMat);
    leftSide.position.set(-1.18, 0.5, 0);
    const rightSide = new THREE.Mesh(sideGeo, steelMat);
    rightSide.position.set(1.18, 0.5, 0);
    rackGroup.add(leftSide);
    rackGroup.add(rightSide);

    // Vertical 19-inch Mounting Rails with U-tick divisions
    for (let rx of [-0.95, 0.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.4, 0.04), railMat);
      rail.position.set(rx, 0.5, 0.85);
      rackGroup.add(rail);
    }

    // 2. Animated Tempered Glass Front Door
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-1.18, 0.5, 0.95);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b48,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.45
    });

    const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.6, 0.04), glassMat);
    glassMesh.position.set(1.15, 0, 0);
    doorPivot.add(glassMesh);

    // Door Handle
    const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 }));
    doorHandle.position.set(2.2, 0, 0.05);
    doorPivot.add(doorHandle);

    rackGroup.add(doorPivot);

    let isDoorOpen = false;
    let targetDoorAngle = 0;

    // 3. 24-Port Managed Enterprise Switch (1U) at y = 0.9
    const switchGroup = new THREE.Group();
    const switchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.24, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x111c30, roughness: 0.25, metalness: 0.8 })
    );
    switchGroup.add(switchMesh);

    // 24 RJ45 Jack Cutouts & Blinking LEDs
    const switchLeds = [];
    const ledMatGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    for (let r = 0; r < 2; r++) {
      for (let p = 0; p < 12; p++) {
        const px = -0.75 + p * 0.125;
        const py = 0.04 - r * 0.08;

        const portBox = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x020712 }));
        portBox.position.set(px, py, 0.71);
        switchGroup.add(portBox);

        const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.02), ledMatGreen.clone());
        led.position.set(px, py + 0.04, 0.71);
        switchGroup.add(led);
        switchLeds.push(led);
      }
    }
    switchGroup.position.set(0, 0.9, 0.15);
    rackGroup.add(switchGroup);

    // 4. Core L3 Enterprise Router (2U) at y = 0.3
    const routerGroup = new THREE.Group();
    const routerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.44, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x0b1a2f, roughness: 0.3, metalness: 0.75 })
    );
    routerGroup.add(routerMesh);

    // Router Cooling Fans (Dual Exhausts)
    const fanMeshes = [];
    for (let fx of [0.55, 0.78]) {
      const fanCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), new THREE.MeshBasicMaterial({ color: 0x020712 }));
      fanCyl.rotation.x = Math.PI / 2;
      fanCyl.position.set(fx, 0.06, 0.76);
      routerGroup.add(fanCyl);

      const fanBlade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: 0x475569 }));
      fanBlade.position.set(fx, 0.06, 0.77);
      routerGroup.add(fanBlade);
      fanMeshes.push(fanBlade);
    }
    routerGroup.position.set(0, 0.35, 0.1);
    rackGroup.add(routerGroup);

    // 5. Cat6 RJ45 Patch Panel (1U) at y = 1.45
    const patchGroup = new THREE.Group();
    const patchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.22, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x16243d, roughness: 0.3, metalness: 0.7 })
    );
    patchGroup.add(patchMesh);
    patchGroup.position.set(0, 1.45, 0.15);
    rackGroup.add(patchGroup);

    // 6. Curved Cat6 Patch Cords (TubeGeometry 3D Splines)
    const cableColors = [0x38bdf8, 0xf59e0b, 0x10b981, 0x818cf8, 0x38bdf8, 0xf59e0b];
    const patchCordsGroup = new THREE.Group();

    for (let c = 0; c < 6; c++) {
      const cx = -0.6 + c * 0.22;
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(cx, 1.45, 0.85),
        new THREE.Vector3(cx + 0.08, 1.25, 1.15),
        new THREE.Vector3(cx - 0.04, 1.05, 1.12),
        new THREE.Vector3(cx, 0.9, 0.86)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.016, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color: cableColors[c], roughness: 0.4, metalness: 0.3 });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      patchCordsGroup.add(tubeMesh);
    }
    rackGroup.add(patchCordsGroup);

    scene.add(rackGroup);

    // ── Raycasting & Component Inspector ──────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const hardwareRegistry = [
      {
        id: 'rack',
        name: '42U Data Center Server Cabinet',
        model: 'NHIT-RACK-42U Enterprise Standard',
        form: '42U (EIA-310-E 19-inch)',
        specs: 'Perforated front/rear doors with tinted tempered glass panel, dual vertical cable channels, 1200kg static load rating.',
        power: 'Dual 30A 208V PDU rails',
        temp: '21.5°C Ambient Intake',
        status: 'Optimal Ventilation • Grounded',
        camPos: { x: 3.8, y: 3.2, z: 4.5 },
        camTarget: { x: 0, y: 0.5, z: 0 }
      },
      {
        id: 'switch',
        name: '24-Port Gigabit L2/L3 Managed Switch',
        model: 'Catalyst 3850-24T Architecture',
        form: '1U Rackmount Unit',
        specs: '24x 10/100/1000BASE-T RJ45 with IEEE 802.3at PoE+, 4x 10G SFP+ uplinks, 92.4 Mpps forwarding throughput, 64 Gbps switching fabric.',
        power: '350W Redundant AC Power Supply',
        temp: '32.4°C Internal ASIC',
        status: '24/24 Ports Operational • CAM Learned',
        camPos: { x: 0.4, y: 1.1, z: 2.1 },
        camTarget: { x: 0, y: 0.9, z: 0.2 }
      },
      {
        id: 'router',
        name: 'Enterprise Dual-Power L3 Core Router',
        model: 'NHIT-R3800 Enterprise Edge',
        form: '2U Rackmount Chassis',
        specs: 'Modular Cisco-style architecture supporting OSPFv2, RIPv2, and BGP-4. Hardware-accelerated packet inspection with hardware NAT & firewall filtering.',
        power: 'Dual Hot-Swap 450W PSUs (Active/Standby)',
        temp: '38.1°C Core CPU',
        status: 'OSPF Adjacency Full • Routing Active',
        camPos: { x: 0.4, y: 0.45, z: 2.2 },
        camTarget: { x: 0, y: 0.35, z: 0.1 }
      },
      {
        id: 'patch',
        name: '48-Port Cat6 RJ45 Keystone Patch Panel',
        model: 'Panduit NetKey Cat6 Standard',
        form: '1U High-Density Panel',
        specs: 'EIA/TIA 568A/B universal color-coded 110-style punchdown blocks, gold-plated phosphor bronze contacts, rated for 250 MHz frequency.',
        power: 'Passive Termination',
        temp: '22.0°C Passive',
        status: 'Channel Compliance Verified (ISO 11801)',
        camPos: { x: 0.3, y: 1.7, z: 2.1 },
        camTarget: { x: 0, y: 1.45, z: 0.2 }
      },
      {
        id: 'cables',
        name: 'Molded Cat6 Snagless UTP Patch Cords',
        model: 'Belden Cat6 550 MHz CM-Rated',
        form: 'Color-Coded Modular Cords',
        specs: '24 AWG stranded copper with molded snagless strain-relief boots, 50-micron gold plated RJ45 connectors, Gigabit Ethernet certified.',
        power: 'Signal Carrier',
        temp: '23.1°C Ambient',
        status: 'Insertion Loss < 0.2 dB per connection',
        camPos: { x: 0.5, y: 1.25, z: 1.9 },
        camTarget: { x: 0, y: 1.15, z: 0.5 }
      }
    ];

    function showComponentTelemetry(hw) {
      compAside.innerHTML = `
        <div style="background:#070e20; border:1px solid #1f3563; border-radius:8px; padding:14px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span class="status-pill highlight" style="font-size:0.7rem;">${hw.form}</span>
            <span class="status-pill active" style="font-size:0.7rem;">${hw.status.split('•')[0]}</span>
          </div>
          <h4 style="color:#38bdf8; font-size:1.0rem; margin:6px 0;">${hw.name}</h4>
          <p style="color:#94a3b8; font-size:0.76rem; font-family:'JetBrains Mono', monospace; margin-bottom:10px;">Model: ${hw.model}</p>
          
          <div style="font-size:0.8rem; color:#cdd7ee; line-height:1.45; margin-bottom:10px;">
            ${hw.specs}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; border-top:1px solid #162646; padding-top:8px; font-size:0.75rem; font-family:'JetBrains Mono', monospace;">
            <div><span style="color:#64748b;">Power:</span><br><strong style="color:#38bdf8;">${hw.power}</strong></div>
            <div><span style="color:#64748b;">Thermal:</span><br><strong style="color:#10b981;">${hw.temp}</strong></div>
          </div>

          <div style="margin-top:12px; border-top:1px solid #162646; padding-top:10px;">
            <div style="font-size:0.72rem; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:4px;">T568B RJ45 Pinout Matrix:</div>
            <div style="font-size:0.7rem; color:#94a3b8; font-family:'JetBrains Mono', monospace; line-height:1.4;">
              1=Wht/Or (Tx+) &bull; 2=Orange (Tx-)<br>
              3=Wht/Grn (Rx+) &bull; 6=Green (Rx-)
            </div>
          </div>
        </div>
      `;
    }

    // Camera Focus Tweening
    function focusCameraOn(targetPos, lookAtPos) {
      if (window.anime) {
        anime({
          targets: camera.position,
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 900,
          easing: 'easeOutCubic'
        });
        anime({
          targets: controls.target,
          x: lookAtPos.x,
          y: lookAtPos.y,
          z: lookAtPos.z,
          duration: 900,
          easing: 'easeOutCubic'
        });
      } else {
        camera.position.set(targetPos.x, targetPos.y, targetPos.z);
        controls.target.set(lookAtPos.x, lookAtPos.y, lookAtPos.z);
      }
    }

    // Default Telemetry
    showComponentTelemetry(hardwareRegistry[0]);

    // Quick Nav Buttons
    document.querySelectorAll('.quick-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quick-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetKey = btn.getAttribute('data-target');
        const hw = hardwareRegistry.find(h => h.id === targetKey);
        if (hw) {
          focusCameraOn(hw.camPos, hw.camTarget);
          showComponentTelemetry(hw);
          sound.playClick();
        }
      });
    });

    // 🚪 Door Toggle Button
    const doorBtn = document.getElementById('btn-3d-door');
    if (doorBtn) {
      doorBtn.addEventListener('click', () => {
        isDoorOpen = !isDoorOpen;
        targetDoorAngle = isDoorOpen ? 1.85 : 0; // ~106 degrees open
        doorBtn.innerHTML = isDoorOpen ? '🚪 Toggle Door: Open' : '🚪 Toggle Door: Closed';
        doorBtn.classList.toggle('active', isDoorOpen);
        sound.playClick();
      });
    }

    // 💡 Lighting Toggle Button
    const lightBtn = document.getElementById('btn-3d-light');
    let lightModeIdx = 0;
    const lightModes = [
      { name: 'Cyber Blue', color: 0x38bdf8, intensity: 2.5 },
      { name: 'Cool White', color: 0xffffff, intensity: 3.0 },
      { name: 'Amber Alert', color: 0xf59e0b, intensity: 2.5 },
      { name: 'Stealth Off', color: 0x000000, intensity: 0.0 }
    ];
    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        lightModeIdx = (lightModeIdx + 1) % lightModes.length;
        const mode = lightModes[lightModeIdx];
        rackInteriorLight.color.setHex(mode.color);
        rackInteriorLight.intensity = mode.intensity;
        lightBtn.innerHTML = `💡 Light: ${mode.name}`;
        sound.playClick();
      });
    }

    // 🔍 Reset View Button
    const resetBtn = document.getElementById('btn-3d-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        const hw = hardwareRegistry[0];
        focusCameraOn(hw.camPos, hw.camTarget);
        showComponentTelemetry(hw);
        document.querySelectorAll('.quick-nav-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
        sound.playClick();
      });
    }

    // Canvas Click Raycaster
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(rackGroup.children, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        let foundKey = 'rack';

        let cur = hitObj;
        while (cur && cur !== rackGroup) {
          if (cur === switchGroup) { foundKey = 'switch'; break; }
          if (cur === routerGroup) { foundKey = 'router'; break; }
          if (cur === patchGroup) { foundKey = 'patch'; break; }
          if (cur === patchCordsGroup) { foundKey = 'cables'; break; }
          cur = cur.parent;
        }

        const hw = hardwareRegistry.find(h => h.id === foundKey);
        if (hw) {
          focusCameraOn(hw.camPos, hw.camTarget);
          showComponentTelemetry(hw);
          document.querySelectorAll('.quick-nav-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-target') === foundKey);
          });
          sound.playClick();
        }
      }
    });

    // Resize Handler
    window.three3DResize = function() {
      if (!canvas || canvas.clientWidth === 0) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', window.three3DResize);

    // Animation Loop
    function animate() {
      requestAnimationFrame(animate);

      // Smooth door swing interpolation
      doorPivot.rotation.y = THREE.MathUtils.lerp(doorPivot.rotation.y, targetDoorAngle, 0.08);

      // Spin Router Cooling Fans
      fanMeshes.forEach(fan => {
        fan.rotation.z += 0.18;
      });

      // Blink Switch LEDs randomly for realism
      if (Math.random() < 0.25) {
        const idx = Math.floor(Math.random() * switchLeds.length);
        switchLeds[idx].material.color.setHex(Math.random() > 0.5 ? 0xf59e0b : 0x10b981);
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  // 8. APPLICATION ORCHESTRATION & DOM BINDINGS
  // ════════════════════════════════════════════════════════════════════════════
  const subnetEngine = new IPv4SubnetEngine();
  const osiEngine = new OsiStackEngine();
  const netEngine = new NetworkTopologyEngine();

  let canvasRenderer = null;
  let activeTicketIdx = 0;
  let solvedTicketsCount = 0;
  let pcapPacketIndex = 1;
  let animTimer = null;

  function initApp() {
    const canvas = document.getElementById('net-canvas');
    if (canvas) {
      canvasRenderer = new UnifiedCanvasRenderer(canvas, netEngine, subnetEngine, osiEngine);
    }

    setupPlatformModeTabs();
    setupModuleSelector();
    setupRightDeckTabs();
    setupSubnettingInputs();
    setupCLITerminal();
    setupChallengeEngine();
    setupQuizAssessment();
    setupFullscreenControls();
    setupTheoryBlueprints();
    setupSpeedSlider();
    setupKeyboardShortcuts();

    // Start Animation Loop for Packet Propagation
    startAnimationLoop();

    syncUI();
  }

  function startAnimationLoop() {
    function loop() {
      if (netEngine.packets.length > 0) {
        netEngine.updatePackets(
          (pkt, evt, node) => {
            logWiresharkPacket(pkt, node);
          },
          (pkt, destNode) => {
            logWiresharkPacket(pkt, destNode, true);
          }
        );
      }
      if (canvasRenderer) canvasRenderer.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Platform Navigation Mode Tabs
  function setupPlatformModeTabs() {
    const tabs = document.querySelectorAll('#mode-tabs .pill');
    const wrappers = {
      'simulate': document.getElementById('sim-wrapper'),
      '3d-model': document.getElementById('model3d-wrapper'),
      'explore': document.getElementById('explore-wrapper'),
      'quiz': document.getElementById('quiz-wrapper')
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode');

        Object.keys(wrappers).forEach(k => {
          if (wrappers[k]) {
            if (k === mode) wrappers[k].classList.remove('hidden');
            else wrappers[k].classList.add('hidden');
          }
        });

        if (mode === '3d-model') {
          initThree3DModel();
          setTimeout(() => {
            if (window.three3DResize) window.three3DResize();
          }, 60);
        } else if (mode === 'explore') {
          if (window.renderMathInElement && window.katex) {
            window.renderMathInElement(document.getElementById('explore-wrapper'));
          }
        }
      });
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isEnabled = sound.toggle();
        soundBtn.textContent = isEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
      });
    }
  }

  // 3 Core Module Selector (Subnetting vs OSI vs Topology)
  function setupModuleSelector() {
    const pills = document.querySelectorAll('.module-pill-selector .mod-pill');
    const actionsBox = document.getElementById('module-actions-container');
    const titleEl = document.getElementById('canvas-main-title');
    const toolbox = document.getElementById('canvas-floating-toolbox');

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mod = pill.getAttribute('data-module');
        canvasRenderer.activeModule = mod;

        // Auto-switch Right Inspector Tab according to context
        if (mod === 'subnetting') {
          switchRightTab('subnet');
          titleEl.innerHTML = '&#128290; IPv4 Subnetting &amp; Bit-Level Calculator';
          toolbox.classList.add('hidden');
          renderModule1Actions(actionsBox);
        } else if (mod === 'osi') {
          switchRightTab('pdu');
          titleEl.innerHTML = '&#128230; OSI 7-Layer Protocol Encapsulation Tower';
          toolbox.classList.add('hidden');
          renderModule2Actions(actionsBox);
        } else if (mod === 'topology') {
          switchRightTab('routing');
          titleEl.innerHTML = '&#127760; Topology, L2 Switching &amp; L3 Dynamic Routing';
          toolbox.classList.remove('hidden');
          renderModule3Actions(actionsBox);
        }

        canvasRenderer.render();
      });
    });

    renderModule1Actions(actionsBox);
  }

  function renderModule1Actions(box) {
    box.innerHTML = `
      <button class="btn-net primary" id="btn-recalc">&#9881; Recalculate Subnet</button>
      <button class="btn-net secondary" id="btn-reset-bits">&#8635; Reset Bits</button>
    `;
    document.getElementById('btn-recalc')?.addEventListener('click', () => {
      sound.playClick();
      syncUI();
    });
    document.getElementById('btn-reset-bits')?.addEventListener('click', () => {
      subnetEngine.ipStr = '192.168.10.65';
      subnetEngine.prefix = 26;
      document.getElementById('ip-input').value = subnetEngine.ipStr;
      document.getElementById('cidr-slider').value = 26;
      sound.playClick();
      syncUI();
    });
  }

  function renderModule2Actions(box) {
    box.innerHTML = `
      <button class="btn-net primary" id="btn-send-packet">&#128230; Send Packet (HTTP GET)</button>
      <button class="btn-net secondary" id="btn-step-layer">&#9654; Step Layer</button>
      <button class="btn-net warning" id="btn-reverse-layer">&#8677; Reverse Decapsulate</button>
    `;
    document.getElementById('btn-send-packet')?.addEventListener('click', () => {
      osiEngine.currentLayer = 7;
      osiEngine.direction = 'DOWN';
      sound.playPacketChirp();
      animateOsiDescending();
    });
    document.getElementById('btn-step-layer')?.addEventListener('click', () => {
      if (osiEngine.direction === 'DOWN') {
        osiEngine.currentLayer = Math.max(1, osiEngine.currentLayer - 1);
        if (osiEngine.currentLayer === 1) osiEngine.direction = 'UP';
      } else {
        osiEngine.currentLayer = Math.min(7, osiEngine.currentLayer + 1);
      }
      sound.playClick();
      canvasRenderer.render();
      renderPDUInspector();
    });
    document.getElementById('btn-reverse-layer')?.addEventListener('click', () => {
      osiEngine.direction = 'UP';
      osiEngine.currentLayer = 1;
      sound.playPacketChirp();
      if (window.anime) {
        anime({
          targets: osiEngine,
          currentLayer: [1, 7],
          round: 1,
          easing: 'spring(1, 80, 10, 0)',
          duration: 1800,
          update: () => {
            canvasRenderer.render();
            renderPDUInspector();
          },
          complete: () => {
            sound.playPingSuccess();
          }
        });
      } else {
        osiEngine.currentLayer = 7;
        canvasRenderer.render();
        renderPDUInspector();
      }
    });
  }

  function renderModule3Actions(box) {
    box.innerHTML = `
      <button class="btn-net primary" id="btn-ping-sim">&#9654; Send Ping (PC1 &rarr; PC2)</button>
      <button class="btn-net secondary" id="btn-cut-link">&#9986; Sever / Restore Link</button>
      <select id="topo-preset-select" class="challenge-select" style="max-width:140px;">
        <option value="dual_router_wan">Dual-Router WAN</option>
        <option value="star_lan">Star LAN (4 PCs)</option>
        <option value="mesh_ospf">OSPF Mesh (4 Routers)</option>
      </select>
    `;
    document.getElementById('btn-ping-sim')?.addEventListener('click', () => {
      netEngine.triggerPing('PC1', '192.168.2.20');
    });
    document.getElementById('btn-cut-link')?.addEventListener('click', () => {
      netEngine.cutToolActive = !netEngine.cutToolActive;
      const btn = document.getElementById('btn-cut-link');
      btn.classList.toggle('warning', netEngine.cutToolActive);
      btn.innerHTML = netEngine.cutToolActive ? '&#9986; Click Link to Cut' : '&#9986; Sever / Restore Link';
    });
    document.getElementById('topo-preset-select')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'dual_router_wan') netEngine.loadDualRouterWAN();
      else if (val === 'star_lan') netEngine.loadStarLAN();
      else if (val === 'mesh_ospf') netEngine.loadMeshOSPF();
      sound.playClick();
      canvasRenderer.render();
      syncUI();
    });
  }

  function animateOsiDescending() {
    let current = 7;
    osiEngine.direction = 'DOWN';
    osiEngine.currentLayer = 7;
    sound.playPacketChirp();
    canvasRenderer.render();
    renderPDUInspector();

    const stepInterval = 320;
    const downTimer = setInterval(() => {
      current--;
      osiEngine.currentLayer = current;
      canvasRenderer.render();
      renderPDUInspector();

      if (current <= 1) {
        clearInterval(downTimer);
        sound.playPacketChirp();
        // Pause on wire transmission then ascend to receiver
        setTimeout(() => {
          osiEngine.direction = 'UP';
          let upLayer = 1;
          const upTimer = setInterval(() => {
            upLayer++;
            osiEngine.currentLayer = upLayer;
            canvasRenderer.render();
            renderPDUInspector();

            if (upLayer >= 7) {
              clearInterval(upTimer);
              sound.playPingSuccess();
            }
          }, stepInterval);
        }, 500);
      }
    }, stepInterval);
  }

  // Right Deck Tab Switching
  function setupRightDeckTabs() {
    document.querySelectorAll('.deck-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        switchRightTab(target);
      });
    });
  }

  function switchRightTab(target) {
    document.querySelectorAll('.deck-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === target);
    });
    document.getElementById('tab-subnet').classList.toggle('hidden', target !== 'subnet');
    document.getElementById('tab-pdu').classList.toggle('hidden', target !== 'pdu');
    document.getElementById('tab-routing').classList.toggle('hidden', target !== 'routing');
    document.getElementById('tab-cli').classList.toggle('hidden', target !== 'cli');
  }

  // Subnetting Inputs
  function setupSubnettingInputs() {
    const ipIn = document.getElementById('ip-input');
    const cidrSlider = document.getElementById('cidr-slider');
    const cidrDisp = document.getElementById('cidr-display');
    const classSel = document.getElementById('class-select');

    ipIn.addEventListener('input', () => {
      subnetEngine.ipStr = ipIn.value;
      syncUI();
    });

    cidrSlider.addEventListener('input', () => {
      subnetEngine.prefix = parseInt(cidrSlider.value, 10);
      cidrDisp.textContent = `/${subnetEngine.prefix}`;
      syncUI();
    });

    classSel.addEventListener('change', () => {
      if (classSel.value === 'A') { subnetEngine.prefix = 8; cidrSlider.value = 8; }
      else if (classSel.value === 'B') { subnetEngine.prefix = 16; cidrSlider.value = 16; }
      else if (classSel.value === 'C') { subnetEngine.prefix = 24; cidrSlider.value = 24; }
      cidrDisp.textContent = `/${subnetEngine.prefix}`;
      syncUI();
    });

    document.getElementById('btn-add-vlsm')?.addEventListener('click', () => {
      const name = prompt('Enter Department Name (e.g. Guest WiFi):', 'Guest WiFi');
      const hosts = parseInt(prompt('Enter Required Hosts count:', '14'), 10);
      if (name && !isNaN(hosts)) {
        subnetEngine.vlsmRequirements.push({ name, hostsNeeded: hosts });
        syncUI();
      }
    });
  }

  // CLI Terminal Emulator
  function setupCLITerminal() {
    const cliIn = document.getElementById('cli-input');
    const cliOut = document.getElementById('cli-output');
    const cliPrompt = document.getElementById('cli-prompt-str');

    cliIn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = cliIn.value.trim();
        cliIn.value = '';
        if (!cmd) return;

        cliOut.innerHTML += `\n${cliPrompt.textContent} ${cmd}\n`;
        handleCliCommand(cmd, cliOut);
        cliOut.scrollTop = cliOut.scrollHeight;
      }
    });
  }

  function handleCliCommand(cmdStr, cliOut) {
    const tokens = cmdStr.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const arg = tokens[1];

    if (cmd === 'help' || cmd === '?') {
      cliOut.innerHTML += `Available Commands:
  ping <ip>               - Test network layer reachability
  traceroute <ip>         - Trace L3 router hops to target
  ipconfig /all           - Display IP address, mask, gateway, and MAC
  show ip route           - Display IPv4 routing table
  show mac address-table  - Display L2 switch CAM table
  arp -a                  - Display ARP cache entries
  clear arp-cache         - Flush local ARP table
  cls / clear             - Clear terminal display`;
    } else if (cmd === 'ping') {
      const target = arg || '192.168.2.20';
      cliOut.innerHTML += `Pinging ${target} with 32 bytes of data:\n`;
      const res = netEngine.triggerPing('PC1', target);
      if (res && res.success) {
        setTimeout(() => {
          cliOut.innerHTML += `Reply from ${target}: bytes=32 time=0.8ms TTL=63\nReply from ${target}: bytes=32 time=0.9ms TTL=63\nReply from ${target}: bytes=32 time=0.7ms TTL=63\nReply from ${target}: bytes=32 time=0.8ms TTL=63\nPing statistics for ${target}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)\n`;
          cliOut.scrollTop = cliOut.scrollHeight;
        }, 800);
      } else {
        cliOut.innerHTML += `Request timed out.\nDestination Host Unreachable.\n`;
      }
    } else if (cmd === 'traceroute' || cmd === 'tracert') {
      const target = arg || '192.168.2.20';
      cliOut.innerHTML += `Tracing route to ${target} over a maximum of 30 hops:\n  1    <1 ms    <1 ms    <1 ms  192.168.1.1 (Router R1)\n  2    1 ms     1 ms     1 ms  10.0.0.2 (Router R2)\n  3    1 ms     1 ms     1 ms  192.168.2.20 (PC2)\nTrace complete.\n`;
    } else if (cmd === 'ipconfig') {
      cliOut.innerHTML += `Ethernet adapter Ethernet0:
   IPv4 Address. . . . . . . . . . . : 192.168.1.10
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   Physical Address (MAC). . . . . . : AA-01-11-11-11-11\n`;
    } else if (cmd === 'show' && tokens[1] === 'ip' && tokens[2] === 'route') {
      cliOut.innerHTML += `Codes: C - connected, S - static, R - RIP, O - OSPF
Gateway of last resort is not set

C    192.168.1.0/24 is directly connected, eth0
C    10.0.0.0/30 is directly connected, eth1
O    192.168.2.0/24 [110/10] via 10.0.0.2, eth1\n`;
    } else if (cmd === 'show' && tokens[1] === 'mac') {
      cliOut.innerHTML += `          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    aa01.1111.1111    DYNAMIC     Fa0/1
   1    cc01.0000.0001    DYNAMIC     Fa0/2
Total Mac Addresses for this criterion: 2\n`;
    } else if (cmd === 'arp') {
      cliOut.innerHTML += `Interface: 192.168.1.10 --- 0x2
  Internet Address      Physical Address      Type
  192.168.1.1           cc-01-00-00-00-01     dynamic\n`;
    } else if (cmd === 'clear' || cmd === 'cls') {
      cliOut.innerHTML = '';
    } else {
      cliOut.innerHTML += `Unknown command: "${cmdStr}". Type "help" for command list.\n`;
    }
  }

  // Wireshark Live Packet Logging
  function logWiresharkPacket(pkt, node, isFinal = false) {
    const tbody = document.getElementById('ws-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = `proto-${pkt.type.toLowerCase().includes('icmp') ? 'icmp' : (pkt.type.toLowerCase().includes('tcp') ? 'tcp' : 'arp')}`;
    const timeSec = (pcapPacketIndex * 0.12).toFixed(3);

    tr.innerHTML = `
      <td>${pcapPacketIndex++}</td>
      <td>${timeSec}</td>
      <td>${pkt.srcIp}</td>
      <td>${pkt.dstIp}</td>
      <td>${pkt.type.replace('_REQ', '').replace('_', ' ')}</td>
      <td>64</td>
      <td>${pkt.info} (Node: ${node?.label || 'Link'})</td>
    `;
    tbody.appendChild(tr);

    // Keep table scrolled to bottom
    const wrap = document.querySelector('.ws-table-wrap');
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  }

  // Progressive Troubleshooting Tickets
  function setupChallengeEngine() {
    const sel = document.getElementById('ticket-select');
    const descBox = document.getElementById('ticket-box');
    const btnLoad = document.getElementById('btn-load-ticket');
    const btnVerify = document.getElementById('btn-verify-ticket');

    function updateTicketView() {
      const ticket = troubleshootingTickets[activeTicketIdx];
      let optsHtml = '<div class="ticket-options">';
      ticket.options.forEach((opt, idx) => {
        optsHtml += `
          <label class="ticket-opt-lbl">
            <input type="radio" name="ticket_opt" value="${idx}">
            <span>[${String.fromCharCode(65 + idx)}] ${opt}</span>
          </label>
        `;
      });
      optsHtml += '</div>';

      descBox.innerHTML = `
        <div class="ticket-title">${ticket.title}</div>
        <div class="ticket-symptom"><strong>Topology:</strong> <code>${ticket.topology}</code></div>
        <div class="ticket-symptom"><strong>Symptom Report:</strong> ${ticket.symptom}</div>
        <strong style="color:var(--accent-amber); margin-top:4px;">Root Cause Diagnosis:</strong>
        ${optsHtml}
      `;
      document.getElementById('ticket-status-result').textContent = '';
    }

    sel.addEventListener('change', () => {
      activeTicketIdx = sel.selectedIndex;
      updateTicketView();
    });

    btnLoad.addEventListener('click', () => {
      const ticket = troubleshootingTickets[activeTicketIdx];
      ticket.fix(netEngine);
      sound.playClick();
      syncUI();
    });

    btnVerify.addEventListener('click', () => {
      const ticket = troubleshootingTickets[activeTicketIdx];
      const selected = document.querySelector('input[name="ticket_opt"]:checked');
      const resEl = document.getElementById('ticket-status-result');

      if (selected && parseInt(selected.value, 10) === ticket.answer) {
        ticket.fix(netEngine);
        resEl.className = 'ticket-status-result pass';
        resEl.innerHTML = '&#10004; TICKET RESOLVED! Correct Root Cause Identified (+100 XP)';
        solvedTicketsCount = Math.min(solvedTicketsCount + 1, 8);
        document.getElementById('challenge-badge').textContent = `Solved: ${solvedTicketsCount} / 8 Tickets`;
        sound.playSuccessChord();
      } else {
        resEl.className = 'ticket-status-result fail';
        resEl.innerHTML = '&#10006; INCORRECT DIAGNOSIS: Re-check show ip route and ARP cache.';
        sound.playAlertTone();
      }
    });

    updateTicketView();
  }

  // 10 Certification Quiz Questions
  function setupQuizAssessment() {
    const listEl = document.getElementById('quiz-questions-list');
    listEl.innerHTML = '';

    quizQuestions.forEach((q, qIdx) => {
      const card = document.createElement('div');
      card.className = 'quiz-q-card';

      const title = document.createElement('div');
      title.className = 'quiz-q-title';
      title.innerHTML = `Q${qIdx + 1}. ${q.q}`;
      card.appendChild(title);

      const optsDiv = document.createElement('div');
      optsDiv.className = 'quiz-options';

      q.options.forEach((opt, oIdx) => {
        const label = document.createElement('label');
        label.className = 'quiz-opt-label';
        label.innerHTML = `
          <input type="radio" name="net_q_${qIdx}" value="${oIdx}">
          <span>${opt}</span>
        `;
        optsDiv.appendChild(label);
      });
      card.appendChild(optsDiv);

      const expDiv = document.createElement('div');
      expDiv.className = 'quiz-explanation hidden';
      expDiv.id = `net_q_exp_${qIdx}`;
      expDiv.innerHTML = `<strong>Pedagogical Explanation:</strong> ${q.explanation}`;
      card.appendChild(expDiv);

      listEl.appendChild(card);
    });

    document.getElementById('btn-submit-quiz').addEventListener('click', () => {
      let score = 0;
      quizQuestions.forEach((q, qIdx) => {
        const selected = document.querySelector(`input[name="net_q_${qIdx}"]:checked`);
        const expEl = document.getElementById(`net_q_exp_${qIdx}`);
        expEl.classList.remove('hidden');

        if (selected && parseInt(selected.value, 10) === q.answer) {
          score++;
          expEl.style.borderLeftColor = '#10b981';
        } else {
          expEl.style.borderLeftColor = '#f43f5e';
        }
      });

      document.getElementById('quiz-score-display').textContent = `${score} / ${quizQuestions.length}`;
      if (score === quizQuestions.length) {
        document.getElementById('quiz-certificate-card').classList.remove('hidden');
        sound.playSuccessChord();
      } else {
        sound.playClick();
      }
    });

    document.getElementById('btn-reset-quiz').addEventListener('click', () => {
      document.querySelectorAll('#quiz-questions-list input[type="radio"]').forEach(r => r.checked = false);
      document.querySelectorAll('.quiz-explanation').forEach(e => e.classList.add('hidden'));
      document.getElementById('quiz-score-display').textContent = `0 / ${quizQuestions.length}`;
      document.getElementById('quiz-certificate-card').classList.add('hidden');
    });
  }

  // Fullscreen Facility
  function setupFullscreenControls() {
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

    document.getElementById('hud-zoom-in').addEventListener('click', () => canvasRenderer.zoomIn());
    document.getElementById('hud-zoom-out').addEventListener('click', () => canvasRenderer.zoomOut());
    document.getElementById('hud-zoom-1').addEventListener('click', () => canvasRenderer.resetZoom());
    document.getElementById('hud-zoom-fit').addEventListener('click', () => canvasRenderer.fitView());
    document.getElementById('hud-grid-toggle').addEventListener('click', () => canvasRenderer.toggleGrid());

    document.getElementById('btn-clear-pcap').addEventListener('click', () => {
      document.getElementById('ws-tbody').innerHTML = '';
      pcapPacketIndex = 1;
    });

    document.getElementById('btn-export-pcap').addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(netEngine.packets, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute('href', dataStr);
      dl.setAttribute('download', 'wireshark_capture.json');
      dl.click();
    });
  }

  function toggleFullscreen() {
    const card = document.getElementById('canvas-card-container');
    const isFull = card.classList.toggle('is-fullscreen');
    document.getElementById('btn-fullscreen').innerHTML = isFull ? '🗗 Exit Fullscreen' : '⛶ Fullscreen';

    const canvas = document.getElementById('net-canvas');
    if (isFull) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 50;
    } else {
      canvas.width = 880;
      canvas.height = 520;
    }
    if (canvasRenderer) canvasRenderer.render();
  }

  // PDU Byte-Field Inspector Rendering
  function renderPDUInspector() {
    const container = document.getElementById('pdu-inspector');
    if (!container) return;

    const h = osiEngine.headers;
    container.innerHTML = `
      <div class="pdu-layer-card">
        <div class="pdu-layer-head"><span class="sum-lbl">${h.dataLink.name} (Layer 2)</span><span class="pdu-badge">${h.dataLink.size}B Overhead</span></div>
        <div class="pdu-fields-grid">
          <div class="pdu-field-item"><span class="pdu-field-name">Dst MAC</span><span class="pdu-field-val">${h.dataLink.fields.dstMAC}</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Src MAC</span><span class="pdu-field-val">${h.dataLink.fields.srcMAC}</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">EtherType</span><span class="pdu-field-val">${h.dataLink.fields.etherType}</span></div>
        </div>
      </div>

      <div class="pdu-layer-card">
        <div class="pdu-layer-head"><span class="sum-lbl">${h.network.name} (Layer 3)</span><span class="pdu-badge">${h.network.size}B Overhead</span></div>
        <div class="pdu-fields-grid">
          <div class="pdu-field-item"><span class="pdu-field-name">Version / IHL</span><span class="pdu-field-val">IPv4 (IHL=5)</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Total Length</span><span class="pdu-field-val">${h.network.fields.totalLen} Bytes</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">TTL (Time to Live)</span><span class="pdu-field-val">${h.network.fields.ttl} Hops</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Src IP</span><span class="pdu-field-val">${h.network.fields.srcIP}</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Dst IP</span><span class="pdu-field-val">${h.network.fields.dstIP}</span></div>
        </div>
      </div>

      <div class="pdu-layer-card">
        <div class="pdu-layer-head"><span class="sum-lbl">${h.transport.name} (Layer 4)</span><span class="pdu-badge">${h.transport.size}B Overhead</span></div>
        <div class="pdu-fields-grid">
          <div class="pdu-field-item"><span class="pdu-field-name">Src Port</span><span class="pdu-field-val">${h.transport.fields.srcPort}</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Dst Port</span><span class="pdu-field-val">${h.transport.fields.dstPort}</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Flags</span><span class="pdu-field-val">${h.transport.fields.flags}</span></div>
          <div class="pdu-field-item"><span class="pdu-field-name">Seq Number</span><span class="pdu-field-val">${h.transport.fields.seqNum}</span></div>
        </div>
      </div>

      <div class="pdu-layer-card">
        <div class="pdu-layer-head"><span class="sum-lbl">${h.app.name} (Payload)</span><span class="pdu-badge">${h.app.size}B Data</span></div>
        <div class="pdu-fields-grid">
          <div class="pdu-field-item" style="grid-column: 1 / -1;"><span class="pdu-field-name">HTTP Command</span><span class="pdu-field-val">${h.app.fields.method} ${h.app.fields.uri} Host: ${h.app.fields.host}</span></div>
        </div>
      </div>
    `;

    // Recompute CRC-32
    document.getElementById('crc32-display').textContent = `0x${osiEngine.calcCRC32(h.app.fields.method)} (Valid &bull; 0 Bit Flips)`;
  }

  // Synchronize entire visual interface
  function syncUI() {
    const calc = subnetEngine.calculate(subnetEngine.ipStr, subnetEngine.prefix);

    // 1. Update Subnet Summary Fields
    document.getElementById('sum-net').textContent = calc.networkStr;
    document.getElementById('sum-bcast').textContent = calc.broadcastStr;
    document.getElementById('sum-first').textContent = calc.firstHostStr;
    document.getElementById('sum-last').textContent = calc.lastHostStr;
    document.getElementById('sum-mask').textContent = calc.maskStr;
    document.getElementById('sum-wild').textContent = calc.wildcardStr;
    document.getElementById('sum-hosts').textContent = calc.usableHosts.toLocaleString();
    document.getElementById('sum-block').textContent = `${calc.totalAddresses.toLocaleString()} Addrs`;

    // 2. Update VLSM Table
    const vlsmRes = subnetEngine.computeVLSM(subnetEngine.ipStr, subnetEngine.prefix, subnetEngine.vlsmRequirements);
    const tbody = document.getElementById('vlsm-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      vlsmRes.allocations.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${a.name}</strong></td>
          <td>${a.hostsNeeded} hosts</td>
          <td><span class="status-pill active">/${a.prefix}</span></td>
          <td>${a.networkStr}</td>
          <td>${a.firstHostStr} - ${a.lastHostStr}</td>
          <td>${a.broadcastStr}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 3. Update Status Badges
    document.getElementById('badge-prefix').textContent = `/${calc.prefix}`;
    document.getElementById('badge-pdu').textContent = `PDU: ${canvasRenderer.activeModule === 'subnetting' ? 'Subnet' : (canvasRenderer.activeModule === 'osi' ? 'Frame' : 'Packet')}`;

    // 4. Update Tables for Selected Node
    updateRoutingAndMacTables();

    // 5. Render Canvas & PDU Inspector
    renderPDUInspector();
    if (canvasRenderer) canvasRenderer.render();
  }

  function updateRoutingAndMacTables() {
    const sel = document.getElementById('table-node-select');
    const nodeId = sel ? sel.value : 'R1';
    const node = netEngine.nodes.find(n => n.id === nodeId);

    const macBody = document.getElementById('mac-table-body');
    const routeBody = document.getElementById('routing-table-body');

    if (macBody) {
      macBody.innerHTML = '';
      if (node && node.macTable && node.macTable.length > 0) {
        node.macTable.forEach(entry => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${entry.vlan}</td><td>${entry.mac}</td><td>DYNAMIC</td><td>${entry.port}</td><td>${entry.age}</td>`;
          macBody.appendChild(tr);
        });
        document.getElementById('mac-count').textContent = `${node.macTable.length} Entries`;
      } else {
        macBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">(No L2 CAM entries for this node)</td></tr>';
        document.getElementById('mac-count').textContent = '0 Entries';
      }
    }

    if (routeBody) {
      routeBody.innerHTML = '';
      if (node && node.routes && node.routes.length > 0) {
        node.routes.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td><span class="status-pill highlight">${r.type}</span></td><td>${r.dest}</td><td>${r.nextHop}</td><td>${r.iface}</td><td>${r.metric}</td>`;
          routeBody.appendChild(tr);
        });
      } else {
        routeBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">(No L3 routes for this node)</td></tr>';
      }
    }
  }


  // ── Theory Interactive Blueprint Inspectors ─────────────────────────────
  function setupTheoryBlueprints() {
    // 1. Blueprint Sub-Tabs
    const bpTabs = document.querySelectorAll('.bp-tab');
    const panes = {
      'ipv4': document.getElementById('bp-pane-ipv4'),
      'tcp': document.getElementById('bp-pane-tcp'),
      'dijkstra': document.getElementById('bp-pane-dijkstra')
    };

    bpTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        bpTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-bp');

        Object.keys(panes).forEach(k => {
          if (panes[k]) {
            if (k === target) panes[k].classList.remove('hidden');
            else panes[k].classList.add('hidden');
          }
        });
        sound.playClick();
      });
    });

    // 2. IPv4 Field Details Data
    const v4FieldData = {
      'v4_ver': {
        title: 'IP Version (4 Bits)',
        desc: 'Specifies the IP format. Value 4 (0100 in binary) signifies IPv4. Value 6 (0110) denotes IPv6. Routers immediately drop packets if the version number does not match their protocol engine.',
        offset: 'Byte 0 (Bits 0-3)',
        rfc: 'RFC 791',
        val: 'Version: 4 (IPv4)'
      },
      'v4_ihl': {
        title: 'Internet Header Length - IHL (4 Bits)',
        desc: 'Length of IPv4 header in 32-bit (4-byte) words. Standard header without options has IHL=5 (5 × 4 = 20 bytes). Maximum IHL is 15 (60 bytes total).',
        offset: 'Byte 0 (Bits 4-7)',
        rfc: 'RFC 791',
        val: 'IHL: 5 (20 Bytes)'
      },
      'v4_tos': {
        title: 'Differentiated Services Code Point (DSCP) & ECN (8 Bits)',
        desc: 'Upper 6 bits define DSCP Quality of Service (QoS) classification (e.g. Expedited Forwarding for VoIP). Lower 2 bits provide Explicit Congestion Notification (ECN) to signal router buffer congestion without dropping packets.',
        offset: 'Byte 1 (Bits 8-15)',
        rfc: 'RFC 2474 / RFC 3168',
        val: 'DSCP: CS0 (Best Effort) • ECN: 00'
      },
      'v4_len': {
        title: 'Total Length (16 Bits)',
        desc: 'Defines entire packet size in bytes, including header and data payload. Minimum is 20 bytes; theoretical maximum is 65,535 bytes. Packets exceeding link MTU undergo fragmentation unless DF flag is set.',
        offset: 'Bytes 2-3 (Bits 16-31)',
        rfc: 'RFC 791',
        val: '1254 Bytes (Fragmentable if MTU < 1254)'
      },
      'v4_id': {
        title: 'Identification (16 Bits)',
        desc: 'Unique integer assigned by the sender to distinguish fragments of one original IP datagram so the receiver can reassemble them.',
        offset: 'Bytes 4-5 (Bits 32-47)',
        rfc: 'RFC 791 / RFC 6864',
        val: '0x3F2A (16170)'
      },
      'v4_flags': {
        title: 'Flags (3 Bits)',
        desc: 'Bit 0: Reserved (must be 0). Bit 1: DF (Don\'t Fragment) — if set, router drops packet with ICMP Type 3 Code 4 if MTU exceeded. Bit 2: MF (More Fragments) — set on all fragments except the final one.',
        offset: 'Byte 6 (Bits 48-50)',
        rfc: 'RFC 791',
        val: 'DF=0, MF=0 (Unfragmented)'
      },
      'v4_frag': {
        title: 'Fragment Offset (13 Bits)',
        desc: 'Indicates the position of this fragment\'s payload relative to the beginning of the original unfragmented datagram, measured in units of 8-byte blocks.',
        offset: 'Bytes 6-7 (Bits 51-63)',
        rfc: 'RFC 791',
        val: 'Offset: 0 (Byte 0)'
      },
      'v4_ttl': {
        title: 'Time-To-Live - TTL (8 Bits)',
        desc: 'Hop count limit to prevent routing loops. Every Layer-3 router decrements TTL by 1 before forwarding. When TTL hits 0, the router discards the packet and sends an ICMP Time Exceeded (Type 11 Code 0) back to the sender.',
        offset: 'Byte 8 (Bits 64-71)',
        rfc: 'RFC 791',
        val: 'TTL: 64 (Standard Linux Default)'
      },
      'v4_proto': {
        title: 'Upper-Layer Protocol (8 Bits)',
        desc: 'Identifies which transport protocol payload is encapsulated inside: 1 = ICMP (Ping), 6 = TCP (Web/SSH), 17 = UDP (DNS/Streaming), 89 = OSPF.',
        offset: 'Byte 9 (Bits 72-79)',
        rfc: 'IANA Assigned Numbers',
        val: 'Protocol: 6 (TCP)'
      },
      'v4_csum': {
        title: 'Header Checksum (16 Bits)',
        desc: '16-bit 1\'s complement sum computed over the IPv4 header only (not payload). Because TTL decrements at each hop, routers MUST recalculate the checksum at every hop.',
        offset: 'Bytes 10-11 (Bits 80-95)',
        rfc: 'RFC 1071',
        val: '0x8F3D (Verified Valid)'
      },
      'v4_src': {
        title: 'Source IPv4 Address (32 Bits)',
        desc: 'The 32-bit logical network address of the original sending host. Examined by firewall ACLs and used by receiver as the destination address for replies.',
        offset: 'Bytes 12-15 (Bits 96-127)',
        rfc: 'RFC 791',
        val: '192.168.1.10 (Class C Private)'
      },
      'v4_dst': {
        title: 'Destination IPv4 Address (32 Bits)',
        desc: 'The 32-bit address of the final destination endpoint. Routers inspect this address and search their FIB/routing table using Longest Prefix Match (LPM) to determine the next hop.',
        offset: 'Bytes 16-19 (Bits 128-159)',
        rfc: 'RFC 791',
        val: '192.168.2.20 (Remote LAN)'
      }
    };

    document.querySelectorAll('#bp-pane-ipv4 .bp-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        document.querySelectorAll('#bp-pane-ipv4 .bp-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        const fKey = cell.getAttribute('data-field');
        const data = v4FieldData[fKey];
        if (data) {
          document.getElementById('bp-v4-title').textContent = data.title;
          document.getElementById('bp-v4-desc').textContent = data.desc;
          document.getElementById('bp-v4-val').textContent = data.val;
          sound.playClick();
        }
      });
    });

    // Test in Simulator Button for IPv4
    const btnTestV4 = document.getElementById('bp-btn-test-v4');
    if (btnTestV4) {
      btnTestV4.addEventListener('click', () => {
        const simTab = document.querySelector('#mode-tabs .pill[data-mode="simulate"]');
        if (simTab) simTab.click();
        const osiMod = document.querySelector('.mod-pill[data-module="osi"]');
        if (osiMod) osiMod.click();
        sound.playClick();
      });
    }

    // 3. TCP Field Details Data
    const tcpFieldData = {
      'tcp_src': {
        title: 'Source Port (16 Bits)',
        desc: 'Identifies the sending client process. Usually an ephemeral port dynamically assigned by the OS stack from range 49152–65535.',
        offset: 'Bytes 0-1',
        rfc: 'RFC 9293',
        val: '54321 (Ephemeral Client Port)'
      },
      'tcp_dst': {
        title: 'Destination Port (16 Bits)',
        desc: 'Identifies the destination service process. Well-known ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 53 (DNS).',
        offset: 'Bytes 2-3',
        rfc: 'RFC 9293',
        val: '80 (HTTP Web Server)'
      },
      'tcp_seq': {
        title: 'Sequence Number (32 Bits)',
        desc: 'Tracks position of the first data byte in this segment within the stream. In a SYN packet, this is the Initial Sequence Number (ISN) chosen randomly.',
        offset: 'Bytes 4-7',
        rfc: 'RFC 9293',
        val: '1001 (Bytes Transmitted)'
      },
      'tcp_ack': {
        title: 'Acknowledgment Number (32 Bits)',
        desc: 'Valid if ACK flag is set. Identifies the next byte number the receiver expects to receive. Provides cumulative byte stream reliability.',
        offset: 'Bytes 8-11',
        rfc: 'RFC 9293',
        val: '2001 (Next Expected Byte)'
      },
      'tcp_offset': {
        title: 'Data Offset (4 Bits)',
        desc: 'Number of 32-bit words in the TCP header. Specifies where the data payload begins. Standard header without options is 5 words (20 bytes).',
        offset: 'Byte 12 (Bits 0-3)',
        rfc: 'RFC 9293',
        val: '5 Words (20 Bytes)'
      },
      'tcp_res': {
        title: 'Reserved (3 Bits)',
        desc: 'Reserved for future use. Must be 0 in standard implementations.',
        offset: 'Byte 12 (Bits 4-6)',
        rfc: 'RFC 9293',
        val: '000'
      },
      'tcp_flags': {
        title: 'Control Flags (9 Bits)',
        desc: 'URG (Urgent), ACK (Acknowledgment valid), PSH (Push data to app), RST (Reset/abort connection), SYN (Synchronize sequence numbers), FIN (Finish connection).',
        offset: 'Bytes 12-13',
        rfc: 'RFC 9293',
        val: 'ACK=1, PSH=1 (Data Transmission)'
      },
      'tcp_win': {
        title: 'Receive Window Size (16 Bits)',
        desc: 'Flow control mechanism. Number of bytes the sender is willing to receive without acknowledgment, based on available socket buffer space.',
        offset: 'Bytes 14-15',
        rfc: 'RFC 9293',
        val: '65535 Bytes (Flow Window)'
      },
      'tcp_csum': {
        title: 'TCP Checksum (16 Bits)',
        desc: 'Mandatory 16-bit 1\'s complement sum computed over the TCP pseudo-header (IP source, IP dest, protocol, TCP length), TCP header, and data payload.',
        offset: 'Bytes 16-17',
        rfc: 'RFC 9293',
        val: '0xA4F2 (Valid)'
      },
      'tcp_urg': {
        title: 'Urgent Pointer (16 Bits)',
        desc: 'Valid only if URG flag is set. Points to the offset from sequence number indicating the end of urgent out-of-band data (e.g. Telnet Ctrl+C interrupt).',
        offset: 'Bytes 18-19',
        rfc: 'RFC 9293',
        val: '0 (Not Urgent)'
      }
    };

    document.querySelectorAll('#bp-pane-tcp .bp-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        document.querySelectorAll('#bp-pane-tcp .bp-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        const fKey = cell.getAttribute('data-field');
        const data = tcpFieldData[fKey];
        if (data) {
          document.getElementById('bp-tcp-title').textContent = data.title;
          document.getElementById('bp-tcp-desc').textContent = data.desc;
          document.getElementById('bp-tcp-specs').innerHTML = `
            <div><span>Byte Offset:</span><strong>${data.offset}</strong></div>
            <div><span>RFC Standard:</span><strong>${data.rfc}</strong></div>
            <div><span>Live Lab State:</span><strong>${data.val}</strong></div>
          `;
          sound.playClick();
        }
      });
    });

    const btnTestTcp = document.getElementById('bp-btn-test-tcp');
    if (btnTestTcp) {
      btnTestTcp.addEventListener('click', () => {
        const simTab = document.querySelector('#mode-tabs .pill[data-mode="simulate"]');
        if (simTab) simTab.click();
        const osiMod = document.querySelector('.mod-pill[data-module="osi"]');
        if (osiMod) osiMod.click();
        sound.playClick();
      });
    }
  }


  // ── Speed Slider Control ────────────────────────────────────────────────
  function setupSpeedSlider() {
    const slider = document.getElementById('speed-slider');
    const valLabel = document.getElementById('speed-val');
    if (!slider || !valLabel) return;

    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      const speeds = [0.2, 0.4, 0.6, 0.8, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0];
      const speed = speeds[val - 1] || 1.0;
      netEngine.simSpeed = speed;
      valLabel.innerHTML = `${speed.toFixed(1)}&times;`;
    });
  }

  // ── Global Keyboard Shortcuts ───────────────────────────────────────────
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        if (canvasRenderer) canvasRenderer.zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (canvasRenderer) canvasRenderer.zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        if (canvasRenderer) canvasRenderer.resetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        if (canvasRenderer) canvasRenderer.toggleGrid();
      } else if (e.code === 'Space') {
        if (canvasRenderer) {
          canvasRenderer.spacePressed = true;
          canvasRenderer.canvas.style.cursor = 'grab';
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        if (canvasRenderer) {
          canvasRenderer.spacePressed = false;
          if (!canvasRenderer.isPanning) {
            canvasRenderer.canvas.style.cursor = 'default';
          }
        }
      }
    });
  }

  // Boot Application on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
