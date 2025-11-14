# Design Guidelines: Indecryption 2.0 - Encrypted Chat Application

## Design Approach
**Reference-Based Approach** drawing from secure messaging leaders: Signal, Telegram, and Discord. Focus on clean utility, security transparency, and real-time messaging patterns.

## Core Design Principles
1. **Security Visibility**: Encryption status must be immediately apparent
2. **Message Clarity**: Clear sender/receiver distinction with readable typography
3. **Real-time Fluidity**: Instant visual feedback for all messaging actions
4. **Minimal Distraction**: Zero unnecessary elements competing with conversation flow

## Typography System
- **Primary Font**: Inter or System UI fonts via Google Fonts
- **Headings**: 600 weight for usernames, section titles
- **Body Text**: 400 weight for messages (15-16px), 500 for timestamps
- **Mono Font**: JetBrains Mono for encryption keys, technical displays

## Layout & Spacing
**Tailwind Units**: Use 2, 4, 6, 8, 12, 16, 24 consistently
- Message padding: p-3 to p-4
- Section spacing: gap-4 to gap-6
- Container margins: mx-4 to mx-6

**Layout Structure**:
- Login: Single centered card (max-w-md)
- Chat: Three-column layout (users list | messages | info panel) on desktop, stacked on mobile

## Component Library

### Authentication Screen
- Centered card with username input
- Key generation happens automatically on login
- Subtle encryption badge/icon to establish trust from first screen

### Chat Interface Layout
**Left Sidebar (w-64 on desktop)**:
- Online users list with status indicators (green dot = online)
- Public key previews (truncated, expandable on click)
- "Publish Key" button prominently at top

**Main Chat Area**:
- Message bubbles: sent messages align right, received align left
- Bubble styling: rounded-2xl with p-3, max-w-md
- Timestamps: text-xs below each message
- Auto-scroll container with smooth behavior
- Input field: sticky bottom, rounded-lg with send button

**Right Panel (Optional, desktop only)**:
- Encryption status indicator
- Active recipient info
- Public key fingerprint display

### Message Components
- **Sent Messages**: Align items-end, distinct background
- **Received Messages**: Align items-start, contrasting background  
- **System Messages**: Centered, italic, reduced opacity for key exchanges/errors
- **Encryption Indicator**: Lock icon next to encrypted messages, warning icon for unencrypted

### User List Items
- Avatar placeholder (initials in circle)
- Username (font-medium)
- Online status dot
- Truncated public key (text-xs, font-mono, opacity-60)

### Input Area
- Textarea with resize-none, rounded-lg
- Send button with icon (paper plane)
- Character counter (subtle, text-xs)
- Error state for missing recipient keys (red border + warning message)

## State Indicators
- **Loading**: Skeleton screens for message list, subtle pulse animation
- **Error**: Red border + inline error text (no toasts to avoid distraction)
- **Success**: Brief green checkmark on message sent (fade out)
- **Encryption Status**: Persistent lock icon or shield badge

## Security Visual Language
- Lock/unlock icons for encryption state
- Shield icon for secure connections
- Key icon for keypair management
- Warning triangle for missing keys or errors
- Green = encrypted & secure, yellow = warning, red = error

## Responsive Behavior
- **Desktop (lg:)**: Three-column layout with all panels visible
- **Tablet (md:)**: Toggle sidebar, main chat always visible
- **Mobile**: Stack navigation, full-screen chat, drawer for user list

## Animation Principles
**Use sparingly**:
- Message send: Brief slide-in from bottom
- New message arrival: Subtle fade-in
- User status change: Dot color transition
- NO hover animations on messages (distracting)
- NO elaborate scroll effects

## Accessibility
- Focus visible on all interactive elements
- Semantic HTML for message threads (article/section)
- Aria-live for new messages (screen readers)
- Keyboard navigation for user list and message input
- High contrast between text and backgrounds

## Images
No hero images needed. This is a functional chat application. Use only:
- User avatar placeholders (colored circles with initials)
- Icon library: Heroicons for UI elements (lock, send, user, key icons)

**Critical**: Maintain clean, distraction-free messaging environment. Every pixel serves security, clarity, or communication efficiency.