// Application State
const state = {
    gridWidth: 12,
    gridHeight: 19,
    cellSize: 35,
    gap: 2,
    currentColor: '#4ECDC4',
    currentPart: null,
    currentTool: null,
    currentRotation: 0,
    templateRotation: 90,
    pendingStripPlacement: null,
    pendingTrianglePlacement: null,
    parts: [],
    imageEditor: {
        active: false,
        tempImage: null,
        scale: 100,
        rotation: 0,
        offsetX: 0,
        offsetY: 0
    },
    screws: [],
    history: [],
    maxHistory: 20,
    hoveredCell: null,
    backgroundColor: '#F7F7F7',
    template: null,
    drawingMode: 'brush',
    brushSize: 5,
    drawColor: '#000000',
    isDrawing: false
};

// Canvas and Context
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to fit inside white container
canvas.width = 700;
canvas.height = 450;

// Part definitions
const PARTS_CONFIG = {
    circle: {
        name: 'Круг',
        gridWidth: 3,
        gridHeight: 3,
        holes: [[1.5, 0.5], [0.5, 1.5], [1.5, 1.5], [2.5, 1.5], [1.5, 2.5]],
        rounded: true,
        scale: 0.85
    },
    triangle: {
        name: 'Треугольник',
        gridWidth: 3,
        gridHeight: 3,
        rotatable: true,
        scale: 1.15,
        cornerRadius: 10,
        geometry: {
            angles: [0, 90, 180, 270],
            vertices: {
                0: {A: [0,0], B: [2,0], C: [0,2]},
                90: {A: [2,0], B: [2,2], C: [0,0]},
                180: {A: [2,2], B: [0,2], C: [2,0]},
                270: {A: [0,2], B: [0,0], C: [2,2]}
            },
            holes: {
                0: [[0,0],[1,0],[2,0],[0,1],[0,2],[1,1]],
                90: [[2,0],[2,1],[2,2],[1,2],[0,2],[1,1]],
                180: [[2,2],[1,2],[0,2],[2,1],[0,1],[1,1]],
                270: [[0,2],[0,1],[0,0],[1,0],[2,0],[1,1]]
            }
        }
    },
    square: {
        name: 'Квадрат',
        gridWidth: 3,
        gridHeight: 3,
        holes: [[0.5, 0.5], [1.5, 0.5], [2.5, 0.5], [0.5, 1.5], [1.5, 1.5], [2.5, 1.5], [0.5, 2.5], [1.5, 2.5], [2.5, 2.5]],
        roundedCorners: 25
    },
    strip: {
        name: 'Полоска',
        gridWidth: 1,
        gridHeight: 3,
        holes: [[0.5, 0.5], [0.5, 1.5], [0.5, 2.5]],
        rotatable: true,
        roundedEnds: true
    }
};

