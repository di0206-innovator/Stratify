// Background Animation
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 60;

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
        ctx.fillStyle = `rgba(0, 210, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Connect particles
        for (let j = index + 1; j < particles.length; j++) {
            const dx = p.x - particles[j].x;
            const dy = p.y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.strokeStyle = `rgba(0, 210, 255, ${0.1 * (1 - distance / 150)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    });
    
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();

// UI Elements
const queryInput = document.getElementById('query-input');
const submitBtn = document.getElementById('submit-btn');
const resultsArea = document.getElementById('results-area');
const reportOutput = document.getElementById('report-output');
const logContent = document.getElementById('log-content');
const copyBtn = document.getElementById('copy-btn');

const agents = {
    research: document.getElementById('agent-research'),
    analyst: document.getElementById('agent-analyst'),
    writer: document.getElementById('agent-writer')
};

// Functions
function addLog(message, type = 'system') {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log = document.createElement('div');
    log.className = `log-entry ${type}`;
    log.innerHTML = `<span class="timestamp">[${time}]</span> ${message}`;
    logContent.prepend(log);
}

function setAgentActive(agentKey) {
    Object.values(agents).forEach(a => a.classList.remove('active'));
    if (agentKey) agents[agentKey].classList.add('active');
}

async function runPipeline() {
    const query = queryInput.value.trim();
    if (!query) {
        addLog("System: Please provide a strategic inquiry.", "error");
        return;
    }

    // Reset UI
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    resultsArea.classList.add('hidden');
    reportOutput.innerHTML = '';
    logContent.innerHTML = '';

    addLog(`System: Initiating NeuralBI Pipeline for query: "${query}"`, "info");
    
    try {
        setAgentActive('research');
        addLog("System: Activating agent network...", "info");

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) throw new Error('Neural pipeline bottleneck');

        const { report } = await response.json();
        const { finalReport, agentLogs } = report;

        // Sequence through logs to show "live" progress
        for (const log of agentLogs) {
            const agentMap = {
                'Research Analyst': 'research',
                'Data Scientist': 'analyst',
                'Executive Writer': 'writer'
            };
            
            setAgentActive(agentMap[log.agent]);
            addLog(`${log.agent}: ${log.message}`, "info");
            await new Promise(r => setTimeout(r, 1500)); // Dramatic pause
        }
        
        // Success
        addLog("System: Intelligence synthesis complete.", "success");
        setAgentActive(null);
        
        // Format report
        const formattedReport = finalReport
            .replace(/\n/g, '<br>')
            .replace(/CONFIDENCE: (\d+%)/, 'CONFIDENCE: <span class="highlight">$1</span>')
            .replace(/(KEY FINDINGS|STRATEGIC RECOMMENDATIONS|ANALYSIS SUMMARY|EXECUTIVE SUMMARY):/g, '<strong>$1:</strong>');

        reportOutput.innerHTML = formattedReport;
        resultsArea.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        addLog("System Error: Critical failure in neural synthesis.", "error");
        reportOutput.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 2rem;">
                <h3 style="color: #e74c3c; margin-bottom: 1rem;">Pipeline Failure</h3>
                <p style="margin-bottom: 1.5rem;">The intelligence network encountered a strategic bottleneck. Please verify backend connectivity.</p>
                <button onclick="location.reload()" class="btn-primary" style="background: var(--primary); border: none; padding: 0.8rem 2rem; border-radius: 12px; color: white; cursor: pointer;">Restart System</button>
            </div>
        `;
        resultsArea.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Initialize Pipeline</span> <i class="fas fa-paper-plane"></i>';
    }
}

// Event Listeners
submitBtn.addEventListener('click', runPipeline);

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(reportOutput.textContent);
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check" style="color: #2ecc71"></i>';
    setTimeout(() => copyBtn.innerHTML = originalIcon, 2000);
});

// Initial Welcome Log
setTimeout(() => {
    addLog("Neural connection established. All systems nominal.");
}, 1000);
