/* ─── Navigation Logic ─── */
const navContent = document.getElementById('nav-content');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  if (window.scrollY > 30) navContent.classList.add('scrolled');
  else navContent.classList.remove('scrolled');
});

let menuOpen = false;
mobileMenuBtn.addEventListener('click', () => {
  menuOpen = !menuOpen;
  if (menuOpen) {
    mobileMenu.classList.add('open');
    mobileMenuBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  } else {
    mobileMenu.classList.remove('open');
    mobileMenuBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  }
});

/* ─── Contact Form (mailto fallback) ─── */
window.submitForm = function(btn, nameId, msgId) {
  const name = document.getElementById(nameId).value;
  const msg = document.getElementById(msgId).value;

  if (!name || !msg) {
    alert("Please enter your name and message.");
    return;
  }
  const subject = encodeURIComponent(`New message from ${name} via Portfolio`);
  const body = encodeURIComponent(msg);
  
  // Triggers user's local email client
  window.location.href = `mailto:bhugraduate@gmail.com?subject=${subject}&body=${body}`;
  
  btn.innerHTML = 'Draft Opened!';
  setTimeout(() => { btn.innerHTML = 'Send Message'; }, 3000);
};

/* ─── Claude's Timeline State Manager & Animations ─── */
function openPanel(panel) {
  if (panel.dataset.state === 'open') return;
  panel.dataset.state = 'opening';
  panel.style.overflow   = 'hidden';
  panel.style.maxHeight  = '0px';
  panel.style.opacity    = '0';
  panel.style.visibility = 'visible';
  panel.style.display    = '';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = panel.scrollHeight;
      panel.style.transition = 'max-height 0.48s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease';
      panel.style.maxHeight  = target + 'px';
      panel.style.opacity    = '1';

      panel.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'max-height') return;
        panel.removeEventListener('transitionend', onEnd);
        panel.style.maxHeight = 'none';
        panel.style.overflow  = '';
        panel.dataset.state   = 'open';
      }, { once: false });
    });
  });
}

function closePanel(panel) {
  if (panel.dataset.state === 'closed' || panel.dataset.state === 'closing') return;
  panel.dataset.state = 'closing';
  panel.style.overflow = 'hidden';
  panel.style.maxHeight = panel.scrollHeight + 'px';
  panel.style.opacity   = '1';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.style.transition = 'max-height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease';
      panel.style.maxHeight  = '0px';
      panel.style.opacity    = '0';

      panel.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName !== 'max-height') return;
        panel.removeEventListener('transitionend', onEnd);
        panel.style.visibility = 'hidden';
        panel.dataset.state    = 'closed';
      }, { once: false });
    });
  });
}

const TimelineManager = (() => {
  let activeNodeIndex = null;
  function allNodes() { return [...document.querySelectorAll('[data-node]')]; }
  function panelOf(nodeEl) { return nodeEl.querySelector('.card-content'); }

  function updateTrail(openIdx) {
    const nodes = allNodes();
    nodes.forEach((node, i) => {
      node.classList.toggle('node-active', i === openIdx);
      node.classList.toggle('node-completed', openIdx !== null && i < openIdx);
    });

    const wrapper = document.querySelector('[data-timeline]');
    if (wrapper && openIdx !== null) {
      const pct = openIdx === nodes.length - 1 ? 100 : ((openIdx + 0.5) / (nodes.length - 1)) * 100;
      wrapper.style.setProperty('--progress', pct.toFixed(1) + '%');
    } else if (wrapper) {
      wrapper.style.setProperty('--progress', '0%');
    }
  }

  function toggleNode(index) {
    const nodes = allNodes();
    if (index < 0 || index >= nodes.length) return;
    const targetNode = nodes[index];
    const targetPanel = panelOf(targetNode);

    if (activeNodeIndex === index) {
      if (targetPanel) closePanel(targetPanel);
      activeNodeIndex = null;
      updateTrail(null);
      return;
    }
    if (activeNodeIndex !== null) {
      const prevPanel = panelOf(nodes[activeNodeIndex]);
      if (prevPanel) closePanel(prevPanel);
    }
    activeNodeIndex = index;
    if (targetPanel) openPanel(targetPanel);
    updateTrail(index);
  }

  function openNodeById(nodeId, scroll = true) {
    const nodes = allNodes();
    const idx = nodes.findIndex(n => n.dataset.node === nodeId);
    if (idx === -1) return;
    if (activeNodeIndex !== idx) toggleNode(idx);

    if (scroll) {
      setTimeout(() => { nodes[idx].scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
    }
  }

  function init() {
    const nodes = allNodes();
    nodes.forEach((node, nodeIdx) => {
      const panel = panelOf(node);
      if (panel) {
        panel.style.maxHeight = '0px'; panel.style.opacity = '0';
        panel.style.overflow = 'hidden'; panel.style.visibility = 'hidden';
        panel.dataset.state = 'closed';
      }
      const trigger = node.querySelector('[data-trigger]') || node;
      trigger.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a') || e.target.tagName.toLowerCase() === 'button') return; 
        // if (tag === 'a' || e.target.closest('a') || tag === 'button' || tag === 'input' || tag === 'textarea') return; 
        e.stopPropagation(); toggleNode(nodeIdx);
      });
      // Also bind the timeline ring
      const ringTrigger = node.querySelector('.node-trigger');
      if (ringTrigger) {
         ringTrigger.addEventListener('click', (e) => { e.stopPropagation(); toggleNode(nodeIdx); });
      }
    });
  }

  return { init, toggleNode, openNodeById };
})();

document.addEventListener('DOMContentLoaded', () => { TimelineManager.init(); });

/* ─── Fixed scrollToSection ─── */
function scrollToSection(section) {
  const sectionMap = { 'home': 'home', 'journey': 'journey', 'projects': 'journey', 'contact': 'contact' };
  const targetId = sectionMap[section] || section;
  const el = document.getElementById(targetId);

  if (section === 'projects') {
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { TimelineManager.openNodeById('projects', true); }, 650);
  } else {
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (menuOpen) mobileMenuBtn.click();
}

/* ─── Inject Social SVGs into Footer ─── */
const socials = [
  { label: "Instagram", href: "https://instagram.com/sh_rituraj", svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>` },
  { label: "YouTube", href: "https://youtube.com/@संस्कृतस्यछात्रः", svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>` },
  { label: "GitHub", href: "https://github.com/BHUgraduate", svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>` },
  { label: "LinkedIn", href: "https://linkedin.com/in/bhugraduate", svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` }
];
document.getElementById('social-links').innerHTML = socials.map(s => `<a href="${s.href}" title="${s.label}" class="social-icon" target="_blank" rel="noopener noreferrer">${s.svg}</a>`).join('');

// Prevent clicks inside the Future form from closing the timeline card
const futureFormElements = document.querySelectorAll('.timeline-card input, .timeline-card textarea, .timeline-card button');

futureFormElements.forEach(element => {
    element.addEventListener('click', (e) => {
        e.stopPropagation(); // This stops the click from "bubbling up" to the card
    });
});
