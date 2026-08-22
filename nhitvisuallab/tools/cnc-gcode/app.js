(function () {
  'use strict';

  /* ================================================================
     DATA -- EXPLORE CONCEPTS
     ================================================================ */
  var CONCEPTS = [
    /* ── G-Codes ─────────────────────────────────────────────── */
    {
      id: 'g00', name: 'G00 — Rapid Positioning', symbol: 'G00 X_ Y_',
      formula: 'G00 X__ Y__', unit: 'mm or in',
      cat: 'gcodes',
      desc: 'G00 commands the tool to move to a specified position at the maximum traverse speed without cutting material. Rapid moves are used for repositioning the tool between cuts, approaching the workpiece, or returning to a safe clearance plane. The tool travels in a straight line (most controllers) at maximum speed. Rapid moves are typically shown as dashed lines in tool path displays because no material removal occurs.',
      codeExample: 'G90 G21          ; Absolute, metric\nG00 X50 Y30      ; Rapid to (50, 30)\nG00 X0 Y0        ; Rapid to origin',
      diagram: 'rapid',
      example: { problem: 'The tool is at (0, 0). Write a G00 command to rapidly position it at X=80, Y=45.', steps: ['G00 moves at max speed to a target position', 'Specify X and Y coordinates', 'G00 X80 Y45'], answer: 'G00 X80 Y45' }
    },
    {
      id: 'g01', name: 'G01 — Linear Interpolation', symbol: 'G01 X_ Y_ F_',
      formula: 'G01 X__ Y__ F__', unit: 'mm/min',
      cat: 'gcodes',
      desc: 'G01 moves the tool in a straight line from the current position to the specified endpoint at a controlled feed rate (F value). This is the primary cutting command used for straight-line machining. The feed rate determines how fast the tool moves through the material and directly affects surface finish and tool life. Unlike G00, G01 actively removes material and the feed rate must be appropriate for the material and tool being used.',
      codeExample: 'G01 X50 Y0 F200  ; Cut to (50,0) at 200 mm/min\nG01 X50 Y30 F200 ; Cut to (50,30)\nG01 X0 Y30 F200  ; Cut to (0,30)',
      diagram: 'linear',
      example: { problem: 'Write G-code to cut a straight line from the current position to (60, 25) at feed rate 150 mm/min.', steps: ['Use G01 for linear cutting move', 'Specify endpoint X=60, Y=25', 'Specify feed rate F=150', 'G01 X60 Y25 F150'], answer: 'G01 X60 Y25 F150' }
    },
    {
      id: 'g02', name: 'G02 — Clockwise Arc', symbol: 'G02 X_ Y_ I_ J_',
      formula: 'G02 X__ Y__ I__ J__', unit: 'mm',
      cat: 'gcodes',
      desc: 'G02 creates a clockwise circular arc from the current position to the specified endpoint (X, Y). The arc center is defined by I and J, which are the incremental offsets from the start point to the arc center. I is the X-offset and J is the Y-offset. The radius is the distance from the center to the start (or end) point. G02 is used for machining convex profiles, fillets, and circular features in the clockwise direction.',
      codeExample: '; Semicircle from (0,0) to (20,0)\n; Center at (10,0), radius 10\nG02 X20 Y0 I10 J0 F150',
      diagram: 'cwArc',
      example: { problem: 'From position (0, 0), write a G02 command to cut a clockwise semicircle to (30, 0) with the center at (15, 0).', steps: ['Endpoint: X=30, Y=0', 'Center offset I = 15-0 = 15', 'Center offset J = 0-0 = 0', 'G02 X30 Y0 I15 J0'], answer: 'G02 X30 Y0 I15 J0' }
    },
    {
      id: 'g03', name: 'G03 — Counter-Clockwise Arc', symbol: 'G03 X_ Y_ I_ J_',
      formula: 'G03 X__ Y__ I__ J__', unit: 'mm',
      cat: 'gcodes',
      desc: 'G03 creates a counter-clockwise (CCW) circular arc from the current position to the specified endpoint. Like G02, it uses I and J values to define the arc center as offsets from the start point. G03 is used for machining concave profiles, internal fillets, and circular pockets. The direction of the arc (CW vs CCW) determines which side of the material is cut, which is critical for climb milling vs conventional milling strategies.',
      codeExample: '; CCW semicircle from (0,0) to (20,0)\n; Center at (10,0), radius 10\nG03 X20 Y0 I10 J0 F150',
      diagram: 'ccwArc',
      example: { problem: 'From (10, 0), write a G03 command to cut a counter-clockwise arc to (0, 10) with center at (0, 0).', steps: ['Endpoint: X=0, Y=10', 'Center offset I = 0-10 = -10', 'Center offset J = 0-0 = 0', 'G03 X0 Y10 I-10 J0'], answer: 'G03 X0 Y10 I-10 J0' }
    },
    {
      id: 'g17-g19', name: 'G17/G18/G19 — Plane Select', symbol: 'G17 (XY)',
      formula: 'G17=XY  G18=XZ  G19=YZ', unit: '',
      cat: 'gcodes',
      desc: 'Plane selection commands define the plane in which circular interpolation (G02/G03) operates. G17 selects the XY plane (default for milling), G18 selects the XZ plane, and G19 selects the YZ plane. The plane selection determines which two axes define the arc and which axis is the perpendicular "depth" axis. Most 2.5D milling operations use G17 (XY plane) with Z as the tool axis.',
      codeExample: 'G17    ; Select XY plane (default)\nG18    ; Select XZ plane\nG19    ; Select YZ plane',
      diagram: 'planes',
      example: { problem: 'Which G-code selects the XY plane for circular interpolation in CNC milling?', steps: ['G17 = XY plane', 'G18 = XZ plane', 'G19 = YZ plane', 'Answer: G17'], answer: 'G17' }
    },
    {
      id: 'g20-g21', name: 'G20/G21 — Inch/Metric', symbol: 'G20/G21',
      formula: 'G20=inch  G21=mm', unit: '',
      cat: 'gcodes',
      desc: 'G20 sets the CNC controller to interpret all dimensions in inches, while G21 sets metric (millimeters). This command must be placed at the beginning of the program before any motion commands. Mixing units in a program causes dimensional errors. Most modern CNC machines default to G21 (metric) but it is best practice to explicitly declare the unit system in every program for safety.',
      codeExample: 'G21    ; All dimensions in mm\nG01 X50 Y30 F200\n; or\nG20    ; All dimensions in inches\nG01 X2.0 Y1.2 F8.0',
      diagram: 'units',
      example: { problem: 'Which G-code sets the CNC machine to work in millimeters?', steps: ['G20 = inches', 'G21 = millimeters', 'Answer: G21'], answer: 'G21' }
    },
    {
      id: 'g28', name: 'G28 — Return to Home', symbol: 'G28',
      formula: 'G28 X0 Y0', unit: '',
      cat: 'gcodes',
      desc: 'G28 commands the machine to return to its home (reference) position. The home position is a fixed machine coordinate set during machine setup. G28 first moves to an intermediate point (if X, Y values are specified) and then rapid-travels to the machine home. This command is used at the end of programs to park the tool safely, during tool changes, and for machine referencing. It is a rapid movement at maximum speed.',
      codeExample: 'G28 X0 Y0    ; Return to home via (0,0)\nG28          ; Return to home directly',
      diagram: 'home',
      example: { problem: 'What does the G28 command do in CNC machining?', steps: ['G28 returns the machine to its home position', 'It moves at rapid traverse speed', 'Used at end of program or during tool change'], answer: 'Returns to home position' }
    },
    {
      id: 'g90-g91', name: 'G90/G91 — Absolute/Incremental', symbol: 'G90/G91',
      formula: 'G90=absolute  G91=incremental', unit: '',
      cat: 'gcodes',
      desc: 'G90 sets absolute positioning mode where all coordinates are measured from a fixed origin (work coordinate system zero). G91 sets incremental mode where coordinates specify the distance and direction from the current position. For example, G90 G01 X50 moves to X=50 from origin, while G91 G01 X50 moves 50 units in the +X direction from wherever the tool currently is. Most CNC programs use G90 (absolute) as the default for clarity and safety.',
      codeExample: 'G90          ; Absolute mode\nG01 X50 Y30  ; Move to (50,30)\n\nG91          ; Incremental mode\nG01 X10 Y5   ; Move +10 in X, +5 in Y',
      diagram: 'absInc',
      example: { problem: 'In G91 incremental mode, if the tool is at (20, 30) and you command G01 X10 Y-5, where does the tool end up?', steps: ['Current position: (20, 30)', 'Incremental move: X+10, Y-5', 'New position: (20+10, 30-5) = (30, 25)'], answer: '(30, 25)' }
    },
    {
      id: 'g40-g42', name: 'G40/G41/G42 — Cutter Comp', symbol: 'G41/G42',
      formula: 'G41=left  G42=right  G40=cancel', unit: '',
      cat: 'gcodes',
      desc: 'Cutter radius compensation offsets the tool path to account for the actual tool diameter. G41 applies left cutter compensation (tool moves to the left of the programmed path), G42 applies right compensation, and G40 cancels compensation. This allows the programmer to define the finished part geometry while the controller automatically adjusts the path based on the tool radius stored in the tool offset table.',
      codeExample: 'G41 D01      ; Left comp, tool 01 radius\nG01 X50 Y0   ; Cut with comp active\nG40          ; Cancel compensation',
      diagram: 'cutterComp',
      example: { problem: 'What does G41 cutter compensation do?', steps: ['G41 activates left cutter compensation', 'Tool path shifts left of programmed path', 'Offset distance = tool radius from offset table', 'G40 cancels compensation'], answer: 'Left cutter radius compensation' }
    },

    /* ── M-Codes ─────────────────────────────────────────────── */
    {
      id: 'm00', name: 'M00 — Program Stop', symbol: 'M00',
      formula: 'M00', unit: '',
      cat: 'mcodes',
      desc: 'M00 causes an unconditional program stop. The spindle, coolant, and feed are stopped. The operator must press Cycle Start to resume the program. This is used for mid-program inspection, manual measurement, chip clearing, or any situation where the operator needs to intervene before the program continues.',
      codeExample: 'G01 X50 Y30 F200\nM00    ; Stop for inspection\nG01 X80 Y30 F200',
      diagram: 'stop',
      example: { problem: 'Which M-code causes an unconditional program stop requiring the operator to press Cycle Start?', steps: ['M00 = unconditional program stop', 'M01 = optional stop (only if switch is on)', 'Answer: M00'], answer: 'M00' }
    },
    {
      id: 'm03', name: 'M03 — Spindle ON (CW)', symbol: 'M03 S__',
      formula: 'M03 S3000', unit: 'RPM',
      cat: 'mcodes',
      desc: 'M03 starts the spindle rotating clockwise at the speed specified by the S word (in RPM). This is the standard spindle direction for right-hand cutting tools. The spindle must be started before any cutting operations begin. M03 is typically placed after the tool change command and before the first cutting move. The S value sets the spindle speed in revolutions per minute.',
      codeExample: 'M03 S3000    ; Spindle ON clockwise at 3000 RPM\nG01 X50 F200 ; Now cut with spindle running\nM05          ; Spindle OFF',
      diagram: 'spindleCW',
      example: { problem: 'Write the command to start the spindle clockwise at 2500 RPM.', steps: ['M03 starts spindle clockwise', 'S word specifies RPM', 'M03 S2500'], answer: 'M03 S2500' }
    },
    {
      id: 'm04', name: 'M04 — Spindle ON (CCW)', symbol: 'M04 S__',
      formula: 'M04 S2000', unit: 'RPM',
      cat: 'mcodes',
      desc: 'M04 starts the spindle rotating counter-clockwise. This is used with left-hand cutting tools or for specific operations like left-hand tapping. The S word specifies the speed in RPM, the same as M03. Counter-clockwise rotation is less common but essential for certain specialized machining operations.',
      codeExample: 'M04 S2000    ; Spindle ON counter-clockwise\n; Used for left-hand tools',
      diagram: 'spindleCCW',
      example: { problem: 'What is the difference between M03 and M04?', steps: ['M03 = spindle clockwise (CW)', 'M04 = spindle counter-clockwise (CCW)', 'Both use S word for RPM'], answer: 'M03=CW, M04=CCW' }
    },
    {
      id: 'm05', name: 'M05 — Spindle OFF', symbol: 'M05',
      formula: 'M05', unit: '',
      cat: 'mcodes',
      desc: 'M05 stops the spindle rotation. It should be commanded after all cutting operations are complete, before tool changes, and at the end of the program. The spindle will coast to a stop (decelerate). M05 does not specify a direction — it simply stops whatever rotation is active (CW or CCW).',
      codeExample: 'M03 S3000    ; Spindle ON\nG01 X50 F200 ; Cut\nM05          ; Spindle OFF',
      diagram: 'spindleOff',
      example: { problem: 'Which M-code stops the spindle?', steps: ['M03 = spindle CW ON', 'M04 = spindle CCW ON', 'M05 = spindle OFF', 'Answer: M05'], answer: 'M05' }
    },
    {
      id: 'm06', name: 'M06 — Tool Change', symbol: 'M06 T__',
      formula: 'M06 T01', unit: '',
      cat: 'mcodes',
      desc: 'M06 commands an automatic tool change (ATC). The T word specifies the tool number from the magazine. Before calling M06, the spindle must be stopped (M05) and the tool should be at a safe position (G28). After the tool change, the new tool offsets are loaded and the spindle is restarted for the next operation.',
      codeExample: 'M05          ; Stop spindle\nG28          ; Go home\nM06 T02      ; Change to tool 2\nM03 S2500    ; Start spindle',
      diagram: 'toolChange',
      example: { problem: 'Write the sequence to change to tool number 3.', steps: ['Stop spindle: M05', 'Return home: G28', 'Tool change: M06 T03', 'Restart spindle: M03 S___'], answer: 'M06 T03' }
    },
    {
      id: 'm08-m09', name: 'M08/M09 — Coolant', symbol: 'M08/M09',
      formula: 'M08=ON  M09=OFF', unit: '',
      cat: 'mcodes',
      desc: 'M08 turns the coolant supply on, and M09 turns it off. Coolant (cutting fluid) serves multiple purposes: cooling the tool and workpiece, lubricating the cutting zone, flushing chips away, and improving surface finish. M08 should be activated after the spindle is running and before cutting begins. M09 should be called after cutting is complete, before tool changes.',
      codeExample: 'M03 S3000    ; Spindle ON\nM08          ; Coolant ON\nG01 X50 F200 ; Cut with coolant\nM09          ; Coolant OFF\nM05          ; Spindle OFF',
      diagram: 'coolant',
      example: { problem: 'Which M-code turns the coolant on?', steps: ['M08 = coolant ON', 'M09 = coolant OFF', 'Answer: M08'], answer: 'M08' }
    },
    {
      id: 'm30', name: 'M30 — Program End', symbol: 'M30',
      formula: 'M30', unit: '',
      cat: 'mcodes',
      desc: 'M30 signals the end of the CNC program and resets the program to the beginning. It stops the spindle, turns off the coolant, and rewinds the program counter to line 1. M30 is placed as the last line of every CNC program. Some machines use M02 for program end without rewind, but M30 (end and rewind) is the most common practice.',
      codeExample: 'G00 X0 Y0    ; Return to start\nM05          ; Spindle OFF\nM09          ; Coolant OFF\nM30          ; Program END',
      diagram: 'progEnd',
      example: { problem: 'What is the difference between M02 and M30?', steps: ['M02 = program end (no rewind)', 'M30 = program end + rewind to start', 'M30 is more commonly used'], answer: 'M30 ends and rewinds' }
    },

    /* ── Programming Concepts ────────────────────────────────── */
    {
      id: 'coord-sys', name: 'Coordinate Systems', symbol: 'WCS',
      formula: 'Machine vs Work Coordinates', unit: '',
      cat: 'concepts',
      desc: 'CNC machines use two coordinate systems. The Machine Coordinate System (MCS) has its origin at a fixed point on the machine (usually the home position). The Work Coordinate System (WCS) has its origin set by the operator at a convenient point on the workpiece (usually a corner or center). Work offsets (G54-G59) store the relationship between MCS and WCS. Programming is done in WCS coordinates for clarity.',
      codeExample: 'G54          ; Select work offset 1\nG90 G21      ; Absolute, metric\nG00 X0 Y0    ; Go to WCS origin',
      diagram: 'coordSys',
      example: { problem: 'What is the purpose of work offsets (G54-G59)?', steps: ['Work offsets define the relationship between machine coordinates and work coordinates', 'G54 is the first (default) work offset', 'The offset stores the XYZ distance from machine home to work zero'], answer: 'Define WCS origin position' }
    },
    {
      id: 'arc-center', name: 'Arc Center Method (I, J)', symbol: 'I, J',
      formula: 'I = Xcenter - Xstart, J = Ycenter - Ystart', unit: 'mm',
      cat: 'concepts',
      desc: 'The I, J method specifies arc center as incremental offsets from the start point. I is the X-distance and J is the Y-distance from the current tool position to the arc center. This is the most common method for defining arcs in CNC. For example, if the tool is at (0, 0) and the arc center is at (15, 0), then I=15 and J=0. The radius is automatically calculated as the distance from center to start point.',
      codeExample: '; From (0,0), arc to (20,0), center at (10,0)\n; I = 10-0 = 10, J = 0-0 = 0\nG02 X20 Y0 I10 J0 F150\n\n; From (0,0), arc to (0,20), center at (0,10)\n; I = 0-0 = 0, J = 10-0 = 10\nG03 X0 Y20 I0 J10 F150',
      diagram: 'arcCenter',
      example: { problem: 'From position (10, 20), the arc center is at (25, 20). What are the I and J values?', steps: ['I = Xcenter - Xstart = 25 - 10 = 15', 'J = Ycenter - Ystart = 20 - 20 = 0', 'I = 15, J = 0'], answer: 'I=15, J=0' }
    },
    {
      id: 'feedrate', name: 'Feed Rate Override', symbol: 'F (mm/min)',
      formula: 'Feed = RPM x teeth x chip_load', unit: 'mm/min',
      cat: 'concepts',
      desc: 'Feed rate (F value) specifies how fast the tool moves through the material during cutting, measured in mm/min (G21) or in/min (G20). The optimal feed rate depends on material hardness, tool diameter, number of flutes, desired chip load, and surface finish requirements. The formula is F = N x z x fz, where N = spindle RPM, z = number of teeth, fz = chip load per tooth. CNC machines have a feed rate override dial (0-200%) that lets the operator adjust the programmed feed in real time.',
      codeExample: 'G01 X50 F200   ; 200 mm/min\nG01 Y30 F100   ; Reduced to 100\nG01 X0 F200    ; Back to 200',
      diagram: 'feedRate',
      example: { problem: 'Calculate the feed rate for a 4-flute end mill at 3000 RPM with 0.05 mm chip load per tooth.', steps: ['F = N x z x fz', 'F = 3000 x 4 x 0.05', 'F = 600 mm/min'], answer: '600 mm/min' }
    },
    {
      id: 'canned-cycles', name: 'Canned Cycles', symbol: 'G81-G89',
      formula: 'G81 X_ Y_ Z_ R_ F_', unit: '',
      cat: 'concepts',
      desc: 'Canned cycles are modal pre-programmed sequences for hole-making operations. This simulator supports G81 (basic drilling), G83 (peck drilling with full retract for chip clearing), G73 (high-speed peck with partial retract), and G84 (tapping). Each cycle specifies the hole position (X, Y), depth (Z), retract plane (R), and feed rate (F). G83 and G73 also require Q (peck increment depth). Once defined, subsequent lines with only X/Y coordinates automatically repeat the cycle at each new position. G80 cancels any active cycle. Drill holes are shown as purple circle markers with crosshairs on the canvas.',
      codeExample: '; Peck drill 3 holes, Q=5mm per peck\nG83 X20 Y20 Z-20 R3 Q5 F60\nX40 Y20     ; 2nd hole (cycle repeats)\nX60 Y20     ; 3rd hole\nG80         ; Cancel cycle',
      diagram: 'cannedCycle',
      example: { problem: 'What G-code is used for peck drilling (with full retract between pecks)?', steps: ['G81 = basic drilling (single plunge)', 'G83 = peck drilling (retract fully for chip clearing)', 'G73 = high-speed peck (partial retract)', 'Answer: G83'], answer: 'G83' }
    },
    {
      id: 'tool-offsets', name: 'Tool Length Offset', symbol: 'G43 H__',
      formula: 'G43 H01 Z50', unit: 'mm',
      cat: 'concepts',
      desc: 'Tool length compensation (G43) adjusts the Z-axis position based on the measured length of each tool. Since different tools have different lengths, the controller must know each tool\'s length to position the cutting tip correctly. H specifies the offset number (usually matching the tool number). G43 adds the offset, G44 subtracts it, and G49 cancels tool length compensation. Tool lengths are measured and stored in the offset table during setup.',
      codeExample: 'M06 T01        ; Change to tool 1\nG43 H01 Z50    ; Apply tool length offset\nG01 Z-5 F100   ; Plunge cut\nG49            ; Cancel offset',
      diagram: 'toolOffset',
      example: { problem: 'What does G43 H02 do?', steps: ['G43 activates tool length compensation', 'H02 references offset number 2', 'The Z position is adjusted by the stored offset value'], answer: 'Applies tool 2 length offset' }
    }
  ];

  /* ================================================================
     EXAMPLE G-CODE PROGRAMS
     ================================================================ */
  var EXAMPLES = {
    square: [
      '; Square Profile - 50x50 mm',
      'G90 G21 G17      ; Absolute, metric, XY plane',
      'M03 S3000         ; Spindle ON CW at 3000 RPM',
      'G00 X0 Y0         ; Rapid to start',
      'G01 X50 Y0 F200   ; Cut right',
      'G01 X50 Y50 F200  ; Cut up',
      'G01 X0 Y50 F200   ; Cut left',
      'G01 X0 Y0 F200    ; Cut down to close',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    circle: [
      '; Full Circle - Radius 25 mm',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S2500          ; Spindle ON CW',
      'G00 X25 Y0         ; Rapid to start (right of center)',
      'G02 X25 Y0 I-25 J0 F150  ; Full CW circle, center at origin',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    pocket: [
      '; Rectangular Pocket - 60x40 mm, 3 passes',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S3000          ; Spindle ON CW',
      'G00 X5 Y5          ; Rapid to start (offset)',
      '; Pass 1 - Outer',
      'G01 X55 Y5 F180    ; Cut right',
      'G01 X55 Y35 F180   ; Cut up',
      'G01 X5 Y35 F180    ; Cut left',
      'G01 X5 Y5 F180     ; Cut down',
      '; Pass 2 - Middle',
      'G01 X15 Y12 F180   ; Approach',
      'G01 X45 Y12 F180   ; Cut right',
      'G01 X45 Y28 F180   ; Cut up',
      'G01 X15 Y28 F180   ; Cut left',
      'G01 X15 Y12 F180   ; Cut down',
      '; Pass 3 - Center line',
      'G01 X25 Y20 F180   ; Approach center',
      'G01 X35 Y20 F180   ; Cut center',
      'G00 X0 Y0          ; Rapid to origin',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    contour: [
      '; Complex Contour - Lines and Arcs',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S2800          ; Spindle ON CW',
      'G00 X0 Y0          ; Rapid to origin',
      'G01 X40 Y0 F200    ; Straight right',
      'G02 X50 Y10 I0 J10 F150  ; CW arc, quarter circle',
      'G01 X50 Y30 F200   ; Straight up',
      'G03 X40 Y40 I-10 J0 F150 ; CCW arc, quarter circle',
      'G01 X20 Y40 F200   ; Straight left',
      'G02 X10 Y30 I0 J-10 F150 ; CW arc, quarter circle',
      'G01 X10 Y20 F200   ; Straight down',
      'G03 X0 Y10 I-10 J0 F150  ; CCW arc, quarter circle',
      'G01 X0 Y0 F200     ; Close contour',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    roundedrect: [
      '; Rounded Rectangle - 60x40 mm, R5 fillets',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S2800          ; Spindle ON CW',
      'G00 X5 Y0          ; Rapid to start',
      'G01 X55 Y0 F200    ; Bottom edge',
      'G02 X60 Y5 I0 J5 F150    ; Bottom-right fillet',
      'G01 X60 Y35 F200   ; Right edge',
      'G02 X55 Y40 I-5 J0 F150  ; Top-right fillet',
      'G01 X5 Y40 F200    ; Top edge',
      'G02 X0 Y35 I0 J-5 F150   ; Top-left fillet',
      'G01 X0 Y5 F200     ; Left edge',
      'G02 X5 Y0 I5 J0 F150     ; Bottom-left fillet',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    triangle: [
      '; Equilateral Triangle - 50 mm sides',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S3000          ; Spindle ON CW',
      'G00 X0 Y0          ; Rapid to start',
      'G01 X50 Y0 F200    ; Base - cut right',
      'G01 X25 Y43.3 F200 ; Right side to apex',
      'G01 X0 Y0 F200     ; Left side - close',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    hexagon: [
      '; Regular Hexagon - 25 mm circumradius',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S2800          ; Spindle ON CW',
      'G00 X55 Y30        ; Rapid to first vertex',
      'G01 X42.5 Y51.7 F200  ; Side 1',
      'G01 X17.5 Y51.7 F200  ; Side 2',
      'G01 X5 Y30 F200       ; Side 3',
      'G01 X17.5 Y8.3 F200   ; Side 4',
      'G01 X42.5 Y8.3 F200   ; Side 5',
      'G01 X55 Y30 F200      ; Side 6 - close',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    slot: [
      '; Oblong Slot - 20x60 mm',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S2500          ; Spindle ON CW',
      'G00 X35 Y10        ; Rapid to start',
      'G01 X35 Y50 F200   ; Right side up',
      'G03 X15 Y50 I-10 J0 F150  ; Top semicircle CCW',
      'G01 X15 Y10 F200   ; Left side down',
      'G03 X35 Y10 I10 J0 F150   ; Bottom semicircle CCW',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),
    steps: [
      '; Step Profile - 3 ascending steps',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S3000          ; Spindle ON CW',
      'G00 X0 Y0          ; Rapid to start',
      'G01 X0 Y15 F200    ; Step 1 riser',
      'G01 X20 Y15 F200   ; Step 1 tread',
      'G01 X20 Y30 F200   ; Step 2 riser',
      'G01 X40 Y30 F200   ; Step 2 tread',
      'G01 X40 Y45 F200   ; Step 3 riser',
      'G01 X60 Y45 F200   ; Step 3 tread',
      'G01 X60 Y0 F200    ; Drop to base',
      'G01 X0 Y0 F200     ; Return to start',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),

    bolthole: [
      '; Bolt Hole Circle - 6 Holes on PCD 40mm',
      'G90 G21 G17',
      'M03 S3000',
      'G00 X20 Y0          ; Hole 1 (0 deg)',
      'G02 X20 Y0 I-3 J0 F100',
      'G00 X10 Y17.321     ; Hole 2 (60 deg)',
      'G02 X10 Y17.321 I-3 J0 F100',
      'G00 X-10 Y17.321    ; Hole 3 (120 deg)',
      'G02 X-10 Y17.321 I-3 J0 F100',
      'G00 X-20 Y0         ; Hole 4 (180 deg)',
      'G02 X-20 Y0 I-3 J0 F100',
      'G00 X-10 Y-17.321   ; Hole 5 (240 deg)',
      'G02 X-10 Y-17.321 I-3 J0 F100',
      'G00 X10 Y-17.321    ; Hole 6 (300 deg)',
      'G02 X10 Y-17.321 I-3 J0 F100',
      'G00 X0 Y0',
      'M05',
      'M30'
    ].join('\n'),

    facemilling: [
      '; Face Milling - 60x40mm, 10mm Stepover',
      'G90 G21 G17',
      'M03 S2000',
      'G00 X-5 Y0',
      'G01 X65 Y0 F300     ; Pass 1 right',
      'G01 X65 Y10 F300',
      'G01 X-5 Y10 F300    ; Pass 2 left',
      'G01 X-5 Y20 F300',
      'G01 X65 Y20 F300    ; Pass 3 right',
      'G01 X65 Y30 F300',
      'G01 X-5 Y30 F300    ; Pass 4 left',
      'G01 X-5 Y40 F300',
      'G01 X65 Y40 F300    ; Pass 5 right',
      'G00 X0 Y0',
      'M05',
      'M30'
    ].join('\n'),

    chamfer: [
      '; Rectangle with Chamfers - 50x40mm, 5mm chamfers',
      'G90 G21 G17',
      'M03 S2800',
      'G00 X5 Y0',
      'G01 X45 Y0 F200     ; Bottom edge',
      'G01 X50 Y5 F200     ; Bottom-right chamfer',
      'G01 X50 Y35 F200    ; Right edge',
      'G01 X45 Y40 F200    ; Top-right chamfer',
      'G01 X5 Y40 F200     ; Top edge',
      'G01 X0 Y35 F200     ; Top-left chamfer',
      'G01 X0 Y5 F200      ; Left edge',
      'G01 X5 Y0 F200      ; Bottom-left chamfer',
      'M05',
      'M30'
    ].join('\n'),

    star: [
      '; 5-Pointed Star - 30mm radius',
      'G90 G21 G17',
      'M03 S3000',
      'G00 X0 Y30           ; Top point',
      'G01 X-11.412 Y-9.271 F200',
      'G01 X28.532 Y16.729 F200',
      'G01 X-28.532 Y16.729 F200',
      'G01 X11.412 Y-9.271 F200',
      'G01 X0 Y30 F200      ; Close star',
      'G00 X0 Y0',
      'M05',
      'M30'
    ].join('\n'),

    circpocket: [
      '; Circular Pocket - R24mm, 3 Concentric Passes',
      'G90 G21 G17',
      'M03 S2500',
      'G00 X8 Y0',
      'G02 X8 Y0 I-8 J0 F150    ; Inner ring R8',
      'G01 X16 Y0 F150',
      'G02 X16 Y0 I-16 J0 F150  ; Middle ring R16',
      'G01 X24 Y0 F150',
      'G02 X24 Y0 I-24 J0 F150  ; Outer ring R24',
      'G00 X0 Y0',
      'M05',
      'M30'
    ].join('\n'),

    drillpattern: [
      '; Drill Pattern — G81 Basic Drill Cycle',
      '; 6 holes in a 2×3 grid, 20mm spacing',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S2000          ; Spindle ON CW',
      'G00 X0 Y0          ; Rapid to start position',
      'G81 X10 Y10 Z-12 R2 F80  ; Initiate cycle, drill hole 1',
      'X30 Y10           ; Hole 2 (cycle repeats)',
      'X50 Y10           ; Hole 3',
      'X10 Y30           ; Hole 4',
      'X30 Y30           ; Hole 5',
      'X50 Y30           ; Hole 6',
      'G80                ; Cancel canned cycle',
      'G00 X0 Y0          ; Return to origin',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),

    peckdrill: [
      '; Peck Drilling — G83 Cycle (Q=5mm peck increment)',
      '; 6 deep holes with chip clearing, 25mm spacing',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S1800          ; Spindle ON CW',
      'G00 X0 Y0          ; Rapid to start',
      'G83 X15 Y15 Z-24 R3 Q5 F60  ; Peck drill: 5mm pecks to 24mm depth',
      'X40 Y15           ; Next hole (cycle repeats with same Z/R/Q)',
      'X65 Y15           ; Next hole',
      'X15 Y40           ; Next hole',
      'X40 Y40           ; Next hole',
      'X65 Y40           ; Next hole',
      'G80                ; Cancel canned cycle',
      'G00 X0 Y0          ; Return to origin',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n'),

    depthpasses: [
      '; Z-Depth Passes — Color by Cut Depth',
      '; Pass 1 (Z-1, green) then Pass 2 (Z-4, blue)',
      'G90 G21 G17       ; Absolute, metric, XY plane',
      'M03 S3000          ; Spindle ON CW at 3000 RPM',
      '; === Pass 1 — Roughing at Z-1 (green) ===',
      'G00 X0 Y0          ; Rapid to start',
      'G01 Z-1 F50        ; Plunge to 1mm depth',
      'G01 X50 Y0 F200    ; Cut right at Z-1',
      'G01 X50 Y30 F200   ; Cut up',
      'G01 X0 Y30 F200    ; Cut left',
      'G01 X0 Y0 F200     ; Close — roughing pass',
      'G00 Z5             ; Retract above workpiece',
      '; === Pass 2 — Finishing at Z-4 (blue) ===',
      'G00 X5 Y5          ; Rapid to offset start',
      'G01 Z-4 F40        ; Plunge to 4mm depth',
      'G01 X45 Y5 F160    ; Cut right at Z-4',
      'G01 X45 Y25 F160   ; Cut up',
      'G01 X5 Y25 F160    ; Cut left',
      'G01 X5 Y5 F160     ; Close — finishing pass',
      'G00 Z5             ; Retract',
      'G00 X0 Y0          ; Return to origin',
      'M05                ; Spindle OFF',
      'M30                ; Program END'
    ].join('\n')
  };

  /* ================================================================
     PRACTICE PROBLEM GENERATORS
     ================================================================ */
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function roundN(v, n) { return Math.round(v * Math.pow(10, n)) / Math.pow(10, n); }

  var PRACTICE_POOL = [
    function () {
      var x = rand(10, 90); var y = rand(10, 90); var f = rand(1, 4) * 50;
      return {
        prompt: 'Write a G01 command to move from the current position to (' + x + ', ' + y + ') at feed ' + f + ' mm/min.',
        answer: 'G01 X' + x + ' Y' + y + ' F' + f,
        unit: '', type: 'text',
        solution: ['Use G01 for linear cutting move', 'Specify X=' + x + ', Y=' + y, 'Specify feed F=' + f, '<strong>G01 X' + x + ' Y' + y + ' F' + f + '</strong>']
      };
    },
    function () {
      var x = rand(20, 80); var y = rand(20, 80);
      return {
        prompt: 'Write a G00 command to rapidly position the tool at (' + x + ', ' + y + ').',
        answer: 'G00 X' + x + ' Y' + y,
        unit: '', type: 'text',
        solution: ['Use G00 for rapid positioning', 'Specify X=' + x + ', Y=' + y, '<strong>G00 X' + x + ' Y' + y + '</strong>']
      };
    },
    function () {
      var r = rand(10, 30);
      var cx = rand(30, 60); var cy = rand(30, 60);
      var sx = cx + r; var sy = cy;
      var ex = cx - r; var ey = cy;
      var i = cx - sx; var j = cy - sy;
      return {
        prompt: 'From position (' + sx + ', ' + sy + '), write a G02 CW semicircle to (' + ex + ', ' + ey + '). The arc center is at (' + cx + ', ' + cy + ').',
        answer: 'G02 X' + ex + ' Y' + ey + ' I' + i + ' J' + j,
        unit: '', type: 'text',
        solution: ['I = Xcenter - Xstart = ' + cx + ' - ' + sx + ' = ' + i, 'J = Ycenter - Ystart = ' + cy + ' - ' + sy + ' = ' + j, '<strong>G02 X' + ex + ' Y' + ey + ' I' + i + ' J' + j + '</strong>']
      };
    },
    function () {
      var x1 = rand(0, 30); var y1 = rand(0, 30);
      var x2 = rand(40, 80); var y2 = rand(40, 80);
      var dx = x2 - x1; var dy = y2 - y1;
      var dist = roundN(Math.sqrt(dx * dx + dy * dy), 2);
      return {
        prompt: 'Calculate the tool path distance from (' + x1 + ', ' + y1 + ') to (' + x2 + ', ' + y2 + ') in mm.',
        answer: dist,
        unit: 'mm', type: 'numeric', tol: 0.05,
        solution: ['Distance = sqrt((X2-X1)^2 + (Y2-Y1)^2)', 'dx = ' + x2 + ' - ' + x1 + ' = ' + dx, 'dy = ' + y2 + ' - ' + y1 + ' = ' + dy, 'Distance = sqrt(' + dx + '^2 + ' + dy + '^2)', '<strong>' + dist + ' mm</strong>']
      };
    },
    function () {
      var r = rand(10, 30);
      return {
        prompt: 'What is the circumference of a full circular tool path with radius ' + r + ' mm?',
        answer: roundN(2 * Math.PI * r, 2),
        unit: 'mm', type: 'numeric', tol: 0.5,
        solution: ['Circumference = 2 x pi x r', 'C = 2 x 3.14159 x ' + r, '<strong>' + roundN(2 * Math.PI * r, 2) + ' mm</strong>']
      };
    },
    function () {
      var f = rand(1, 4) * 100; var dist = rand(50, 200);
      var time = roundN(dist / f, 3);
      return {
        prompt: 'A tool moves ' + dist + ' mm at feed rate ' + f + ' mm/min. How long does the move take (in minutes)?',
        answer: time,
        unit: 'min', type: 'numeric', tol: 0.005,
        solution: ['Time = Distance / Feed Rate', 'Time = ' + dist + ' / ' + f, '<strong>' + time + ' min</strong>']
      };
    },
    function () {
      var n = rand(1, 5) * 500; var z = rand(2, 6); var fz = roundN(rand(2, 10) / 100, 2);
      var feed = roundN(n * z * fz, 1);
      return {
        prompt: 'Calculate the feed rate (mm/min) for a ' + z + '-flute end mill at ' + n + ' RPM with ' + fz + ' mm chip load per tooth.',
        answer: feed,
        unit: 'mm/min', type: 'numeric', tol: 1,
        solution: ['Feed = RPM x teeth x chip_load', 'F = ' + n + ' x ' + z + ' x ' + fz, '<strong>' + feed + ' mm/min</strong>']
      };
    },
    function () {
      var cx = rand(20, 50); var cy = rand(20, 50);
      var sx = rand(0, 20); var sy = cy;
      var i = cx - sx; var j = cy - sy;
      return {
        prompt: 'The arc starts at (' + sx + ', ' + sy + ') and the center is at (' + cx + ', ' + cy + '). What are I and J values?',
        answer: i,
        unit: '', type: 'numeric', tol: 0,
        solution: ['I = Xcenter - Xstart = ' + cx + ' - ' + sx + ' = ' + i, 'J = Ycenter - Ystart = ' + cy + ' - ' + sy + ' = ' + j, '<strong>I = ' + i + ', J = ' + j + '</strong>']
      };
    },
    function () {
      var x = rand(10, 40); var y = rand(10, 40);
      var dx = rand(5, 20); var dy = rand(5, 20);
      var nx = x + dx; var ny = y + dy;
      return {
        prompt: 'In G91 incremental mode, the tool is at (' + x + ', ' + y + '). After G01 X' + dx + ' Y' + dy + ', what is the new X position?',
        answer: nx,
        unit: 'mm', type: 'numeric', tol: 0,
        solution: ['G91 = incremental mode', 'New X = current X + move X', 'New X = ' + x + ' + ' + dx + ' = ' + nx, '<strong>' + nx + ' mm</strong>']
      };
    },
    function () {
      var r = rand(8, 25);
      var arcLen = roundN(Math.PI * r, 2);
      return {
        prompt: 'What is the tool path length of a semicircular arc with radius ' + r + ' mm?',
        answer: arcLen,
        unit: 'mm', type: 'numeric', tol: 0.5,
        solution: ['Semicircle arc length = pi x r', 'L = 3.14159 x ' + r, '<strong>' + arcLen + ' mm</strong>']
      };
    },
    function () {
      var f = rand(1, 4) * 50; var dist = rand(30, 100);
      var timeS = roundN((dist / f) * 60, 2);
      return {
        prompt: 'A G01 move of ' + dist + ' mm at F' + f + ' mm/min takes how many seconds?',
        answer: timeS,
        unit: 's', type: 'numeric', tol: 0.5,
        solution: ['Time (min) = Distance / Feed', 'Time = ' + dist + ' / ' + f + ' = ' + roundN(dist / f, 4) + ' min', 'Time (s) = ' + roundN(dist / f, 4) + ' x 60', '<strong>' + timeS + ' s</strong>']
      };
    },
    function () {
      var r = rand(10, 30);
      var ang = rand(1, 3) * 90;
      var arcLen = roundN((ang / 360) * 2 * Math.PI * r, 2);
      return {
        prompt: 'Calculate the arc length of a ' + ang + '-degree arc with radius ' + r + ' mm.',
        answer: arcLen,
        unit: 'mm', type: 'numeric', tol: 0.5,
        solution: ['Arc length = (angle/360) x 2 x pi x r', 'L = (' + ang + '/360) x 2 x 3.14159 x ' + r, '<strong>' + arcLen + ' mm</strong>']
      };
    }
  ];

  /* ================================================================
     QUIZ QUESTION POOL
     ================================================================ */
  var QUIZ_POOL = [
    { q: 'What G-code is used for rapid positioning (non-cutting)?', type: 'mcq', opts: ['G00', 'G01', 'G02', 'G28'], ans: 0 },
    { q: 'Which command performs a linear cutting move at a controlled feed rate?', type: 'mcq', opts: ['G00', 'G01', 'G02', 'G03'], ans: 1 },
    { q: 'G02 creates which type of arc?', type: 'mcq', opts: ['Counter-clockwise', 'Clockwise', 'Helical', 'Parabolic'], ans: 1 },
    { q: 'G03 creates which type of arc?', type: 'mcq', opts: ['Clockwise', 'Counter-clockwise', 'Spiral', 'Elliptical'], ans: 1 },
    { q: 'What does M03 do?', type: 'mcq', opts: ['Stop spindle', 'Start spindle CW', 'Start spindle CCW', 'Tool change'], ans: 1 },
    { q: 'What does M05 do?', type: 'mcq', opts: ['Program end', 'Coolant ON', 'Spindle OFF', 'Spindle CW'], ans: 2 },
    { q: 'What does M30 do?', type: 'mcq', opts: ['Spindle ON', 'Coolant OFF', 'Program stop', 'Program end and rewind'], ans: 3 },
    { q: 'Which G-code selects absolute positioning mode?', type: 'mcq', opts: ['G90', 'G91', 'G28', 'G17'], ans: 0 },
    { q: 'Which G-code selects millimeter (metric) mode?', type: 'mcq', opts: ['G20', 'G21', 'G90', 'G17'], ans: 1 },
    { q: 'What does G28 do?', type: 'mcq', opts: ['Set origin', 'Return to home', 'Rapid move', 'Cancel offset'], ans: 1 },
    { q: 'In arc programming, what do I and J represent?', type: 'mcq', opts: ['Endpoint X,Y', 'Arc radius', 'Incremental offset to arc center', 'Feed rate components'], ans: 2 },
    { q: 'G41 activates which type of cutter compensation?', type: 'mcq', opts: ['Right', 'Left', 'Length', 'Diameter'], ans: 1 },
    { q: 'What M-code turns the coolant ON?', type: 'mcq', opts: ['M05', 'M06', 'M08', 'M30'], ans: 2 },
    {
      q: 'Calculate the distance from (0,0) to (30,40).',
      type: 'numeric', ans: 50, unit: 'mm', tol: 0.5
    },
    {
      q: 'A tool moves 120 mm at F240 mm/min. How many seconds does the move take?',
      type: 'numeric', ans: 30, unit: 's', tol: 0.5
    },
    {
      q: 'What is the arc length of a full circle with radius 20 mm? (Round to 1 decimal)',
      type: 'numeric', ans: roundN(2 * Math.PI * 20, 1), unit: 'mm', tol: 1
    },
    {
      q: 'Feed rate for a 3-flute tool at 2000 RPM, 0.08 mm/tooth chip load?',
      type: 'numeric', ans: 480, unit: 'mm/min', tol: 1
    }
  ];

  /* ================================================================
     DOM REFERENCES
     ================================================================ */
  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');
  var editor = document.getElementById('gcode-editor');
  var exSelect = document.getElementById('example-select');
  var btnRun = document.getElementById('btn-run');
  var btnStep = document.getElementById('btn-step');
  var btnReset = document.getElementById('btn-reset');
  var btnClear = document.getElementById('btn-clear');
  var speedSlider = document.getElementById('speed-slider');
  var speedVal = document.getElementById('speed-val');
  var lineIndicator = document.getElementById('line-indicator');

  // Readouts
  var rX = document.getElementById('r-x');
  var rY = document.getElementById('r-y');
  var rZ = document.getElementById('r-z');
  var rFeed = document.getElementById('r-feed');
  var rSpindle = document.getElementById('r-spindle');
  var rLine = document.getElementById('r-line');
  var rPathLen = document.getElementById('r-pathlen');

  // Mode panels
  var simPanel = document.getElementById('sim-panel');
  var catRow = document.getElementById('cat-row');
  var itemSelector = document.getElementById('item-selector');
  var itemInfo = document.getElementById('item-info');
  var conceptGrid = document.getElementById('concept-grid');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');

  // Practice
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var W = 800; var H = 500;

  // G-code machine state
  var machineState = {
    x: 0, y: 0, z: 0, feed: 0, spindle: 0, spindleOn: false,
    absolute: true, metric: true, plane: 'XY',
    pathLength: 0
  };

  // Global min Z for depth color visualization (0 = no negative Z found)
  var globalMinZ = 0;

  // Parsed commands and execution
  var parsedCommands = [];
  var executionIndex = 0;
  var pathSegments = []; // { type: 'rapid'|'linear'|'cwArc'|'ccwArc', from, to, ... }
  var animating = false;
  var animTimer = null;

  // Explore
  var exploreCat = 'gcodes';
  var selectedConcept = null;

  // Practice
  var practiceCorrect = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  // Quiz
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizAnswers = [];
  var quizSubmitted = false;

  // Warnings
  var warnings = [];

  // Canned cycle state
  var cannedCycle = null; // { code: 81|83|73|84, Z, R, Q, F }
  var drillHoles = [];   // { x, y, z, code } for statistics

  // Tool diameter visualisation (0 = off)
  var toolDiam = 0;

  // Zoom & Pan
  var zoomLevel = 1;
  var panX = 0;
  var panY = 0;
  var isPanning = false;
  var panStartX = 0, panStartY = 0;
  var panStartPanX = 0, panStartPanY = 0;

  // Feature toggles
  var view3D = false;
  var showAnimTool = false;
  var toolAngle = 0; // spindle rotation angle for animated tool
  var toolAnimRAF = null;

  // New v6 state
  var showArrows = false;        // cut direction arrows overlay
  var displayMetric = true;      // MM (true) or IN (false) for readouts only
  var spindleWarned = false;     // flag to avoid duplicate spindle-not-started warning

  // Last transform params for coordinate tooltip inverse mapping
  var lastTransform = { offsetX: 0, offsetY: 0, scale: 1, minX: 0, maxX: 100, minY: 0, maxY: 100, cx: 0, cy: 0 };

  function addWarning(msg, lineNum) {
    warnings.push({ msg: msg, lineNum: lineNum !== undefined ? lineNum : -1 });
    renderWarnBar();
  }
  function clearWarnings() {
    warnings = [];
    var warnEl = document.getElementById('warn-bar');
    if (warnEl) warnEl.style.display = 'none';
  }
  function renderWarnBar() {
    var warnEl = document.getElementById('warn-bar');
    if (!warnEl || warnings.length === 0) { if (warnEl) warnEl.style.display = 'none'; return; }
    warnEl.style.display = '';
    var MAX_SHOW = 3;
    var html = '';
    for (var i = 0; i < Math.min(warnings.length, MAX_SHOW); i++) {
      var w = warnings[i];
      html += '<span class="warn-item">';
      if (w.lineNum >= 0) {
        html += '<button class="warn-goto" data-line="' + w.lineNum + '">L' + (w.lineNum + 1) + '</button>';
      }
      html += ' \u26A0 ' + w.msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
    }
    if (warnings.length > MAX_SHOW) {
      html += '<span class="warn-more">+' + (warnings.length - MAX_SHOW) + ' more</span>';
    }
    warnEl.innerHTML = html;
    // Bind line-jump buttons
    warnEl.querySelectorAll('.warn-goto').forEach(function (btn) {
      btn.addEventListener('click', function () { scrollEditorToLine(parseInt(btn.dataset.line)); });
    });
  }
  function scrollEditorToLine(lineNum) {
    if (lineNum < 0) return;
    var style = getComputedStyle(editor);
    var lh = parseFloat(style.lineHeight);
    if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.6;
    editor.scrollTop = Math.max(0, lineNum * lh - editor.offsetHeight / 2);
    highlightEditorLine(lineNum);
  }

  /* ── Canned Cycle Execution Helper ────────────────────────── */
  function executeCannedCycleAt(x, y) {
    if (!cannedCycle) return;
    var ms = machineState;
    // Rapid to position (XY)
    pathSegments.push({ type: 'rapid', fromX: ms.x, fromY: ms.y, toX: x, toY: y });
    ms.x = x; ms.y = y;
    // Choose segment type by cycle code
    var holeType = cannedCycle.code === 83 ? 'drillPeck' : (cannedCycle.code === 84 ? 'drillTap' : 'drill');
    // Record drill hole in both lists
    drillHoles.push({ x: x, y: y, z: cannedCycle.Z, code: cannedCycle.code });
    pathSegments.push({
      type: holeType,
      fromX: x, fromY: y, toX: x, toY: y,
      holeZ: cannedCycle.Z, holeR: cannedCycle.R, holeQ: cannedCycle.Q
    });
  }

  /* ================================================================
     SOUND EFFECTS (Web Audio API)
     ================================================================ */
  var audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
    }
  }
  document.addEventListener('pointerdown', function () { initAudio(); }, { once: true });

  function playClick() {
    if (!audioCtx) return;
    try {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'square'; o.frequency.value = 800;
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      o.start(); o.stop(audioCtx.currentTime + 0.05);
    } catch (e) { /* silent */ }
  }
  function playSuccess() {
    if (!audioCtx) return;
    try {
      var o1 = audioCtx.createOscillator(); var g1 = audioCtx.createGain();
      o1.connect(g1); g1.connect(audioCtx.destination);
      o1.type = 'sine'; o1.frequency.value = 880;
      g1.gain.setValueAtTime(0.1, audioCtx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      o1.start(); o1.stop(audioCtx.currentTime + 0.2);
      var o2 = audioCtx.createOscillator(); var g2 = audioCtx.createGain();
      o2.connect(g2); g2.connect(audioCtx.destination);
      o2.type = 'sine'; o2.frequency.value = 1100;
      g2.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.1);
      g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o2.start(audioCtx.currentTime + 0.1); o2.stop(audioCtx.currentTime + 0.3);
    } catch (e) { /* silent */ }
  }
  function playError() {
    if (!audioCtx) return;
    try {
      var o = audioCtx.createOscillator(); var g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sawtooth'; o.frequency.value = 300;
      g.gain.setValueAtTime(0.1, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      o.start(); o.stop(audioCtx.currentTime + 0.25);
    } catch (e) { /* silent */ }
  }
  function playComplete() {
    if (!audioCtx) return;
    try {
      [660, 880, 1100].forEach(function (f, i) {
        var o = audioCtx.createOscillator(); var g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.06, audioCtx.currentTime + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.15);
        o.start(audioCtx.currentTime + i * 0.08); o.stop(audioCtx.currentTime + i * 0.08 + 0.15);
      });
    } catch (e) { /* silent */ }
  }

  /* ================================================================
     UNIT DISPLAY HELPERS
     ================================================================ */
  // Conversion helpers for readout display (displayMetric flag)
  function toD(v)  { return displayMetric ? v : v * 0.03937; }   // length mm→in
  function toDF(v) { return displayMetric ? v : v * 0.03937; }   // feed mm/min→in/min (same factor)
  function uLen()  { return displayMetric ? 'mm' : 'in'; }
  function uFeed() { return displayMetric ? 'mm/min' : 'in/min'; }

  function unitLabel(type) {
    if (type === 'length') return uLen();
    if (type === 'feed') return uFeed();
    return '';
  }
  function updateUnitLabels() {
    var ruX = document.getElementById('ru-x');
    var ruY = document.getElementById('ru-y');
    var ruZ = document.getElementById('ru-z');
    var ruFeed = document.getElementById('ru-feed');
    var ruPathLen = document.getElementById('ru-pathlen');
    var u = ' ' + uLen();
    if (ruX) ruX.textContent = u;
    if (ruY) ruY.textContent = u;
    if (ruZ) ruZ.textContent = u;
    if (ruPathLen) ruPathLen.textContent = u;
    if (ruFeed) ruFeed.textContent = ' ' + uFeed();
  }

  /* ================================================================
     G-CODE PARSER
     ================================================================ */
  function parseGCode(code) {
    var lines = code.split('\n');
    var cmds = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.charAt(0) === ';' || line.charAt(0) === '(') continue;
      // Remove inline comments
      var commentIdx = line.indexOf(';');
      if (commentIdx > 0) line = line.substring(0, commentIdx).trim();
      commentIdx = line.indexOf('(');
      if (commentIdx > 0) line = line.substring(0, commentIdx).trim();

      var cmd = { lineNum: i, raw: lines[i] };
      // Extract words
      var words = line.match(/[A-Z]-?[0-9.]+/gi);
      if (!words) continue;
      for (var w = 0; w < words.length; w++) {
        var letter = words[w].charAt(0).toUpperCase();
        var val = parseFloat(words[w].substring(1));
        cmd[letter] = val;
      }
      cmds.push(cmd);
    }
    return cmds;
  }

  function resetMachine() {
    machineState = {
      x: 0, y: 0, z: 0, feed: 0, spindle: 0, spindleOn: false,
      absolute: true, metric: true, plane: 'XY',
      pathLength: 0
    };
    globalMinZ = 0;
    parsedCommands = [];
    executionIndex = 0;
    pathSegments = [];
    animating = false;
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }
    zoomLevel = 1; panX = 0; panY = 0;
    cannedCycle = null;
    drillHoles = [];
    spindleWarned = false;
    clearWarnings();
    hideScrubber();
    updateReadouts();
    highlightEditorLine(-1);
    updateGuideBlink();
    var sp = document.getElementById('stats-panel');
    if (sp) sp.style.display = 'none';
    var dc = document.getElementById('stat-drill-card');
    if (dc) dc.style.display = 'none';
  }

  function executeCommand(cmd) {
    var ms = machineState;
    // Check G codes
    if (cmd.G !== undefined) {
      var g = cmd.G;
      if (g === 90) { ms.absolute = true; return; }
      if (g === 91) { ms.absolute = false; return; }
      if (g === 21) { ms.metric = true; return; }
      if (g === 20) { ms.metric = false; return; }
      if (g === 17) { ms.plane = 'XY'; return; }
      if (g === 18) { ms.plane = 'XZ'; return; }
      if (g === 19) { ms.plane = 'YZ'; return; }
      if (g === 28) {
        // Return to home
        var seg = { type: 'rapid', fromX: ms.x, fromY: ms.y, toX: 0, toY: 0 };
        pathSegments.push(seg);
        ms.x = 0; ms.y = 0;
        return;
      }

      // Cancel canned cycle
      if (g === 80) { cannedCycle = null; return; }

      // Canned drilling cycles (G81 basic, G83 peck, G73 HS peck, G84 tap)
      if (g === 81 || g === 83 || g === 73 || g === 84) {
        if (cmd.F !== undefined) ms.feed = cmd.F;
        cannedCycle = {
          code: g,
          Z: cmd.Z !== undefined ? cmd.Z : -10,
          R: cmd.R !== undefined ? cmd.R : 2,
          Q: cmd.Q !== undefined ? cmd.Q : 5,
          F: ms.feed
        };
        // Execute at initial position on the same line
        var cycX = cmd.X !== undefined ? (ms.absolute ? cmd.X : ms.x + cmd.X) : ms.x;
        var cycY = cmd.Y !== undefined ? (ms.absolute ? cmd.Y : ms.y + cmd.Y) : ms.y;
        executeCannedCycleAt(cycX, cycY);
        return;
      }

      // Motion commands
      var targetX = ms.x; var targetY = ms.y;
      if (cmd.X !== undefined) targetX = ms.absolute ? cmd.X : ms.x + cmd.X;
      if (cmd.Y !== undefined) targetY = ms.absolute ? cmd.Y : ms.y + cmd.Y;
      if (cmd.F !== undefined) ms.feed = cmd.F;
      // B5: Warn if motion command has no coordinates
      if (cmd.X === undefined && cmd.Y === undefined && cmd.Z === undefined && (g === 0 || g === 1 || g === 2 || g === 3)) {
        addWarning('G0' + g + ' has no X/Y/Z coordinates', cmd.lineNum);
      }

      if (g === 0) {
        // Rapid — also track Z
        if (cmd.Z !== undefined) ms.z = cmd.Z;
        var seg0 = { type: 'rapid', fromX: ms.x, fromY: ms.y, toX: targetX, toY: targetY, segZ: ms.z };
        pathSegments.push(seg0);
        ms.x = targetX; ms.y = targetY;
      } else if (g === 1) {
        // Linear — track Z, store segZ for depth coloring
        if (cmd.Z !== undefined) ms.z = cmd.Z;
        // Linter: F=0 stall warning
        if (ms.feed <= 0) addWarning('G01 with F=0 — machine will stall', cmd.lineNum);
        // Linter: spindle not started before cut
        if (!ms.spindleOn && !spindleWarned) {
          addWarning('Cutting move before M03/M04 spindle start', cmd.lineNum);
          spindleWarned = true;
        }
        var dx = targetX - ms.x; var dy = targetY - ms.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        ms.pathLength += dist;
        var seg1 = { type: 'linear', fromX: ms.x, fromY: ms.y, toX: targetX, toY: targetY, segZ: ms.z, feed: ms.feed };
        pathSegments.push(seg1);
        ms.x = targetX; ms.y = targetY;
      } else if (g === 2 || g === 3) {
        // Arc — track Z, store segZ for depth coloring
        if (cmd.Z !== undefined) ms.z = cmd.Z;
        // Linter: spindle not started before arc cut
        if (!ms.spindleOn && !spindleWarned) {
          addWarning('Cutting move before M03/M04 spindle start', cmd.lineNum);
          spindleWarned = true;
        }
        var ci = cmd.I || 0; var cj = cmd.J || 0;
        var centerX, centerY, r;
        if (cmd.I === undefined && cmd.J === undefined && cmd.R !== undefined) {
          /* R-format arc (G02/G03 X_ Y_ R_): centre lies on the perpendicular
             bisector of the chord at distance h = √(R² − (chord/2)²).
             Positive R = minor arc (≤180°), negative R = major arc. */
          var Rw = cmd.R;
          var dxc = targetX - ms.x, dyc = targetY - ms.y;
          var chord = Math.sqrt(dxc * dxc + dyc * dyc);
          if (chord < 0.001) {
            addWarning('R-format arc cannot make a full circle — use I/J', cmd.lineNum);
            centerX = ms.x; centerY = ms.y; r = 0;
          } else if (Math.abs(Rw) * 2 < chord - 0.001) {
            addWarning('Arc R' + Rw + ' too small for chord ' + chord.toFixed(2) + ' — using R=chord/2', cmd.lineNum);
            centerX = (ms.x + targetX) / 2; centerY = (ms.y + targetY) / 2;
            r = chord / 2;
          } else {
            var hh = Math.sqrt(Math.max(0, Rw * Rw - (chord / 2) * (chord / 2)));
            var ux = -dyc / chord, uy = dxc / chord;   /* left normal of chord */
            var sgn = (g === 2 ? -1 : 1) * (Rw >= 0 ? 1 : -1);
            centerX = (ms.x + targetX) / 2 + ux * hh * sgn;
            centerY = (ms.y + targetY) / 2 + uy * hh * sgn;
            r = Math.abs(Rw);
          }
          ci = centerX - ms.x; cj = centerY - ms.y;
        } else {
          if (ci === 0 && cj === 0 && cmd.R === undefined) {
            addWarning('G0' + g + ' arc without I/J or R — no arc centre defined', cmd.lineNum);
          }
          centerX = ms.x + ci;
          centerY = ms.y + cj;
          r = Math.sqrt(ci * ci + cj * cj);
        }
        // B2: Validate arc geometry — start and end must be equidistant from center
        var rEnd = Math.sqrt((targetX - centerX) * (targetX - centerX) + (targetY - centerY) * (targetY - centerY));
        if (r > 0.001 && Math.abs(r - rEnd) / r > 0.05) {
          addWarning('Arc radius mismatch — start R=' + r.toFixed(2) + ', end R=' + rEnd.toFixed(2), cmd.lineNum);
        }
        var startAngle = Math.atan2(ms.y - centerY, ms.x - centerX);
        var endAngle = Math.atan2(targetY - centerY, targetX - centerX);
        var cw = (g === 2);

        // Calculate sweep
        var sweep;
        if (cw) {
          sweep = startAngle - endAngle;
          if (sweep <= 0) sweep += 2 * Math.PI;
        } else {
          sweep = endAngle - startAngle;
          if (sweep <= 0) sweep += 2 * Math.PI;
        }
        // Full circle check
        if (Math.abs(targetX - ms.x) < 0.001 && Math.abs(targetY - ms.y) < 0.001) {
          sweep = 2 * Math.PI;
        }

        ms.pathLength += r * sweep;
        var segArc = {
          type: cw ? 'cwArc' : 'ccwArc',
          fromX: ms.x, fromY: ms.y, toX: targetX, toY: targetY,
          centerX: centerX, centerY: centerY, radius: r,
          startAngle: startAngle, endAngle: endAngle, sweep: sweep,
          segZ: ms.z, feed: ms.feed
        };
        pathSegments.push(segArc);
        ms.x = targetX; ms.y = targetY;
      }
    }
    // M codes
    if (cmd.M !== undefined) {
      var m = cmd.M;
      if (m === 3 || m === 4) { ms.spindleOn = true; if (cmd.S !== undefined) ms.spindle = cmd.S; }
      if (m === 5) { ms.spindleOn = false; }
      if (m === 30) { /* program end */ }
    }
    if (cmd.S !== undefined && cmd.M === undefined) { ms.spindle = cmd.S; }

    // Canned cycle repeat: no G code, no M code, but X/Y given and cycle is active
    if (cmd.G === undefined && cmd.M === undefined && cannedCycle !== null &&
        (cmd.X !== undefined || cmd.Y !== undefined)) {
      var repX = cmd.X !== undefined ? (ms.absolute ? cmd.X : ms.x + cmd.X) : ms.x;
      var repY = cmd.Y !== undefined ? (ms.absolute ? cmd.Y : ms.y + cmd.Y) : ms.y;
      executeCannedCycleAt(repX, repY);
    }
  }

  function runAll() {
    dismissHint();
    resetMachine();
    parsedCommands = parseGCode(editor.value);
    for (var i = 0; i < parsedCommands.length; i++) {
      executeCommand(parsedCommands[i]);
    }
    executionIndex = parsedCommands.length;
    updateReadouts();
    draw();
    computeStats();
  }

  function stepOne() {
    dismissHint();
    if (executionIndex === 0 && parsedCommands.length === 0) {
      resetMachine();
      parsedCommands = parseGCode(editor.value);
    }
    if (executionIndex < parsedCommands.length) {
      var cmd = parsedCommands[executionIndex];
      executeCommand(cmd);
      executionIndex++;
      highlightEditorLine(cmd.lineNum);
      updateReadouts();
      updateGuideBlink();
      draw();
      if (executionIndex >= parsedCommands.length) computeStats();
    }
  }

  function startAnimation() {
    if (animating) return;
    dismissHint();
    resetMachine();
    parsedCommands = parseGCode(editor.value);
    animating = true;
    btnRun.textContent = '\u23F8 Pause';
    updateGuideBlink();
    animateStep();
  }

  function pauseAnimation() {
    animating = false;
    btnRun.textContent = '\u25B6 Run';
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }
    updateGuideBlink();
  }

  function animateStep() {
    if (!animating || executionIndex >= parsedCommands.length) {
      animating = false;
      btnRun.textContent = '\u25B6 Run';
      highlightEditorLine(-1);
      updateGuideBlink();
      playComplete();
      computeStats();
      return;
    }
    var cmd = parsedCommands[executionIndex];
    executeCommand(cmd);
    executionIndex++;
    highlightEditorLine(cmd.lineNum);
    updateReadouts();
    draw();
    var speed = parseInt(speedSlider.value);
    var delay = Math.max(50, 500 / speed);
    animTimer = setTimeout(animateStep, delay);
  }

  function updateReadouts() {
    rX.textContent = toD(machineState.x).toFixed(3);
    rY.textContent = toD(machineState.y).toFixed(3);
    if (rZ) {
      rZ.textContent = toD(machineState.z).toFixed(3);
      // E4: dim Z card when Z is never used (stays at 0 and globalMinZ==0)
      var zCard = rZ.closest('.readout-card');
      if (zCard) zCard.style.opacity = (globalMinZ < 0 || machineState.z !== 0) ? '1' : '0.4';
    }
    rFeed.textContent = Math.round(toDF(machineState.feed));
    rSpindle.textContent = machineState.spindle;
    rLine.textContent = executionIndex;
    rPathLen.textContent = toD(machineState.pathLength).toFixed(1);
    lineIndicator.textContent = 'Line: ' + executionIndex + ' / ' + parsedCommands.length;
    // Update scrubber position if visible
    var scrubber = document.getElementById('scrubber');
    var scrubberRow = document.getElementById('scrubber-row');
    if (scrubber && scrubberRow && scrubberRow.style.display !== 'none') {
      scrubber.value = executionIndex;
      var scrubberVal = document.getElementById('scrubber-val');
      if (scrubberVal) scrubberVal.textContent = executionIndex + ' / ' + parsedCommands.length;
    }
    updateUnitLabels();
  }

  /* ================================================================
     DRAWING — PURE RENDER
     ================================================================ */
  var _cvCache = { w: 0, h: 0, dpr: 0 };
  function resizeCanvas() {
    var card = canvas.parentElement;
    var cardRect = card.getBoundingClientRect();
    var pad = 16; // 8px padding top + bottom
    W = Math.floor(cardRect.width - pad);
    H = Math.floor(cardRect.height - pad);
    if (H < 200) H = 200;
    /* Hi-DPI backing store — draw in logical W×H via the DPR transform.
       Pointer handlers (wheel zoom, pan, tooltip) map with W/rect.width in
       lockstep with this. Reallocate only when the size actually changes
       (draw() runs on every pan/animation frame). */
    var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    if (W !== _cvCache.w || H !== _cvCache.h || dpr !== _cvCache.dpr) {
      _cvCache.w = W; _cvCache.h = H; _cvCache.dpr = dpr;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(_cvCache.dpr, 0, 0, _cvCache.dpr, 0, 0);
  }

  function draw() {
    resizeCanvas();
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Calculate view bounds
    var padding = 40;
    var viewW = W - padding * 2;
    var viewH = H - padding * 2;

    // Find bounding box of all path segments
    var minX = 0, maxX = 100, minY = 0, maxY = 100;
    for (var s = 0; s < pathSegments.length; s++) {
      var seg = pathSegments[s];
      minX = Math.min(minX, seg.fromX, seg.toX);
      maxX = Math.max(maxX, seg.fromX, seg.toX);
      minY = Math.min(minY, seg.fromY, seg.toY);
      maxY = Math.max(maxY, seg.fromY, seg.toY);
      if (seg.centerX !== undefined) {
        minX = Math.min(minX, seg.centerX - seg.radius);
        maxX = Math.max(maxX, seg.centerX + seg.radius);
        minY = Math.min(minY, seg.centerY - seg.radius);
        maxY = Math.max(maxY, seg.centerY + seg.radius);
      }
    }
    // Add margin
    var rangeX = (maxX - minX) || 100;
    var rangeY = (maxY - minY) || 100;
    var marginFrac = 0.1;
    minX -= rangeX * marginFrac; maxX += rangeX * marginFrac;
    minY -= rangeY * marginFrac; maxY += rangeY * marginFrac;
    rangeX = maxX - minX; rangeY = maxY - minY;
    if (rangeX < 1) rangeX = 100;
    if (rangeY < 1) rangeY = 100;

    // Scale
    var scaleX = viewW / rangeX;
    var scaleY = viewH / rangeY;
    var scale = Math.min(scaleX, scaleY);

    // Center offset
    var offsetX = padding + (viewW - rangeX * scale) / 2;
    var offsetY = padding + (viewH - rangeY * scale) / 2;

    var cx = W / 2, cy = H / 2;
    function tx(x) { return (offsetX + (x - minX) * scale - cx) * zoomLevel + cx + panX; }
    function ty(y) { return (offsetY + (maxY - y) * scale - cy) * zoomLevel + cy + panY; }
    var effScale = scale * zoomLevel;

    // Store transform for coordinate tooltip
    lastTransform = { offsetX: offsetX, offsetY: offsetY, scale: scale, minX: minX, maxX: maxX, minY: minY, maxY: maxY, cx: cx, cy: cy };

    // Update zoom badge
    var zb = document.getElementById('zoom-badge');
    if (zb) zb.textContent = zoomLevel.toFixed(1) + 'x';

    // Apply 3D isometric transform
    if (view3D) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.transform(1, 0.18, -0.25, 0.82, 0, 0);
      ctx.translate(-cx, -cy + 30);
    }

    // Draw grid
    drawGrid(tx, ty, minX, maxX, minY, maxY, effScale);

    // Draw workpiece stock — faint metal fill + outline, anchored (0,0) to
    // (min(maxX,100), min(maxY,100)). (Old code anchored the top edge at
    // 0.9·maxY, drawing a rectangle 10% short of the toolpath.)
    if (maxX > 0 && maxY > 0) {
      var wpW = Math.min(maxX, 100), wpH = Math.min(maxY, 100);
      var wpL = tx(0), wpT = ty(wpH);
      var stock = ctx.createLinearGradient(0, wpT, 0, wpT + wpH * effScale);
      stock.addColorStop(0, 'rgba(130,150,180,0.07)');
      stock.addColorStop(1, 'rgba(130,150,180,0.03)');
      ctx.fillStyle = stock;
      ctx.fillRect(wpL, wpT, wpW * effScale, wpH * effScale);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(wpL, wpT, wpW * effScale, wpH * effScale);
    }

    // Compute globalMinZ for Z-depth color visualization
    globalMinZ = 0;
    for (var sz = 0; sz < pathSegments.length; sz++) {
      var segz = pathSegments[sz].segZ;
      if (segz !== undefined && segz < globalMinZ) globalMinZ = segz;
    }

    // Draw path segments
    for (var i = 0; i < pathSegments.length; i++) {
      var sg = pathSegments[i];
      drawSegment(sg, tx, ty, effScale);
    }

    // Draw origin marker
    ctx.save();
    var ox = tx(0); var oy = ty(0);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox - 8, oy); ctx.lineTo(ox + 8, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy - 8); ctx.lineTo(ox, oy + 8); ctx.stroke();
    ctx.fillStyle = '#42a5f5';
    ctx.font = '11px sans-serif';
    ctx.fillText('0,0', ox + 10, oy + 14);
    ctx.restore();

    // Draw current tool position
    if (pathSegments.length > 0 || machineState.x !== 0 || machineState.y !== 0) {
      var toolX = tx(machineState.x);
      var toolY = ty(machineState.y);

      if (showAnimTool) {
        // Animated tool: spinning disc with flutes
        var tr = 16;
        ctx.save();
        ctx.translate(toolX, toolY);

        // Outer glow
        ctx.fillStyle = 'rgba(67,160,71,0.15)';
        ctx.beginPath(); ctx.arc(0, 0, tr + 6, 0, 2 * Math.PI); ctx.fill();

        // Tool body circle
        ctx.fillStyle = 'rgba(67,160,71,0.25)';
        ctx.strokeStyle = '#43a047';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, tr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();

        // Spinning flutes
        ctx.strokeStyle = '#66bb6a';
        ctx.lineWidth = 2;
        for (var fl = 0; fl < 4; fl++) {
          var fa = toolAngle + fl * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(fa) * 4, Math.sin(fa) * 4);
          ctx.lineTo(Math.cos(fa) * tr, Math.sin(fa) * tr);
          ctx.stroke();
        }

        // Center dot
        ctx.fillStyle = '#a5d6a7';
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, 2 * Math.PI); ctx.fill();

        // Feed direction arrow (if we have a last segment)
        if (executionIndex > 0 && executionIndex <= pathSegments.length) {
          var ls = pathSegments[executionIndex - 1];
          if (ls.type === 'linear' || ls.type === 'rapid') {
            var dx = ls.toX - ls.fromX, dy = ls.toY - ls.fromY;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0.01) {
              var ang = Math.atan2(-dy, dx); // negative because canvas Y is flipped
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(Math.cos(ang) * (tr + 8), Math.sin(ang) * (tr + 8));
              ctx.lineTo(Math.cos(ang) * (tr + 18), Math.sin(ang) * (tr + 18));
              ctx.stroke();
              // Arrowhead
              ctx.beginPath();
              ctx.moveTo(Math.cos(ang) * (tr + 18), Math.sin(ang) * (tr + 18));
              ctx.lineTo(Math.cos(ang + 0.4) * (tr + 12), Math.sin(ang + 0.4) * (tr + 12));
              ctx.moveTo(Math.cos(ang) * (tr + 18), Math.sin(ang) * (tr + 18));
              ctx.lineTo(Math.cos(ang - 0.4) * (tr + 12), Math.sin(ang - 0.4) * (tr + 12));
              ctx.stroke();
            }
          }
        }

        ctx.restore();
      } else {
        // Simple tool marker (original)
        ctx.fillStyle = 'rgba(67,160,71,0.3)';
        ctx.beginPath(); ctx.arc(toolX, toolY, 10, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#43a047';
        ctx.beginPath(); ctx.arc(toolX, toolY, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#43a047';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(toolX - 14, toolY); ctx.lineTo(toolX + 14, toolY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toolX, toolY - 14); ctx.lineTo(toolX, toolY + 14); ctx.stroke();
      }
    }

    // Axis labels
    ctx.fillStyle = '#42a5f5';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('X', W - 20, ty(0) + 4);
    ctx.fillText('Y', tx(0) - 4, 16);

    // Close 3D transform
    if (view3D) ctx.restore();
  }

  function drawGrid(tx, ty, minX, maxX, minY, maxY, scale) {
    // Auto grid spacing
    var range = Math.max(maxX - minX, maxY - minY);
    var gridStep = 10;
    if (range > 200) gridStep = 50;
    else if (range > 100) gridStep = 20;
    else if (range > 50) gridStep = 10;
    else gridStep = 5;

    ctx.strokeStyle = '#1a2030';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    var startX = Math.floor(minX / gridStep) * gridStep;
    var startY = Math.floor(minY / gridStep) * gridStep;

    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#3a4060';

    for (var gx = startX; gx <= maxX; gx += gridStep) {
      var px = tx(gx);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      ctx.fillText(gx.toString(), px + 2, H - 4);
    }
    for (var gy = startY; gy <= maxY; gy += gridStep) {
      var py = ty(gy);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      ctx.fillText(gy.toString(), 4, py - 3);
    }

    // Axes
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    // X axis
    var axY = ty(0);
    if (axY >= 0 && axY <= H) {
      ctx.beginPath(); ctx.moveTo(0, axY); ctx.lineTo(W, axY); ctx.stroke();
    }
    // Y axis
    var axX = tx(0);
    if (axX >= 0 && axX <= W) {
      ctx.beginPath(); ctx.moveTo(axX, 0); ctx.lineTo(axX, H); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* Interpolate cut color based on Z depth:
     Z=0 (surface) → green #43a047, Z=globalMinZ (deepest) → blue #42a5f5 */
  function zToColor(z) {
    if (z === undefined || z === null || z >= 0 || globalMinZ >= 0) return null;
    var t = Math.max(0, Math.min(1, z / globalMinZ)); // 0 = surface, 1 = deepest
    var r = Math.round(67  + (33  - 67)  * t); // 67 → 33
    var g = Math.round(160 + (150 - 160) * t); // 160 → 150 (slight dip)
    var b = Math.round(71  + (243 - 71)  * t); // 71 → 243
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* Draw a small directional arrow at (x,y) pointing in direction `angle` */
  function drawArrow(x, y, angle, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha || 0.75;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
    ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.lineTo(x + Math.cos(angle - 2.4) * (size * 0.65), y + Math.sin(angle - 2.4) * (size * 0.65));
    ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
    ctx.lineTo(x + Math.cos(angle + 2.4) * (size * 0.65), y + Math.sin(angle + 2.4) * (size * 0.65));
    ctx.stroke();
    ctx.restore();
  }

  function drawSegment(seg, tx, ty, scale) {
    ctx.setLineDash([]);
    ctx.lineWidth = 2;

    if (seg.type === 'rapid') {
      ctx.strokeStyle = '#6b7a99';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx(seg.fromX), ty(seg.fromY));
      ctx.lineTo(tx(seg.toX), ty(seg.toY));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (seg.type === 'linear') {
      // Cut-width band (behind the path)
      if (toolDiam > 0) {
        ctx.strokeStyle = 'rgba(67,160,71,0.12)';
        ctx.lineWidth = Math.max(2, toolDiam * scale);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx(seg.fromX), ty(seg.fromY));
        ctx.lineTo(tx(seg.toX), ty(seg.toY));
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
      var linColor = zToColor(seg.segZ) || '#43a047';
      ctx.strokeStyle = linColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx(seg.fromX), ty(seg.fromY));
      ctx.lineTo(tx(seg.toX), ty(seg.toY));
      ctx.stroke();
      // Direction arrow at midpoint of linear segment
      if (showArrows) {
        var fpx = tx(seg.fromX), fpy = ty(seg.fromY);
        var tpx = tx(seg.toX),   tpy = ty(seg.toY);
        var adx = tpx - fpx, ady = tpy - fpy;
        var alen = Math.sqrt(adx * adx + ady * ady);
        if (alen > 24) {
          drawArrow((fpx + tpx) / 2, (fpy + tpy) / 2, Math.atan2(ady, adx), 7, linColor, 0.8);
        }
      }
    } else if (seg.type === 'cwArc' || seg.type === 'ccwArc') {
      var cw = seg.type === 'cwArc';
      var cxp = tx(seg.centerX);
      var cyp = ty(seg.centerY);
      var rp = seg.radius * scale;
      var isFullCircle = Math.abs(seg.sweep - 2 * Math.PI) < 0.01;
      var sa = -seg.startAngle;
      var ea = -seg.endAngle;
      // Cut-width band (behind the path)
      if (toolDiam > 0) {
        ctx.strokeStyle = cw ? 'rgba(66,165,245,0.12)' : 'rgba(239,83,80,0.12)';
        ctx.lineWidth = Math.max(2, toolDiam * scale);
        ctx.beginPath();
        if (isFullCircle) { ctx.arc(cxp, cyp, rp, 0, 2 * Math.PI); }
        else { ctx.arc(cxp, cyp, rp, sa, ea, cw); }
        ctx.stroke();
      }
      var arcDepthColor = zToColor(seg.segZ);
      ctx.strokeStyle = arcDepthColor || (cw ? '#42a5f5' : '#ef5350');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (isFullCircle) {
        ctx.arc(cxp, cyp, rp, 0, 2 * Math.PI);
      } else {
        ctx.arc(cxp, cyp, rp, sa, ea, cw);
      }
      ctx.stroke();
      // Direction arrow at midpoint of arc
      if (showArrows && rp > 20) {
        var midAng = cw ? sa + seg.sweep / 2 : sa - seg.sweep / 2;
        var midX = cxp + rp * Math.cos(midAng);
        var midY = cyp + rp * Math.sin(midAng);
        var tangAng = cw ? midAng + Math.PI / 2 : midAng - Math.PI / 2;
        var arcCol = arcDepthColor || (cw ? '#42a5f5' : '#ef5350');
        drawArrow(midX, midY, tangAng, 7, arcCol, 0.8);
      }
    } else if (seg.type === 'drill' || seg.type === 'drillPeck' || seg.type === 'drillTap') {
      // Hole symbol: circle + crosshair at drill position
      var hx = tx(seg.fromX);
      var hy = ty(seg.fromY);
      var hr = Math.max(5, Math.min(14, scale * 2));
      var isPeck = seg.type === 'drillPeck';
      var isTap  = seg.type === 'drillTap';
      var holeColor = isTap ? '#ffa000' : (isPeck ? '#ab47bc' : '#7c4dff');
      var holeFill  = isTap ? 'rgba(255,160,0,0.13)' : (isPeck ? 'rgba(171,71,188,0.13)' : 'rgba(124,77,255,0.16)');
      // Outer circle
      ctx.strokeStyle = holeColor;
      ctx.fillStyle = holeFill;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      // Crosshair
      ctx.strokeStyle = holeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.65, hy); ctx.lineTo(hx + hr * 0.65, hy);
      ctx.moveTo(hx, hy - hr * 0.65); ctx.lineTo(hx, hy + hr * 0.65);
      ctx.stroke();
      // Downward arrows for peck to indicate incremental retract motion
      if (isPeck) {
        ctx.strokeStyle = holeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy - hr * 0.25); ctx.lineTo(hx, hy + hr * 0.55);
        ctx.moveTo(hx - hr * 0.3, hy + hr * 0.25); ctx.lineTo(hx, hy + hr * 0.55);
        ctx.moveTo(hx + hr * 0.3, hy + hr * 0.25); ctx.lineTo(hx, hy + hr * 0.55);
        ctx.stroke();
      }
      // Helix indicator for tap
      if (isTap) {
        ctx.strokeStyle = holeColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.arc(hx, hy, hr * 0.45, 0, Math.PI * 1.5); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.setLineDash([]);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;
    // Hide all panels
    simPanel.style.display = 'none';
    catRow.style.display = 'none';
    itemSelector.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';

    if (m === 'simulate') {
      simPanel.style.display = '';
    } else if (m === 'explore') {
      catRow.style.display = '';
      itemSelector.style.display = '';
      renderExplore();
    } else if (m === 'practice') {
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      practiceCorrect = 0; practiceTotal = 0;
      practiceAnswered = false;
      pbarScoreVal.textContent = '0 / 0';
      ppFeedback.textContent = '';
      ppSolution.style.display = 'none';
      ppNext.style.display = 'none';
      newPractice();
    } else if (m === 'quiz') {
      startQuiz();
    }
  }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.cat === exploreCat);
    });
    selectedConcept = null;
    itemInfo.style.display = 'none';
    renderExplore();
  });

  function renderExplore() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    conceptGrid.innerHTML = '';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.dataset.idx = i;
      btn.addEventListener('click', (function (concept) {
        return function () {
          selectedConcept = concept;
          renderExplore();
          renderConceptDetail(concept);
        };
      })(c));
      conceptGrid.appendChild(btn);
    }
  }

  function renderConceptDetail(c) {
    itemInfo.style.display = '';
    var catLabels = { gcodes: 'G-Code', mcodes: 'M-Code', concepts: 'Programming' };
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + (catLabels[c.cat] || c.cat) + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>';
    if (c.unit) html += '<span class="fb-unit">' + c.unit + '</span>';
    html += '</div>';
    if (c.codeExample) {
      html += '<div class="code-box">' + escapeHtml(c.codeExample) + '</div>';
    }
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      for (var s = 0; s < c.example.steps.length; s++) {
        html += '<p class="ex-step">' + (s < c.example.steps.length - 1 ? c.example.steps[s] : '<strong>' + c.example.steps[s] + '</strong>') + '</p>';
      }
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPractice() {
    practiceAnswered = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppNext.style.display = 'none';
    ppCheck.style.display = '';
    ppInput.value = '';
    ppInput.disabled = false;

    var gen = PRACTICE_POOL[Math.floor(Math.random() * PRACTICE_POOL.length)];
    currentProblem = gen();
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.type = currentProblem.type === 'numeric' ? 'number' : 'text';
    ppInput.placeholder = currentProblem.type === 'numeric' ? 'Your answer' : 'e.g., G01 X50 Y30 F200';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkPractice();
  });

  function checkPractice() {
    if (practiceAnswered || !currentProblem) return;
    practiceAnswered = true;
    practiceTotal++;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';

    var userVal = ppInput.value.trim();
    var correct = false;

    if (currentProblem.type === 'numeric') {
      var numVal = parseFloat(userVal);
      var tol = currentProblem.tol || 0.02;
      correct = Math.abs(numVal - currentProblem.answer) <= Math.abs(currentProblem.answer * tol) + tol;
    } else {
      // Text comparison: normalize whitespace, uppercase
      var norm = function (s) { return s.replace(/\s+/g, ' ').trim().toUpperCase(); };
      correct = norm(userVal) === norm(currentProblem.answer.toString());
    }

    if (correct) {
      practiceCorrect++;
      ppFeedback.textContent = '\u2713 Correct!';
      ppFeedback.className = 'feedback ok';
      playSuccess();
    } else {
      ppFeedback.textContent = '\u2717 Incorrect. Answer: ' + currentProblem.answer;
      ppFeedback.className = 'feedback err';
      playError();
    }
    pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;

    // Show solution
    if (currentProblem.solution) {
      ppSolution.style.display = '';
      ppSolution.innerHTML = '<h4>Solution</h4>' + currentProblem.solution.map(function (s) {
        return '<p class="sol-step">' + s + '</p>';
      }).join('');
    }
  }

  ppNext.addEventListener('click', newPractice);

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function startQuiz() {
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0; quizAnswers = [];
    quizSubmitted = false;
    quizPanel.style.display = '';
    quizBar.style.display = '';
    quizResult.style.display = 'none';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= quizSet.length) { showQuizResult(); return; }
    var q = quizSet[quizIdx];
    document.getElementById('qbar-num').textContent = quizIdx + 1;
    quizSubmitted = false;

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.q + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      for (var i = 0; i < q.opts.length; i++) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + q.opts[i] + '</button>';
      }
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + (q.unit || '') + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
    }
    html += '<p class="quiz-feedback" id="quiz-fb"></p>';
    html += '<button class="btn btn-ghost" id="quiz-next" style="display:none;margin-top:10px;">Next \u2192</button>';

    quizPanel.innerHTML = html;

    // Bind events
    if (q.type === 'mcq') {
      var btns = quizPanel.querySelectorAll('.answer-btn');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizSubmitted) return;
          quizSubmitted = true;
          var chosen = parseInt(btn.dataset.idx);
          var correct = chosen === q.ans;
          if (correct) quizScore++;
          quizAnswers.push({ q: q.q, correct: correct, given: q.opts[chosen], expected: q.opts[q.ans] });

          btns.forEach(function (b) {
            b.classList.add('locked');
            if (parseInt(b.dataset.idx) === q.ans) b.classList.add('correct');
            if (parseInt(b.dataset.idx) === chosen && !correct) b.classList.add('wrong');
          });
          var fb = document.getElementById('quiz-fb');
          fb.textContent = correct ? '\u2713 Correct!' : '\u2717 Incorrect. Answer: ' + q.opts[q.ans];
          fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
          if (correct) playSuccess(); else playError();
          document.getElementById('quiz-next').style.display = '';
        });
      });
    } else {
      var subBtn = document.getElementById('qi-submit');
      var inp = document.getElementById('qi-input');
      function submitNumeric() {
        if (quizSubmitted) return;
        quizSubmitted = true;
        var val = parseFloat(inp.value);
        var tol = q.tol || 0.5;
        var correct = Math.abs(val - q.ans) <= tol;
        if (correct) quizScore++;
        quizAnswers.push({ q: q.q, correct: correct, given: val, expected: q.ans, unit: q.unit });

        inp.disabled = true;
        subBtn.disabled = true;
        var fb = document.getElementById('quiz-fb');
        fb.textContent = correct ? '\u2713 Correct!' : '\u2717 Incorrect. Answer: ' + q.ans + ' ' + (q.unit || '');
        fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
        if (correct) playSuccess(); else playError();
        document.getElementById('quiz-next').style.display = '';
      }
      subBtn.addEventListener('click', submitNumeric);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumeric(); });
      inp.focus();
    }

    document.getElementById('quiz-next').addEventListener('click', function () {
      quizIdx++;
      renderQuizQuestion();
    });
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var stars, cls, verdict;
    if (pct === 1) { stars = '\u2605\u2605\u2605'; cls = 'perfect'; verdict = 'Perfect Score!'; }
    else if (pct >= 0.6) { stars = '\u2605\u2605'; cls = 'good'; verdict = 'Good Job!'; }
    else { stars = '\u2605'; cls = 'poor'; verdict = 'Keep Practicing'; }

    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</span><div class="qr-verdict">' + verdict + '</div></div></div>';
    html += '<div class="qr-rows">';
    for (var i = 0; i < quizAnswers.length; i++) {
      var a = quizAnswers[i];
      var ok = a.correct;
      html += '<div class="qr-row ' + (ok ? 'ok' : 'err') + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail">' + a.q + ' <strong>Your answer: ' + a.given + '</strong>' + (!ok ? ' (Correct: ' + a.expected + ')' : '') + '</span>';
      html += '<span class="qr-mark">' + (ok ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('quiz-retry').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  /* ================================================================
     SIMULATE MODE EVENT HANDLERS
     ================================================================ */
  exSelect.addEventListener('change', function () {
    editor.value = EXAMPLES[exSelect.value] || '';
    updateSyntaxHighlight();
    updateLineNumbers();
    resetMachine();
    draw();
  });

  btnRun.addEventListener('click', function () {
    if (animating) { pauseAnimation(); } else { startAnimation(); }
  });

  btnStep.addEventListener('click', stepOne);

  btnReset.addEventListener('click', function () {
    resetMachine();
    draw();
  });

  btnClear.addEventListener('click', function () {
    editor.value = '';
    updateSyntaxHighlight();
    updateLineNumbers();
    resetMachine();
    draw();
  });

  speedSlider.addEventListener('input', function () {
    speedVal.textContent = speedSlider.value + 'x';
  });

  /* ================================================================
     EXPORT FUNCTIONS
     ================================================================ */
  function exportGCode() {
    var blob = new Blob([editor.value], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'program.nc';
    a.click();
    URL.revokeObjectURL(a.href);
    playClick();
  }

  function exportCSV() {
    var header = 'Segment,Type,FromX,FromY,ToX,ToY,CenterX,CenterY,Radius,Sweep_deg,HoleZ,Feed\n';
    var rows = pathSegments.map(function (seg, i) {
      var cx = seg.centerX !== undefined ? seg.centerX.toFixed(3) : '';
      var cy = seg.centerY !== undefined ? seg.centerY.toFixed(3) : '';
      var r  = seg.radius   !== undefined ? seg.radius.toFixed(3)   : '';
      var sw = seg.sweep    !== undefined ? (seg.sweep * 180 / Math.PI).toFixed(2) : '';
      var hz = seg.holeZ    !== undefined ? seg.holeZ.toFixed(3) : '';
      return (i + 1) + ',' + seg.type + ',' +
        seg.fromX.toFixed(3) + ',' + seg.fromY.toFixed(3) + ',' +
        seg.toX.toFixed(3)   + ',' + seg.toY.toFixed(3)   + ',' +
        cx + ',' + cy + ',' + r + ',' + sw + ',' + hz + ',' + machineState.feed;
    }).join('\n');
    var blob = new Blob([header + rows], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'toolpath.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    playClick();
  }

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.022);
    if (fs < 10) fs = 10;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'cnc_toolpath.png';
    a.click();
    playClick();
  }

  // Export button event listeners
  var btnExGcode = document.getElementById('btn-ex-gcode');
  var btnExCsv = document.getElementById('btn-ex-csv');
  var btnExPng = document.getElementById('btn-ex-png');
  if (btnExGcode) btnExGcode.addEventListener('click', exportGCode);
  if (btnExCsv) btnExCsv.addEventListener('click', exportCSV);
  if (btnExPng) btnExPng.addEventListener('click', exportPNG);

  /* ================================================================
     RIGHT-CLICK CONTEXT MENU
     ================================================================ */
  var ctxMenu = document.getElementById('ctx-menu');
  if (ctxMenu) {
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      ctxMenu.style.display = 'block';
      var mw = ctxMenu.offsetWidth, mh = ctxMenu.offsetHeight;
      var vw = window.innerWidth, vh = window.innerHeight;
      ctxMenu.style.position = 'fixed';
      ctxMenu.style.left = Math.max(4, Math.min(e.clientX, vw - mw - 8)) + 'px';
      ctxMenu.style.top = Math.max(4, Math.min(e.clientY, vh - mh - 8)) + 'px';
    });
    document.addEventListener('click', function () { ctxMenu.style.display = 'none'; });
    ctxMenu.querySelectorAll('.ctx-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var action = item.dataset.action;
        if (action === 'save-png') exportPNG();
        else if (action === 'export-csv') exportCSV();
        else if (action === 'export-gcode') exportGCode();
        else if (action === 'reset') { resetMachine(); draw(); }
        ctxMenu.style.display = 'none';
      });
    });
  }

  /* ================================================================
     BUTTON CLICK SOUNDS
     ================================================================ */
  btnRun.addEventListener('click', function () { playClick(); });
  btnStep.addEventListener('click', function () { playClick(); });
  btnReset.addEventListener('click', function () { playClick(); });
  btnClear.addEventListener('click', function () { playClick(); });

  /* ================================================================
     GUIDE BLINK — highlight the next action button
     ================================================================ */
  function updateGuideBlink() {
    btnRun.classList.remove('sim-guide-blink');
    btnStep.classList.remove('sim-guide-blink');
    btnReset.classList.remove('sim-guide-blink');
    if (animating) return; // no blink while running
    if (executionIndex > 0 && executionIndex >= parsedCommands.length) {
      btnReset.classList.add('sim-guide-blink');
    } else if (executionIndex > 0 && executionIndex < parsedCommands.length) {
      btnStep.classList.add('sim-guide-blink');
    } else if (executionIndex === 0 && editor.value.trim().length > 0) {
      btnRun.classList.add('sim-guide-blink');
    }
  }

  /* ================================================================
     EDITOR LINE HIGHLIGHT
     ================================================================ */
  var editorHL = document.createElement('div');
  editorHL.id = 'editor-highlight';
  editor.parentNode.insertBefore(editorHL, editor);

  function highlightEditorLine(lineIdx) {
    editorHL.innerHTML = '';
    if (lineIdx < 0) return;
    var style = getComputedStyle(editor);
    var lh = parseFloat(style.lineHeight);
    if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.6;
    var pt = parseFloat(style.paddingTop) || 12;
    var bt = parseFloat(style.borderTopWidth) || 2;
    var top = pt + bt + lineIdx * lh - editor.scrollTop;
    if (top < 0 || top > editor.offsetHeight) return;
    var hl = document.createElement('div');
    hl.className = 'editor-hl-line';
    hl.style.top = top + 'px';
    hl.style.height = lh + 'px';
    editorHL.appendChild(hl);
  }
  editor.addEventListener('scroll', function () {
    // re-highlight current line on scroll
    if (executionIndex > 0 && executionIndex <= parsedCommands.length) {
      highlightEditorLine(parsedCommands[executionIndex - 1].lineNum);
    }
  });

  /* ================================================================
     ZOOM & PAN
     ================================================================ */
  function applyZoom(factor, cx, cy) {
    if (cx !== undefined) {
      panX = cx - (cx - panX) * factor;
      panY = cy - (cy - panY) * factor;
    }
    zoomLevel *= factor;
    zoomLevel = Math.max(0.5, Math.min(zoomLevel, 20));
    draw();
  }

  function resetView() {
    zoomLevel = 1; panX = 0; panY = 0;
    draw();
  }

  /* Ctrl+Scroll to zoom (avoids conflict with page scroll) */
  canvas.addEventListener('wheel', function (e) {
    if (!e.ctrlKey && !e.metaKey) return; // let page scroll normally
    e.preventDefault();
    var factor = e.deltaY < 0 ? 1.12 : 0.89;
    var rect = canvas.getBoundingClientRect();
    /* map to LOGICAL canvas units (W/H), matching the DPR-scaled draw space */
    var mx = (e.clientX - rect.left) * (W / rect.width);
    var my = (e.clientY - rect.top) * (H / rect.height);
    applyZoom(factor, mx, my);
  }, { passive: false });

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button === 2) return;
    isPanning = true;
    panStartX = e.clientX; panStartY = e.clientY;
    panStartPanX = panX; panStartPanY = panY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!isPanning) return;
    var rect = canvas.getBoundingClientRect();
    var sx = W / rect.width;   /* logical units — lockstep with the DPR draw space */
    var sy = H / rect.height;
    panX = panStartPanX + (e.clientX - panStartX) * sx;
    panY = panStartPanY + (e.clientY - panStartY) * sy;
    draw();
  });
  canvas.addEventListener('pointerup', function () { isPanning = false; });
  canvas.addEventListener('pointercancel', function () { isPanning = false; });

  /* Zoom control buttons */
  document.getElementById('zoom-in').addEventListener('click', function () { applyZoom(1.25); });
  document.getElementById('zoom-out').addEventListener('click', function () { applyZoom(0.8); });
  document.getElementById('zoom-reset').addEventListener('click', resetView);

  /* Double-click to reset view */
  canvas.addEventListener('dblclick', resetView);

  /* ================================================================
     CHEAT SHEET TOGGLE
     ================================================================ */
  var csPanel = document.getElementById('cs-panel');
  var csBackdrop = document.getElementById('cs-backdrop');
  var csClose = document.getElementById('cs-close');
  var btnCS = document.getElementById('btn-cheatsheet');

  function toggleCheatSheet(show) {
    var on = show !== undefined ? show : getComputedStyle(csPanel).display === 'none';
    csPanel.style.display = on ? 'block' : 'none';
    csBackdrop.style.display = on ? 'block' : 'none';
  }
  if (btnCS) btnCS.addEventListener('click', function () { toggleCheatSheet(); playClick(); });
  if (csClose) csClose.addEventListener('click', function () { toggleCheatSheet(false); });
  if (csBackdrop) csBackdrop.addEventListener('click', function () { toggleCheatSheet(false); });
  /* ================================================================
     FULLSCREEN
     ================================================================ */
  var simPanel = document.getElementById('sim-panel');
  var fsBtn = document.getElementById('fs-btn');

  function toggleFullscreen() {
    var isFS = simPanel.classList.toggle('is-fullscreen');
    fsBtn.innerHTML = isFS ? '&#x2716;' : '&#x26F6;';
    fsBtn.title = isFS ? 'Exit fullscreen' : 'Fullscreen';
    setTimeout(function () { resizeCanvas(); draw(); }, 50);
  }
  if (fsBtn) fsBtn.addEventListener('click', function () { toggleFullscreen(); playClick(); });

  /* Unified Escape handler: cheat sheet first, then fullscreen */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (csPanel && getComputedStyle(csPanel).display !== 'none') {
      toggleCheatSheet(false);
    } else if (simPanel.classList.contains('is-fullscreen')) {
      toggleFullscreen();
    }
  });

  /* ================================================================
     3D VIEW & ANIMATED TOOL TOGGLES
     ================================================================ */
  var btn3D = document.getElementById('btn-3d');
  var btnTool = document.getElementById('btn-tool');

  btn3D.addEventListener('click', function () {
    view3D = !view3D;
    btn3D.classList.toggle('active', view3D);
    draw();
    playClick();
  });

  btnTool.addEventListener('click', function () {
    showAnimTool = !showAnimTool;
    btnTool.classList.toggle('active', showAnimTool);
    if (showAnimTool) startToolAnim(); else stopToolAnim();
    draw();
    playClick();
  });

  function startToolAnim() {
    if (toolAnimRAF) return;
    var last = performance.now();
    function tick(now) {
      var dt = (now - last) / 1000;
      last = now;
      // Spin when spindle is on, proportional to RPM
      if (machineState.spindleOn) {
        var rps = (machineState.spindle || 1000) / 60;
        toolAngle += rps * dt * 2 * Math.PI * 0.05; // visual speed
      }
      draw();
      toolAnimRAF = requestAnimationFrame(tick);
    }
    toolAnimRAF = requestAnimationFrame(tick);
  }

  function stopToolAnim() {
    if (toolAnimRAF) { cancelAnimationFrame(toolAnimRAF); toolAnimRAF = null; }
  }

  /* ── Cut Direction Arrows Toggle ─────────────────────────────── */
  var btnArrows = document.getElementById('btn-arrows');
  if (btnArrows) {
    btnArrows.addEventListener('click', function () {
      showArrows = !showArrows;
      btnArrows.classList.toggle('active', showArrows);
      draw();
      playClick();
    });
  }

  /* ── SI/Imperial Readout Toggle ──────────────────────────────── */
  var btnUnits = document.getElementById('btn-units');
  if (btnUnits) {
    btnUnits.addEventListener('click', function () {
      displayMetric = !displayMetric;
      btnUnits.textContent = displayMetric ? 'MM' : 'IN';
      btnUnits.classList.toggle('active', !displayMetric);
      updateReadouts();
      /* The stats panel (cut/rapid distance, bounding box) is only written by
         computeStats(), so it would otherwise keep the previous system. */
      var statsPanel = document.getElementById('stats-panel');
      if (statsPanel && statsPanel.style.display !== 'none') computeStats();
      // Sync S&F Calculator if it is open
      var sfcPanel = document.getElementById('sfc-panel');
      if (sfcPanel && sfcPanel.style.display === 'block') sfcCalc();
      playClick();
    });
  }

  /* ── Save/Load Program Slots ─────────────────────────────────── */
  var SAVE_PREFIX = 'cnc-slot-';
  function refreshSlotButtons() {
    document.querySelectorAll('.save-slot-btn').forEach(function (btn) {
      var saved = localStorage.getItem(SAVE_PREFIX + btn.dataset.slot);
      btn.classList.toggle('has-save', !!saved);
      btn.title = saved
        ? 'Click: Load slot ' + (+btn.dataset.slot + 1) + ' | Shift+click: Overwrite'
        : 'Click: Save current program to slot ' + (+btn.dataset.slot + 1);
    });
  }
  document.querySelectorAll('.save-slot-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var slot = btn.dataset.slot;
      var saved = localStorage.getItem(SAVE_PREFIX + slot);
      if (saved && !e.shiftKey) {
        // Load
        editor.value = saved;
        updateSyntaxHighlight();
        updateLineNumbers();
        resetMachine();
        draw();
        playClick();
      } else {
        // Save / overwrite
        localStorage.setItem(SAVE_PREFIX + slot, editor.value);
        refreshSlotButtons();
        playClick();
      }
    });
  });
  refreshSlotButtons();

  /* ================================================================
     NAMED SAVE / LOAD / IMPORT  (multi-slot, separate from quick-slots)
     ================================================================ */
  (function () {
    var STORAGE_KEY = 'mechsim.cnc-gcode.programs.v1';   /* { name: {savedAt, gcode, toolDiam, units} } */
    var SCHEMA = 'mechsim.cnc-gcode.v1';

    function showToast(msg, kind) {
      var t = document.getElementById('_cnc-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = '_cnc-toast';
        t.className = 'toast';
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.className = 'toast show' + (kind === 'error' ? ' toast-error' : (kind === 'success' ? ' toast-success' : ''));
      clearTimeout(t._tid);
      t._tid = setTimeout(function () { t.className = 'toast'; }, 2200);
    }

    function readSlots() {
      var slots = {};
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') slots = parsed; }
      } catch (e) { /* ignore */ }
      return slots;
    }
    function writeSlots(slots) { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)); }

    function defaultSaveName() {
      var d = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      return 'Program ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
           + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function fmtDate(iso) {
      try { var d = new Date(iso); if (isNaN(d.getTime())) return iso || ''; return d.toLocaleString(); }
      catch (e) { return iso || ''; }
    }

    function snapshotCurrent() {
      var rec = {
        schema: SCHEMA,
        savedAt: new Date().toISOString(),
        gcode: editor.value
      };
      if (typeof toolDiamInput !== 'undefined' && toolDiamInput) {
        rec.toolDiam = parseFloat(toolDiamInput.value) || 0;
      }
      if (typeof displayMetric !== 'undefined') rec.units = displayMetric ? 'mm' : 'in';
      return rec;
    }

    function restoreInto(gcodeText, opts) {
      editor.value = gcodeText;
      try { updateSyntaxHighlight(); } catch (e) {}
      try { updateLineNumbers(); } catch (e) {}
      try { resetMachine(); } catch (e) {}
      try { draw(); } catch (e) {}
      if (opts && typeof opts.toolDiam === 'number' && typeof toolDiamInput !== 'undefined' && toolDiamInput) {
        toolDiamInput.value = opts.toolDiam;
        toolDiamInput.dispatchEvent(new Event('input'));
      }
      if (opts && opts.units && typeof btnUnits !== 'undefined' && btnUnits) {
        var wantMetric = opts.units === 'mm';
        if (wantMetric !== displayMetric) btnUnits.click();
      }
    }

    /* Save As… */
    var btnSaveAs = document.getElementById('btn-save-as');
    if (btnSaveAs) btnSaveAs.addEventListener('click', function () {
      if (!editor.value.trim()) { showToast('Editor is empty — nothing to save', 'error'); return; }
      var slots = readSlots();
      var name = prompt('Save program as:', defaultSaveName());
      if (name === null) return;
      name = String(name).trim();
      if (!name) { showToast('Name cannot be empty', 'error'); return; }
      if (name.length > 60) name = name.slice(0, 60);
      if (slots[name] && !confirm('A program named "' + name + '" already exists. Overwrite?')) return;
      try {
        slots[name] = snapshotCurrent();
        slots[name].savedAt = new Date().toISOString();
        writeSlots(slots);
        showToast('Saved as "' + name + '"', 'success');
      } catch (err) { showToast('Save failed: ' + (err && err.message ? err.message : 'storage error'), 'error'); }
    });

    /* Saved picker */
    var btnOpen = document.getElementById('btn-open-saved');
    var pickerOverlay = document.getElementById('saved-picker-overlay');
    var pickerList    = document.getElementById('saved-picker-list');
    var pickerEmpty   = document.getElementById('saved-picker-empty');
    var pickerClose   = document.getElementById('saved-picker-close');

    function renderPicker() {
      if (!pickerList) return;
      var slots = readSlots();
      var names = Object.keys(slots).sort(function (a, b) {
        return (slots[b].savedAt || '').localeCompare(slots[a].savedAt || '');
      });
      pickerList.innerHTML = '';
      if (!names.length) {
        pickerList.style.display = 'none';
        if (pickerEmpty) pickerEmpty.style.display = '';
        return;
      }
      pickerList.style.display = '';
      if (pickerEmpty) pickerEmpty.style.display = 'none';
      names.forEach(function (n) {
        var rec = slots[n];
        var lines = (rec.gcode || '').split('\n').length;
        var row = document.createElement('div'); row.className = 'saved-item';
        var info = document.createElement('div'); info.className = 'saved-item-info';
        var nameEl = document.createElement('div'); nameEl.className = 'saved-item-name'; nameEl.textContent = n;
        var metaParts = [lines + ' line' + (lines === 1 ? '' : 's')];
        if (typeof rec.toolDiam === 'number' && rec.toolDiam > 0) metaParts.push('tool Ø' + rec.toolDiam + 'mm');
        if (rec.units) metaParts.push(rec.units.toUpperCase());
        metaParts.push(fmtDate(rec.savedAt));
        var metaEl = document.createElement('div'); metaEl.className = 'saved-item-meta';
        metaEl.textContent = metaParts.join(' · ');
        info.appendChild(nameEl); info.appendChild(metaEl);
        var actions = document.createElement('div'); actions.className = 'saved-item-actions';
        var loadBtn = document.createElement('button'); loadBtn.type = 'button';
        loadBtn.className = 'saved-item-btn'; loadBtn.textContent = 'Load';
        loadBtn.setAttribute('aria-label', 'Load program ' + n);
        loadBtn.addEventListener('click', function () {
          if (editor.value.trim() && !confirm('Replace current program with "' + n + '"?')) return;
          restoreInto(rec.gcode || '', { toolDiam: rec.toolDiam, units: rec.units });
          if (pickerOverlay) pickerOverlay.style.display = 'none';
          showToast('Loaded "' + n + '"', 'success');
        });
        var delBtn = document.createElement('button'); delBtn.type = 'button';
        delBtn.className = 'saved-item-btn saved-item-delete'; delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete program ' + n);
        delBtn.addEventListener('click', function () {
          if (!confirm('Delete saved program "' + n + '"? This cannot be undone.')) return;
          var s = readSlots(); delete s[n]; writeSlots(s);
          renderPicker(); showToast('Deleted "' + n + '"', 'success');
        });
        actions.appendChild(loadBtn); actions.appendChild(delBtn);
        row.appendChild(info); row.appendChild(actions);
        pickerList.appendChild(row);
      });
    }

    if (btnOpen && pickerOverlay) {
      btnOpen.addEventListener('click', function () { renderPicker(); pickerOverlay.style.display = 'flex'; });
      if (pickerClose) pickerClose.addEventListener('click', function () { pickerOverlay.style.display = 'none'; });
      pickerOverlay.addEventListener('click', function (e) { if (e.target === pickerOverlay) pickerOverlay.style.display = 'none'; });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pickerOverlay.style.display === 'flex') {
          pickerOverlay.style.display = 'none'; e.stopPropagation();
        }
      });
    }

    /* Import: accept .nc/.gcode/.tap/.cnc/.txt as raw G-code, .json as named slot */
    var btnImport = document.getElementById('btn-import');
    var fileInput = document.getElementById('import-gcode-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', function () { fileInput.value = ''; fileInput.click(); });
      fileInput.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var text = String(ev.target.result || '');
          var asJson = null;
          /* Try JSON first only if file is .json OR content begins with { */
          var isJsonName = /\.json$/i.test(f.name);
          var looksJson = text.trim().charAt(0) === '{';
          if (isJsonName || looksJson) {
            try { asJson = JSON.parse(text); } catch (er) { asJson = null; }
          }
          if (asJson && asJson.schema === SCHEMA && typeof asJson.gcode === 'string') {
            if (editor.value.trim() && !confirm('Replace current program with imported one?')) return;
            restoreInto(asJson.gcode, { toolDiam: asJson.toolDiam, units: asJson.units });
            showToast('Imported "' + (f.name) + '"', 'success');
            return;
          }
          if (asJson) {
            showToast('JSON file does not match expected schema', 'error');
            return;
          }
          /* Plain G-code text */
          if (!text.trim()) { showToast('File is empty', 'error'); return; }
          if (editor.value.trim() && !confirm('Replace current program with imported file?')) return;
          restoreInto(text);
          showToast('Imported ' + f.name, 'success');
        };
        reader.onerror = function () { showToast('Could not read file', 'error'); };
        reader.readAsText(f);
      });
    }

    /* ── SHAREABLE URL — the G-code program is encoded into the link (no backend).
       snapshotCurrent() (minus savedAt) → [flag] + deflate-raw|raw → base64url → '#c=' ── */
    (function () {
      function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
      function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
      function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
      function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
      var SHARE_MAX = 1800;
      function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
      function shareLink(){
        if(!editor.value.trim()){ flashShare('Nothing to share',false); try{ showToast('Type a program first, then Share.','error'); }catch(e){} return Promise.resolve(); }
        try{
          var rec=snapshotCurrent(); delete rec.savedAt;   // drop the transient timestamp
          var U=new TextEncoder().encode(JSON.stringify(rec));
          var canZip=(typeof CompressionStream!=='undefined');
          return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
            var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
            var enc=b64urlEncode(out);
            if(enc.length>SHARE_MAX){ flashShare('⚠ Too big',false); try{ showToast('Program too long to share as a link — use Save/Export.','error'); }catch(e){} return; }
            var url=location.origin+location.pathname+'#c='+enc;
            try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
            if(navigator.clipboard&&navigator.clipboard.writeText){
              navigator.clipboard.writeText(url).then(
                function(){ flashShare('✓ Link copied!',true); try{ showToast('Shareable link copied.','success'); }catch(e){} },
                function(){ flashShare('↑ In address bar'); try{ showToast('Shareable link is in the address bar.',''); }catch(e){} });
            } else { flashShare('↑ In address bar'); }
          }).catch(function(){ flashShare('✗ Failed',false); });
        }catch(e){ flashShare('✗ Failed',false); return Promise.resolve(); }
      }
      function loadFromHash(){
        var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
        var enc=h.slice(3);
        Promise.resolve().then(function(){
          var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
          return (flag===1)?inflateBytes(body):Promise.resolve(body);
        }).then(function(U){
          var rec=JSON.parse(new TextDecoder().decode(U));
          if(!rec || typeof rec.gcode!=='string') return;   // shape mismatch → ignore
          restoreInto(rec.gcode, rec);                        // reuse the tool's own restore
          try{ showToast('Opened a shared program.','success'); }catch(e){}
        }).catch(function(){});                               // corrupt link → keep the example
      }
      var btnShare=document.getElementById('btn-share');
      if(btnShare) btnShare.addEventListener('click', shareLink);
      setTimeout(loadFromHash, 0);   // after the synchronous boot (rAF-free so it isn't throttled)
    })();
  })();

  /* ================================================================
     G-CODE SYNTAX HIGHLIGHTING
     ================================================================ */
  var syntaxEl = document.getElementById('syntax-highlight');

  function updateSyntaxHighlight() {
    var text = editor.value;
    var html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Comments first (preserve across other replacements)
    html = html.replace(/(;[^\n]*)/g, '<span class="sy-comment">$1</span>');
    // G-codes
    html = html.replace(/\b(G\d{1,2}(\.\d)?)\b/gi, '<span class="sy-g">$1</span>');
    // M-codes
    html = html.replace(/\b(M\d{1,2})\b/gi, '<span class="sy-m">$1</span>');
    // S/F/T words
    html = html.replace(/\b([SFT])(\d+\.?\d*)/gi, '<span class="sy-s">$1$2</span>');
    // Coordinate words (X Y Z I J K R Q)
    html = html.replace(/\b([XYZIJKRQ])([-]?\d+\.?\d*)/gi, '<span class="sy-coord">$1$2</span>');
    syntaxEl.innerHTML = html + '\n'; // trailing newline prevents last-line clipping
  }

  /* ── Line number gutter ───────────────────────────────────────── */
  var lineNosEl = document.getElementById('editor-linenos');

  function updateLineNumbers() {
    if (!lineNosEl) return;
    var count = (editor.value.match(/\n/g) || []).length + 1;
    var html = '';
    for (var ln = 1; ln <= count; ln++) html += '<span>' + ln + '</span>';
    lineNosEl.innerHTML = html;
    lineNosEl.scrollTop = editor.scrollTop;
  }

  editor.addEventListener('input', function () {
    updateSyntaxHighlight();
    updateLineNumbers();
  });
  editor.addEventListener('scroll', function () {
    syntaxEl.scrollTop = editor.scrollTop;
    syntaxEl.scrollLeft = editor.scrollLeft;
    if (lineNosEl) lineNosEl.scrollTop = editor.scrollTop;
  });

  /* ================================================================
     CANVAS COORDINATE TOOLTIP
     ================================================================ */
  var coordTooltip = document.getElementById('coord-tooltip');

  function canvasToMachine(px, py) {
    var t = lastTransform;
    var machX = ((px - t.cx - panX) / zoomLevel + t.cx - t.offsetX) / t.scale + t.minX;
    var machY = t.maxY - ((py - t.cy - panY) / zoomLevel + t.cy - t.offsetY) / t.scale;
    return { x: machX, y: machY };
  }

  canvas.addEventListener('mousemove', function (e) {
    if (isPanning) { coordTooltip.style.display = 'none'; return; }
    var rect = canvas.getBoundingClientRect();
    var sx = W / rect.width;   /* logical units — lockstep with the DPR draw space */
    var sy = H / rect.height;
    var px = (e.clientX - rect.left) * sx;
    var py = (e.clientY - rect.top) * sy;
    var mc = canvasToMachine(px, py);
    coordTooltip.textContent = 'X: ' + mc.x.toFixed(2) + '  Y: ' + mc.y.toFixed(2);
    coordTooltip.style.display = 'block';
    var tipX = e.clientX - rect.left + 15;
    var tipY = e.clientY - rect.top - 10;
    if (tipX + 140 > rect.width) tipX -= 170;
    coordTooltip.style.left = tipX + 'px';
    coordTooltip.style.top = tipY + 'px';
  });
  canvas.addEventListener('mouseleave', function () {
    coordTooltip.style.display = 'none';
  });

  /* ================================================================
     TOOLPATH SCRUBBER
     ================================================================ */
  function showScrubber(total) {
    var scrubberRow = document.getElementById('scrubber-row');
    var scrubber = document.getElementById('scrubber');
    var scrubberVal = document.getElementById('scrubber-val');
    if (!scrubberRow || !scrubber) return;
    scrubberRow.style.display = '';
    scrubber.max = total;
    scrubber.value = executionIndex;
    if (scrubberVal) scrubberVal.textContent = executionIndex + ' / ' + total;
  }
  function hideScrubber() {
    var scrubberRow = document.getElementById('scrubber-row');
    if (scrubberRow) scrubberRow.style.display = 'none';
  }

  /* Scrubber input — re-execute from step 0 to target */
  var scrubberEl = document.getElementById('scrubber');
  if (scrubberEl) {
    scrubberEl.addEventListener('input', function () {
      var target = parseInt(scrubberEl.value);
      if (animating) pauseAnimation();
      // Reset state
      machineState = { x: 0, y: 0, z: 0, feed: 0, spindle: 0, spindleOn: false,
        absolute: true, metric: true, plane: 'XY', pathLength: 0 };
      globalMinZ = 0; pathSegments = []; cannedCycle = null; drillHoles = [];
      spindleWarned = false;
      clearWarnings();
      // Re-run up to target step
      for (var i = 0; i < target && i < parsedCommands.length; i++) {
        executeCommand(parsedCommands[i]);
      }
      executionIndex = target;
      highlightEditorLine(target > 0 ? parsedCommands[target - 1].lineNum : -1);
      updateReadouts();
      draw();
      var scrubberVal = document.getElementById('scrubber-val');
      if (scrubberVal) scrubberVal.textContent = target + ' / ' + parsedCommands.length;
    });
  }

  /* ================================================================
     TOOLPATH STATISTICS
     ================================================================ */
  function computeStats() {
    var cutDist = 0, rapidDist = 0, totalMoves = 0, cutTimeMin = 0;
    var bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;

    for (var i = 0; i < pathSegments.length; i++) {
      var seg = pathSegments[i];
      totalMoves++;
      bMinX = Math.min(bMinX, seg.fromX, seg.toX);
      bMaxX = Math.max(bMaxX, seg.fromX, seg.toX);
      bMinY = Math.min(bMinY, seg.fromY, seg.toY);
      bMaxY = Math.max(bMaxY, seg.fromY, seg.toY);

      if (seg.type === 'rapid') {
        var dx = seg.toX - seg.fromX, dy = seg.toY - seg.fromY;
        rapidDist += Math.sqrt(dx * dx + dy * dy);
      } else if (seg.type === 'linear') {
        var dx2 = seg.toX - seg.fromX, dy2 = seg.toY - seg.fromY;
        var segLen = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        cutDist += segLen;
        cutTimeMin += segLen / (seg.feed > 0 ? seg.feed : 200);
      } else if (seg.type === 'cwArc' || seg.type === 'ccwArc') {
        var arcLen = Math.abs(seg.radius * seg.sweep);
        cutDist += arcLen;
        cutTimeMin += arcLen / (seg.feed > 0 ? seg.feed : 200);
        bMinX = Math.min(bMinX, seg.centerX - seg.radius);
        bMaxX = Math.max(bMaxX, seg.centerX + seg.radius);
        bMinY = Math.min(bMinY, seg.centerY - seg.radius);
        bMaxY = Math.max(bMaxY, seg.centerY + seg.radius);
      }
    }

    /* Per-segment feed (was: whole path at the FINAL feed rate) */
    var estMin = cutTimeMin + (rapidDist / 5000);
    var estSec = Math.round(estMin * 60);
    var mins = Math.floor(estSec / 60);
    var secs = estSec % 60;

    document.getElementById('stats-panel').style.display = '';
    /* These two are travel distances like Path Length — they follow the
       MM/IN readout toggle too. */
    document.getElementById('stat-cut-dist').textContent = toD(cutDist).toFixed(displayMetric ? 1 : 3);
    document.getElementById('stat-rapid-dist').textContent = toD(rapidDist).toFixed(displayMetric ? 1 : 3);
    var ruCut = document.getElementById('ru-cut-dist'); if (ruCut) ruCut.textContent = ' ' + uLen();
    var ruRap = document.getElementById('ru-rapid-dist'); if (ruRap) ruRap.textContent = ' ' + uLen();
    document.getElementById('stat-moves').textContent = totalMoves;
    document.getElementById('stat-time').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    if (bMinX !== Infinity) {
      var bd = displayMetric ? 1 : 3;
      document.getElementById('stat-bbox').textContent =
        toD(bMaxX - bMinX).toFixed(bd) + ' x ' + toD(bMaxY - bMinY).toFixed(bd) + ' ' + uLen();
    } else {
      document.getElementById('stat-bbox').textContent = '--';
    }
    // Drill holes count card
    var drillCard = document.getElementById('stat-drill-card');
    var drillCount = document.getElementById('stat-drill-count');
    if (drillCard && drillCount) {
      if (drillHoles.length > 0) {
        drillCard.style.display = '';
        drillCount.textContent = drillHoles.length;
      } else {
        drillCard.style.display = 'none';
      }
    }
    // Show scrubber now that we have parsedCommands.length
    showScrubber(parsedCommands.length);
  }

  /* ================================================================
     FIRST-TIME HINT
     ================================================================ */
  var hintBar = document.getElementById('hint-bar');
  function dismissHint() { if (hintBar) hintBar.style.display = 'none'; }
  if (hintBar) {
    hintBar.addEventListener('click', dismissHint);
  }

  /* ================================================================
     TOOL DIAMETER INPUT
     ================================================================ */
  var toolDiamInput = document.getElementById('tool-diam-input');
  if (toolDiamInput) {
    toolDiamInput.addEventListener('input', function () {
      var v = parseFloat(toolDiamInput.value);
      toolDiam = (isNaN(v) || v < 0) ? 0 : v;
      if (mode === 'simulate') draw();
    });
    toolDiamInput.addEventListener('change', function () {
      var v = parseFloat(toolDiamInput.value);
      toolDiam = (isNaN(v) || v < 0) ? 0 : v;
      if (mode === 'simulate') draw();
    });
  }

  /* ================================================================
     KEYBOARD SHORTCUTS
     ================================================================ */
  document.addEventListener('keydown', function (e) {
    // Only trigger when not focused on a non-editor input/select
    var tag = document.activeElement ? document.activeElement.tagName : '';
    var isEditor = document.activeElement === editor;
    if ((tag === 'INPUT' || tag === 'SELECT') && !isEditor) return;
    if (tag === 'TEXTAREA' && !isEditor) return;
    if (mode !== 'simulate') return;
    if (e.key === 'F5')  { e.preventDefault(); btnRun.click(); }
    if (e.key === 'F8')  { e.preventDefault(); resetMachine(); draw(); playClick(); }
    if (e.key === 'F10') { e.preventDefault(); stepOne(); }
  });

  /* ================================================================
     SPEEDS & FEEDS CALCULATOR
     ================================================================ */
  var SFC_MATERIALS = {
    'aluminium':          { vc: 200, fz: 0.040 },
    'aluminium-carbide':  { vc: 500, fz: 0.060 },
    'mild-steel':         { vc:  30, fz: 0.025 },
    'mild-steel-carbide': { vc: 120, fz: 0.050 },
    'stainless':          { vc:  80, fz: 0.035 },
    'cast-iron':          { vc:  70, fz: 0.050 },
    'brass':              { vc: 150, fz: 0.050 },
    'plastic':            { vc: 300, fz: 0.080 },
    'wood':               { vc: 400, fz: 0.120 }
  };

  function sfcCalc() {
    var matKey = document.getElementById('sfc-material') ? document.getElementById('sfc-material').value : '';
    var dInput = parseFloat(document.getElementById('sfc-diam') ? document.getElementById('sfc-diam').value : '0');
    var z = parseInt(document.getElementById('sfc-flutes') ? document.getElementById('sfc-flutes').value : '2');
    var data = SFC_MATERIALS[matKey];

    // Update unit labels to match current display mode
    var metric = displayMetric;
    var diamLabel = document.getElementById('sfc-diam-label');
    var feedUnit  = document.getElementById('sfc-feed-unit');
    var clUnit    = document.getElementById('sfc-chipload-unit');
    var vcUnit    = document.getElementById('sfc-vc-unit');
    if (diamLabel) diamLabel.textContent = 'Tool Diameter (' + (metric ? 'mm' : 'in') + ')';
    if (feedUnit)  feedUnit.textContent  = metric ? 'mm/min' : 'in/min';
    if (clUnit)    clUnit.textContent    = metric ? 'mm/tooth' : 'in/tooth';
    if (vcUnit)    vcUnit.textContent    = metric ? 'm/min' : 'ft/min';

    if (!data || !dInput || dInput <= 0 || isNaN(z) || z < 1) {
      ['sfc-rpm', 'sfc-feed', 'sfc-chipload', 'sfc-vc'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.textContent = '—';
      });
      return;
    }

    // All internal formulas use mm; convert inch input → mm first
    var d_mm = metric ? dInput : dInput * 25.4;

    var rpm  = Math.round((data.vc * 1000) / (Math.PI * d_mm));
    var feed_mm = Math.round(rpm * z * data.fz);

    // Convert outputs for display
    var feedDisplay = metric ? feed_mm : +(feed_mm / 25.4).toFixed(2);
    var clDisplay   = metric ? data.fz.toFixed(3) : (data.fz / 25.4).toFixed(4);
    var vcDisplay   = metric ? data.vc : +(data.vc * 3.28084).toFixed(1);

    document.getElementById('sfc-rpm').textContent      = rpm.toLocaleString();
    document.getElementById('sfc-feed').textContent     = feedDisplay.toLocaleString();
    document.getElementById('sfc-chipload').textContent = clDisplay;
    document.getElementById('sfc-vc').textContent       = vcDisplay;
  }

  function toggleSFC(show) {
    var panel = document.getElementById('sfc-panel');
    var backdrop = document.getElementById('sfc-backdrop');
    if (!panel) return;
    var on = show !== undefined ? show : (panel.style.display === 'none' || panel.style.display === '');
    panel.style.display = on ? 'block' : 'none';
    if (backdrop) backdrop.style.display = on ? 'block' : 'none';
    if (on) sfcCalc();
  }

  var btnSFC = document.getElementById('btn-sfc');
  if (btnSFC) btnSFC.addEventListener('click', function () { toggleSFC(); playClick(); });

  var sfcClose = document.getElementById('sfc-close');
  var sfcBackdrop = document.getElementById('sfc-backdrop');
  if (sfcClose) sfcClose.addEventListener('click', function () { toggleSFC(false); });
  if (sfcBackdrop) sfcBackdrop.addEventListener('click', function () { toggleSFC(false); });

  // Live recalculate when inputs change
  ['sfc-material', 'sfc-diam', 'sfc-flutes'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', sfcCalc);
    if (el) el.addEventListener('change', sfcCalc);
  });

  // Apply to Editor: insert M03 S___ line and feed rate comment
  var sfcApplyBtn = document.getElementById('sfc-apply');
  if (sfcApplyBtn) {
    sfcApplyBtn.addEventListener('click', function () {
      var matKey = document.getElementById('sfc-material').value;
      var d = parseFloat(document.getElementById('sfc-diam').value);
      var z = parseInt(document.getElementById('sfc-flutes').value);
      var data = SFC_MATERIALS[matKey];
      if (!data || !d || d <= 0) return;
      // Convert inch input → mm for internal formula
      var d_mm = displayMetric ? d : d * 25.4;
      var rpm = Math.round((data.vc * 1000) / (Math.PI * d_mm));
      var feed_mm = Math.round(rpm * z * data.fz);
      var feedDisplay = displayMetric ? feed_mm : +(feed_mm / 25.4).toFixed(2);
      var feedUnit = displayMetric ? 'mm/min' : 'in/min';
      var diamStr = d + (displayMetric ? 'mm' : 'in');
      // Find insert point: after leading comment/blank lines
      var lines = editor.value.split('\n');
      var insertIdx = 0;
      for (var li = 0; li < lines.length; li++) {
        var t = lines[li].trim();
        if (t === '' || t.charAt(0) === ';' || t.charAt(0) === '(') { insertIdx = li + 1; }
        else { break; }
      }
      lines.splice(insertIdx, 0,
        'M03 S' + rpm + '        ; Spindle — S&F Calc (' + diamStr + ' ' + z + '-flute)',
        '; Recommended feed: F' + feedDisplay + ' ' + feedUnit + ' (update G01 lines above)'
      );
      editor.value = lines.join('\n');
      updateSyntaxHighlight();
      toggleSFC(false);
      playClick();
    });
  }

  // Extend Escape key handler to also close SFC panel
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var sfcPanel = document.getElementById('sfc-panel');
    if (sfcPanel && sfcPanel.style.display === 'block') { toggleSFC(false); }
  });

  /* ================================================================
     INIT
     ================================================================ */
  editor.value = EXAMPLES.square;
  updateSyntaxHighlight();
  updateLineNumbers();
  resizeCanvas();
  draw();
  updateGuideBlink();
  window.addEventListener('resize', function () {
    if (mode === 'simulate') { resizeCanvas(); draw(); }
  });

})();
