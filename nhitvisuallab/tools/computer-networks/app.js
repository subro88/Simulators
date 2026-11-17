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
      if (!srcNode) return null;

      sound.playPacketChirp();

      // Check route / next-hop path
      const path = this.findPathTo(srcId, dstIp);
      if (!path || path.length < 2) {
        sound.playAlertTone();
        return { success: false, reason: 'Destination Host Unreachable (No Route)' };
      }

      const pkt = {
        id: this.nextPacketId++,
        type: 'ICMP_ECHO_REQ',
        srcNodeId: srcId,
        dstIp,
        srcIp: srcNode.ip || srcNode.eth0?.ip,
        ttl: 64,
        path, // Array of node IDs: ['PC1', 'SW1', 'R1', 'R2', 'SW2', 'PC2']
        currentHopIndex: 0,
        progress: 0.0,
        speed: 0.02,
        info: `ICMP Echo Request (id=1, seq=1)`
      };

      this.packets.push(pkt);
      return { success: true, pkt };
    }

    findPathTo(srcId, dstIp) {
      // Direct graph search / routing lookup
      if (srcId === 'PC1' && dstIp.startsWith('192.168.2.')) {
        // Check if links are active
        const l1 = this.links.find(l => l.id === 'L1');
        const l2 = this.links.find(l => l.id === 'L2');
        const l3 = this.links.find(l => l.id === 'L3');
        const l4 = this.links.find(l => l.id === 'L4');
        const l5 = this.links.find(l => l.id === 'L5');

        if (l1?.severed || l2?.severed || l3?.severed || l4?.severed || l5?.severed) {
          return null; // Link severed!
        }
        return ['PC1', 'SW1', 'R1', 'R2', 'SW2', 'PC2'];
      }
      return null;
    }

    // Step packet simulation forward
    updatePackets(onPacketHopCallback, onPacketArrivalCallback) {
      for (let i = this.packets.length - 1; i >= 0; i--) {
        const pkt = this.packets[i];
        pkt.progress += pkt.speed;

        if (pkt.progress >= 1.0) {
          // Packet arrived at next node in path
          pkt.progress = 0.0;
          pkt.currentHopIndex++;

          const currentNodeId = pkt.path[pkt.currentHopIndex];
          const currentNode = this.nodes.find(n => n.id === currentNodeId);

          if (currentNode && currentNode.type === 'ROUTER') {
            // Decrement TTL at Layer 3 Router
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
            // Arrived at final destination!
            sound.playPingSuccess();
            this.packets.splice(i, 1);
            if (onPacketArrivalCallback) onPacketArrivalCallback(pkt, currentNode);
          } else {
            if (onPacketHopCallback) onPacketHopCallback(pkt, 'HOP', currentNode);
          }
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. UNIFIED DYNAMIC CANVAS RENDERER
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
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.showGrid = true;

      // Dragging nodes in Module 3
      this.draggedNode = null;

      this.initEvents();
    }

    initEvents() {
      this.canvas.addEventListener('mousedown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - this.panX) / this.zoom;
        const my = (e.clientY - rect.top - this.panY) / this.zoom;

        if (this.activeModule === 'topology') {
          // Check if clicked scissors on a link
          if (this.netEngine.cutToolActive) {
            const hitLink = this.findLinkAt(mx, my);
            if (hitLink) {
              hitLink.severed = !hitLink.severed;
              sound.playCutSnap();
              this.render();
              return;
            }
          }

          // Check if clicked a node to drag
          const hitNode = this.netEngine.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 25);
          if (hitNode) {
            this.draggedNode = hitNode;
            this.netEngine.selectedNodeId = hitNode.id;
            sound.playClick();
            syncUI();
            return;
          }
        } else if (this.activeModule === 'subnetting') {
          // Check if clicked an interactive 32-bit bit box
          this.checkBitClick(mx, my);
        }

        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (this.draggedNode) {
          const rect = this.canvas.getBoundingClientRect();
          this.draggedNode.x = (e.clientX - rect.left - this.panX) / this.zoom;
          this.draggedNode.y = (e.clientY - rect.top - this.panY) / this.zoom;
          this.render();
          return;
        }

        if (!this.isDragging) return;
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.render();
      });

      window.addEventListener('mouseup', () => {
        this.isDragging = false;
        this.draggedNode = null;
      });

      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
        const newZoom = Math.min(Math.max(this.zoom * zoomFactor, 0.4), 3.0);

        this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
        this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;

        const zoomEl = document.getElementById('hud-zoom-level');
        if (zoomEl) zoomEl.textContent = `${Math.round(this.zoom * 100)}%`;
        this.render();
      });

      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === '+' || e.key === '=') this.zoomIn();
        if (e.key === '-' || e.key === '_') this.zoomOut();
        if (e.key === '0') this.resetZoom();
        if (e.key.toLowerCase() === 'g') this.toggleGrid();
        if (e.key.toLowerCase() === 'f') toggleFullscreen();
      });
    }

    zoomIn() {
      this.zoom = Math.min(this.zoom * 1.2, 3.0);
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
      this.render();
    }
    zoomOut() {
      this.zoom = Math.max(this.zoom * 0.8, 0.4);
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
      this.render();
    }
    resetZoom() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      document.getElementById('hud-zoom-level').textContent = '100%';
      this.render();
    }
    fitView() {
      this.zoom = 0.95;
      this.panX = 20;
      this.panY = 20;
      document.getElementById('hud-zoom-level').textContent = `${Math.round(this.zoom * 100)}%`;
      this.render();
    }
    toggleGrid() {
      this.showGrid = !this.showGrid;
      this.render();
    }

    findLinkAt(x, y) {
      for (const link of this.netEngine.links) {
        const fromNode = this.netEngine.nodes.find(n => n.id === link.from);
        const toNode = this.netEngine.nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) continue;

        // Line segment distance
        const dist = this.distToSegment({ x, y }, fromNode, toNode);
        if (dist < 12) return link;
      }
      return null;
    }

    distToSegment(p, v, w) {
      const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
      if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    checkBitClick(mx, my) {
      const bitBoxes = this.cachedBitBoxes || [];
      for (const box of bitBoxes) {
        if (mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h) {
          // Toggle bit in IP
          const bitPos = 31 - box.bitIndex;
          const currentIp = this.subnetEngine.ipToInt(this.subnetEngine.ipStr);
          const newIp = (currentIp ^ (1 << bitPos)) >>> 0;
          this.subnetEngine.ipStr = this.subnetEngine.intToIp(newIp);
          sound.playClick();
          document.getElementById('ip-input').value = this.subnetEngine.ipStr;
          syncUI();
          break;
        }
      }
    }

    render() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      const ctx = this.ctx;

      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Deep Obsidian Base
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, w, h);

      // Pan & Zoom
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      // Subtle Dot Matrix Grid (40px spacing at 12% opacity)
      if (this.showGrid) {
        const dotSpacing = 40;
        const startX = Math.floor((-this.panX / this.zoom) / dotSpacing) * dotSpacing;
        const startY = Math.floor((-this.panY / this.zoom) / dotSpacing) * dotSpacing;
        const endX = startX + (w / this.zoom) + dotSpacing;
        const endY = startY + (h / this.zoom) + dotSpacing;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        for (let x = startX; x < endX; x += dotSpacing) {
          for (let y = startY; y < endY; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render Active Module Mode
      if (this.activeModule === 'subnetting') {
        this.renderSubnettingCanvas(ctx, w, h);
      } else if (this.activeModule === 'osi') {
        this.renderOsiTowerCanvas(ctx, w, h);
      } else if (this.activeModule === 'topology') {
        this.renderTopologyCanvas(ctx, w, h);
      }

      ctx.restore();
    }

    // ── Module 1 Canvas: 32-Bit CIDR & VLSM Visualizer ─────────────────────
    renderSubnettingCanvas(ctx, w, h) {
      const calc = this.subnetEngine.calculate(this.subnetEngine.ipStr, this.subnetEngine.prefix);
      this.cachedBitBoxes = [];

      // Frame Box
      ctx.strokeStyle = '#162238';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#060d1c';
      ctx.roundRect(40, 25, 800, 460, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText('32-BIT BINARY IPV4 ADDRESS & CIDR PREFIX MASK MATRIX', 55, 50);

      // 32 Bit Boxes grouped into 4 octets
      const octetSpacing = 192;
      const boxW = 20;
      const boxH = 34;
      const startX = 60;
      const startY = 80;

      const ipInt = calc.ipInt;
      const p = calc.prefix;

      for (let o = 0; o < 4; o++) {
        const octetX = startX + o * octetSpacing;
        const octetVal = (ipInt >>> (24 - o * 8)) & 0xFF;

        // Octet Decimal Header
        ctx.fillStyle = '#0f1b33';
        ctx.roundRect(octetX, startY - 20, 168, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`Octet ${o + 1}: ${octetVal} (0x${octetVal.toString(16).toUpperCase().padStart(2, '0')})`, octetX + 12, startY - 8);

        for (let b = 0; b < 8; b++) {
          const bitIdx = o * 8 + b;
          const bitX = octetX + b * 21;
          const bitVal = (ipInt >>> (31 - bitIdx)) & 1;
          const isNetBit = bitIdx < p;

          // Color Scheme: Net bits (Blue/Cyan), Host bits (Emerald)
          ctx.fillStyle = isNetBit ? '#0f2445' : '#063829';
          ctx.strokeStyle = isNetBit ? '#2563eb' : '#059669';
          ctx.lineWidth = 1;
          ctx.roundRect(bitX, startY, boxW, boxH, 4);
          ctx.fill();
          ctx.stroke();

          // Bit Value
          ctx.fillStyle = isNetBit ? '#38bdf8' : '#34d399';
          ctx.font = 'bold 14px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(bitVal.toString(), bitX + boxW / 2, startY + 22);

          // Bit Index
          ctx.fillStyle = '#475569';
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
        ctx.moveTo(markerX, startY - 22);
        ctx.lineTo(markerX, startY + boxH + 10);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`/${p} DIVIDER`, markerX - 30, startY + boxH + 24);
      }

      // Legend
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText('Legend: [ Blue = Network Bits (/p) ]  [ Green = Interactive Toggleable Host Bits ]', startX, startY + 80);

      // VLSM Memory Map Allocation Bar (Horizontal proportional representation)
      const vlsmY = startY + 110;
      ctx.fillStyle = '#0f1a30';
      ctx.roundRect(startX, vlsmY, 760, 24, 4);
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
        const segW = Math.max(30, alloc.sizeRatio * 760);
        ctx.fillStyle = palette[idx % palette.length];
        ctx.globalAlpha = 0.35;
        ctx.fillRect(curBarX, vlsmY, segW, 24);
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = palette[idx % palette.length];
        ctx.strokeRect(curBarX, vlsmY, segW, 24);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`${alloc.name} (/${alloc.prefix})`, curBarX + 6, vlsmY + 16);

        curBarX += segW;
      });

      // Free Space if any
      if (curBarX < startX + 760) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(curBarX, vlsmY, startX + 760 - curBarX, 24);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText('Unallocated Free Space', curBarX + 8, vlsmY + 16);
      }
    }

    // ── Module 2 Canvas: OSI 7-Layer Dual Tower with Header Snapping ─────────
    renderOsiTowerCanvas(ctx, w, h) {
      ctx.strokeStyle = '#162238';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#060d1c';
      ctx.roundRect(40, 25, 800, 460, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText('OSI 7-LAYER PROTOCOL ENCAPSULATION & DECAPSULATION PIPELINE', 55, 50);

      const layers = [
        { num: 7, name: 'Application', pdu: 'Data', color: '#38bdf8' },
        { num: 6, name: 'Presentation', pdu: 'Data', color: '#60a5fa' },
        { num: 5, name: 'Session', pdu: 'Data', color: '#818cf8' },
        { num: 4, name: 'Transport', pdu: 'Segment (TCP/UDP)', color: '#a78bfa' },
        { num: 3, name: 'Network', pdu: 'Packet (IPv4)', color: '#f43f5e' },
        { num: 2, name: 'Data Link', pdu: 'Frame (Ethernet II)', color: '#f59e0b' },
        { num: 1, name: 'Physical', pdu: 'Bits (Signals)', color: '#10b981' }
      ];

      // Sender Tower (Left)
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillText('TRANSMITTER HOST (Encapsulation)', 100, 80);

      // Receiver Tower (Right)
      ctx.fillText('RECEIVER HOST (Decapsulation)', 550, 80);

      const towerY = 95;
      const rowH = 40;

      layers.forEach((l, idx) => {
        const y = towerY + idx * (rowH + 6);
        const isActiveSender = (this.osiEngine.currentLayer === l.num && this.osiEngine.direction === 'DOWN');
        const isActiveReceiver = (this.osiEngine.currentLayer === l.num && this.osiEngine.direction === 'UP');

        // Sender Layer Block
        ctx.fillStyle = isActiveSender ? 'rgba(56, 189, 248, 0.25)' : '#0a1426';
        ctx.strokeStyle = isActiveSender ? '#38bdf8' : '#1c2844';
        ctx.lineWidth = isActiveSender ? 2 : 1;
        ctx.roundRect(100, y, 240, rowH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = l.color;
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`L${l.num} ${l.name}`, 112, y + 18);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`PDU: ${l.pdu}`, 112, y + 32);

        // Receiver Layer Block
        ctx.fillStyle = isActiveReceiver ? 'rgba(16, 185, 129, 0.25)' : '#0a1426';
        ctx.strokeStyle = isActiveReceiver ? '#10b981' : '#1c2844';
        ctx.lineWidth = isActiveReceiver ? 2 : 1;
        ctx.roundRect(540, y, 240, rowH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = l.color;
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`L${l.num} ${l.name}`, 552, y + 18);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`PDU: ${l.pdu}`, 552, y + 32);
      });

      // Physical Transmission Wire (Connecting L1 to L1)
      const wireY = towerY + 6 * (rowH + 6) + 20;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(340, wireY);
      ctx.lineTo(540, wireY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('1000BASE-T Cat6 Copper Medium (Manchester / NRZ-I Line Coding)', 340, wireY - 8);

      // Central Header Snapping Envelope
      ctx.fillStyle = '#0f1c36';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.roundRect(360, towerY + 50, 160, 140, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('ACTIVE PACKET FRAME', 370, towerY + 70);

      // Header slices inside frame
      const headers = ['[ETH] 14B', '[IP] 20B', '[TCP] 20B', '[DATA] 1200B', '[FCS] 4B'];
      const sliceColors = ['#f59e0b', '#f43f5e', '#a78bfa', '#38bdf8', '#10b981'];
      headers.forEach((hName, idx) => {
        ctx.fillStyle = sliceColors[idx];
        ctx.fillRect(370, towerY + 80 + idx * 20, 140, 16);
        ctx.fillStyle = '#020712';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(hName, 376, towerY + 92 + idx * 20);
      });
    }

    // ── Module 3 Canvas: Drag-and-Drop Topology & Dynamic Routing ──────────
    renderTopologyCanvas(ctx, w, h) {
      // 1. Draw Links
      this.netEngine.links.forEach(link => {
        const fromNode = this.netEngine.nodes.find(n => n.id === link.from);
        const toNode = this.netEngine.nodes.find(n => n.id === link.to);
        if (!fromNode || !toNode) return;

        ctx.lineWidth = 2;
        if (link.severed) {
          ctx.strokeStyle = '#ef4444';
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = (link.speed === '1G') ? '#38bdf8' : (link.speed === '100M' ? '#10b981' : '#f59e0b');
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Link Speed & Cost Label
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;

        ctx.fillStyle = '#070e1c';
        ctx.fillRect(midX - 22, midY - 8, 44, 16);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(midX - 22, midY - 8, 44, 16);

        ctx.fillStyle = link.severed ? '#ef4444' : '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(link.severed ? 'CUT' : `${link.speed}`, midX, midY + 4);
      });

      // 2. Draw Flying Packet Envelopes
      this.netEngine.packets.forEach(pkt => {
        const fromId = pkt.path[pkt.currentHopIndex];
        const toId = pkt.path[pkt.currentHopIndex + 1];
        const fromNode = this.netEngine.nodes.find(n => n.id === fromId);
        const toNode = this.netEngine.nodes.find(n => n.id === toId);

        if (fromNode && toNode) {
          const px = fromNode.x + (toNode.x - fromNode.x) * pkt.progress;
          const py = fromNode.y + (toNode.y - fromNode.y) * pkt.progress;

          // Glowing Packet Envelope
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Live TTL Badge
          ctx.fillStyle = '#020712';
          ctx.roundRect(px - 14, py - 20, 28, 14, 3);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 8px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(`TTL:${pkt.ttl}`, px, py - 10);
        }
      });
      ctx.textAlign = 'left';

      // 3. Draw Nodes (PC, Switch, Router)
      this.netEngine.nodes.forEach(node => {
        const isSelected = (node.id === this.netEngine.selectedNodeId);

        // Node Glow / Selection Ring
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 26, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Base Circle
        ctx.fillStyle = (node.type === 'ROUTER') ? '#1e3a5f' : (node.type === 'SWITCH' ? '#064e3b' : '#312e81');
        ctx.strokeStyle = (node.type === 'ROUTER') ? '#38bdf8' : (node.type === 'SWITCH' ? '#10b981' : '#818cf8');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node Icon Glyph
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        const glyph = (node.type === 'ROUTER') ? '⇄' : (node.type === 'SWITCH' ? '⇅' : '💻');
        ctx.fillText(glyph, node.x, node.y + 4);

        // Node Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(node.label, node.x, node.y + 34);

        // IP / MAC Sub-label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px JetBrains Mono';
        const sub = node.ip || node.eth0?.ip || (node.type === 'SWITCH' ? 'L2 Switch' : '');
        ctx.fillText(sub, node.x, node.y + 46);
      });
      ctx.textAlign = 'left';
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
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
  // 7. THREE.JS 3D MODEL WORKBENCH (42U Data Center Server Rack & Gigabit Switch)
  // ════════════════════════════════════════════════════════════════════════════
  function initThree3DModel() {
    if (window.three3DInitialized) return;
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
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(8, 15, 10);
    scene.add(dirLight);
    const blueLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueLight.position.set(-6, -4, -6);
    scene.add(blueLight);

    const rackGroup = new THREE.Group();

    // 1. 42U Server Rack Steel Cabinet
    const rackGeo = new THREE.BoxGeometry(2.4, 5.0, 2.0);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x0b1324, roughness: 0.4, metalness: 0.8 });
    const rackFrame = new THREE.Mesh(rackGeo, rackMat);
    rackGroup.add(rackFrame);

    // 2. 24-Port Managed Switch (1U)
    const switchGeo = new THREE.BoxGeometry(2.1, 0.35, 1.6);
    const switchMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.6 });
    const switchMesh = new THREE.Mesh(switchGeo, switchMat);
    switchMesh.position.set(0, 0.8, 0.2);
    rackGroup.add(switchMesh);

    // RJ45 Ports & LED indicators on Switch
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    for (let p = 0; p < 12; p++) {
      const portX = -0.8 + p * 0.14;
      const portMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), new THREE.MeshBasicMaterial({ color: 0x050b18 }));
      portMesh.position.set(portX, 0.8, 1.02);
      rackGroup.add(portMesh);

      const ledMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), ledMat);
      ledMesh.position.set(portX, 0.9, 1.02);
      rackGroup.add(ledMesh);
    }

    // 3. Core L3 Enterprise Router (2U)
    const routerGeo = new THREE.BoxGeometry(2.1, 0.65, 1.7);
    const routerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.7 });
    const routerMesh = new THREE.Mesh(routerGeo, routerMat);
    routerMesh.position.set(0, -0.2, 0.15);
    rackGroup.add(routerMesh);

    // 4. Cat6 Patch Panel (1U)
    const patchMesh = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 1.5), switchMat.clone());
    patchMesh.position.set(0, 1.5, 0.2);
    rackGroup.add(patchMesh);

    // Patch Cables (Colorful Cat6 jumpers)
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 });
    for (let c = 0; c < 6; c++) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.6 + c * 0.24, 1.5, 1.0),
        new THREE.Vector3(-0.5 + c * 0.24, 1.15, 1.25),
        new THREE.Vector3(-0.6 + c * 0.24, 0.8, 1.0)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.02, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, cableMat);
      rackGroup.add(tubeMesh);
    }

    scene.add(rackGroup);

    // Components Aside
    const components = [
      { name: '42U Data Center Cabinet', desc: 'Standard 19-inch EIA-310-E steel server enclosure.' },
      { name: '24-Port L2/L3 Gigabit Switch', desc: 'High-density switch with CAM hardware table learning.' },
      { name: 'Enterprise Core Router', desc: 'Hardware routing engine supporting OSPF, RIP, and BGP.' },
      { name: '48-Port Cat6 Patch Panel', desc: 'Structured cabling termination with RJ45 keystone jacks.' },
      { name: 'Fiber SFP+ Transceivers', desc: '10GBASE-SR optical modules for high-speed uplink backbone.' }
    ];

    compAside.innerHTML = '';
    components.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = `sim3d-comp ${idx === 0 ? 'active' : ''}`;
      btn.innerHTML = `<strong>${c.name}</strong><br><span style="font-size:0.7rem; color:#94a3b8;">${c.desc}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim3d-comp').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchMesh.material.color.setHex(0x38bdf8);
        setTimeout(() => switchMesh.material.color.setHex(0x1e293b), 400);
      });
      compAside.appendChild(btn);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  // ════════════════════════════════════════════════════════════════════════════
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
        if (canvasRenderer) canvasRenderer.render();
      }
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
    if (window.anime) {
      anime({
        targets: osiEngine,
        currentLayer: [7, 1],
        round: 1,
        easing: 'spring(1, 80, 10, 0)',
        duration: 1800,
        update: () => {
          canvasRenderer.render();
          renderPDUInspector();
        },
        complete: () => {
          sound.playPacketChirp();
          // Ascend to receiver
          osiEngine.direction = 'UP';
          anime({
            targets: osiEngine,
            currentLayer: [1, 7],
            round: 1,
            easing: 'spring(1, 80, 10, 0)',
            duration: 1800,
            delay: 400,
            update: () => {
              canvasRenderer.render();
              renderPDUInspector();
            },
            complete: () => {
              sound.playPingSuccess();
            }
          });
        }
      });
    }
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

  // Boot Application on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