// Buttons and UI elements
const colorButtons = document.querySelectorAll('.color-btn');
const partButtons = document.querySelectorAll('.part-btn');
const toolButtons = document.querySelectorAll('.tool-btn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const printBtn = document.getElementById('printBtn');
const shareBtn = document.getElementById('shareBtn');
const undoBtn = document.getElementById('undoBtn');
const currentModeElement = document.getElementById('currentMode');
const hintTextElement = document.getElementById('hintText');
const partsCountElement = document.getElementById('partsCount');
const screwsCountElement = document.getElementById('screwsCount');
const drawTemplateBtn = document.getElementById('drawTemplateBtn');
const aiTemplateBtn = document.getElementById('aiTemplateBtn');
const presetsBtn = document.getElementById('presetsBtn');
const rotateTemplateBtn = document.getElementById('rotateTemplateBtn');
const loadBtn = document.getElementById('loadBtn');
const rotationInfoElement = document.getElementById('rotationInfo');

// Image Editor Modal elements
const imageEditorModal = document.getElementById('imageEditorModal');
const imageEditorPreview = document.getElementById('imageEditorPreview');
const imageEditorCtx = imageEditorPreview ? imageEditorPreview.getContext('2d') : null;
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const scaleUpBtn = document.getElementById('scaleUpBtn');
const scaleDownBtn = document.getElementById('scaleDownBtn');
const rotate0Btn = document.getElementById('rotate0Btn');
const rotate90Btn = document.getElementById('rotate90Btn');
const rotate180Btn = document.getElementById('rotate180Btn');
const rotate270Btn = document.getElementById('rotate270Btn');
const rotationValue = document.getElementById('rotationValue');
const offsetXSlider = document.getElementById('offsetXSlider');
const offsetYSlider = document.getElementById('offsetYSlider');
const offsetXValue = document.getElementById('offsetXValue');
const offsetYValue = document.getElementById('offsetYValue');
const centerImageBtn = document.getElementById('centerImageBtn');
const resetImageBtn = document.getElementById('resetImageBtn');
const applyImageBtn = document.getElementById('applyImageBtn');
const cancelImageBtn = document.getElementById('cancelImageBtn');
const closeImageEditorX = document.getElementById('closeImageEditorX');

// Modals
const clearModal = document.getElementById('clearModal');
const confirmClear = document.getElementById('confirmClear');
const cancelClear = document.getElementById('cancelClear');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const angleModal = document.getElementById('angleModal');
const angleButtons = document.querySelectorAll('.angle-btn');
const cancelAngleModal = document.getElementById('cancelAngleModal');
const drawTemplateModal = document.getElementById('drawTemplateModal');
const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas ? drawCanvas.getContext('2d') : null;
const aiTemplateModal = document.getElementById('aiTemplateModal');
const presetsModal = document.getElementById('presetsModal');
const presetButtons = document.querySelectorAll('.preset-btn');



// Initialize
function init() {
    setupEventListeners();
    setupDrawCanvas();
    updateUI();
    drawBoard();
    loadFromURL();
}

// Draw part previews in buttons
function drawPartPreviews() {
    document.querySelectorAll('[data-preview]').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const partType = canvas.getAttribute('data-preview');
        const config = PARTS_CONFIG[partType];
        
        ctx.clearRect(0, 0, 60, 60);
        
        const scale = 16;
        let offsetX = 30;
        let offsetY = 30;
        
        // Draw part shape
        ctx.fillStyle = state.currentColor;
        ctx.globalAlpha = 0.85;
        
        if (partType === 'circle') {
            const radius = scale * 1.2;
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.strokeStyle = darkenColor(state.currentColor, 20);
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw 5 holes in circle pattern
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            // Center hole
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // 4 outer holes
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                const hx = offsetX + Math.cos(angle) * (radius * 0.5);
                const hy = offsetY + Math.sin(angle) * (radius * 0.5);
                ctx.beginPath();
                ctx.arc(hx, hy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        } else if (partType === 'triangle') {
            // Draw triangle matching the board display exactly
            const triScale = 1.15;
            const baseSize = scale * 1.5;
            
            // Use the same geometry as on the board for consistency
            const tgeo = PARTS_CONFIG.triangle.geometry;
            const angle = 0; // Preview at 0° angle
            const v = tgeo.vertices[String(angle)];
            const cornerRadius = 8;
            
            // Calculate center point
            const centerX = offsetX;
            const centerY = offsetY;
            
            // Calculate vertices using the same method as the board
            function vertexXY(gridX, gridY) {
                const baseX = offsetX + (gridX - 1) * (baseSize / 3);
                const baseY = offsetY + (gridY - 1) * (baseSize / 3);
                const scaledX = centerX + (baseX - centerX) * triScale;
                const scaledY = centerY + (baseY - centerY) * triScale;
                return [scaledX, scaledY];
            }
            const vA = vertexXY(...v.A);
            const vB = vertexXY(...v.B);
            const vC = vertexXY(...v.C);
            
            drawRoundedTriangle(ctx, vA[0], vA[1], vB[0], vB[1], vC[0], vC[1], cornerRadius);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.strokeStyle = darkenColor(state.currentColor, 20);
            ctx.lineWidth = 2.5;
            drawRoundedTriangle(ctx, vA[0], vA[1], vB[0], vB[1], vC[0], vC[1], cornerRadius);
            ctx.stroke();
            
            // Draw 6 holes exactly like on the board
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            const holes = tgeo.holes[String(angle)];
            holes.forEach(([hx, hy]) => {
                const holePos = vertexXY(hx, hy);
                ctx.beginPath();
                ctx.arc(holePos[0], holePos[1], 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        } else if (partType === 'strip') {
            const width = scale * 0.8;
            const height = scale * 2.8;
            const radius = width / 2;
            const x = offsetX - width / 2;
            const y = offsetY - height / 2;
            
            ctx.beginPath();
            ctx.arc(x + radius, y + radius, radius, Math.PI, 0, false);
            ctx.lineTo(x + width, y + height - radius);
            ctx.arc(x + radius, y + height - radius, radius, 0, Math.PI, false);
            ctx.closePath();
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.strokeStyle = darkenColor(state.currentColor, 20);
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw 3 holes vertically
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const hy = y + radius + i * (height - 2 * radius) / 2;
                ctx.beginPath();
                ctx.arc(offsetX, hy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        } else if (partType === 'square') {
            const size = scale * 2.2;
            const x = offsetX - size / 2;
            const y = offsetY - size / 2;
            const cornerRadius = 6;
            
            roundRect(ctx, x, y, size, size, cornerRadius);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.strokeStyle = darkenColor(state.currentColor, 20);
            ctx.lineWidth = 2;
            roundRect(ctx, x, y, size, size, cornerRadius);
            ctx.stroke();
            
            // Draw 3x3 grid of holes
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const hx = x + (col + 0.5) * (size / 3);
                    const hy = y + (row + 0.5) * (size / 3);
                    ctx.beginPath();
                    ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
        
        ctx.globalAlpha = 1;
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Color selection
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentColor = btn.getAttribute('data-color');
            updateUI();
            drawBoard();
        });
    });
    
    // Part selection
    partButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentPart = btn.getAttribute('data-part');
            state.currentTool = null;
            updateUI();
        });
    });
    
    // Tool selection
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentTool = btn.getAttribute('data-tool');
            state.currentPart = null;
            updateUI();
        });
    });
    
    // Canvas interactions
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasHover);
    canvas.addEventListener('mouseleave', () => {
        state.hoveredCell = null;
        drawBoard();
    });
    
    // Action buttons
    clearBtn.addEventListener('click', () => clearModal.classList.add('active'));
    confirmClear.addEventListener('click', clearBoard);
    cancelClear.addEventListener('click', () => clearModal.classList.remove('active'));
    saveBtn.addEventListener('click', saveAsImage);
    printBtn.addEventListener('click', printBoard);
    shareBtn.addEventListener('click', showShareModal);
    closeShareModal.addEventListener('click', () => shareModal.classList.remove('active'));
    copyUrlBtn.addEventListener('click', copyShareUrl);
    undoBtn.addEventListener('click', undoLastAction);
    
    // Template buttons
    if (drawTemplateBtn) drawTemplateBtn.addEventListener('click', () => drawTemplateModal.classList.add('active'));
    if (aiTemplateBtn) aiTemplateBtn.addEventListener('click', () => aiTemplateModal.classList.add('active'));
    if (presetsBtn) presetsBtn.addEventListener('click', () => presetsModal.classList.add('active'));
    if (rotateTemplateBtn) rotateTemplateBtn.addEventListener('click', rotateTemplate);
    if (loadBtn) loadBtn.addEventListener('click', loadProject);
    
    // Image Editor Modal
    if (scaleSlider) scaleSlider.addEventListener('input', updateImageScale);
    if (scaleUpBtn) scaleUpBtn.addEventListener('click', () => { scaleSlider.value = Math.min(200, parseInt(scaleSlider.value) + 10); updateImageScale(); });
    if (scaleDownBtn) scaleDownBtn.addEventListener('click', () => { scaleSlider.value = Math.max(50, parseInt(scaleSlider.value) - 10); updateImageScale(); });
    if (rotate0Btn) rotate0Btn.addEventListener('click', () => setImageRotation(0));
    if (rotate90Btn) rotate90Btn.addEventListener('click', () => setImageRotation(90));
    if (rotate180Btn) rotate180Btn.addEventListener('click', () => setImageRotation(180));
    if (rotate270Btn) rotate270Btn.addEventListener('click', () => setImageRotation(270));
    if (offsetXSlider) offsetXSlider.addEventListener('input', updateImageOffset);
    if (offsetYSlider) offsetYSlider.addEventListener('input', updateImageOffset);
    if (centerImageBtn) centerImageBtn.addEventListener('click', centerImage);
    if (resetImageBtn) resetImageBtn.addEventListener('click', resetImageEditor);
    if (applyImageBtn) applyImageBtn.addEventListener('click', applyImageEdits);
    if (cancelImageBtn) cancelImageBtn.addEventListener('click', cancelImageEdits);
    if (closeImageEditorX) closeImageEditorX.addEventListener('click', cancelImageEdits);
    
    // Angle modal
    angleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const angle = parseInt(btn.getAttribute('data-angle'));
            handleAngleSelection(angle);
        });
    });
    if (cancelAngleModal) cancelAngleModal.addEventListener('click', () => {
        // Cancel angle selection - does NOT affect template rotation
        angleModal.classList.remove('active');
        state.pendingStripPlacement = null;
        state.pendingTrianglePlacement = null;
    });
    
    // Draw template modal
    const closeDrawModal = document.getElementById('closeDrawModal');
    const closeDrawModalX = document.getElementById('closeDrawModalX');
    const saveDrawTemplate = document.getElementById('saveDrawTemplate');
    const clearDrawCanvas = document.getElementById('clearDrawCanvas');
    const brushBtn = document.getElementById('brushBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const drawColorPicker = document.getElementById('drawColorPicker');
    const brushSizeSlider = document.getElementById('brushSize');
    
    if (closeDrawModal) closeDrawModal.addEventListener('click', () => drawTemplateModal.classList.remove('active'));
    if (closeDrawModalX) closeDrawModalX.addEventListener('click', () => drawTemplateModal.classList.remove('active'));
    if (saveDrawTemplate) saveDrawTemplate.addEventListener('click', saveDrawnTemplate);
    if (clearDrawCanvas) clearDrawCanvas.addEventListener('click', () => {
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });
    if (brushBtn) brushBtn.addEventListener('click', () => { state.drawingMode = 'brush'; updateDrawUI(); });
    if (eraserBtn) eraserBtn.addEventListener('click', () => { state.drawingMode = 'eraser'; updateDrawUI(); });
    if (drawColorPicker) drawColorPicker.addEventListener('change', (e) => { state.drawColor = e.target.value; });
    if (brushSizeSlider) brushSizeSlider.addEventListener('input', (e) => { state.brushSize = parseInt(e.target.value); });
    
    // AI template modal
    const closeAIModal = document.getElementById('closeAIModal');
    const generateAITemplate = document.getElementById('generateAITemplate');
    if (closeAIModal) closeAIModal.addEventListener('click', () => aiTemplateModal.classList.remove('active'));
    if (generateAITemplate) generateAITemplate.addEventListener('click', generateAIPattern);
    
    // Presets modal
    const closePresetsModal = document.getElementById('closePresetsModal');
    if (closePresetsModal) closePresetsModal.addEventListener('click', () => presetsModal.classList.remove('active'));
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.getAttribute('data-preset');
            applyPreset(preset);
        });
    });
}

