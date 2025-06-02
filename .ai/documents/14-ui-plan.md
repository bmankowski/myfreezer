# UI Architecture for MyFreezer

## 1. UI Structure Overview

MyFreezer is a voice-first, single-page web application that provides hierarchical management of freezer and fridge contents. The application uses a scrollable layout with fixed navigation elements, prioritizing voice interactions while offering comprehensive manual controls. The architecture supports real-time data synchronization, responsive design across devices, and intuitive visual feedback systems.

The UI is built around a three-tier hierarchy (Containers → Shelves → Items) displayed in an always-visible structure that eliminates the need for separate views or complex navigation. Voice commands are processed through a fixed floating action button with visual progress indicators, while manual operations are supported through inline editing and contextual controls.

## 2. List of Views

### 2.1 Login/Landing View
- **View Path**: `/` (unauthenticated state)
- **Main Purpose**: User authentication and application introduction
- **Key Information to Display**: 
  - Application branding and purpose
  - Google OAuth login button
  - Brief description of functionality
- **Key Components**:
  - Google OAuth button component
  - Landing page hero section
  - Basic layout structure
- **UX, Accessibility, and Security Considerations**:
  - Clear call-to-action for login
  - ARIA labels for authentication flow
  - Secure OAuth redirect handling
  - Loading states during authentication

### 2.2 Main Dashboard View
- **View Path**: `/` (authenticated state)
- **Main Purpose**: Central hub for all freezer/fridge management activities
- **Key Information to Display**:
  - All user containers (freezers/fridges) in responsive grid
  - Complete hierarchical structure (containers → shelves → items)
  - Real-time search results
  - Voice command status and feedback
- **Key Components**:
  - Header with search functionality
  - Container grid layout
  - Individual container cards
  - Floating microphone button
  - Toast notification system
  - Modal dialogs for editing
  - Offline/error state banners
- **UX, Accessibility, and Security Considerations**:
  - Single-page design eliminates navigation complexity
  - Keyboard navigation support for all interactions
  - Screen reader compatibility with hierarchical structure
  - Row-level security ensures data isolation
  - Clear visual feedback for all operations
  - Progressive enhancement for voice features

### 2.3 Empty State View
- **View Path**: `/` (authenticated, no containers)
- **Main Purpose**: Guide new users to create their first container
- **Key Information to Display**:
  - Welcome message and instructions
  - "Add First Container" call-to-action
  - Feature overview for voice commands
- **Key Components**:
  - Empty state illustration
  - Primary action button
  - Help text or quick start guide
- **UX, Accessibility, and Security Considerations**:
  - Clear onboarding path
  - Accessible empty state messaging
  - Prominent primary action

## 3. User Journey Map

### 3.1 First-Time User Flow
1. **Landing** → User visits application URL
2. **Authentication** → Click "Login with Google" → OAuth flow → Return to app
3. **Empty State** → See empty dashboard with "Add First Container" prompt
4. **Container Creation** → Click add button → Fill form (name, type) → Save
5. **Shelf Creation** → Click "Add Shelf" in new container → Fill form → Save
6. **Voice Introduction** → Notice floating microphone button → Click for first voice command
7. **Voice Command** → Record "add milk to first shelf" → See progress ring → Receive confirmation
8. **Content Review** → See new item appear in hierarchical structure → Understand layout

### 3.2 Daily Usage Flow
1. **Quick Access** → Open app → Authenticated automatically → See current inventory
2. **Voice Management** → Click microphone → Voice command (add/remove/query) → Visual feedback
3. **Manual Review** → Scroll through containers → Check inventory visually
4. **Search Usage** → Type in search box → Filter results in real-time → Find specific items
5. **Maintenance** → Edit container/shelf names as needed → Reorganize structure

### 3.3 Error Recovery Flow
1. **Connection Issues** → Offline banner appears → Voice commands disabled → Manual review still available
2. **Voice Errors** → Microphone permission denial → Clear error message → Fallback to manual entry
3. **Command Ambiguity** → AI unclear on command → Toast with clarification request → Retry with more specific command

## 4. Layout and Navigation Structure

### 4.1 Page Layout Structure
```
┌─────────────────────────────────────────┐
│ Header (Sticky)                         │
│ ┌─────────────────────────────────────┐ │
│ │ Search Input + Controls             │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Main Content Area (Scrollable)          │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ Container 1 │ │ Container 2 │        │
│ │ └─ Shelf A  │ │ └─ Shelf A  │        │
│ │    ├─ Item  │ │    ├─ Item  │        │
│ │ └─ Shelf B  │ │ └─ Shelf B  │        │
│ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────┤
│ Fixed Elements                          │
│              [🎤] Microphone            │
│ [Toast Area]                            │
└─────────────────────────────────────────┘
```

