document.addEventListener('DOMContentLoaded', () => {
    const queryInput = document.getElementById('queryInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const reportCard = document.getElementById('reportCard');
    const placeholder = document.getElementById('placeholder');
    const placeholderText = document.getElementById('placeholderText');
    const spinner = document.getElementById('spinner');
    const reportContent = document.getElementById('reportContent');

    const agents = {
        researcher: document.getElementById('agent-researcher'),
        analyst: document.getElementById('agent-analyst'),
        strategist: document.getElementById('agent-strategist')
    };

    const setAgentState = (id, action, isActive = false) => {
        const card = agents[id];
        if (!card) return;
        
        const actionEl = card.querySelector('.agent-action');
        actionEl.textContent = action;
        
        if (isActive) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    };

    const resetAgents = () => {
        Object.keys(agents).forEach(id => {
            setAgentState(id, 'Node standby...', false);
        });
    };

    const startAnalysis = async () => {
        const query = queryInput.value.trim();
        if (!query) return;

        // Reset UI
        reportContent.style.display = 'none';
        placeholder.style.display = 'flex';
        spinner.style.display = 'block';
        placeholderText.textContent = 'Initializing multi-agent synthesis...';
        resetAgents();

        try {
            // Start agent simulation logs immediately to feel responsive
            setTimeout(() => setAgentState('researcher', 'Scanning global datasets...', true), 500);
            setTimeout(() => {
                setAgentState('researcher', 'Data points collected.', false);
                setAgentState('analyst', 'Extracting patterns...', true);
            }, 2500);
            setTimeout(() => {
                setAgentState('analyst', 'Signals verified.', false);
                setAgentState('strategist', 'Synthesizing report...', true);
            }, 4500);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();

            // Finalizing
            setTimeout(() => {
                setAgentState('strategist', 'Synthesis complete.', false);
                spinner.style.display = 'none';
                placeholder.style.display = 'none';
                
                // Use marked to render the markdown
                reportContent.innerHTML = marked.parse(data.report);
                reportContent.style.display = 'block';
                
                // Scroll to result on mobile
                if (window.innerWidth < 968) {
                    reportCard.scrollIntoView({ behavior: 'smooth' });
                }
            }, 6000); // Sync with agent animations

        } catch (error) {
            console.error('Error:', error);
            spinner.style.display = 'none';
            placeholderText.textContent = 'Strategic bottleneck encountered. Please try again.';
            resetAgents();
        }
    };

    analyzeBtn.addEventListener('click', startAnalysis);
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startAnalysis();
    });
});