// Draw Board
function drawBoard() {
    const totalWidth = state.gridWidth * state.cellSize + (state.gridWidth - 1) * state.gap;
    const totalHeight = state.gridHeight * state.cellSize + (state.gridHeight - 1) * state.gap;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply 90° rotation transform to entire board
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.translate(-canvas.height / 2, -canvas.width / 2);
    
    // Calculate offsets AFTER rotation (swap width/height due to rotation)
    const offsetX = (canvas.height - totalWidth) / 2;
    const offsetY = (canvas.width - totalHeight) / 2;

    // Draw board background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(offsetX - 10, offsetY - 10, totalWidth + 20, totalHeight + 20);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw template if exists
    if (state.template) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        if (state.templateRotation !== 0) {
            ctx.translate(offsetX + totalWidth / 2, offsetY + totalHeight / 2);
            ctx.rotate((state.templateRotation * Math.PI) / 180);
            ctx.translate(-(offsetX + totalWidth / 2), -(offsetY + totalHeight / 2));
        }
        
        ctx.drawImage(state.template, offsetX, offsetY, totalWidth, totalHeight);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Draw grid holes
    for (let row = 0; row < state.gridHeight; row++) {
        for (let col = 0; col < state.gridWidth; col++) {
            const x = offsetX + col * (state.cellSize + state.gap);
            const y = offsetY + row * (state.cellSize + state.gap);

            // Draw hole
            ctx.fillStyle = adjustBrightness(state.backgroundColor, -15);
            ctx.beginPath();
            ctx.arc(x + state.cellSize / 2, y + state.cellSize / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw parts with their individual rotations (independent from template rotation)
    state.parts.forEach(part => {
        drawPart(part, offsetX, offsetY);
    });

    // Draw bolts
    state.screws.forEach(screw => {
        drawScrew(screw, offsetX, offsetY);
    });

    // Draw hover preview
    if (state.hoveredCell && state.currentPart) {
        drawPartPreview(state.hoveredCell, offsetX, offsetY);
    }
    
    // Restore canvas transform
    ctx.restore();
}

// Draw Part
function drawPart(part, offsetX, offsetY) {
    const config = PARTS_CONFIG[part.type];
    const x = offsetX + part.gridX * (state.cellSize + state.gap);
    const y = offsetY + part.gridY * (state.cellSize + state.gap);
    const width = config.gridWidth * state.cellSize + (config.gridWidth - 1) * state.gap;
    const height = config.gridHeight * state.cellSize + (config.gridHeight - 1) * state.gap;

    ctx.save();
    
    // Apply individual shape rotation (completely independent from template rotation)
    // This rotates ONLY this specific part, not the entire board
    if ((part.type === 'strip' || part.type === 'triangle') && part.rotation) {
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((part.rotation * Math.PI) / 180);
        ctx.translate(-(x + width / 2), -(y + height / 2));
    }
    
    // Draw part shape with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = part.color;
    ctx.globalAlpha = 0.85;
    
    if (part.type === 'circle') {
        const radius = (width / 2) * (config.scale || 1);
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        ctx.fill();
    } else if (part.type === 'triangle') {
        // CRITICAL GEOMETRY: Use three precise grid holes for triangle vertices with scaling
        const angle = part.rotation % 360;
        const tgeo = PARTS_CONFIG.triangle.geometry;
        const v = tgeo.vertices[String(angle)];
        const triScale = config.scale || 1.15;
        const cornerRadius = config.cornerRadius || 10;
        
        // Calculate center of triangle
        const centerX = offsetX + (part.gridX + 1) * (state.cellSize + state.gap) + state.cellSize / 2;
        const centerY = offsetY + (part.gridY + 1) * (state.cellSize + state.gap) + state.cellSize / 2;
        
        // Calculate vertex pixel coordinates with scaling from center
        function vertexXY(gridX, gridY) {
            const baseX = offsetX + (part.gridX + gridX) * (state.cellSize + state.gap) + state.cellSize / 2;
            const baseY = offsetY + (part.gridY + gridY) * (state.cellSize + state.gap) + state.cellSize / 2;
            // Scale from center
            const scaledX = centerX + (baseX - centerX) * triScale;
            const scaledY = centerY + (baseY - centerY) * triScale;
            return [scaledX, scaledY];
        }
        const vA = vertexXY(...v.A);
        const vB = vertexXY(...v.B);
        const vC = vertexXY(...v.C);
        
        // Draw rounded triangle
        drawRoundedTriangle(ctx, vA[0], vA[1], vB[0], vB[1], vC[0], vC[1], cornerRadius);
        ctx.fill();

        // Draw triangle outline for contrast
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = darkenColor(part.color, 20);
        ctx.lineWidth = 3.5;
        drawRoundedTriangle(ctx, vA[0], vA[1], vB[0], vB[1], vC[0], vC[1], cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Draw holes (white circles, exact positions per current angle)
        const holeList = tgeo.holes[String(angle)];
        for (let h of holeList) {
            const [hx, hy] = h;
            const holeX = offsetX + (part.gridX + hx) * (state.cellSize + state.gap) + state.cellSize / 2;
            const holeY = offsetY + (part.gridY + hy) * (state.cellSize + state.gap) + state.cellSize / 2;
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(holeX, holeY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#DDD';
            ctx.stroke();
            ctx.restore();
        }
    } else if (part.type === 'strip') {
        const radius = width / 2;
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, Math.PI, 0, false);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arc(x + radius, y + height - radius, radius, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();
    } else if (part.type === 'square') {
        const radius = config.roundedCorners || 0;
        roundRect(ctx, x, y, width, height, radius);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, width, height);
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw holes (only for non-triangle parts, triangle holes drawn above)
    if (part.type !== 'triangle') {
        const cellWithGap = state.cellSize + state.gap;
        config.holes.forEach(([hx, hy]) => {
            const holeX = x + hx * cellWithGap - state.gap / 2;
            const holeY = y + hy * cellWithGap - state.gap / 2;
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(holeX, holeY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = adjustBrightness(part.color, -40);
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }
    
    // Draw border (only for non-triangle parts, triangle border drawn above)
    if (part.type !== 'triangle') {
        ctx.strokeStyle = darkenColor(part.color, 20);
        ctx.lineWidth = 3;
        
        if (part.type === 'circle') {
            const radius = (width / 2) * (config.scale || 1);
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (part.type === 'strip') {
            const radius = width / 2;
            ctx.beginPath();
            ctx.arc(x + radius, y + radius, radius, Math.PI, 0, false);
            ctx.lineTo(x + width, y + height - radius);
            ctx.arc(x + radius, y + height - radius, radius, 0, Math.PI, false);
            ctx.closePath();
            ctx.stroke();
        } else if (part.type === 'square') {
            const radius = config.roundedCorners || 0;
            roundRect(ctx, x, y, width, height, radius);
            ctx.stroke();
        } else {
            ctx.strokeRect(x, y, width, height);
        }
    }
    
    ctx.restore();
}

// Draw Screw - Realistic circular screw head with cross slot
function drawScrew(screw, offsetX, offsetY) {
    const x = offsetX + screw.gridX * (state.cellSize + state.gap) + state.cellSize / 2;
    const y = offsetY + screw.gridY * (state.cellSize + state.gap) + state.cellSize / 2;
    const screwRadius = 13;

    ctx.save();
    
    // Drop shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw circular screw head
    ctx.beginPath();
    ctx.arc(x, y, screwRadius, 0, Math.PI * 2);
    
    // Dynamic color based on screw color with radial gradient for 3D effect
    const baseColor = screw.color || state.currentColor;
    const darkerColor = darkenColor(baseColor, 30);
    const lightColor = lightenColor(baseColor, 20);
    
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, screwRadius);
    gradient.addColorStop(0, lightColor);
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, darkerColor);
    gradient.addColorStop(1, darkenColor(baseColor, 50));
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Reset shadow for inner details
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Dark border around circle
    ctx.strokeStyle = darkenColor(baseColor, 60);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Cross slot (Phillips head) - more visible on circular screw
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;
    
    // Vertical line of cross
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
    
    // Horizontal line of cross
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.stroke();
    
    // Inner shadow for depth around the circle
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, screwRadius - 1, 0, Math.PI * 2);
    ctx.stroke();
    
    // Glossy highlight for metallic finish
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Smaller bright highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw part preview on hover
function drawPartPreview(cell, offsetX, offsetY) {
    const config = PARTS_CONFIG[state.currentPart];
    const x = offsetX + cell.col * (state.cellSize + state.gap);
    const y = offsetY + cell.row * (state.cellSize + state.gap);
    const width = config.gridWidth * state.cellSize + (config.gridWidth - 1) * state.gap;
    const height = config.gridHeight * state.cellSize + (config.gridHeight - 1) * state.gap;

    const canPlace = canPlacePart(cell.col, cell.row, state.currentPart);

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = canPlace ? state.currentColor : '#FF0000';

    if (state.currentPart === 'triangle') {
        // Use triangle geometry for preview
        const tgeo = PARTS_CONFIG.triangle.geometry;
        const angle = 0; // For preview, always 0 unless picking rotation
        const v = tgeo.vertices[String(angle)];
        const triScale = PARTS_CONFIG.triangle.scale || 1.15;
        const cornerRadius = PARTS_CONFIG.triangle.cornerRadius || 10;
        
        // Calculate center
        const centerX = offsetX + (cell.col + 1) * (state.cellSize + state.gap) + state.cellSize / 2;
        const centerY = offsetY + (cell.row + 1) * (state.cellSize + state.gap) + state.cellSize / 2;
        
        function vertexXY(gridX, gridY) {
            const baseX = offsetX + (cell.col + gridX) * (state.cellSize + state.gap) + state.cellSize / 2;
            const baseY = offsetY + (cell.row + gridY) * (state.cellSize + state.gap) + state.cellSize / 2;
            const scaledX = centerX + (baseX - centerX) * triScale;
            const scaledY = centerY + (baseY - centerY) * triScale;
            return [scaledX, scaledY];
        }
        const vA = vertexXY(...v.A);
        const vB = vertexXY(...v.B);
        const vC = vertexXY(...v.C);
        
        drawRoundedTriangle(ctx, vA[0], vA[1], vB[0], vB[1], vC[0], vC[1], cornerRadius);
        ctx.fill();
        
        // Draw preview holes
        const holes = tgeo.holes[String(angle)];
        for (let h of holes) {
            const [hx, hy] = h;
            const holeX = offsetX + (cell.col + hx) * (state.cellSize + state.gap) + state.cellSize / 2;
            const holeY = offsetY + (cell.row + hy) * (state.cellSize + state.gap) + state.cellSize / 2;
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(holeX, holeY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    } else if (state.currentPart === 'circle') {
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, width, height);
    }
    ctx.restore();
}

// Handle Canvas Click
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromCoordinates(x, y);
    if (!cell) return;

    saveToHistory();

    if (state.currentPart) {
        // Place part - opens angle selection for rotatable shapes
        if (state.currentPart === 'strip') {
            if (canPlacePart(cell.col, cell.row, state.currentPart)) {
                state.pendingStripPlacement = { col: cell.col, row: cell.row };
                // Show strip angle options: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
                showStripAngleModal();
            }
        } else if (state.currentPart === 'triangle') {
            if (canPlacePart(cell.col, cell.row, state.currentPart)) {
                state.pendingTrianglePlacement = { col: cell.col, row: cell.row };
                // Show triangle angle options: 0°, 90°, 180°, 270°
                showTriangleAngleModal();
            }
        } else if (canPlacePart(cell.col, cell.row, state.currentPart)) {
            state.parts.push({
                type: state.currentPart,
                color: state.currentColor,
                gridX: cell.col,
                gridY: cell.row,
                rotation: 0,
                id: Date.now()
            });
            updateCounts();
            drawBoard();
        }
    } else if (state.currentTool === 'screw') {
        // Toggle screw placement - works EVERYWHERE on the grid
        console.log(`Screw mode: Click at grid cell (${cell.col}, ${cell.row})`);
        
        const existingScrewIndex = state.screws.findIndex(s => s.gridX === cell.col && s.gridY === cell.row);
        
        if (existingScrewIndex !== -1) {
            // Remove existing screw
            console.log(`Removing screw at (${cell.col}, ${cell.row})`);
            state.screws.splice(existingScrewIndex, 1);
            updateCounts();
            drawBoard();
        } else {
            // Place new screw - WORKS ON ALL GRID CELLS (no restrictions)
            console.log(`Placing screw at (${cell.col}, ${cell.row})`);
            const part = findPartAtCell(cell.col, cell.row);
            
            state.screws.push({
                gridX: cell.col,
                gridY: cell.row,
                color: state.currentColor,
                partId: part ? part.id : null
            });
            updateCounts();
            drawBoard();
        }
    } else if (state.currentTool === 'delete') {
        // Delete part or screw
        const screwIndex = state.screws.findIndex(s => s.gridX === cell.col && s.gridY === cell.row);
        if (screwIndex !== -1) {
            state.screws.splice(screwIndex, 1);
        } else {
            const partIndex = state.parts.findIndex(p => {
                const config = PARTS_CONFIG[p.type];
                return cell.col >= p.gridX && cell.col < p.gridX + config.gridWidth &&
                       cell.row >= p.gridY && cell.row < p.gridY + config.gridHeight;
            });
            if (partIndex !== -1) {
                const partId = state.parts[partIndex].id;
                state.parts.splice(partIndex, 1);
                state.screws = state.screws.filter(s => s.partId !== partId);
            }
        }
        updateCounts();
        drawBoard();
    }
}

// Handle Canvas Hover
function handleCanvasHover(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromCoordinates(x, y);

    if (!cell || (state.hoveredCell && state.hoveredCell.col === cell.col && state.hoveredCell.row === cell.row)) {
        if (!cell && state.hoveredCell) {
            state.hoveredCell = null;
            drawBoard();
        }
        return;
    }

    state.hoveredCell = cell;
    drawBoard();
}

// Get cell from coordinates - FIXED to work everywhere on the grid
function getCellFromCoordinates(x, y) {
    // Transform coordinates back through 90° rotation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Inverse rotation: rotate -90°
    const dx = x - centerX;
    const dy = y - centerY;
    const rotatedX = dy + canvas.height / 2;
    const rotatedY = -dx + canvas.width / 2;
    
    const totalWidth = state.gridWidth * state.cellSize + (state.gridWidth - 1) * state.gap;
    const totalHeight = state.gridHeight * state.cellSize + (state.gridHeight - 1) * state.gap;
    const offsetX = (canvas.height - totalWidth) / 2;
    const offsetY = (canvas.width - totalHeight) / 2;

    const adjustedX = rotatedX - offsetX;
    const adjustedY = rotatedY - offsetY;

    // Check if outside the entire board area
    if (adjustedX < 0 || adjustedY < 0 || adjustedX > totalWidth || adjustedY > totalHeight) {
        return null;
    }

    // Calculate grid cell - this now works for the ENTIRE grid
    const col = Math.floor(adjustedX / (state.cellSize + state.gap));
    const row = Math.floor(adjustedY / (state.cellSize + state.gap));

    // Ensure we're within grid bounds
    if (col < 0 || col >= state.gridWidth || row < 0 || row >= state.gridHeight) {
        return null;
    }

    console.log(`Click coordinates: canvas(${x.toFixed(0)}, ${y.toFixed(0)}) → rotated(${rotatedX.toFixed(0)}, ${rotatedY.toFixed(0)}) → adjusted(${adjustedX.toFixed(0)}, ${adjustedY.toFixed(0)}) → grid(${col}, ${row})`);

    return { col, row };
}

// Check if part can be placed (now allows overlapping)
function canPlacePart(col, row, partType) {
    const config = PARTS_CONFIG[partType];
    
    // Check bounds only - parts can now overlap
    if (col + config.gridWidth > state.gridWidth || row + config.gridHeight > state.gridHeight) {
        return false;
    }
    
    // Allow overlapping parts - removed collision detection
    return true;
}

// Find part at cell
function findPartAtCell(col, row) {
    return state.parts.find(p => {
        const config = PARTS_CONFIG[p.type];
        return col >= p.gridX && col < p.gridX + config.gridWidth &&
               row >= p.gridY && row < p.gridY + config.gridHeight;
    });
}

// Check if cell is on part hole
function isOnPartHole(part, col, row) {
    if (part.type === 'triangle') {
        const angle = part.rotation % 360;
        const tgeo = PARTS_CONFIG.triangle.geometry;
        const holes = tgeo.holes[String(angle)];
        const relX = col - part.gridX;
        const relY = row - part.gridY;
        return holes.some(([hx, hy]) => hx === relX && hy === relY);
    }
    const config = PARTS_CONFIG[part.type];
    const relX = col - part.gridX;
    const relY = row - part.gridY;
    return config.holes && config.holes.some(([hx, hy]) => {
        const holeCol = Math.floor(hx);
        const holeRow = Math.floor(hy);
        return holeCol === relX && holeRow === relY;
    });
}

// Update UI
function updateUI() {
    // Update color buttons
    colorButtons.forEach(btn => {
        if (btn.getAttribute('data-color') === state.currentColor) {
            btn.style.border = '4px solid #333';
            btn.style.transform = 'scale(1.15)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        } else {
            btn.style.border = '2px solid #ccc';
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
    });
    
    // Update part buttons
    partButtons.forEach(btn => {
        if (btn.getAttribute('data-part') === state.currentPart) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tool buttons
    toolButtons.forEach(btn => {
        if (btn.getAttribute('data-tool') === state.currentTool) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update mode text
    let modeText = 'Выберите инструмент';
    let hintText = 'Выбери инструмент и кликай на доску';
    
    if (state.currentPart) {
        modeText = `Размещение - ${PARTS_CONFIG[state.currentPart].name}`;
        hintText = 'Кликни на доску, чтобы разместить деталь';
    } else if (state.currentTool === 'screw') {
        modeText = 'Вкручивание шурупов';
        hintText = 'Кликни на любую ячейку сетки (повторный клик удаляет)';
    } else if (state.currentTool === 'delete') {
        modeText = 'Удаление';
        hintText = 'Кликни на деталь или болт, чтобы удалить';
    }
    
    if (currentModeElement) currentModeElement.textContent = modeText;
    if (hintTextElement) hintTextElement.textContent = hintText;
    
    // Redraw part previews with current color
    drawPartPreviews();
}

// Update counts
function updateCounts() {
    if (partsCountElement) partsCountElement.textContent = state.parts.length;
    if (screwsCountElement) screwsCountElement.textContent = state.screws.length;
    // Show template rotation (independent from shape rotations)
    if (rotationInfoElement) rotationInfoElement.textContent = `Трафарет: ${state.templateRotation}°`;
}

// Show triangle angle selection modal with only 4 angles
function showTriangleAngleModal() {
    console.log('TRIANGLE ROTATION: Opening angle selection for triangle - this will NOT rotate template');
    document.getElementById('angleModalTitle').textContent = 'Выберите угол треугольника';
    // Hide 45°, 135°, 225°, 315° buttons for triangles (only 0°, 90°, 180°, 270°)
    angleButtons.forEach(btn => {
        const angle = parseInt(btn.getAttribute('data-angle'));
        if ([0, 90, 180, 270].includes(angle)) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    });
    angleModal.classList.add('active');
}

// Show strip angle selection modal with all 8 angles
function showStripAngleModal() {
    console.log('STRIP ROTATION: Opening angle selection for strip - this will NOT rotate template');
    document.getElementById('angleModalTitle').textContent = 'Выберите угол полоски';
    // Show all angle buttons for strips (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
    angleButtons.forEach(btn => {
        btn.style.display = 'block';
    });
    angleModal.classList.add('active');
}

// Handle angle selection - CRITICAL: Only rotate the selected shape, NOT the template
function handleAngleSelection(angle) {
    console.log(`SHAPE ROTATION: Selected angle ${angle}° - this affects ONLY the shape, template stays at ${state.templateRotation}°`);
    
    if (state.pendingStripPlacement) {
        console.log('STRIP ROTATION: Placing strip with individual rotation, template unchanged');
        // Add strip with specified rotation angle - template stays unchanged
        state.parts.push({
            type: 'strip',
            color: state.currentColor,
            gridX: state.pendingStripPlacement.col,
            gridY: state.pendingStripPlacement.row,
            rotation: angle, // This rotates ONLY the strip
            id: Date.now()
        });
        state.pendingStripPlacement = null;
        angleModal.classList.remove('active');
        updateCounts();
        drawBoard();
    } else if (state.pendingTrianglePlacement) {
        console.log('TRIANGLE ROTATION: Placing triangle with individual rotation, template unchanged');
        // Add triangle with specified rotation angle - template stays unchanged
        state.parts.push({
            type: 'triangle',
            color: state.currentColor,
            gridX: state.pendingTrianglePlacement.col,
            gridY: state.pendingTrianglePlacement.row,
            rotation: angle, // This rotates ONLY the triangle
            id: Date.now()
        });
        state.pendingTrianglePlacement = null;
        angleModal.classList.remove('active');
        updateCounts();
        drawBoard();
    }
    // IMPORTANT: Template rotation is completely separate and handled by rotateTemplate() function
}

// Clear Board
function clearBoard() {
    saveToHistory();
    state.parts = [];
    state.screws = [];
    updateCounts();
    drawBoard();
    clearModal.classList.remove('active');
}

// Save as Image (High Quality PNG)
function saveAsImage() {
    const config = {
        parts: state.parts,
        screws: state.screws,
        currentColor: state.currentColor,
        backgroundColor: state.backgroundColor,
        templateRotation: state.templateRotation
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.download = `screwdriver_project_${Date.now()}.json`;
    link.href = URL.createObjectURL(dataBlob);
    link.click();
    
    setTimeout(() => {
        const imgLink = document.createElement('a');
        imgLink.download = `screwdriver_image_${Date.now()}.png`;
        imgLink.href = canvas.toDataURL('image/png');
        imgLink.click();
    }, 100);
}

// Print Board
function printBoard() {
    const printWindow = window.open('', '_blank');
    const dataUrl = canvas.toDataURL('image/png');

    printWindow.document.write(`
        <html>
        <head>
            <title>Печать - Виртуальный конструктор</title>
            <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Show Share Modal
function showShareModal() {
    const config = {
        parts: state.parts,
        screws: state.screws,
        currentColor: state.currentColor,
        backgroundColor: state.backgroundColor
    };

    const configString = JSON.stringify(config);
    const encodedConfig = btoa(encodeURIComponent(configString));
    const shareUrl = `${window.location.origin}${window.location.pathname}?config=${encodedConfig}`;

    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.innerHTML = '';

    new QRCode(qrContainer, {
        text: shareUrl,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('shareUrl').textContent = shareUrl;
    shareModal.classList.add('active');
}

// Copy Share URL
function copyShareUrl() {
    const urlText = document.getElementById('shareUrl').textContent;
    navigator.clipboard.writeText(urlText).then(() => {
        copyUrlBtn.textContent = '✓ Скопировано!';
        setTimeout(() => {
            copyUrlBtn.textContent = 'Копировать ссылку';
        }, 2000);
    }).catch(() => {
        alert('Не удалось скопировать ссылку');
    });
}

// Undo Last Action
function undoLastAction() {
    if (state.history.length > 0) {
        const previousState = state.history.pop();
        state.parts = JSON.parse(JSON.stringify(previousState.parts));
        state.screws = JSON.parse(JSON.stringify(previousState.screws));
        updateCounts();
        drawBoard();
    }
}

// Save to History
function saveToHistory() {
    state.history.push({
        parts: JSON.parse(JSON.stringify(state.parts)),
        screws: JSON.parse(JSON.stringify(state.screws))
    });
    if (state.history.length > state.maxHistory) {
        state.history.shift();
    }
}



// Load from URL
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');

    if (configParam) {
        try {
            const configString = decodeURIComponent(atob(configParam));
            const config = JSON.parse(configString);

            if (config.parts) state.parts = config.parts;
            if (config.bolts) state.bolts = config.bolts;
            if (config.currentColor) state.currentColor = config.currentColor;
            if (config.backgroundColor) state.backgroundColor = config.backgroundColor;

            updateCounts();
            updateUI();
            drawBoard();
        } catch (e) {
            console.error('Failed to load config from URL:', e);
        }
    }
}

// Color Utility Functions
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function adjustBrightness(color, percent) {
    return percent > 0 ? lightenColor(color, percent) : darkenColor(color, Math.abs(percent));
}

// Drawing canvas setup
function setupDrawCanvas() {
    if (!drawCanvas || !drawCtx) return;
    
    drawCanvas.addEventListener('mousedown', startDrawing);
    drawCanvas.addEventListener('mousemove', draw);
    drawCanvas.addEventListener('mouseup', stopDrawing);
    drawCanvas.addEventListener('mouseleave', stopDrawing);
}

function startDrawing(e) {
    state.isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!state.isDrawing) return;
    
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawCtx.lineWidth = state.brushSize;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    
    if (state.drawingMode === 'brush') {
        drawCtx.strokeStyle = state.drawColor;
        drawCtx.globalCompositeOperation = 'source-over';
    } else {
        drawCtx.globalCompositeOperation = 'destination-out';
    }
    
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
}

function stopDrawing() {
    state.isDrawing = false;
    drawCtx.beginPath();
}

function updateDrawUI() {
    const brushBtn = document.getElementById('brushBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    
    if (state.drawingMode === 'brush') {
        brushBtn.style.background = 'var(--color-primary)';
        brushBtn.style.color = 'white';
        eraserBtn.style.background = 'var(--color-secondary)';
        eraserBtn.style.color = 'var(--color-text)';
    } else {
        eraserBtn.style.background = 'var(--color-primary)';
        eraserBtn.style.color = 'white';
        brushBtn.style.background = 'var(--color-secondary)';
        brushBtn.style.color = 'var(--color-text)';
    }
}

function saveDrawnTemplate() {
    const img = new Image();
    img.onload = () => {
        state.template = img;
        state.templateRotation = 0;
        drawTemplateModal.classList.remove('active');
        updateCounts();
        drawBoard();
    };
    img.src = drawCanvas.toDataURL();
}

// Rotate ONLY the template (background stencil) - independent from shape rotations
function rotateTemplate() {
    const oldRotation = state.templateRotation;
    // This rotates ONLY the template/stencil background by 90°
    state.templateRotation = (state.templateRotation + 90) % 360;
    console.log(`TEMPLATE ROTATION: Template rotated from ${oldRotation}° to ${state.templateRotation}° - shape angles remain unchanged`);
    updateCounts();
    drawBoard();
    // IMPORTANT: Shape rotations (triangle/strip individual angles) are completely separate
}

function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if it's an image file
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите файл изображения (PNG, JPG)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Open image editor modal
                openImageEditor(img);
            };
            img.onerror = () => {
                alert('Ошибка загрузки изображения');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function openImageEditor(img) {
    state.imageEditor.tempImage = img;
    state.imageEditor.scale = 100;
    state.imageEditor.rotation = 0;
    state.imageEditor.offsetX = 0;
    state.imageEditor.offsetY = 0;
    state.imageEditor.active = true;
    
    // Reset UI controls
    if (scaleSlider) scaleSlider.value = 100;
    if (scaleValue) scaleValue.textContent = 100;
    if (offsetXSlider) offsetXSlider.value = 0;
    if (offsetYSlider) offsetYSlider.value = 0;
    if (offsetXValue) offsetXValue.textContent = 0;
    if (offsetYValue) offsetYValue.textContent = 0;
    if (rotationValue) rotationValue.textContent = 0;
    updateRotationButtons();
    
    // Show modal and draw preview
    if (imageEditorModal) imageEditorModal.classList.add('active');
    drawImageEditorPreview();
}

function updateImageScale() {
    state.imageEditor.scale = parseInt(scaleSlider.value);
    if (scaleValue) scaleValue.textContent = state.imageEditor.scale;
    drawImageEditorPreview();
}

function setImageRotation(angle) {
    state.imageEditor.rotation = angle;
    if (rotationValue) rotationValue.textContent = angle;
    updateRotationButtons();
    drawImageEditorPreview();
}

function updateRotationButtons() {
    const buttons = [rotate0Btn, rotate90Btn, rotate180Btn, rotate270Btn];
    const angles = [0, 90, 180, 270];
    
    buttons.forEach((btn, idx) => {
        if (!btn) return;
        if (angles[idx] === state.imageEditor.rotation) {
            btn.style.background = 'var(--color-primary)';
            btn.style.color = 'white';
        } else {
            btn.style.background = 'var(--color-secondary)';
            btn.style.color = 'var(--color-text)';
        }
    });
}

function updateImageOffset() {
    state.imageEditor.offsetX = parseInt(offsetXSlider.value);
    state.imageEditor.offsetY = parseInt(offsetYSlider.value);
    if (offsetXValue) offsetXValue.textContent = state.imageEditor.offsetX;
    if (offsetYValue) offsetYValue.textContent = state.imageEditor.offsetY;
    drawImageEditorPreview();
}

function centerImage() {
    state.imageEditor.offsetX = 0;
    state.imageEditor.offsetY = 0;
    if (offsetXSlider) offsetXSlider.value = 0;
    if (offsetYSlider) offsetYSlider.value = 0;
    if (offsetXValue) offsetXValue.textContent = 0;
    if (offsetYValue) offsetYValue.textContent = 0;
    drawImageEditorPreview();
}

function resetImageEditor() {
    state.imageEditor.scale = 100;
    state.imageEditor.rotation = 0;
    state.imageEditor.offsetX = 0;
    state.imageEditor.offsetY = 0;
    
    if (scaleSlider) scaleSlider.value = 100;
    if (scaleValue) scaleValue.textContent = 100;
    if (offsetXSlider) offsetXSlider.value = 0;
    if (offsetYSlider) offsetYSlider.value = 0;
    if (offsetXValue) offsetXValue.textContent = 0;
    if (offsetYValue) offsetYValue.textContent = 0;
    if (rotationValue) rotationValue.textContent = 0;
    updateRotationButtons();
    drawImageEditorPreview();
}

function drawImageEditorPreview() {
    if (!imageEditorCtx || !state.imageEditor.tempImage) return;
    
    const previewCanvas = imageEditorPreview;
    const ctx = imageEditorCtx;
    
    // Clear canvas
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Draw grid (12x19)
    const gridWidth = 12;
    const gridHeight = 19;
    const cellSize = 27;
    const gap = 2;
    const totalWidth = gridWidth * cellSize + (gridWidth - 1) * gap;
    const totalHeight = gridHeight * cellSize + (gridHeight - 1) * gap;
    const offsetX = (previewCanvas.width - totalWidth) / 2;
    const offsetY = (previewCanvas.height - totalHeight) / 2;
    
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let i = 0; i <= gridWidth; i++) {
        const x = offsetX + i * (cellSize + gap);
        ctx.beginPath();
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + totalHeight);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= gridHeight; i++) {
        const y = offsetY + i * (cellSize + gap);
        ctx.beginPath();
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + totalWidth, y);
        ctx.stroke();
    }
    
    // Draw image with transformations
    ctx.save();
    
    // Apply scale
    const scale = state.imageEditor.scale / 100;
    const scaledWidth = totalWidth * scale;
    const scaledHeight = totalHeight * scale;
    
    // Apply offset (as percentage of canvas size)
    const offsetXPx = (state.imageEditor.offsetX / 100) * totalWidth;
    const offsetYPx = (state.imageEditor.offsetY / 100) * totalHeight;
    
    // Calculate center point
    const centerX = offsetX + totalWidth / 2 + offsetXPx;
    const centerY = offsetY + totalHeight / 2 + offsetYPx;
    
    // Move to center, rotate, then draw
    ctx.translate(centerX, centerY);
    ctx.rotate((state.imageEditor.rotation * Math.PI) / 180);
    
    ctx.globalAlpha = 0.6;
    ctx.drawImage(
        state.imageEditor.tempImage,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
    );
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

function applyImageEdits() {
    if (!state.imageEditor.tempImage) return;
    
    // Create a new canvas to apply transformations
    const tempCanvas = document.createElement('canvas');
    const gridWidth = 12;
    const gridHeight = 19;
    const cellSize = 50;
    const gap = 3;
    const totalWidth = gridWidth * cellSize + (gridWidth - 1) * gap;
    const totalHeight = gridHeight * cellSize + (gridHeight - 1) * gap;
    
    tempCanvas.width = totalWidth;
    tempCanvas.height = totalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Apply transformations
    const scale = state.imageEditor.scale / 100;
    const scaledWidth = totalWidth * scale;
    const scaledHeight = totalHeight * scale;
    const offsetXPx = (state.imageEditor.offsetX / 100) * totalWidth;
    const offsetYPx = (state.imageEditor.offsetY / 100) * totalHeight;
    const centerX = totalWidth / 2 + offsetXPx;
    const centerY = totalHeight / 2 + offsetYPx;
    
    tempCtx.translate(centerX, centerY);
    tempCtx.rotate((state.imageEditor.rotation * Math.PI) / 180);
    tempCtx.drawImage(
        state.imageEditor.tempImage,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
    );
    
    // Convert to image and save
    const img = new Image();
    img.onload = () => {
        state.template = img;
        state.templateRotation = 0;
        state.imageEditor.active = false;
        state.imageEditor.tempImage = null;
        if (imageEditorModal) imageEditorModal.classList.remove('active');
        updateCounts();
        drawBoard();
    };
    img.src = tempCanvas.toDataURL();
}

function cancelImageEdits() {
    state.imageEditor.active = false;
    state.imageEditor.tempImage = null;
    if (imageEditorModal) imageEditorModal.classList.remove('active');
}

// AI Template generation
function generateAIPattern() {
    const prompt = document.getElementById('aiPrompt').value.trim();
    
    if (!prompt) {
        alert('Пожалуйста, опишите желаемый узор');
        return;
    }
    
    // Create a procedural pattern based on keywords
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('диагональ') || lowerPrompt.includes('diagonal')) {
        // Diagonal stripes
        tempCtx.strokeStyle = '#4ECDC4';
        tempCtx.lineWidth = 20;
        for (let i = -tempCanvas.height; i < tempCanvas.width + tempCanvas.height; i += 60) {
            tempCtx.beginPath();
            tempCtx.moveTo(i, 0);
            tempCtx.lineTo(i + tempCanvas.height, tempCanvas.height);
            tempCtx.stroke();
        }
    } else if (lowerPrompt.includes('звезд') || lowerPrompt.includes('star')) {
        // Stars pattern
        tempCtx.fillStyle = '#FFE66D';
        for (let y = 60; y < tempCanvas.height; y += 120) {
            for (let x = 60; x < tempCanvas.width; x += 120) {
                drawStar(tempCtx, x, y, 5, 30, 15);
            }
        }
    } else if (lowerPrompt.includes('цвет') || lowerPrompt.includes('flower')) {
        // Flower pattern
        tempCtx.fillStyle = '#FF6B6B';
        for (let y = 100; y < tempCanvas.height; y += 180) {
            for (let x = 100; x < tempCanvas.width; x += 180) {
                drawFlower(tempCtx, x, y, 40);
            }
        }
    } else {
        // Random geometric pattern
        const colors = ['#4ECDC4', '#FF6B6B', '#2ECC71', '#FFE66D'];
        for (let i = 0; i < 30; i++) {
            tempCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            const x = Math.random() * tempCanvas.width;
            const y = Math.random() * tempCanvas.height;
            const size = 20 + Math.random() * 40;
            tempCtx.fillRect(x - size / 2, y - size / 2, size, size);
        }
    }
    
    const img = new Image();
    img.onload = () => {
        state.template = img;
        state.templateRotation = 0;
        aiTemplateModal.classList.remove('active');
        updateCounts();
        drawBoard();
    };
    img.src = tempCanvas.toDataURL();
}

// Preset templates
function applyPreset(preset) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    if (preset === 'grid') {
        tempCtx.strokeStyle = '#ccc';
        tempCtx.lineWidth = 2;
        for (let x = 0; x < tempCanvas.width; x += 40) {
            tempCtx.beginPath();
            tempCtx.moveTo(x, 0);
            tempCtx.lineTo(x, tempCanvas.height);
            tempCtx.stroke();
        }
        for (let y = 0; y < tempCanvas.height; y += 40) {
            tempCtx.beginPath();
            tempCtx.moveTo(0, y);
            tempCtx.lineTo(tempCanvas.width, y);
            tempCtx.stroke();
        }
    } else if (preset === 'diagonal') {
        tempCtx.strokeStyle = '#4ECDC4';
        tempCtx.lineWidth = 15;
        for (let i = -tempCanvas.height; i < tempCanvas.width + tempCanvas.height; i += 50) {
            tempCtx.beginPath();
            tempCtx.moveTo(i, 0);
            tempCtx.lineTo(i + tempCanvas.height, tempCanvas.height);
            tempCtx.stroke();
        }
    } else if (preset === 'stars') {
        tempCtx.fillStyle = '#FFE66D';
        for (let y = 60; y < tempCanvas.height; y += 100) {
            for (let x = 60; x < tempCanvas.width; x += 100) {
                drawStar(tempCtx, x, y, 5, 25, 12);
            }
        }
    } else if (preset === 'flower') {
        tempCtx.fillStyle = '#FF6B6B';
        for (let y = 80; y < tempCanvas.height; y += 160) {
            for (let x = 80; x < tempCanvas.width; x += 160) {
                drawFlower(tempCtx, x, y, 35);
            }
        }
    }
    
    const img = new Image();
    img.onload = () => {
        state.template = img;
        state.templateRotation = 0;
        presetsModal.classList.remove('active');
        updateCounts();
        drawBoard();
    };
    img.src = tempCanvas.toDataURL();
}

// Helper drawing functions
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawFlower(ctx, cx, cy, radius) {
    const petals = 6;
    for (let i = 0; i < petals; i++) {
        const angle = (Math.PI * 2 * i) / petals;
        const x = cx + Math.cos(angle) * radius / 2;
        const y = cy + Math.sin(angle) * radius / 2;
        
        ctx.beginPath();
        ctx.arc(x, y, radius / 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#FFE66D';
    ctx.beginPath();
    ctx.arc(cx, cy, radius / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF6B6B';
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawRoundedTriangle(ctx, x1, y1, x2, y2, x3, y3, radius) {
    ctx.beginPath();
    
    // Calculate angles and positions
    const angle1 = Math.atan2(y2 - y1, x2 - x1);
    const angle2 = Math.atan2(y3 - y2, x3 - x2);
    const angle3 = Math.atan2(y1 - y3, x1 - x3);
    
    // Start from first point with offset
    const startX = x1 + radius * Math.cos(angle1);
    const startY = y1 + radius * Math.sin(angle1);
    ctx.moveTo(startX, startY);
    
    // Line to corner 2 with arc
    const beforeX2 = x2 - radius * Math.cos(angle1);
    const beforeY2 = y2 - radius * Math.sin(angle1);
    ctx.lineTo(beforeX2, beforeY2);
    ctx.quadraticCurveTo(x2, y2, x2 + radius * Math.cos(angle2), y2 + radius * Math.sin(angle2));
    
    // Line to corner 3 with arc
    const beforeX3 = x3 - radius * Math.cos(angle2);
    const beforeY3 = y3 - radius * Math.sin(angle2);
    ctx.lineTo(beforeX3, beforeY3);
    ctx.quadraticCurveTo(x3, y3, x3 + radius * Math.cos(angle3), y3 + radius * Math.sin(angle3));
    
    // Line back to start with arc
    const beforeX1 = x1 - radius * Math.cos(angle3);
    const beforeY1 = y1 - radius * Math.sin(angle3);
    ctx.lineTo(beforeX1, beforeY1);
    ctx.quadraticCurveTo(x1, y1, startX, startY);
    
    ctx.closePath();
}

// Initialize app
init();