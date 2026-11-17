/* ==========================================================================
   PC Maintenance, Hardware Assembly & Fault-Diagnostics Engine
   WBSCTE Diploma CST 3rd Sem (CST/3/PP-I)
   Thermal Heat Transfer, Power Rails, POST State Machine & Diagnostics
   ========================================================================== */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 1. WEB AUDIO API SYNTHESIZER (POST Beeper, Latch Clicks, Fan Whirr)
  // ══════════════════════════════════════════════════════════════════════════
  const SoundFX = {
    ctx: null,
    enabled: true,
    volume: 0.22,

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();
        } catch (e) {
          console.warn('AudioContext unavailable:', e);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    toggle() {
      this.init();
      this.enabled = !this.enabled;
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) {
        btn.innerHTML = this.enabled ? '&#128264;' : '&#128263;';
        btn.classList.toggle('muted', !this.enabled);
      }
    },

    playTone(freq, type, duration, gainVal = 0.5, slideFreq = null) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
          osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(gainVal * this.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // audio failsafe
      }
    },

    // Crisp mechanical snap for RAM / PCIe latch
    snapClick() {
      this.playTone(1800, 'triangle', 0.04, 0.6, 500);
    },

    // Metal screw tightening
    screwTurn() {
      this.playTone(320, 'sawtooth', 0.08, 0.35, 180);
    },

    // Air duster burst
    airBlast() {
      if (!this.enabled || !this.ctx) return;
      try {
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.25 * this.volume;
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
      } catch (e) {}
    },

    // Motherboard Piezo Speaker Beeper
    beep(freq, duration) {
      this.playTone(freq || 950, 'square', duration, 0.45);
    },

    // Standard Award/AMI Beep Sequences
    postPassBeep() {
      // 1 Short Beep (Normal Pass)
      this.beep(960, 0.14);
    },

    postDramBeep() {
      // 1 Long, 2 Short (Memory Failure)
      this.beep(880, 0.45);
      setTimeout(() => this.beep(880, 0.12), 520);
      setTimeout(() => this.beep(880, 0.12), 700);
    },

    postGpuBeep() {
      // 1 Long, 3 Short (Display Failure)
      this.beep(880, 0.45);
      setTimeout(() => this.beep(880, 0.12), 520);
      setTimeout(() => this.beep(880, 0.12), 700);
      setTimeout(() => this.beep(880, 0.12), 880);
    },

    postCpuBeep() {
      // 5 Short Beeps (CPU failure / Missing 8-pin EPS)
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.beep(1050, 0.08), i * 160);
      }
    },

    dmmBeep() {
      // Multimeter Continuity Buzzer
      this.playTone(2200, 'sine', 0.2, 0.3);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2. COMPONENT DATA & HARDWARE PROFILES
  // ══════════════════════════════════════════════════════════════════════════
  const RIG_PRESETS = {
    cad_rig: {
      name: 'Engineering CAD Rig',
      cpu: { id: 'ryzen_7700x', name: 'AMD Ryzen 7 7700X', tdp: 105, socket: 'AM5', cores: '8C / 16T', baseFreq: '4.5 GHz', boostFreq: '5.4 GHz' },
      cooler: { id: 'tower_cooler', name: '240W Dual-Tower Heatsink Cooler', type: 'Air', tdpCapacity: 250, fanRpmMax: 2000 },
      ram: { id: 'ddr5_32gb', name: '32GB (2x16GB) DDR5-6000 CL30', standard: 'DDR5', sticks: 2, capacityGb: 32, baseSpeed: 4800, xmpSpeed: 6000 },
      storage: { id: 'nvme_2tb', name: '2TB PCIe Gen4 x4 NVMe SSD', interface: 'M.2', readMb: 7400, writeMb: 6800 },
      gpu: { id: 'rtx_4070', name: 'NVIDIA GeForce RTX 4070 12GB', tdp: 200, pciePower: 'PCIe 8-Pin', vram: '12GB GDDR6X' },
      psu: { id: 'psu_750w', name: '750W 80+ Gold Modular ATX 3.0', ratedWatts: 750, rail12VAmps: 62.5 }
    },
    office_pc: {
      name: 'Office Workstation',
      cpu: { id: 'core_i5_13400', name: 'Intel Core i5-13400', tdp: 65, socket: 'LGA1700', cores: '10C (6P+4E) / 16T', baseFreq: '2.5 GHz', boostFreq: '4.6 GHz' },
      cooler: { id: 'stock_cooler', name: 'Intel Laminar Box Cooler', type: 'Air', tdpCapacity: 95, fanRpmMax: 2600 },
      ram: { id: 'ddr4_16gb', name: '16GB (2x8GB) DDR4-3200', standard: 'DDR4', sticks: 2, capacityGb: 16, baseSpeed: 2666, xmpSpeed: 3200 },
      storage: { id: 'nvme_1tb', name: '1TB PCIe Gen3 x4 NVMe SSD', interface: 'M.2', readMb: 3500, writeMb: 3000 },
      gpu: { id: 'igpu_uhd730', name: 'Intel UHD 730 (Integrated)', tdp: 15, pciePower: 'None', vram: 'Shared' },
      psu: { id: 'psu_450w', name: '450W 80+ Bronze ATX', ratedWatts: 450, rail12VAmps: 37.5 }
    },
    enthusiast: {
      name: 'Workstation Extreme',
      cpu: { id: 'core_i9_14900k', name: 'Intel Core i9-14900K', tdp: 253, socket: 'LGA1700', cores: '24C (8P+16E) / 32T', baseFreq: '3.2 GHz', boostFreq: '6.0 GHz' },
      cooler: { id: 'aio_360', name: '360mm Triple-Fan Liquid AIO', type: 'Liquid', tdpCapacity: 350, fanRpmMax: 2400 },
      ram: { id: 'ddr5_64gb', name: '64GB (2x32GB) DDR5-6400', standard: 'DDR5', sticks: 2, capacityGb: 64, baseSpeed: 4800, xmpSpeed: 6400 },
      storage: { id: 'nvme_4tb', name: '4TB PCIe Gen5 x4 NVMe SSD', interface: 'M.2', readMb: 12000, writeMb: 10000 },
      gpu: { id: 'rtx_4090', name: 'NVIDIA GeForce RTX 4090 24GB', tdp: 450, pciePower: '12VHPWR 16-Pin', vram: '24GB GDDR6X' },
      psu: { id: 'psu_1000w', name: '1000W 80+ Platinum ATX 3.0', ratedWatts: 1000, rail12VAmps: 83.3 }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. WORKBENCH STATE & HARDWARE GRAPH
  // ══════════════════════════════════════════════════════════════════════════
  const LabState = {
    mode: 'guided',       // 'guided' | 'sandbox' | 'tickets'
    currentRigKey: 'cad_rig',
    currentRig: RIG_PRESETS.cad_rig,

    // Safety & Controls
    esdGrounded: false,
    psuRockerOn: false,
    frontPowerPushed: false,
    systemPowered: false,
    xmpEnabled: false,
    stressTestActive: false,

    // Assembly Checklist Hardware Netlist
    assembly: {
      standoffsInstalled: false,
      cpuSeated: false,
      cpuLatched: false,
      thermalPasteApplied: false,
      coolerPeelRemoved: true,     // Default true; Tickets can break this!
      coolerMounted: false,
      coolerFanPlugged: false,     // CPU_FAN header
      ramSlotA1: false,
      ramSlotA2: false,
      ramSlotB1: false,
      ramSlotB2: false,
      m2StorageSeated: false,
      m2ScrewSecured: false,
      gpuSeated: false,
      gpuLatched: false,
      // Power Cables
      cableAtx24Connected: false,
      cableEps8Connected: false,
      cablePcieConnected: false,
      // Front Panel Header
      headerPwrSwConnected: false,
      headerPwrLedConnected: false,
      headerResetConnected: false
    },

    // Diagnostics & Measurements
    qleds: { cpu: false, dram: false, vga: false, boot: false },
    postStage: 0, // 0: Standby, 1: CPU, 2: DRAM, 3: VGA, 4: BOOT
    postPassed: false,
    postError: null,
    dmmTestPoint: null,
    dmmMode: 'v_dc',

    // Thermodynamics Transient Engine
    ambientTemp: 24.0,
    cpuDieTemp: 28.5,
    thermalHistory: [],
    fanRpm: 0,
    rTim: 0.05, // degC/W

    // Selected Component for Shelf Interaction
    selectedDrawer: 'core',
    selectedCompId: 'cpu',

    // Canvas Camera & Zoom
    view: {
      zone: 'chassis',
      panX: 0,
      panY: 0,
      zoom: 1.0,
      targetZoom: 1.0,
      targetPanX: 0,
      targetPanY: 0,
      isPanning: false,
      dragStart: { x: 0, y: 0 },
      thermalOverlay: false
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. TROUBLESHOOTING TICKETS ENGINE (8 Real-World Scenarios)
  // ══════════════════════════════════════════════════════════════════════════
  const TroubleshootingTickets = [
    {
      id: 1,
      title: 'Ticket #01: Workstation Dead on Arrival (No Standby Power)',
      symptom: 'User says newly assembled desktop does not power on when pressing the front chassis power button. No fans spin, and zero LEDs illuminate on the motherboard.',
      telemetry: {
        qled: 'All Dark (No Standby Light)',
        beep: 'Silent (Zero Beeps)',
        dmm: '0.00 V on +5VSB & PS_ON#'
      },
      setup(state) {
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB2 = true;
        state.assembly.m2StorageSeated = true;
        state.assembly.m2ScrewSecured = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        state.assembly.cablePcieConnected = true;
        // FAULT: PSU rocker switch is OFF and Front Panel PWR_SW is shifted by 1 pin
        state.psuRockerOn = false;
        state.assembly.headerPwrSwConnected = false;
      },
      options: [
        { text: 'A. Replace the CPU because internal microcode is corrupted', correct: false },
        { text: 'B. Turn ON the rear PSU master rocker switch [I] and plug PWR_SW into pins 6 & 8', correct: true },
        { text: 'C. Re-paste the CPU heatsink with liquid metal', correct: false },
        { text: 'D. Replace the DDR5 memory with DDR4', correct: false }
      ],
      explanation: 'Without the rear PSU rocker switch turned to [I], the power supply cannot generate the +5VSB (Standby) rail. Additionally, the front panel PWR_SW header must be bridged to signal the PS_ON# line to ground.'
    },
    {
      id: 2,
      title: 'Ticket #02: Solid Red CPU Q-LED & 5 Short Beeps',
      symptom: 'System turns on, fans spin at full speed, but the motherboard diagnostic Q-LED halts at solid RED beside the [CPU] label with 5 short alert beeps.',
      telemetry: {
        qled: 'Solid RED [CPU]',
        beep: '5 Short Beeps (CPU / VRM Initialization Failed)',
        dmm: '0.00 V on 8-Pin EPS CPU VRM Rail; 12.0 V on 24-Pin ATX'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB2 = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        // FAULT: Missing 8-pin EPS CPU auxiliary connector
        state.assembly.cableEps8Connected = false;
        state.assembly.cablePcieConnected = true;
        state.assembly.headerPwrSwConnected = true;
      },
      options: [
        { text: 'A. Plug the 8-Pin EPS 12V auxiliary power cable into the upper-left VRM socket', correct: true },
        { text: 'B. Reseat the GPU in PCIe slot 2', correct: false },
        { text: 'C. Reinstall Windows 11 on the boot drive', correct: false },
        { text: 'D. Clear CMOS by shorting the battery pins for 24 hours', correct: false }
      ],
      explanation: 'The 24-Pin ATX connector does not supply high-current power to the CPU VRM. The 8-Pin EPS 12V connector is required to energize the multi-phase buck converters supplying Vcore to the processor die.'
    },
    {
      id: 3,
      title: 'Ticket #03: Amber DRAM Q-LED & 1 Long, 2 Short Beeps',
      symptom: 'User upgraded workstation memory. Now fans spin up, but display remains black with a solid AMBER DRAM Q-LED light.',
      telemetry: {
        qled: 'Solid AMBER [DRAM]',
        beep: '1 Long Beep, 2 Short Beeps (Memory Parity / Training Fault)',
        dmm: '3.31 V on DIMM SPD Rail; Memory controller signals unseated'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        state.assembly.cablePcieConnected = true;
        state.assembly.headerPwrSwConnected = true;
        // FAULT: RAM unseated / installed improperly
        state.assembly.ramSlotA1 = true;
        state.assembly.ramSlotA2 = false;
        state.assembly.ramSlotB1 = false;
        state.assembly.ramSlotB2 = false;
      },
      options: [
        { text: 'A. Replace power supply with an 850W unit', correct: false },
        { text: 'B. Reseat matched RAM sticks firmly into primary paired slots DIMM_A2 and DIMM_B2', correct: true },
        { text: 'C. Invert the CPU cooler fan direction', correct: false },
        { text: 'D. Disconnect the M.2 NVMe SSD', correct: false }
      ],
      explanation: 'In daisy-chain memory trace designs, installing single or mismatched sticks in slot A1 leaves unterminated stub traces causing signal reflections. Installing matched sticks into paired slots A2 + B2 enables optimal Dual-Channel memory training.'
    },
    {
      id: 4,
      title: 'Ticket #04: Thermal Throttling & Sudden Shutdown at 100°C',
      symptom: 'System completes POST successfully, but within 45 seconds of entering the OS, CPU temperature spikes from 35°C to 100°C, and the system powers down abruptly.',
      telemetry: {
        qled: 'POST Passed initially -> Emergency Thermal Trip (100°C)',
        beep: '1 Short Beep -> Sudden Silent Shutdown',
        dmm: 'Thermal resistance R_th > 0.85 °C/W (High Heat Flux Boundary)'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        // FAULT: Protective plastic peel sticker left on cooler base!
        state.assembly.coolerPeelRemoved = false;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB2 = true;
        state.assembly.m2StorageSeated = true;
        state.assembly.m2ScrewSecured = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        state.assembly.cablePcieConnected = true;
        state.assembly.headerPwrSwConnected = true;
        state.rTim = 0.88;
      },
      options: [
        { text: 'A. Overclock CPU core voltage to 1.55V', correct: false },
        { text: 'B. Remove cooler, peel off the transparent factory plastic warning sticker, re-paste, and remount', correct: true },
        { text: 'C. Reverse the front panel reset switch orientation', correct: false },
        { text: 'D. Swap the GPU PCIe slot', correct: false }
      ],
      explanation: 'The factory plastic peel sticker on the copper cooler base acts as a severe thermal insulator. Removing this protective sticker allows metal-to-TIM-to-metal heat transfer with an R_th of ~0.05°C/W.'
    },
    {
      id: 5,
      title: 'Ticket #05: White VGA Q-LED & 1 Long, 3 Short Beeps',
      symptom: 'Fans spin and system passes CPU/RAM checks, but diagnostic LED stops on solid WHITE [VGA] with 1 long and 3 short beeps. Monitor reports "No Signal".',
      telemetry: {
        qled: 'Solid WHITE [VGA]',
        beep: '1 Long Beep, 3 Short Beeps (Display Adapter Failure)',
        dmm: '0.00 V on GPU PCIe 8-Pin Header; PCIe x16 link unpowered'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB2 = true;
        state.assembly.m2StorageSeated = true;
        state.assembly.m2ScrewSecured = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        // FAULT: PCIe auxiliary 8-pin disconnected from GPU
        state.assembly.cablePcieConnected = false;
        state.assembly.headerPwrSwConnected = true;
      },
      options: [
        { text: 'A. Connect the dedicated PCIe 8-Pin power cable from the PSU to the graphics card', correct: true },
        { text: 'B. Replace the thermal paste on the CPU', correct: false },
        { text: 'C. Turn the RAM stick around 180 degrees', correct: false },
        { text: 'D. Replace the CMOS battery', correct: false }
      ],
      explanation: 'The PCIe motherboard slot provides a maximum of 75W. Discrete graphics cards requiring >75W (such as the RTX 4070, TDP 200W) halt the VGA POST phase unless auxiliary PCIe 8-pin power cables are connected.'
    },
    {
      id: 6,
      title: 'Ticket #06: Green BOOT Q-LED & UEFI "No Bootable Device Found"',
      symptom: 'Workstation powers on and video displays, but BIOS directly presents: "Reboot and Select proper Boot device or Insert Boot Media in selected Boot device".',
      telemetry: {
        qled: 'Solid GREEN [BOOT]',
        beep: '1 Short Beep (POST Pass -> Storage Handshake Failed)',
        dmm: 'M.2 NVMe Slot PCIe lanes floating / Unseated drive'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB2 = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        state.assembly.cablePcieConnected = true;
        state.assembly.headerPwrSwConnected = true;
        // FAULT: M.2 SSD not seated / missing standoff screw
        state.assembly.m2StorageSeated = false;
        state.assembly.m2ScrewSecured = false;
      },
      options: [
        { text: 'A. Replace the graphics card', correct: false },
        { text: 'B. Insert the M.2 NVMe SSD at a 30-degree angle and secure the grounding standoff screw', correct: true },
        { text: 'C. Upgrade the PSU to 1200W', correct: false },
        { text: 'D. Blow air into the CPU socket', correct: false }
      ],
      explanation: 'An unseated or floating M.2 NVMe drive prevents PCIe link enumeration during UEFI Stage 4 (BOOT). Securing the drive into the M-Key slot with the standoff screw provides ground continuity and bus detection.'
    },
    {
      id: 7,
      title: 'Ticket #07: Under-Load Power Crash (PSU Over-Current Trip)',
      symptom: 'Workstation boots to Windows cleanly, but running a 3D rendering benchmark causes the computer to instantly shut off with a click sound from the PSU.',
      telemetry: {
        qled: 'POST Passed -> Instant Hard Shutdown Under 100% Load',
        beep: 'Normal 1 Beep -> Click (OCP Trip)',
        dmm: 'Peak transient wattage exceeded PSU rated capacity (η_load > 115%)'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB2 = true;
        state.assembly.m2StorageSeated = true;
        state.assembly.m2ScrewSecured = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        state.assembly.cablePcieConnected = true;
        state.assembly.headerPwrSwConnected = true;
        // FAULT: Undersized 450W power supply in an RTX 4070/4090 rig!
        state.currentRig.psu = { id: 'psu_450w_bad', name: '450W 80+ White Generic', ratedWatts: 400, rail12VAmps: 30 };
      },
      options: [
        { text: 'A. Upgrade the power supply to a 750W+ 80+ Gold unit with sufficient +12V rail capacity', correct: true },
        { text: 'B. Remove one of the RAM sticks to save 3W of power', correct: false },
        { text: 'C. Apply liquid electric tape over the PSU exhaust', correct: false },
        { text: 'D. Turn off the front panel power LED', correct: false }
      ],
      explanation: 'Under heavy 3D load, high-TDP components and transient power spikes exceed the rated amperage of the 450W PSU, triggering the hardware Over-Current Protection (OCP) circuit to prevent thermal damage.'
    },
    {
      id: 8,
      title: 'Ticket #08: Single-Channel Bottleneck & Unused XMP/EXPO',
      symptom: 'Workstation operates normally, but benchmark scores show memory bandwidth is capped at 38 GB/s (half of expected 76 GB/s) and RAM speed is stuck at baseline 4800 MT/s.',
      telemetry: {
        qled: 'Normal Boot (All LEDs Pass)',
        beep: '1 Short Beep (Normal Pass)',
        dmm: 'Bus width = 64-bit (Single-Channel Mode: DIMM_A1 + DIMM_A2)'
      },
      setup(state) {
        state.psuRockerOn = true;
        state.assembly.standoffsInstalled = true;
        state.assembly.cpuSeated = true;
        state.assembly.cpuLatched = true;
        state.assembly.thermalPasteApplied = true;
        state.assembly.coolerPeelRemoved = true;
        state.assembly.coolerMounted = true;
        state.assembly.coolerFanPlugged = true;
        state.assembly.m2StorageSeated = true;
        state.assembly.m2ScrewSecured = true;
        state.assembly.gpuSeated = true;
        state.assembly.gpuLatched = true;
        state.assembly.cableAtx24Connected = true;
        state.assembly.cableEps8Connected = true;
        state.assembly.cablePcieConnected = true;
        state.assembly.headerPwrSwConnected = true;
        // FAULT: RAM in adjacent slots A1 + A2 (Single Channel) & XMP disabled
        state.assembly.ramSlotA1 = true;
        state.assembly.ramSlotA2 = true;
        state.assembly.ramSlotB1 = false;
        state.assembly.ramSlotB2 = false;
        state.xmpEnabled = false;
      },
      options: [
        { text: 'A. Move the stick from slot A1 to slot B2 (enabling A2+B2 Dual Channel) and turn ON XMP/EXPO in BIOS', correct: true },
        { text: 'B. Replace the M.2 NVMe SSD with a SATA mechanical hard drive', correct: false },
        { text: 'C. Increase the screen resolution', correct: false },
        { text: 'D. Disconnect the chassis fans', correct: false }
      ],
      explanation: 'Installing memory in adjacent slots A1 and A2 forces the memory controller into a single 64-bit channel. Spreading modules across primary channels A2 + B2 activates 128-bit dual-channel interleaving and enables EXPO/XMP 6000MT/s profiles.'
    }
  ];

  let currentTicketIdx = 0;
  let solvedTicketsCount = 0;
  let ticketAttempts = 0;
  let ticketCorrects = 0;

  // ══════════════════════════════════════════════════════════════════════════
  // 5. THERMODYNAMIC & ELECTRICAL CALCULATION ENGINES
  // ══════════════════════════════════════════════════════════════════════════
  function updateElectricalAndThermal(dtSeconds = 0.05) {
    const s = LabState;
    const rig = s.currentRig;

    // 1. Power draw calculation
    let pCpu = 0;
    let pGpu = 0;
    let pOther = 0;

    if (s.systemPowered) {
      // Base idle vs stress
      const stress = s.stressTestActive ? 1.0 : 0.15;
      pCpu = (rig.cpu.tdp * stress) + 12;
      pGpu = (rig.gpu.tdp * (s.stressTestActive ? 0.95 : 0.10)) + 10;
      pOther = 25 + (s.assembly.ramSlotA2 || s.assembly.ramSlotB2 ? 8 : 2) + 10; // MB + RAM + Fans
    }

    const totalWatts = Math.round(pCpu + pGpu + pOther);
    const ratedPsu = rig.psu.ratedWatts;
    const loadFactor = ((totalWatts / ratedPsu) * 100);

    // OCP Trip Check
    if (s.systemPowered && totalWatts > ratedPsu * 1.05) {
      logTerminal(`[CRITICAL OCP TRIP] Power draw (${totalWatts}W) exceeded rated capacity (${ratedPsu}W). Emergency shutdown!`, 'log-error');
      SoundFX.beep(200, 0.3);
      emergencyShutdown();
      return;
    }

    // 2. Thermodynamic lumped-capacitance model
    // C_th * dT/dt = P_cpu - (T_die - T_amb) / R_th
    const cTh = 85.0; // J / degC lumped heat capacity
    let rTh = s.rTim; // TIM resistance

    if (!s.assembly.coolerMounted) {
      rTh = 2.5; // Bare CPU heats up extremely fast
    } else if (!s.assembly.coolerPeelRemoved) {
      rTh = 0.92; // Plastic peel insulating barrier
    } else if (!s.assembly.thermalPasteApplied) {
      rTh = 0.45; // Dry metal-on-metal with air gaps
    } else {
      rTh = 0.05; // Optimal paste coverage
    }

    if (!s.assembly.coolerFanPlugged && s.assembly.coolerMounted) {
      rTh += 0.35; // Passive heatsink only
    }

    // Fan RPM proportional to temperature
    if (s.systemPowered && s.assembly.coolerFanPlugged) {
      const targetRpm = Math.min(rig.cooler.fanRpmMax, Math.max(600, (s.cpuDieTemp - 30) * 45));
      s.fanRpm += (targetRpm - s.fanRpm) * 0.1;
    } else {
      s.fanRpm = 0;
    }

    // Temperature delta
    const heatFluxOut = (s.cpuDieTemp - s.ambientTemp) / rTh;
    const heatFluxIn = s.systemPowered ? pCpu : 0;
    const dTemp = ((heatFluxIn - heatFluxOut) / cTh) * dtSeconds;
    s.cpuDieTemp += dTemp;

    // Safety thermal trip at 100°C
    if (s.systemPowered && s.cpuDieTemp >= 100.0) {
      logTerminal(`[THERMAL EMERGENCY] CPU Die Temperature hit 100.0°C! Thermal runaway trip triggered.`, 'log-error');
      SoundFX.beep(300, 0.4);
      emergencyShutdown();
    }

    // Record history for BIOS graph
    s.thermalHistory.push(s.cpuDieTemp);
    if (s.thermalHistory.length > 80) s.thermalHistory.shift();

    // Update telemetry indicators
    updateTelemetryDisplay(totalWatts, ratedPsu, loadFactor);
  }

  function updateTelemetryDisplay(totalWatts, ratedPsu, loadFactor) {
    const s = LabState;
    const tempEl = document.getElementById('live-cpu-temp');
    if (tempEl) {
      tempEl.textContent = `${s.cpuDieTemp.toFixed(1)} °C`;
      tempEl.className = `tele-val ${s.cpuDieTemp > 75 ? 'text-rose' : (s.cpuDieTemp > 50 ? 'text-amber' : 'text-emerald')}`;
    }

    const fanEl = document.getElementById('live-fan-rpm');
    if (fanEl) fanEl.textContent = `${Math.round(s.fanRpm)} RPM`;

    const pwrEl = document.getElementById('live-power-draw');
    if (pwrEl) pwrEl.textContent = `${totalWatts} W / ${ratedPsu} W`;

    const memEl = document.getElementById('live-mem-channel');
    if (memEl) {
      const hasA2 = s.assembly.ramSlotA2;
      const hasB2 = s.assembly.ramSlotB2;
      const hasA1 = s.assembly.ramSlotA1;
      const hasB1 = s.assembly.ramSlotB1;
      if (hasA2 && hasB2 && !hasA1 && !hasB1) {
        memEl.textContent = 'Dual-Channel (A2+B2)';
        memEl.className = 'tele-val text-emerald';
      } else if ((hasA1 && hasA2) || (hasB1 && hasB2)) {
        memEl.textContent = 'Single-Channel (Sub-optimal)';
        memEl.className = 'tele-val text-amber';
      } else if (hasA1 || hasA2 || hasB1 || hasB2) {
        memEl.textContent = 'Single Stick (64-bit)';
        memEl.className = 'tele-val text-sky';
      } else {
        memEl.textContent = 'None Installed';
        memEl.className = 'tele-val text-rose';
      }
    }

    // Update Power Tab values
    const calcWatts = document.getElementById('calc-total-watts');
    if (calcWatts) calcWatts.textContent = `${totalWatts} W`;
    const calcRated = document.getElementById('calc-rated-psu');
    if (calcRated) calcRated.textContent = `${ratedPsu} W`;
    const calcLoad = document.getElementById('calc-load-factor');
    if (calcLoad) calcLoad.textContent = `${loadFactor.toFixed(1)}% (${loadFactor > 95 ? 'Overloaded' : (loadFactor > 80 ? 'Heavy' : 'Optimal')})`;

    // Rail table breakdown
    const r12w = document.getElementById('rail-12v-watts');
    if (r12w) r12w.textContent = `${Math.round(totalWatts * 0.85)} W`;
    const r12a = document.getElementById('rail-12v-amps');
    if (r12a) r12a.textContent = `${((totalWatts * 0.85) / 12.0).toFixed(1)} A`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. POST STATE MACHINE EXECUTION & AUDITING
  // ══════════════════════════════════════════════════════════════════════════
  function runPostStateMachine() {
    const s = LabState;
    if (!s.psuRockerOn) {
      logTerminal('[POST FAIL] PSU Rocker Switch is OFF (0). No +5VSB standby rail.', 'log-warn');
      return;
    }
    if (!s.assembly.headerPwrSwConnected) {
      logTerminal('[POST FAIL] Chassis PWR_SW header is not bridged to pins 6 & 8.', 'log-warn');
      return;
    }

    logTerminal('[POST INIT] Front power switch activated. Starting hardware audit sweep...', 'log-info');
    s.systemPowered = true;
    s.postPassed = false;
    s.postError = null;

    // Reset Q-LEDs
    setQleds(false, false, false, false);
    document.getElementById('disp-post-stage').textContent = 'STAGE 1: CPU';

    // Stage 1: CPU Init
    setQleds(true, false, false, false); // CPU LED on
    setTimeout(() => {
      if (!s.systemPowered) return;

      if (!s.assembly.cpuSeated || !s.assembly.cpuLatched) {
        logTerminal('[POST STAGE 1 ERROR] CPU is missing or socket ZIF lever is unlatched!', 'log-error');
        SoundFX.postCpuBeep();
        s.postError = 'CPU_UNSEATED';
        return;
      }
      if (!s.assembly.cableEps8Connected) {
        logTerminal('[POST STAGE 1 ERROR] 8-Pin EPS CPU VRM 12V auxiliary power cable is unplugged!', 'log-error');
        SoundFX.postCpuBeep();
        s.postError = 'CPU_NO_EPS';
        return;
      }

      logTerminal('[POST STAGE 1 PASS] CPU VRM continuity verified. Core frequency calibrated.', 'log-success');

      // Stage 2: DRAM Memory Training
      document.getElementById('disp-post-stage').textContent = 'STAGE 2: DRAM';
      setQleds(false, true, false, false); // DRAM LED on

      setTimeout(() => {
        if (!s.systemPowered) return;

        const hasRam = s.assembly.ramSlotA1 || s.assembly.ramSlotA2 || s.assembly.ramSlotB1 || s.assembly.ramSlotB2;
        if (!hasRam) {
          logTerminal('[POST STAGE 2 ERROR] No memory modules detected in DIMM slots!', 'log-error');
          SoundFX.postDramBeep();
          s.postError = 'DRAM_MISSING';
          return;
        }

        logTerminal('[POST STAGE 2 PASS] SPD EEPROM read. Dual-channel memory timings trained.', 'log-success');

        // Stage 3: VGA Graphics Init
        document.getElementById('disp-post-stage').textContent = 'STAGE 3: VGA';
        setQleds(false, false, true, false); // VGA LED on

        setTimeout(() => {
          if (!s.systemPowered) return;

          // Check if GPU requires PCIe power
          const needsPciePower = s.currentRig.gpu.pciePower !== 'None';
          if (needsPciePower && (!s.assembly.gpuSeated || !s.assembly.gpuLatched)) {
            logTerminal('[POST STAGE 3 ERROR] Discrete graphics card unseated from PCIe x16 slot!', 'log-error');
            SoundFX.postGpuBeep();
            s.postError = 'GPU_UNSEATED';
            return;
          }
          if (needsPciePower && !s.assembly.cablePcieConnected) {
            logTerminal('[POST STAGE 3 ERROR] PCIe 8-Pin auxiliary cable disconnected from graphics card!', 'log-error');
            SoundFX.postGpuBeep();
            s.postError = 'GPU_NO_PCIE_POWER';
            return;
          }

          logTerminal('[POST STAGE 3 PASS] PCIe x16 link negotiated. VESA display handshake active.', 'log-success');

          // Stage 4: BOOT Device Handshake
          document.getElementById('disp-post-stage').textContent = 'STAGE 4: BOOT';
          setQleds(false, false, false, true); // BOOT LED on

          setTimeout(() => {
            if (!s.systemPowered) return;

            if (!s.assembly.m2StorageSeated || !s.assembly.m2ScrewSecured) {
              logTerminal('[POST STAGE 4 WARN] No bootable NVMe/SATA storage found. Halting at UEFI setup.', 'log-warn');
              SoundFX.beep(800, 0.2);
              s.postError = 'NO_BOOT_DRIVE';
              updateBiosScreen(false);
              return;
            }

            // ALL STAGES PASS!
            setQleds(false, false, false, false);
            s.postPassed = true;
            document.getElementById('disp-post-stage').textContent = 'BOOT PASS (UEFI)';
            logTerminal('[POST COMPLETE] ★ 1 Short Beep: All subsystems verified. Loading OS bootloader!', 'log-success');
            SoundFX.postPassBeep();
            updateBiosScreen(true);
            updateChecklist();
          }, 650);

        }, 650);

      }, 650);

    }, 650);
  }

  function setQleds(cpu, dram, vga, boot) {
    LabState.qleds = { cpu, dram, vga, boot };
    const elCpu = document.getElementById('qled-cpu');
    const elDram = document.getElementById('qled-dram');
    const elVga = document.getElementById('qled-vga');
    const elBoot = document.getElementById('qled-boot');

    if (elCpu) elCpu.className = `badge badge-qled ${cpu ? 'qled-red' : ''}`;
    if (elDram) elDram.className = `badge badge-qled ${dram ? 'qled-amber' : ''}`;
    if (elVga) elVga.className = `badge badge-qled ${vga ? 'qled-white' : ''}`;
    if (elBoot) elBoot.className = `badge badge-qled ${boot ? 'qled-green' : ''}`;
  }

  function emergencyShutdown() {
    const s = LabState;
    s.systemPowered = false;
    s.stressTestActive = false;
    setQleds(false, false, false, false);
    document.getElementById('disp-post-stage').textContent = 'TRIPPED / OFF';
    logTerminal('[POWER CUT] System main power rails extinguished.', 'log-dim');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7. MULTIMETER DMM LOGIC & MEASUREMENT
  // ══════════════════════════════════════════════════════════════════════════
  function evaluateDmmProbe(pointId) {
    const s = LabState;
    s.dmmTestPoint = pointId;
    const digitsEl = document.getElementById('dmm-lcd-digits');
    const modeEl = document.getElementById('dmm-lcd-mode');
    const statusEl = document.getElementById('dmm-lcd-status');
    const liveDmm = document.getElementById('live-dmm-val');

    SoundFX.dmmBeep();

    if (!pointId) {
      if (digitsEl) digitsEl.textContent = '+0.00 V';
      if (statusEl) statusEl.textContent = 'OPEN CIRCUIT';
      if (liveDmm) liveDmm.textContent = 'Probes Lifted';
      return;
    }

    let volts = 0.0;
    let label = '0.00 V';

    if (pointId === 'atx24_12v') {
      volts = s.systemPowered && s.assembly.cableAtx24Connected ? 12.08 : 0.0;
    } else if (pointId === 'atx24_5v') {
      volts = s.systemPowered && s.assembly.cableAtx24Connected ? 5.04 : 0.0;
    } else if (pointId === 'atx24_3v3') {
      volts = s.systemPowered && s.assembly.cableAtx24Connected ? 3.32 : 0.0;
    } else if (pointId === 'atx24_pson') {
      volts = s.psuRockerOn ? (s.systemPowered ? 0.08 : 3.4) : 0.0; // Low when active, High in standby
    } else if (pointId === 'atx24_5vsb') {
      volts = s.psuRockerOn ? 5.06 : 0.0; // Standby rail active whenever rocker is ON
    } else if (pointId === 'eps_12v') {
      volts = s.systemPowered && s.assembly.cableEps8Connected ? 12.12 : 0.0;
    } else if (pointId === 'pcie_12v') {
      volts = s.systemPowered && s.assembly.cablePcieConnected ? 12.05 : 0.0;
    } else if (pointId === 'pwr_sw') {
      volts = s.psuRockerOn ? 3.3 : 0.0;
    }

    label = `${volts >= 0 ? '+' : ''}${volts.toFixed(2)} V`;
    if (digitsEl) digitsEl.textContent = label;
    if (statusEl) statusEl.textContent = volts > 0.5 ? 'VOLTAGE NOMINAL' : 'RAIL DE-ENERGIZED';
    if (liveDmm) liveDmm.textContent = `${label} (${pointId})`;

    logTerminal(`[DMM PROBE] Placed on [${pointId}]: Measured ${label}`, 'log-info');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 8. CANVAS 2D WORKBENCH RENDERER (ATX Motherboard & Chassis)
  // ══════════════════════════════════════════════════════════════════════════
  const WorkbenchRenderer = {
    canvas: null,
    ctx: null,

    init(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
      }
    },

    setupEventListeners() {
      const c = this.canvas;
      if (!c) return;

      c.addEventListener('mousedown', (e) => {
        SoundFX.init();
        const rect = c.getBoundingClientRect();
        LabState.view.isPanning = true;
        LabState.view.dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      });

      window.addEventListener('mousemove', (e) => {
        if (!LabState.view.isPanning) return;
        const rect = c.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;
        const dx = curX - LabState.view.dragStart.x;
        const dy = curY - LabState.view.dragStart.y;
        LabState.view.panX += dx;
        LabState.view.panY += dy;
        LabState.view.dragStart = { x: curX, y: curY };
      });

      window.addEventListener('mouseup', () => {
        LabState.view.isPanning = false;
      });

      c.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;
        LabState.view.zoom = Math.min(3.5, Math.max(0.65, LabState.view.zoom * zoomDelta));
        document.getElementById('hud-zoom-val').textContent = `${Math.round(LabState.view.zoom * 100)}%`;
      }, { passive: false });
    },

    setZone(zone) {
      const v = LabState.view;
      v.zone = zone;
      if (zone === 'chassis') {
        v.panX = 0; v.panY = 0; v.zoom = 1.0;
      } else if (zone === 'cpu') {
        v.panX = -120; v.panY = -60; v.zoom = 1.8;
      } else if (zone === 'ram') {
        v.panX = -260; v.panY = -80; v.zoom = 1.9;
      } else if (zone === 'pcie') {
        v.panX = -120; v.panY = -240; v.zoom = 1.7;
      } else if (zone === 'fpanel') {
        v.panX = -320; v.panY = -310; v.zoom = 2.4;
      }
      document.getElementById('hud-zoom-val').textContent = `${Math.round(v.zoom * 100)}%`;
    },

    render() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const s = LabState;
      const a = s.assembly;

      ctx.clearRect(0, 0, w, h);

      // Deep studio workspace background
      ctx.fillStyle = '#020612';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // Apply pan & zoom matrix
      ctx.translate(w / 2 + s.view.panX, h / 2 + s.view.panY);
      ctx.scale(s.view.zoom, s.view.zoom);
      ctx.translate(-w / 2, -h / 2);

      // ── 1. Mid-Tower ATX Chassis Outer Frame ──
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, 30, 700, 460, 16);
      ctx.fill();
      ctx.stroke();

      // Top / Front Cable Grommets
      ctx.fillStyle = '#020617';
      ctx.fillRect(720, 60, 24, 80);
      ctx.fillRect(720, 180, 24, 100);
      ctx.fillRect(720, 320, 24, 80);

      // PSU Shroud at bottom
      ctx.fillStyle = '#090d16';
      ctx.fillRect(82, 410, 696, 78);
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 10px var(--font-mono)';
      ctx.fillText('PSU SHROUD & MODULAR CABLE BASEMENT [750W 80+ GOLD]', 100, 440);

      // Rear I/O Shield Cutout
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(80, 60, 20, 120);

      // ── 2. Motherboard PCB Substrate ──
      const mbX = 140, mbY = 60, mbW = 460, mbH = 340;
      ctx.fillStyle = a.standoffsInstalled ? '#062817' : '#081c12'; // Matte Emerald Green
      ctx.strokeStyle = a.standoffsInstalled ? '#10b981' : '#1e3a2b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(mbX, mbY, mbW, mbH, 8);
      ctx.fill();
      ctx.stroke();

      // 9 Brass Standoff Screws
      const standoffs = [
        [mbX + 15, mbY + 15], [mbX + mbW / 2, mbY + 15], [mbX + mbW - 15, mbY + 15],
        [mbX + 15, mbY + mbH / 2], [mbX + mbW / 2, mbY + mbH / 2], [mbX + mbW - 15, mbY + mbH / 2],
        [mbX + 15, mbY + mbH - 15], [mbX + mbW / 2, mbY + mbH - 15], [mbX + mbW - 15, mbY + mbH - 15]
      ];
      standoffs.forEach(([sx, sy]) => {
        ctx.fillStyle = a.standoffsInstalled ? '#f59e0b' : '#334155';
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
      });

      // Motherboard Model Label
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px var(--font-mono)';
      ctx.textAlign = 'left';
      ctx.fillText('PRO B650-P WIFI &bull; ATX MOTHERBOARD', mbX + 25, mbY + 30);

      // Active PCB Copper Trace Bus Glow
      if (s.systemPowered) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mbX + 120, mbY + 140); ctx.lineTo(mbX + 280, mbY + 140);
        ctx.moveTo(mbX + 180, mbY + 180); ctx.lineTo(mbX + 180, mbY + 260);
        ctx.moveTo(mbX + 280, mbY + 90);  ctx.lineTo(mbX + 410, mbY + 90);
        ctx.stroke();
      }

      // ── 3. CPU Socket & VRM Zone ──
      const cpuX = mbX + 120, cpuY = mbY + 80, cpuSize = 85;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(cpuX, cpuY, cpuSize, cpuSize);
      ctx.strokeRect(cpuX, cpuY, cpuSize, cpuSize);

      // Gold Triangle pin 1 mark (upper-left corner)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cpuX + 2, cpuY + 12);
      ctx.lineTo(cpuX + 12, cpuY + 2);
      ctx.lineTo(cpuX + 2, cpuY + 2);
      ctx.closePath();
      ctx.fill();

      // CPU Socket Retention Lever
      ctx.strokeStyle = a.cpuLatched ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cpuX + cpuSize + 4, cpuY + 10);
      ctx.lineTo(cpuX + cpuSize + 4, cpuY + cpuSize + (a.cpuLatched ? 0 : -20));
      ctx.stroke();

      // CPU Installed (IHS)
      if (a.cpuSeated) {
        ctx.fillStyle = '#64748b'; // Nickel-plated copper IHS
        ctx.fillRect(cpuX + 8, cpuY + 8, cpuSize - 16, cpuSize - 16);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText('RYZEN 7', cpuX + cpuSize / 2, cpuY + cpuSize / 2 - 2);
        ctx.fillText('7700X', cpuX + cpuSize / 2, cpuY + cpuSize / 2 + 10);

        // Thermal Paste Dot / Spread
        if (a.thermalPasteApplied && !a.coolerMounted) {
          ctx.fillStyle = '#94a3b8'; // Silver paste
          ctx.beginPath();
          ctx.arc(cpuX + cpuSize / 2, cpuY + cpuSize / 2, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cooler Mounted on CPU
      if (a.coolerMounted) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cpuX - 10, cpuY - 10, cpuSize + 20, cpuSize + 20, 8);
        ctx.fill(); ctx.stroke();

        // Cooler Fan Spinning Animation
        const angle = (Date.now() / 1000) * (s.fanRpm / 60) * Math.PI * 2;
        const cx = cpuX + cpuSize / 2;
        const cy = cpuY + cpuSize / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.arc(15, 0, 12, 0, Math.PI / 2);
          ctx.stroke();
        }
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px var(--font-sans)';
        ctx.fillText('CPU COOLER', cx, cy + 3);
      }

      // ── 4. DIMM Memory Slots (A1, A2, B1, B2) ──
      const dimmX = mbX + 260;
      const dimmSlots = [
        { name: 'DIMM_A1', y: mbY + 70, active: a.ramSlotA1, color: '#334155' },
        { name: 'DIMM_A2', y: mbY + 92, active: a.ramSlotA2, color: '#10b981' }, // Primary paired
        { name: 'DIMM_B1', y: mbY + 114, active: a.ramSlotB1, color: '#334155' },
        { name: 'DIMM_B2', y: mbY + 136, active: a.ramSlotB2, color: '#10b981' }  // Primary paired
      ];

      dimmSlots.forEach(slot => {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = slot.active ? '#10b981' : '#334155';
        ctx.lineWidth = 1.5;
        ctx.fillRect(dimmX, slot.y, 140, 16);
        ctx.strokeRect(dimmX, slot.y, 140, 16);

        // Latches on ends
        ctx.fillStyle = slot.active ? '#10b981' : '#f59e0b';
        ctx.fillRect(dimmX - 4, slot.y + 2, 4, 12);
        ctx.fillRect(dimmX + 140, slot.y + 2, 4, 12);

        if (slot.active) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(dimmX + 10, slot.y + 3, 120, 10);
          ctx.fillStyle = '#020617';
          ctx.font = 'bold 8px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.fillText(`DDR5 16GB [${slot.name}]`, dimmX + 70, slot.y + 11);
        } else {
          ctx.fillStyle = '#64748b';
          ctx.font = '8px var(--font-mono)';
          ctx.textAlign = 'center';
          ctx.fillText(slot.name, dimmX + 70, slot.y + 11);
        }
      });

      // ── 5. PCIe Expansion Slots & Discrete GPU ──
      const pcieX = mbX + 60, pcieY = mbY + 230;
      // PCIe x16 Slot 1
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = a.gpuSeated ? '#10b981' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(pcieX, pcieY, 220, 18);
      ctx.strokeRect(pcieX, pcieY, 220, 18);

      if (a.gpuSeated) {
        // Discrete Graphics Card Body
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = a.gpuLatched ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(pcieX - 20, pcieY - 10, 260, 50, 6);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText(s.currentRig.gpu.name, pcieX + 110, pcieY + 16);

        // GPU Twin Fans
        const gpuFanAngle = (Date.now() / 800) * (s.systemPowered ? 1 : 0);
        [pcieX + 40, pcieX + 180].forEach(gx => {
          ctx.save();
          ctx.translate(gx, pcieY + 24);
          ctx.rotate(gpuFanAngle);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        });
      }

      // M.2 NVMe Slot between CPU and PCIe
      const m2X = mbX + 100, m2Y = mbY + 185;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = a.m2StorageSeated ? '#10b981' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(m2X, m2Y, 110, 22);
      ctx.strokeRect(m2X, m2Y, 110, 22);

      if (a.m2StorageSeated) {
        ctx.fillStyle = '#047857';
        ctx.fillRect(m2X + 6, m2Y + 4, 98, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 8px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText('M.2 NVMe Gen4 2TB', m2X + 55, m2Y + 14);

        // Grounding standoff screw
        ctx.fillStyle = a.m2ScrewSecured ? '#f59e0b' : '#ef4444';
        ctx.beginPath(); ctx.arc(m2X + 102, m2Y + 11, 3.5, 0, Math.PI * 2); ctx.fill();
      }

      // ── 6. Power Cable Harness Wires ──
      // 24-Pin ATX Cable (Right Edge)
      const atx24X = mbX + mbW - 20, atx24Y = mbY + 80;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = a.cableAtx24Connected ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(atx24X, atx24Y, 16, 60);
      ctx.strokeRect(atx24X, atx24Y, 16, 60);

      if (a.cableAtx24Connected) {
        // Multi-colored sleeved bundle curving to basement
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(atx24X + 8, atx24Y + 30);
        ctx.bezierCurveTo(atx24X + 70, atx24Y + 30, atx24X + 60, 410, mbX + mbW - 50, 410);
        ctx.stroke();
      }

      // 8-Pin EPS CPU Cable (Top Left)
      const epsX = mbX + 30, epsY = mbY + 10;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = a.cableEps8Connected ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(epsX, epsY, 32, 16);
      ctx.strokeRect(epsX, epsY, 32, 16);

      if (a.cableEps8Connected) {
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(epsX + 16, epsY + 8);
        ctx.bezierCurveTo(epsX - 40, epsY + 8, 90, 380, 140, 410);
        ctx.stroke();
      }

      // Front Panel (F_PANEL) 9-Pin Header
      const fpanelX = mbX + mbW - 60, fpanelY = mbY + mbH - 30;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = a.headerPwrSwConnected ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.fillRect(fpanelX, fpanelY, 40, 18);
      ctx.strokeRect(fpanelX, fpanelY, 40, 18);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText('F_PANEL', fpanelX + 20, fpanelY + 12);

      // ── 7. Diagnostic Q-LEDs on Top-Right of Motherboard ──
      const qledStartX = mbX + mbW - 70, qledStartY = mbY + 40;
      const qleds = [
        { name: 'CPU', on: s.qleds.cpu, color: '#ef4444' },
        { name: 'DRAM', on: s.qleds.dram, color: '#f59e0b' },
        { name: 'VGA', on: s.qleds.vga, color: '#f8fafc' },
        { name: 'BOOT', on: s.qleds.boot, color: '#10b981' }
      ];
      qleds.forEach((q, idx) => {
        const qx = qledStartX + idx * 16;
        ctx.fillStyle = q.on ? q.color : '#1e293b';
        ctx.beginPath(); ctx.arc(qx, qledStartY, 3.5, 0, Math.PI * 2); ctx.fill();
        if (q.on) {
          ctx.strokeStyle = q.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // ── 8. Thermal IR Heatmap Overlay (if enabled) ──
      if (s.view.thermalOverlay) {
        ctx.save();
        const rad = 60;
        const grad = ctx.createRadialGradient(cpuX + cpuSize / 2, cpuY + cpuSize / 2, 5, cpuX + cpuSize / 2, cpuY + cpuSize / 2, rad);
        const heatRatio = Math.min(1.0, Math.max(0.0, (s.cpuDieTemp - 25) / 75));
        const color = heatRatio > 0.8 ? 'rgba(239, 68, 68, 0.65)' : (heatRatio > 0.4 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cpuX - 30, cpuY - 30, cpuSize + 60, cpuSize + 60);
        ctx.restore();
      }

      ctx.restore();
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 9. BIOS / UEFI SCREEN RENDERER & THERMAL GRAPH
  // ══════════════════════════════════════════════════════════════════════════
  function updateBiosScreen(postPass) {
    const s = LabState;
    const rig = s.currentRig;

    const cpuName = document.getElementById('bios-cpu-name');
    const cpuFreq = document.getElementById('bios-cpu-freq');
    const memSize = document.getElementById('bios-mem-size');
    const memMode = document.getElementById('bios-mem-mode');
    const xmpState = document.getElementById('bios-xmp-state');
    const gpuName = document.getElementById('bios-gpu-name');
    const bootDrive = document.getElementById('bios-boot-drive');

    if (!postPass) {
      if (cpuName) cpuName.textContent = 'Hardware Post Halted';
      if (bootDrive) bootDrive.textContent = 'No Boot Device Detected';
      return;
    }

    if (cpuName) cpuName.textContent = rig.cpu.name;
    if (cpuFreq) cpuFreq.textContent = s.stressTestActive ? rig.cpu.boostFreq : rig.cpu.baseFreq;

    // Memory sizing
    const sticks = (s.assembly.ramSlotA1 ? 1 : 0) + (s.assembly.ramSlotA2 ? 1 : 0) +
                   (s.assembly.ramSlotB1 ? 1 : 0) + (s.assembly.ramSlotB2 ? 1 : 0);
    const totalMb = sticks * 16384;
    if (memSize) memSize.textContent = `${totalMb} MB (${sticks * 16} GB DDR5)`;

    const isDual = s.assembly.ramSlotA2 && s.assembly.ramSlotB2;
    if (memMode) {
      memMode.textContent = isDual ? '128-Bit Dual-Channel Active' : '64-Bit Single-Channel';
      memMode.className = isDual ? 'text-emerald' : 'text-amber';
    }

    if (xmpState) {
      xmpState.textContent = s.xmpEnabled ? `ENABLED (EXPO-6000 30-38-38-96 1.35V)` : `DISABLED (Auto 4800 MT/s JEDEC)`;
      xmpState.className = s.xmpEnabled ? 'text-emerald' : 'text-amber';
    }

    if (gpuName) gpuName.textContent = s.assembly.gpuSeated ? rig.gpu.name : 'PCIe Display Error';
    if (bootDrive) bootDrive.textContent = s.assembly.m2StorageSeated ? `${rig.storage.name} (UEFI OS Loader)` : 'No Boot Volume';
  }

  function drawThermalGraph() {
    const canvas = document.getElementById('thermal-history-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const hist = LabState.thermalHistory;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000c2e';
    ctx.fillRect(0, 0, w, h);

    // Grid lines for 40C, 70C, 100C
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1;
    [40, 70, 100].forEach(temp => {
      const y = h - ((temp - 20) / 85) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.fillStyle = '#60a5fa'; ctx.font = '8px var(--font-mono)';
      ctx.fillText(`${temp}°C`, 4, y - 2);
    });

    if (hist.length < 2) return;

    // Plot temperature trace
    ctx.strokeStyle = LabState.cpuDieTemp > 75 ? '#ef4444' : '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const stepX = w / (hist.length - 1);
    hist.forEach((t, i) => {
      const x = i * stepX;
      const y = h - ((t - 20) / 85) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const curEl = document.getElementById('graph-cur-temp');
    if (curEl) {
      curEl.textContent = `${LabState.cpuDieTemp.toFixed(1)} °C`;
      curEl.className = LabState.cpuDieTemp > 75 ? 'text-rose' : 'text-emerald';
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 10. COMPONENT SHELF & DRAWER INTERACTION
  // ══════════════════════════════════════════════════════════════════════════
  const SHELF_ITEMS = {
    core: [
      { id: 'cpu', name: 'AMD Ryzen 7 7700X CPU', tag: 'AM5 &bull; 105W', desc: '8-Core Zen 4 processor with gold corner 1 triangle. Requires LGA socket clamp.' },
      { id: 'paste', name: 'Noctua NT-H1 Thermal Paste', tag: 'TIM &bull; 8.5W/mK', desc: 'Non-conductive silver-hybrid paste. Dispenses pea-sized dot onto IHS.' },
      { id: 'peel', name: 'Cooler Protective Plastic Peel', tag: 'Packaging', desc: 'Factory protective plastic film on heatsink copper base. MUST be peeled off.' },
      { id: 'cooler', name: 'Thermalright Dual-Tower Cooler', tag: '240W Capacity', desc: 'Heatsink + twin 120mm PWM fans. Connects to 4-Pin CPU_FAN header.' }
    ],
    memory: [
      { id: 'ram_a2', name: 'DDR5 16GB Stick 1 (Slot A2)', tag: '6000MT/s CL30', desc: 'Primary channel A module. Keyed notched pins.' },
      { id: 'ram_b2', name: 'DDR5 16GB Stick 2 (Slot B2)', tag: '6000MT/s CL30', desc: 'Primary channel B module. Enables 128-bit dual channel operation.' },
      { id: 'm2_ssd', name: 'Samsung 990 PRO 2TB M.2 SSD', tag: 'PCIe Gen4 x4', desc: 'High-speed NVMe solid-state storage. Placed at 30 deg angle and secured by screw.' }
    ],
    gpu: [
      { id: 'gpu_card', name: 'RTX 4070 12GB Graphics Card', tag: 'PCIe 5.0 x16', desc: 'Discrete graphics accelerator with PCIe retention latch and 8-Pin power port.' }
    ],
    cables: [
      { id: 'atx_24', name: 'Main ATX 24-Pin Power Harness', tag: '+12V/+5V/+3.3V', desc: 'Primary motherboard power delivery cable with locking clip.' },
      { id: 'eps_8', name: '8-Pin EPS CPU VRM 12V Cable', tag: 'CPU Core Power', desc: 'Auxiliary high-current cable plugged into upper-left VRM socket.' },
      { id: 'pcie_8', name: 'PCIe 8-Pin GPU Power Cable', tag: '150W auxiliary', desc: 'Supplies dedicated 12V power to discrete graphics card.' },
      { id: 'fpanel', name: 'Front Panel PWR_SW Header Wire', tag: 'Pin 6 & 8', desc: 'Chassis power button connector connecting to PS_ON# switch circuit.' }
    ]
  };

  function renderShelf(drawer) {
    const grid = document.getElementById('component-shelf-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const items = SHELF_ITEMS[drawer] || [];

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `comp-card ${item.id === LabState.selectedCompId ? 'selected' : ''}`;
      card.dataset.id = item.id;
      card.innerHTML = `
        <div class="comp-card-top">
          <span class="comp-title">${item.name}</span>
          <span class="comp-badge">${item.tag}</span>
        </div>
        <span class="comp-meta">${item.desc}</span>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.comp-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        LabState.selectedCompId = item.id;
        showComponentDetail(item);
      });
      grid.appendChild(card);
    });

    if (items.length > 0) {
      showComponentDetail(items[0]);
    }
  }

  function showComponentDetail(item) {
    const title = document.getElementById('detail-comp-title');
    const desc = document.getElementById('detail-comp-desc');
    if (title) title.textContent = item.name;
    if (desc) desc.textContent = item.desc;
  }

  function installSelectedPart() {
    const s = LabState;
    const id = s.selectedCompId;

    // Safety Check: ESD Wrist Strap
    if (!s.esdGrounded && (id === 'cpu' || id === 'ram_a2' || id === 'ram_b2')) {
      showCanvasAlert('⚠️ ESD Warning! Static charge (>3kV) detected. Ground wrist strap first!');
      logTerminal('[ESD VIOLATION] Attempted to handle sensitive silicon without grounded wrist strap!', 'log-warn');
      SoundFX.beep(400, 0.15);
      return;
    }

    SoundFX.snapClick();

    if (id === 'cpu') {
      s.assembly.cpuSeated = true;
      s.assembly.cpuLatched = true;
      logTerminal('CPU installed cleanly into AM5 socket. ZIF retention lever locked.', 'log-success');
    } else if (id === 'paste') {
      if (!s.assembly.cpuSeated) {
        showCanvasAlert('Cannot apply paste without CPU in socket!');
        return;
      }
      s.assembly.thermalPasteApplied = true;
      logTerminal('Thermal paste applied in optimal pea pattern onto CPU IHS.', 'log-info');
    } else if (id === 'peel') {
      s.assembly.coolerPeelRemoved = true;
      s.rTim = 0.05;
      logTerminal('Protective plastic peel sticker removed from cooler base.', 'log-success');
    } else if (id === 'cooler') {
      if (!s.assembly.cpuSeated) {
        showCanvasAlert('Install CPU before mounting cooler!');
        return;
      }
      s.assembly.coolerMounted = true;
      s.assembly.coolerFanPlugged = true;
      logTerminal('Heatsink mounted over CPU. 4-Pin fan plugged into CPU_FAN header.', 'log-success');
    } else if (id === 'ram_a2') {
      s.assembly.ramSlotA2 = true;
      logTerminal('DDR5 16GB seated firmly into primary paired slot DIMM_A2.', 'log-success');
    } else if (id === 'ram_b2') {
      s.assembly.ramSlotB2 = true;
      logTerminal('DDR5 16GB seated firmly into primary paired slot DIMM_B2 (Dual-Channel Ready).', 'log-success');
    } else if (id === 'm2_ssd') {
      s.assembly.m2StorageSeated = true;
      s.assembly.m2ScrewSecured = true;
      logTerminal('M.2 NVMe SSD installed into M-Key slot and secured with standoff screw.', 'log-success');
    } else if (id === 'gpu_card') {
      s.assembly.gpuSeated = true;
      s.assembly.gpuLatched = true;
      logTerminal('RTX 4070 graphics card seated into PCIe 5.0 x16 slot. Latch clicked.', 'log-success');
    } else if (id === 'atx_24') {
      s.assembly.cableAtx24Connected = true;
      logTerminal('Main 24-Pin ATX power harness connected to motherboard edge socket.', 'log-success');
    } else if (id === 'eps_8') {
      s.assembly.cableEps8Connected = true;
      logTerminal('8-Pin EPS CPU VRM power cable connected to top-left motherboard header.', 'log-success');
    } else if (id === 'pcie_8') {
      s.assembly.cablePcieConnected = true;
      logTerminal('Dedicated PCIe 8-Pin auxiliary cable connected to graphics card.', 'log-success');
    } else if (id === 'fpanel') {
      s.assembly.headerPwrSwConnected = true;
      logTerminal('Chassis PWR_SW jumper plugged into front panel header pins 6 & 8.', 'log-success');
    }

    updateChecklist();
  }

  function showCanvasAlert(text) {
    const el = document.getElementById('canvas-alert-banner');
    const txt = document.getElementById('alert-banner-text');
    if (!el || !txt) return;
    txt.textContent = text;
    el.classList.remove('hidden');

    if (window.anime) {
      anime({
        targets: el,
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 250,
        easing: 'easeOutElastic(1, .8)'
      });
    }

    setTimeout(() => {
      el.classList.add('hidden');
    }, 2800);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 11. AUDIT CHECKLIST MODULE
  // ══════════════════════════════════════════════════════════════════════════
  const CHECKLIST_ITEMS = [
    { id: 'chk_esd', title: '1. ESD Wrist Strap Grounding', check: (s) => s.esdGrounded },
    { id: 'chk_standoffs', title: '2. 9 Motherboard Standoffs', check: (s) => s.assembly.standoffsInstalled },
    { id: 'chk_cpu', title: '3. CPU ZIF Socket Mating', check: (s) => s.assembly.cpuSeated && s.assembly.cpuLatched },
    { id: 'chk_thermal', title: '4. Thermal Interface & Cooler', check: (s) => s.assembly.thermalPasteApplied && s.assembly.coolerMounted && s.assembly.coolerPeelRemoved },
    { id: 'chk_ram', title: '5. Dual-Channel RAM (A2+B2)', check: (s) => s.assembly.ramSlotA2 && s.assembly.ramSlotB2 },
    { id: 'chk_storage', title: '6. M.2 Storage & PCIe GPU', check: (s) => s.assembly.m2StorageSeated && s.assembly.gpuSeated },
    { id: 'chk_cables', title: '7. 24-Pin ATX & 8-Pin EPS Cables', check: (s) => s.assembly.cableAtx24Connected && s.assembly.cableEps8Connected },
    { id: 'chk_post', title: '8. Power ON & 1 Short Beep POST Pass', check: (s) => s.postPassed }
  ];

  function updateChecklist() {
    const s = LabState;
    const grid = document.getElementById('assembly-checklist-grid');
    if (!grid) return;
    grid.innerHTML = '';
    let completed = 0;

    CHECKLIST_ITEMS.forEach(item => {
      const isDone = item.check(s);
      if (isDone) completed++;
      const div = document.createElement('div');
      div.className = `chk-item ${isDone ? 'done' : ''}`;
      div.innerHTML = `
        <span class="chk-box">${isDone ? '&#10004;' : ''}</span>
        <span>${item.title}</span>
      `;
      grid.appendChild(div);
    });

    const countEl = document.getElementById('chk-completed-count');
    if (countEl) countEl.textContent = completed;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 12. LOG TERMINAL UTILITY
  // ══════════════════════════════════════════════════════════════════════════
  function logTerminal(text, typeClass = 'log-info') {
    const term = document.getElementById('terminal-event-log');
    if (!term) return;
    const line = document.createElement('div');
    line.className = `log-line ${typeClass}`;
    line.innerHTML = `&gt; ${text}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 13. TROUBLESHOOTING TICKETS UI CONTROLLER
  // ══════════════════════════════════════════════════════════════════════════
  function renderTicket(idx) {
    const t = TroubleshootingTickets[idx];
    if (!t) return;
    currentTicketIdx = idx;

    document.getElementById('ticket-number-badge').textContent = `TICKET #${t.id < 10 ? '0' + t.id : t.id} / 08`;
    document.getElementById('ticket-title').textContent = t.title;
    document.getElementById('ticket-symptom').textContent = t.symptom;

    document.getElementById('ticket-tele-qled').textContent = t.telemetry.qled;
    document.getElementById('ticket-tele-beep').textContent = t.telemetry.beep;
    document.getElementById('ticket-tele-dmm').textContent = t.telemetry.dmm;

    const optList = document.getElementById('ticket-options-list');
    optList.innerHTML = '';
    t.options.forEach((opt, oIdx) => {
      const btn = document.createElement('button');
      btn.className = 'ticket-opt-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        optList.querySelectorAll('.ticket-opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        t.selectedOption = oIdx;
      });
      optList.appendChild(btn);
    });

    document.getElementById('ticket-feedback-box').classList.add('hidden');
    document.getElementById('btn-next-ticket').classList.add('hidden');

    // Setup state for this ticket
    t.setup(LabState);
    updateChecklist();
    logTerminal(`[TICKET LOADED] Activated ${t.title}. Inspect telemetry and troubleshoot.`, 'log-info');
  }

  function submitTicketDiagnosis() {
    const t = TroubleshootingTickets[currentTicketIdx];
    if (!t || t.selectedOption === undefined) {
      showCanvasAlert('Please select a diagnosis option first!');
      return;
    }

    ticketAttempts++;
    const isCorrect = t.options[t.selectedOption].correct;
    const fbBox = document.getElementById('ticket-feedback-box');
    const optBtns = document.querySelectorAll('.ticket-opt-btn');

    if (isCorrect) {
      ticketCorrects++;
      optBtns[t.selectedOption].classList.add('correct');
      SoundFX.postPassBeep();
      fbBox.innerHTML = `<strong style="color:var(--accent-emerald);">&#10004; Correct Diagnosis!</strong> ${t.explanation}`;
      fbBox.classList.remove('hidden');
      document.getElementById('btn-next-ticket').classList.remove('hidden');

      // Auto-apply fix to system state
      if (t.id === 1) {
        LabState.psuRockerOn = true;
        LabState.assembly.headerPwrSwConnected = true;
      } else if (t.id === 2) {
        LabState.assembly.cableEps8Connected = true;
      } else if (t.id === 3) {
        LabState.assembly.ramSlotA1 = false;
        LabState.assembly.ramSlotA2 = true;
        LabState.assembly.ramSlotB2 = true;
      } else if (t.id === 4) {
        LabState.assembly.coolerPeelRemoved = true;
        LabState.rTim = 0.05;
      } else if (t.id === 5) {
        LabState.assembly.cablePcieConnected = true;
      } else if (t.id === 6) {
        LabState.assembly.m2StorageSeated = true;
        LabState.assembly.m2ScrewSecured = true;
      } else if (t.id === 7) {
        LabState.currentRig.psu = RIG_PRESETS.cad_rig.psu;
      } else if (t.id === 8) {
        LabState.assembly.ramSlotA1 = false;
        LabState.assembly.ramSlotB2 = true;
        LabState.xmpEnabled = true;
      }

      solvedTicketsCount++;
      document.getElementById('ticket-solved-count').textContent = solvedTicketsCount;
      document.getElementById('ticket-accuracy-val').textContent = `${Math.round((ticketCorrects / ticketAttempts) * 100)}%`;

      logTerminal(`[TICKET RESOLVED] Ticket #${t.id} successfully diagnosed and fixed!`, 'log-success');
      runPostStateMachine();
    } else {
      optBtns[t.selectedOption].classList.add('wrong');
      SoundFX.beep(250, 0.3);
      fbBox.innerHTML = `<strong style="color:var(--accent-rose);">&#10008; Incorrect.</strong> Review the telemetry clues, inspect probe readouts, or click Show Hint.`;
      fbBox.classList.remove('hidden');
      document.getElementById('ticket-accuracy-val').textContent = `${Math.round((ticketCorrects / ticketAttempts) * 100)}%`;
      logTerminal(`[DIAGNOSIS REJECTED] Selected diagnosis for Ticket #${t.id} failed verification.`, 'log-error');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 14. CERTIFICATION QUIZ MODULE (10 Real-World Questions)
  // ══════════════════════════════════════════════════════════════════════════
  const QuizModule = {
    score: 0,
    questions: [
      {
        q: '1. What is the primary purpose of wearing an anti-static wrist strap connected to unpainted chassis metal before handling computer hardware?',
        opts: [
          'A. To protect the user from 230V AC mains shock',
          'B. To equalize electrical potential and bleed off electrostatic charges (ESD > 3kV) safely',
          'C. To provide a high-frequency RF shield',
          'D. To improve CPU thermal conductivity'
        ],
        ans: 1,
        exp: 'Static electricity accumulated on the human body can exceed 3,000V—enough to burn through microscopic MOSFET gates—while being undetectable by touch.'
      },
      {
        q: '2. In modern dual-channel motherboards with 4 DIMM slots (A1, A2, B1, B2), why is slot pair A2 + B2 recommended over A1 + B1?',
        opts: [
          'A. Slots A2 and B2 run at higher voltage rails',
          'B. Daisy-chain trace topologies terminate at slots 2 and 4, preventing open-stub signal reflections',
          'C. Slots A1 and B1 are reserved strictly for ECC server memory',
          'D. Slot A1 physically blocks the CPU cooler'
        ],
        ans: 1,
        exp: 'In daisy-chain PCB layout, running signals past an empty second slot creates an open-stub reflection that degrades signal integrity at high DDR4/DDR5 frequencies.'
      },
      {
        q: '3. A computer powers on, CPU cooler fans spin at maximum RPM, but the motherboard diagnostic Q-LED halts at solid RED [CPU]. What is the most common assembly oversight?',
        opts: [
          'A. Front panel HDD LED is oriented backwards',
          'B. 8-Pin EPS auxiliary CPU power cable is unplugged from the upper-left VRM socket',
          'C. M.2 SSD heatsink is screwed too tightly',
          'D. Monitor refresh rate is set to 144Hz'
        ],
        ans: 1,
        exp: 'The 24-Pin ATX connector alone does not power the CPU VRM. The 8-pin EPS 12V cable is required to supply power to the processor core buck converters.'
      },
      {
        q: '4. What catastrophic failure occurs if a builder forgets to remove the transparent factory plastic warning sticker from the base of a CPU cooler?',
        opts: [
          'A. Cooler mounting screws will strip their threads',
          'B. Severe thermal insulation (R_th > 0.85 °C/W) causes rapid thermal runaway to 100°C within seconds of boot',
          'C. The BIOS will refuse to enter POST Stage 1',
          'D. Power supply Over-Current Protection trips instantly'
        ],
        ans: 1,
        exp: 'Plastic has an extremely low thermal conductivity (~0.2 W/m·K) compared to copper (~400 W/m·K), blocking heat transfer to the heatsink and causing thermal throttling.'
      },
      {
        q: '5. Which DC power supply voltage rail is continuously energized even when the desktop workstation is powered off, as long as the rear PSU rocker switch is ON?',
        opts: ['A. +12V Rail', 'B. -12V Rail', 'C. +5VSB (Standby) Rail', 'D. +3.3V Memory Rail'],
        ans: 2,
        exp: '+5VSB supplies continuous low-current power to the Super I/O chip and front-panel power switch circuitry to monitor the PWR_SW button press.'
      },
      {
        q: '6. When testing a standalone ATX power supply with a digital multimeter, which two pins on the 24-Pin harness must be bridged to turn on the main voltage rails?',
        opts: [
          'A. PS_ON# (Green wire, pin 16) and any Ground (Black wire)',
          'B. +12V (Yellow) and +5V (Red)',
          'C. Power Good (Gray) and +3.3V (Orange)',
          'D. +5VSB (Purple) and Chassis Frame'
        ],
        ans: 0,
        exp: 'Shorting PS_ON# to Ground pulls the active-low enable line to 0V, signaling the PSU internal controller to start the main switching transformers.'
      },
      {
        q: '7. What does a diagnostic BIOS beep code sequence of "1 Long Beep followed by 2 Short Beeps" typically represent on AMI / Award UEFI boards?',
        opts: [
          'A. Normal successful POST pass',
          'B. Memory (DRAM) parity / initialization error or unseated module',
          'C. CPU fan speed warning',
          'D. Hard drive sector failure'
        ],
        ans: 1,
        exp: '1 Long + 2 Short beeps indicates an unseated, incompatible, or defective RAM module failing initial memory training.'
      },
      {
        q: '8. Why does installing a discrete graphics card requiring 200W TDP into a PCIe x16 slot require external 8-Pin PCIe power cables?',
        opts: [
          'A. The motherboard PCIe x16 slot can only deliver a maximum of 75W of power',
          'B. The PCIe slot only supplies AC voltage',
          'C. PCIe slots are strictly data lines with zero power pins',
          'D. To cool down the motherboard chipset'
        ],
        ans: 0,
        exp: 'PCIe slot electrical specification restricts slot power to 75W maximum. Any graphics card exceeding 75W requires auxiliary 6-pin (75W) or 8-pin (150W) cables.'
      },
      {
        q: '9. When installing an LGA (Land Grid Array) CPU into a modern Intel or AMD AM5 socket, how does the technician guarantee correct pin alignment?',
        opts: [
          'A. Force the processor down until all pins compress',
          'B. Align the printed gold triangle on corner 1 of the CPU with the triangle marking on the socket',
          'C. Rotate the CPU until it snaps in any 90-degree orientation',
          'D. Align the CPU with the PCIe x16 slot'
        ],
        ans: 1,
        exp: 'LGA CPUs have asymmetrical keying notches and a distinct gold alignment triangle on corner 1 to prevent bent pins or short-circuit destruction.'
      },
      {
        q: '10. What is the primary purpose of motherboard standoffs installed inside the metal chassis tray before mounting the PCB?',
        opts: [
          'A. To improve Wi-Fi reception',
          'B. To elevate the motherboard so exposed rear solder leads do not short out against the bare metal tray',
          'C. To provide liquid cooling channels behind the motherboard',
          'D. To reduce fan noise vibrations'
        ],
        ans: 1,
        exp: 'Brass standoffs elevate the PCB ~6mm off the steel tray, preventing solder joints and through-hole leads from shorting to ground.'
      }
    ],

    init() {
      const container = document.getElementById('quiz-questions-list');
      if (!container) return;
      container.innerHTML = '';

      this.questions.forEach((qObj, qIdx) => {
        const item = document.createElement('div');
        item.className = 'quiz-item';
        item.innerHTML = `
          <div class="quiz-q-text">${qObj.q}</div>
          <div class="quiz-opt-list" id="q-opts-${qIdx}">
            ${qObj.opts.map((opt, oIdx) => `<button class="quiz-opt-btn" data-q="${qIdx}" data-o="${oIdx}">${opt}</button>`).join('')}
          </div>
          <div class="quiz-explanation" id="q-exp-${qIdx}">${qObj.exp}</div>
        `;
        container.appendChild(item);
      });

      container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const qIdx = parseInt(btn.dataset.q, 10);
          const oIdx = parseInt(btn.dataset.o, 10);
          this.answer(qIdx, oIdx);
        });
      });
    },

    answer(qIdx, oIdx) {
      const qObj = this.questions[qIdx];
      const optList = document.getElementById(`q-opts-${qIdx}`);
      if (!optList || optList.dataset.answered) return;
      optList.dataset.answered = 'true';

      const expEl = document.getElementById(`q-exp-${qIdx}`);
      const btns = optList.querySelectorAll('.quiz-opt-btn');

      if (oIdx === qObj.ans) {
        btns[oIdx].classList.add('correct');
        this.score++;
        SoundFX.postPassBeep();
      } else {
        btns[oIdx].classList.add('wrong');
        btns[qObj.ans].classList.add('correct');
        SoundFX.beep(250, 0.25);
      }

      if (expEl) expEl.style.display = 'block';
      const scoreVal = document.getElementById('quiz-score-val');
      if (scoreVal) scoreVal.textContent = this.score;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 15. MAIN APP CONTROLLER & DOM BINDINGS
  // ══════════════════════════════════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Canvas Renderer
    WorkbenchRenderer.init('pc-workbench-canvas');

    // 2. Initialize Sub-Engines
    renderShelf('core');
    updateChecklist();
    QuizModule.init();

    // 3. Platform Mode Switcher (Simulate | 3D Model | Theory | Quiz)
    const modeTabs = document.querySelectorAll('#mode-tabs .pill');
    modeTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        modeTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;

        document.getElementById('sim-wrapper').classList.toggle('hidden', mode !== 'simulate');
        document.getElementById('model3d-wrapper').classList.toggle('hidden', mode !== '3d-model');
        document.getElementById('explore-wrapper').classList.toggle('hidden', mode !== 'explore');
        document.getElementById('quiz-wrapper').classList.toggle('hidden', mode !== 'quiz');

        if (mode === '3d-model' && !window.three3DInitialized && typeof init3DModelViewer === 'function') {
          init3DModelViewer();
        }
      });
    });

    // 4. Submode Switcher (Guided Assembly | Sandbox | Troubleshooting)
    const subPills = document.querySelectorAll('#submode-tabs .sub-pill');
    subPills.forEach(pill => {
      pill.addEventListener('click', () => {
        subPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const sub = pill.dataset.submode;
        LabState.mode = sub;
        document.getElementById('disp-mode-name').textContent = pill.textContent.trim().replace(/^[^\w]+/, '');

        // Auto-switch right tab if tickets chosen
        if (sub === 'tickets') {
          switchRightTab('tab-tickets');
          renderTicket(0);
        } else {
          switchRightTab('tab-inventory');
        }
      });
    });

    // 5. Right Pane Tabs
    const rightTabs = document.querySelectorAll('#right-pane-tabs .tab-btn');
    rightTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchRightTab(tab.dataset.tab);
      });
    });

    function switchRightTab(targetTabId) {
      document.querySelectorAll('#right-pane-tabs .tab-btn').forEach(t => t.classList.toggle('active', t.dataset.tab === targetTabId));
      document.querySelectorAll('.viewport-card.right-card .tab-pane').forEach(p => p.classList.toggle('hidden', p.id !== targetTabId));
      if (targetTabId === 'tab-bios') {
        updateBiosScreen(LabState.postPassed);
      }
    }

    // 6. Drawer Pills in Shelf
    const drawerPills = document.querySelectorAll('#drawer-tabs .drawer-pill');
    drawerPills.forEach(pill => {
      pill.addEventListener('click', () => {
        drawerPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        LabState.selectedDrawer = pill.dataset.drawer;
        renderShelf(pill.dataset.drawer);
      });
    });

    // 7. Install Part Button
    document.getElementById('btn-install-part').addEventListener('click', () => {
      installSelectedPart();
    });

    // 8. Master Status Bar Controls
    document.getElementById('btn-toggle-esd').addEventListener('click', () => {
      SoundFX.init();
      LabState.esdGrounded = !LabState.esdGrounded;
      const statusEl = document.getElementById('disp-esd-status');
      const ind = document.getElementById('esd-indicator');
      if (LabState.esdGrounded) {
        statusEl.textContent = 'GROUNDED (0.0 V)';
        ind.className = 'chip-dot dot-green';
        logTerminal('[ESD SAFETY] Wrist strap attached to chassis frame. Static zeroed.', 'log-success');
      } else {
        statusEl.textContent = 'UNGROUNDED (3.2 kV)';
        ind.className = 'chip-dot dot-red';
        logTerminal('[ESD WARNING] Wrist strap detached. Potential static discharge risk.', 'log-warn');
      }
      updateChecklist();
    });

    document.getElementById('btn-psu-rocker').addEventListener('click', () => {
      SoundFX.init();
      SoundFX.snapClick();
      LabState.psuRockerOn = !LabState.psuRockerOn;
      const rockerEl = document.getElementById('disp-psu-switch');
      const ind = document.getElementById('psu-switch-indicator');
      if (LabState.psuRockerOn) {
        rockerEl.textContent = 'ON [I] (+5VSB Live)';
        ind.className = 'chip-dot dot-green';
        logTerminal('PSU Rocker Switch ON [I]. Standby +5VSB rail energized.', 'log-info');
      } else {
        rockerEl.textContent = 'OFF [O]';
        ind.className = 'chip-dot dot-slate';
        emergencyShutdown();
      }
    });

    document.getElementById('btn-chassis-power').addEventListener('click', () => {
      SoundFX.init();
      SoundFX.snapClick();
      runPostStateMachine();
    });

    document.getElementById('btn-emergency-stop').addEventListener('click', () => {
      emergencyShutdown();
    });

    // 9. Zoom Zone Buttons
    document.querySelectorAll('#zoom-presets-bar .btn-zoom-zone').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#zoom-presets-bar .btn-zoom-zone').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        WorkbenchRenderer.setZone(btn.dataset.zone);
      });
    });

    // 10. Canvas Floating HUD Buttons
    document.getElementById('btn-hud-zoom-in').addEventListener('click', () => {
      LabState.view.zoom = Math.min(3.5, LabState.view.zoom * 1.2);
      document.getElementById('hud-zoom-val').textContent = `${Math.round(LabState.view.zoom * 100)}%`;
    });
    document.getElementById('btn-hud-zoom-out').addEventListener('click', () => {
      LabState.view.zoom = Math.max(0.65, LabState.view.zoom * 0.83);
      document.getElementById('hud-zoom-val').textContent = `${Math.round(LabState.view.zoom * 100)}%`;
    });
    document.getElementById('btn-hud-reset').addEventListener('click', () => {
      WorkbenchRenderer.setZone('chassis');
    });
    document.getElementById('btn-hud-fit').addEventListener('click', () => {
      WorkbenchRenderer.setZone('chassis');
    });
    document.getElementById('btn-hud-thermal').addEventListener('click', (e) => {
      LabState.view.thermalOverlay = !LabState.view.thermalOverlay;
      e.target.style.background = LabState.view.thermalOverlay ? 'var(--accent-rose)' : 'transparent';
      e.target.style.color = LabState.view.thermalOverlay ? '#fff' : 'var(--accent-cyan)';
    });

    // 11. Multimeter DMM Probe Buttons
    document.querySelectorAll('.btn-probe').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-probe').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        evaluateDmmProbe(btn.dataset.probe);
      });
    });

    // DMM Mode Pills
    document.querySelectorAll('#dmm-mode-pills .dmm-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#dmm-mode-pills .dmm-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        LabState.dmmMode = pill.dataset.dmm;
        document.getElementById('dmm-lcd-mode').textContent = pill.textContent.toUpperCase();
        evaluateDmmProbe(LabState.dmmTestPoint);
      });
    });

    // 12. Maintenance Tool Buttons (Air, IPA, Peel, Paste)
    document.getElementById('btn-air-duster').addEventListener('click', () => {
      SoundFX.airBlast();
      logTerminal('[MAINTENANCE] Compressed air canister blast cleaned dust from DIMM and PCIe slots.', 'log-info');
    });

    document.getElementById('btn-ipa-swab').addEventListener('click', () => {
      SoundFX.snapClick();
      LabState.assembly.thermalPasteApplied = false;
      logTerminal('[MAINTENANCE] 99% Isopropyl Alcohol swab cleaned dried thermal interface paste.', 'log-info');
    });

    document.getElementById('btn-peel-sticker').addEventListener('click', () => {
      SoundFX.snapClick();
      LabState.assembly.coolerPeelRemoved = true;
      LabState.rTim = 0.05;
      logTerminal('[MAINTENANCE] Transparent plastic warning peel sticker removed from cooler base.', 'log-success');
    });

    document.getElementById('btn-thermal-paste').addEventListener('click', () => {
      SoundFX.snapClick();
      LabState.assembly.thermalPasteApplied = true;
      logTerminal('[MAINTENANCE] Fresh thermal paste applied onto CPU integrated heat spreader.', 'log-success');
    });

    // 13. BIOS Buttons (XMP, Stress, Reboot)
    document.getElementById('btn-toggle-xmp').addEventListener('click', () => {
      SoundFX.snapClick();
      LabState.xmpEnabled = !LabState.xmpEnabled;
      logTerminal(`[UEFI] EXPO / XMP memory profile ${LabState.xmpEnabled ? 'ENABLED (DDR5-6000 1.35V)' : 'DISABLED (JEDEC 4800)'}.`, 'log-info');
      updateBiosScreen(LabState.postPassed);
    });

    document.getElementById('btn-stress-cpu').addEventListener('click', (e) => {
      SoundFX.snapClick();
      LabState.stressTestActive = !LabState.stressTestActive;
      e.target.textContent = LabState.stressTestActive ? '⏹ Stop CPU Stress Test' : '🔥 Run CPU Stress Test (100% Load)';
      logTerminal(`[BENCHMARK] All CPU cores loaded to ${LabState.stressTestActive ? '100% TDP' : 'Idle 15%'}.`, 'log-info');
    });

    document.getElementById('btn-reboot-bios').addEventListener('click', () => {
      SoundFX.snapClick();
      runPostStateMachine();
    });

    // 14. Troubleshooting Ticket Buttons
    document.getElementById('btn-submit-ticket').addEventListener('click', submitTicketDiagnosis);

    document.getElementById('btn-hint-ticket').addEventListener('click', () => {
      const t = TroubleshootingTickets[currentTicketIdx];
      if (t) {
        showCanvasAlert(`Hint: Look closely at: ${t.telemetry.qled} and ${t.telemetry.dmm}`);
      }
    });

    document.getElementById('btn-next-ticket').addEventListener('click', () => {
      const nextIdx = (currentTicketIdx + 1) % TroubleshootingTickets.length;
      renderTicket(nextIdx);
    });

    // 15. Hardware Rig Preset Selector
    document.getElementById('rig-tier-select').addEventListener('change', (e) => {
      const rigKey = e.target.value;
      if (RIG_PRESETS[rigKey]) {
        LabState.currentRigKey = rigKey;
        LabState.currentRig = RIG_PRESETS[rigKey];
        logTerminal(`Loaded preset rig: ${LabState.currentRig.name}.`, 'log-info');
        updateChecklist();
      }
    });

    // 16. Sound Toggle
    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      SoundFX.toggle();
    });

    // 17. Clear Terminal Log
    document.getElementById('btn-clear-terminal').addEventListener('click', () => {
      const term = document.getElementById('terminal-event-log');
      if (term) term.innerHTML = '<div class="log-line log-dim">&gt; Terminal event log reset.</div>';
    });

    // 18. Default Start Conditions for Guided Assembly
    LabState.assembly.standoffsInstalled = true; // Motherboard pre-screwed into chassis standoffs

    // 19. 60 FPS Main Animation Loop
    function animationLoop() {
      updateElectricalAndThermal(0.04);
      WorkbenchRenderer.render();
      drawThermalGraph();
      requestAnimationFrame(animationLoop);
    }
    requestAnimationFrame(animationLoop);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 16. THREE.JS 3D MODEL VIEWER (Procedural Fallback + GLTF Loader)
  // ══════════════════════════════════════════════════════════════════════════
  function init3DModelViewer() {
    window.three3DInitialized = true;
    const canvas3d = document.getElementById('sim3d-canvas');
    const aside = document.getElementById('sim3d-components');
    if (!canvas3d || !window.THREE) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);

    const camera = new THREE.PerspectiveCamera(45, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 100);
    camera.position.set(3.5, 3.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
    renderer.setSize(canvas3d.clientWidth, canvas3d.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.4);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);

    // Procedural 3D Motherboard & Components Mesh Group
    const pcGroup = new THREE.Group();

    // 1. Motherboard PCB
    const pcbGeo = new THREE.BoxGeometry(3.0, 0.08, 2.4);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.name = 'Motherboard ATX PCB';
    pcGroup.add(pcbMesh);

    // 2. CPU Socket & Heatsink
    const cpuGeo = new THREE.BoxGeometry(0.7, 0.06, 0.7);
    const cpuMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const cpuMesh = new THREE.Mesh(cpuGeo, cpuMat);
    cpuMesh.position.set(-0.5, 0.07, -0.4);
    cpuMesh.name = 'LGA/AM5 CPU Socket & IHS';
    pcGroup.add(cpuMesh);

    // Cooler Heatsink Block
    const coolerGeo = new THREE.BoxGeometry(0.9, 0.8, 0.9);
    const coolerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
    const coolerMesh = new THREE.Mesh(coolerGeo, coolerMat);
    coolerMesh.position.set(-0.5, 0.5, -0.4);
    coolerMesh.name = 'Tower Cooler & Heatpipes';
    pcGroup.add(coolerMesh);

    // 3. DIMM Memory Slots (4 sticks)
    for (let i = 0; i < 4; i++) {
      const dimmGeo = new THREE.BoxGeometry(1.1, 0.25, 0.05);
      const dimmMat = new THREE.MeshStandardMaterial({ color: (i === 1 || i === 3) ? 0x0284c7 : 0x334155 });
      const dimmMesh = new THREE.Mesh(dimmGeo, dimmMat);
      dimmMesh.position.set(0.6, 0.16, -0.7 + i * 0.16);
      dimmMesh.name = `DIMM Slot ${i === 1 ? 'A2 (Active)' : (i === 3 ? 'B2 (Active)' : ['A1', 'A2', 'B1', 'B2'][i])}`;
      pcGroup.add(dimmMesh);
    }

    // 4. PCIe x16 GPU Card
    const gpuGeo = new THREE.BoxGeometry(2.2, 0.6, 0.3);
    const gpuMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
    gpuMesh.position.set(-0.2, 0.35, 0.6);
    gpuMesh.name = 'PCIe 5.0 x16 Graphics Card';
    pcGroup.add(gpuMesh);

    scene.add(pcGroup);

    // Populate Aside buttons
    if (aside) {
      aside.innerHTML = '';
      pcGroup.children.forEach(child => {
        const btn = document.createElement('button');
        btn.className = 'sim3d-comp';
        btn.textContent = child.name;
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sim3d-comp').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const originalColor = child.material.color.getHex();
          child.material.color.setHex(0x38bdf8);
          setTimeout(() => child.material.color.setHex(originalColor), 700);
        });
        aside.appendChild(btn);
      });
    }

    function animate3D() {
      requestAnimationFrame(animate3D);
      controls.update();
      renderer.render(scene, camera);
    }
    animate3D();
  }

})();