### 4.2 Responsive Behavior
- **Desktop/Tablet (≥768px)**: 2-column container grid with flexible sizing
- **Mobile (<768px)**: Single-column layout with full-width containers
- **Container Sizing**: Minimum 320px width, proportional growth, unlimited vertical expansion
- **Touch Optimization**: Larger touch targets (44px minimum) for mobile interactions

### 4.3 Navigation Philosophy
- **No Traditional Navigation**: Single-page application eliminates navigation complexity
- **Scroll-Based Discovery**: All content accessible through vertical scrolling
- **Fixed Action Elements**: Microphone button always accessible regardless of scroll position
- **Context-Sensitive Actions**: Edit/delete options appear contextually within containers/shelves

### 4.4 Visual Hierarchy
- **Level 1**: Container cards with distinct color coding (blue/orange)
- **Level 2**: Shelf sections with clear boundaries and add controls
- **Level 3**: Item rows with quantity and action controls
- **Fixed Layer**: Floating elements (microphone, toasts) with appropriate z-index

## 5. Key Components

### 5.1 Header Component
- **Purpose**: Global search and application branding
- **Features**: 
  - Sticky positioning for always-available search
  - Real-time search with 300ms debounce
  - Clear button for search reset
  - User authentication status indicator
- **Accessibility**: Proper form labels, keyboard navigation

### 5.2 Container Card Component
- **Purpose**: Display and manage individual freezers/fridges
- **Features**:
  - Color-coded borders (blue for freezers, orange for fridges)
  - Inline name editing with modal dialogs
  - Add shelf functionality
  - Delete option for empty containers only
  - Expandable/collapsible content structure
- **State Management**: Local state for editing modes, global state for data

### 5.3 Shelf Component  
- **Purpose**: Organize items within containers
- **Features**:
  - Position-based ordering
  - Inline name editing
  - Add item controls
  - Delete option for empty shelves only
  - Item count indicators
- **Visual Design**: Clear section boundaries with consistent spacing

### 5.4 Item Component
- **Purpose**: Display individual food products with quantities
- **Features**:
  - Name and quantity display
  - Direct edit/delete controls
  - Move functionality between shelves
  - Quantity adjustment controls
  - Visual feedback for operations
- **Data Handling**: Optimistic updates with server reconciliation

### 5.5 Voice Interface Component
- **Purpose**: Central voice command processing
- **Features**:
  - Fixed bottom-center positioning with safe-area-inset-bottom
  - 30-second recording timeout with circular progress indicator
  - Visual feedback states: idle, recording, processing, success, error
  - Permission handling and error recovery
  - Queue management for multiple commands
- **Progress Indicator**: 2px ring with color transition (blue → amber → red)

### 5.6 Toast Notification System
- **Purpose**: Provide feedback for all operations
- **Features**:
  - Fixed top-right positioning (1rem margins)
  - 2-second auto-dismiss with hover-to-persist
  - Queue system for multiple notifications
  - Type-based styling (success, error, warning, info)
  - Smooth enter/exit animations
- **Accessibility**: ARIA live regions for screen reader announcements

### 5.7 Search Results Component
- **Purpose**: Filter and highlight search matches
- **Features**:
  - Real-time filtering within existing layout
  - Hide non-matching items with smooth transitions
  - Highlight matching text in results
  - Preserve container/shelf context for matches
  - Clear search state management
- **Performance**: Debounced input with efficient filtering

### 5.8 Modal Dialog Component
- **Purpose**: Handle editing operations for containers and shelves
- **Features**:
  - Small, centered design for focused interactions
  - Keyboard support (ESC to cancel, Enter to save)
  - Real-time validation feedback
  - Click-outside-to-cancel behavior
  - Focus trap for accessibility
- **Implementation**: Shadcn/ui Dialog component with custom styling

### 5.9 Offline Indicator Component
- **Purpose**: Communicate connectivity status
- **Features**:
  - Top banner with non-dismissible yellow indicator
  - Clear messaging about disabled features
  - Automatic hide/show based on connection status
  - No interference with main content layout
- **Behavior**: Appears/disappears with smooth transitions

### 5.10 Loading State Component
- **Purpose**: Provide feedback during async operations
- **Features**:
  - Overlay spinners on container content
  - Semi-transparent backdrop to indicate busy state
  - Spinner animation with consistent branding
  - Prevent user interaction during loading (pointer-events-none)
  - Context-appropriate sizing and positioning
- **Performance**: Minimize layout shifts during loading states 