function addMissingStyles() {
    // Check if styles already exist
    const styleId = 'additional-tech-badge-styles';
    if (document.getElementById(styleId)) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .tech-badge.html {
            background-color: rgba(227, 76, 38, 0.2);
            color: #e34c26;
            border-color: #e34c26;
        }
        
        .tech-badge.css {
            background-color: rgba(21, 114, 182, 0.2);
            color: #1572b6;
            border-color: #1572b6;
        }
        
        .tech-badge.github {
            background-color: rgba(110, 84, 148, 0.2);
            color: #6e5494;
            border-color: #6e5494;
        }
        
        .tech-badge.markdown {
            background-color: rgba(0, 0, 0, 0.2);
            color: #ffffff;
            border-color: #000000;
        }
        
        .tech-badge.webdev {
            background-color: rgba(66, 184, 131, 0.2);
            color: #42b883;
            border-color: #42b883;
        }
        
        .no-matches-message {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: var(--light-text);
            font-style: italic;
        }
        
        .retry-btn {
            background-color: var(--primary-color);
            color: var(--text-color);
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 15px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .retry-btn:hover {
            background-color: var(--accent-color);
            transform: translateY(-2px);
        }
        
        .error-card {
            background-color: rgba(255, 0, 0, 0.1);
            border-color: #ff0000;
        }
    `;
    
    document.head.appendChild(styleElement);
}
