// SCROLL ANIMATION LOGIC - OPTIMIZED FOR QUALITY
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("scroll-hero");
    if (!canvas) return;

    // Disable on mobile to prevent layout overlap/performance issues
    if (window.innerWidth <= 768) return;

    const context = canvas.getContext("2d", { alpha: false }); // Optimize for no transparency
    const frameCount = 192; // Total frames (0 to 191)
    const images = [];
    const sequence = { frame: 0 };

    // Configuration
    const CONFIG = {
        // 'cover': Fill screen (crop excess)
        // 'contain': Fit screen (letterbox)
        mode: 'cover',
        // If true, never upscale image beyond its natural resolution (prevents blur)
        // If screen is larger than image, image will be centered with background color
        preventUpscale: false,
        backgroundColor: '#000000'
    };

    // Helper to generate image paths
    // Path: ./assets/frames/frame_0000.jpg
    const currentFrame = index => (
        `./assets/frames/frame_${index.toString().padStart(4, '0')}.jpg`
    );

    // Preload images
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);
    }

    // Handle Canvas Resize & High-DPI
    const resizeCanvas = () => {
        // 1. Get window dimensions (CSS pixels)
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 2. Get Device Pixel Ratio (e.g., 2 for Retina)
        const dpr = window.devicePixelRatio || 1;

        // 3. Set Canvas Real Size (Physical Pixels)
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // 4. Set Canvas CSS Size (Logical Pixels)
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // 5. Scale context to match DPR (Optional, but makes drawing math easier in CSS units)
        // However, for strict pixel control, we will calculate in physical pixels below.
        // So we WON'T scale the context here, we will scale the drawImage destination instead.

        // Force re-render
        requestAnimationFrame(render);
    };

    // Render function
    const render = () => {
        const img = images[sequence.frame];

        // Draw Background
        context.fillStyle = CONFIG.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Ensure High-Quality Scaling
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        if (img && img.complete && img.naturalHeight !== 0) {
            // Image dimensions
            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;

            // Canvas dimensions (Physical pixels)
            const cvsW = canvas.width;
            const cvsH = canvas.height;

            // Calculate Calculate Ratios
            const scaleX = cvsW / imgW;
            const scaleY = cvsH / imgH;

            let scale;
            if (CONFIG.mode === 'cover') {
                scale = Math.max(scaleX, scaleY);
            } else {
                scale = Math.min(scaleX, scaleY);
            }

            // Prevent Upscaling Quality Check
            // If the image needs to be scaled UP to cover/contain, check flag.
            // Note: "scale > 1" means we are stretching the image pixels.
            // "scale <= 1" means we are downsampling (good for sharp edges).
            if (CONFIG.preventUpscale && scale > 1) {
                scale = 1;
            }

            // Calculate new dimensions
            const drawW = imgW * scale;
            const drawH = imgH * scale;

            // Center the image
            const offsetX = (cvsW - drawW) / 2;
            const offsetY = (cvsH - drawH) / 2;

            // Debug Info (Once)
            if (!window.hasLoggedScrollDebug) {
                console.group('Scroll Animation Debug');
                console.log(`Screen: ${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio})`);
                console.log(`Canvas: ${canvas.width}x${canvas.height}`);
                console.log(`Image: ${imgW}x${imgH}`);
                console.log(`Scale: ${scale.toFixed(3)}`);
                console.log(`Mode: ${CONFIG.mode}`);
                if (scale > 1) console.warn('⚠️ Image is being upscaled! This causes blur. Use larger images.');
                console.groupEnd();
                window.hasLoggedScrollDebug = true;
            }

            // Draw
            // We use Math.floor to align to pixel grid for extra sharpness
            context.drawImage(img,
                0, 0, imgW, imgH, // Source
                Math.floor(offsetX), Math.floor(offsetY), Math.ceil(drawW), Math.ceil(drawH) // Dest
            );

        } else {
            // Placeholder
            context.fillStyle = '#fff';
            context.font = `${30 * (window.devicePixelRatio || 1)}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(`Frame ${sequence.frame + 1} / ${frameCount}`, canvas.width / 2, canvas.height / 2);
        }
    };

    // Initial Load
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Set initial size
    images[0].onload = render;

    // Scroll handler
    const section = document.getElementById("scroll-sequence");

    if (section) {
        window.addEventListener("scroll", () => {
            const rect = section.getBoundingClientRect();
            const sectionHeight = rect.height;
            const windowHeight = window.innerHeight;

            // Scroll Math
            const scrollTop = -rect.top;
            const scrollableDistance = sectionHeight - windowHeight;

            if (scrollableDistance <= 0) return;

            let scrollFraction = scrollTop / scrollableDistance;
            scrollFraction = Math.min(1, Math.max(0, scrollFraction));

            const frameIndex = Math.floor(scrollFraction * (frameCount - 1));

            if (sequence.frame !== frameIndex) {
                sequence.frame = frameIndex;
                requestAnimationFrame(render);
            }
        });
    }
});
