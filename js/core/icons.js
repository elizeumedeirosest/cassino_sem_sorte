/* Biblioteca centralizada de icones vetoriais SVG de alta fidelidade */

export const ICONS = {
  home: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  `,
  wallet: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3"></rect>
      <circle cx="16" cy="12" r="1.5" fill="currentColor"></circle>
    </svg>
  `,
  chart: `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18"></path>
      <path d="M7 16l4-7 4 5 5-9"></path>
    </svg>
  `,
  diamond: `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 3h12l4 7-10 11L2 10l4-7z" fill="rgba(56, 189, 248, 0.28)"></path>
      <path d="M2 10h20"></path>
      <path d="M12 21L7 10l5-7 5 7-5 11z"></path>
    </svg>
  `,
  bomb: `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="13" r="8" fill="rgba(244, 63, 94, 0.28)"></circle>
      <path d="M14.35 4.65l1.41-1.41"></path>
      <path d="M17 2h2v2"></path>
      <path d="M20 7h2"></path>
      <path d="M17.5 7.5l1.5-1.5"></path>
    </svg>
  `,
  minesLobby: `
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 3h12l4 7-10 11L2 10l4-7z" fill="rgba(56, 189, 248, 0.22)"></path>
      <path d="M2 10h20"></path>
      <path d="M12 21L7 10l5-7 5 7-5 11z"></path>
    </svg>
  `,
  aviatorLobby: `
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#d4a34b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5S19 3 17.5 4.5L14 8 5.8 6.2c-.6-.2-1.2.2-1.3.8-.1.4.1.8.4 1l5.5 4.5L7 16l-3.2-.8c-.4-.1-.8.1-1 .5s0 .8.3 1.1l2.5 2.5c.3.3.7.4 1.1.3L10 17l3.5 2.6c.2.3.6.5 1 .4.6-.1 1-.7.8-1.3l-1.5-6.5 3 3 .8 4z" fill="rgba(212, 163, 75, 0.22)"></path>
    </svg>
  `,
  rouletteLobby: `
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.6">
      <circle cx="12" cy="12" r="10" stroke="rgba(16, 185, 129, 0.6)" fill="rgba(16, 185, 129, 0.15)"></circle>
      <circle cx="12" cy="12" r="4" fill="#10b981"></circle>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"></path>
    </svg>
  `,
  slotsLobby: `
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="4" stroke="rgba(244, 63, 94, 0.6)" fill="rgba(244, 63, 94, 0.15)"></rect>
      <line x1="8" y1="4" x2="8" y2="20"></line>
      <line x1="16" y1="4" x2="16" y2="20"></line>
      <circle cx="5" cy="12" r="1.8" fill="#f43f5e"></circle>
      <circle cx="12" cy="12" r="1.8" fill="#f43f5e"></circle>
      <circle cx="19" cy="12" r="1.8" fill="#f43f5e"></circle>
    </svg>
  `,
  monteCarloLobby: `
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.6" stroke-linecap="round">
      <path d="M3 20h18"></path>
      <path d="M3 17c3.5-0.5 5.5-13 9-13s5.5 12.5 9 13" stroke="#a855f7" stroke-width="2.2" fill="rgba(168, 85, 247, 0.2)"></path>
      <circle cx="12" cy="4" r="2.5" fill="#a855f7"></circle>
    </svg>
  `
};
