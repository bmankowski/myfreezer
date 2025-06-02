# UI Architecture Plan - MyFreezer MVP

## 1. Overview

### Application Type
Single-page web application with responsive design supporting voice commands and manual interactions for managing freezer/fridge inventory.

### Key UI Principles
- **Voice-First Design**: Primary interaction through voice commands with visual feedback
- **Responsive Layout**: Seamless experience across desktop, tablet, and mobile
- **Real-time Updates**: Immediate visual feedback for all user actions
- **Accessibility**: Clear visual hierarchy and keyboard navigation support
- **Performance**: Optimized loading and smooth interactions

## 2. Layout Architecture

### Page Structure
- **Single Scrollable Page**: All functionality on one page with unlimited vertical expansion
- **Sticky Header**: Search functionality always accessible at top
- **Container Grid**: Responsive grid layout for freezer/fridge containers
- **Fixed Elements**: Microphone button and toast notifications

### Responsive Design

#### Desktop/Tablet (≥768px)
- **Container Grid**: CSS Grid with `minmax(320px, 1fr)` for proportional sizing
- **Minimum Width**: 320px per container, no maximum width constraint
- **Columns**: Auto-fit based on available space and content

#### Mobile (<768px)
- **Single Column**: Containers stack vertically
- **Full Width**: Containers use full available width minus padding
- **Touch Optimization**: Larger touch targets and appropriate spacing

## 3. Visual Design System

### Color Scheme

#### Container Types
- **Freezers**: Blue theme (`border-blue-400`, `bg-blue-50`)
- **Fridges**: Orange theme (`border-orange-400`, `bg-orange-50`)
- **Hover States**: Darker border colors for interactive elements

#### Interactive Elements
- **Primary Actions**: Blue accent color (`#3b82f6`)
- **Success States**: Green (`#10b981`)
- **Warning States**: Amber (`#f59e0b`)
- **Error States**: Red (`#ef4444`)

### Typography & Spacing
- **System**: Tailwind 4 design tokens
- **Hierarchy**: Clear heading levels for containers, shelves, and items
- **Spacing**: Consistent padding and margins using Tailwind spacing scale

## 4. Component Architecture

### Core Components

#### Container Component
```typescript
interface ContainerProps {
  container: Container;
  isLoading: boolean;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}
```

#### Shelf Component
```typescript
interface ShelfProps {
  shelf: Shelf;
  items: Item[];
  containerType: 'freezer' | 'fridge';
  onEditShelf: (id: string, name: string) => void;
  onDeleteShelf: (id: string) => void;
  onAddItem: (shelfId: string, item: ItemInput) => void;
}
```

#### Item Component
```typescript
interface ItemProps {
  item: Item;
  onEdit: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
  isHighlighted?: boolean;
}
```

### Layout Components

#### AppLayout
- Main page wrapper with header, content area, and fixed elements
- Manages global state and authentication

#### Header
- Sticky search input with real-time filtering
- Offline status indicator banner
- App title and navigation elements

#### ContainerGrid
- Responsive grid container for freezer/fridge cards
- Handles empty states and loading states

## 5. Voice Interface Design

### Microphone Button
- **Position**: Fixed at bottom center with 2rem margin from edge
- **Design**: Circular FAB with clear visual states
- **Progress Indicator**: Thin ring (2px) around button edge
- **Animation**: Smooth progress from blue → amber → red over 30 seconds
- **Mobile Safety**: Uses `safe-area-inset-bottom` for device compatibility

### Voice States
1. **Idle**: Default microphone icon with subtle shadow
2. **Recording**: Pulsing animation with progress ring
3. **Processing**: Spinner overlay with "Processing..." text
4. **Success**: Brief checkmark animation before returning to idle
5. **Error**: Red color state with error icon

### Audio Feedback
- **Start Recording**: Subtle audio cue (if enabled)
- **Command Recognized**: Success tone
- **Error**: Error tone
- **Timeout**: Warning tone

## 6. Search and Filtering

### Search Interface
- **Location**: Sticky header at top of page
- **Input**: Shadcn/ui Input component with search icon
- **Debouncing**: 300ms delay for performance
- **Clear Button**: X button to reset search

### Search Behavior
- **Real-time Filtering**: Updates as user types
- **Scope**: Searches across all containers, shelves, and items
- **Matching**: Case-insensitive partial matching
- **Visual Feedback**: Highlighted matches, hidden non-matches

### Search Results Display
- **In-place Filtering**: Results shown within existing container layout
- **Item Highlighting**: Colored borders and backgrounds for matches
- **Container Visibility**: Hide containers with no matching items
- **Transitions**: 200ms fade-out/fade-in animations

## 7. State Management

### Data Flow Architecture
```typescript
// Global State Structure
interface AppState {
  user: User | null;
  containers: Container[];
  isLoading: boolean;
  searchQuery: string;
  voiceState: VoiceState;
  toasts: Toast[];
  isOffline: boolean;
}
```

### State Management Strategy
- **React Context**: For global app state and user authentication
- **Local Component State**: For UI-specific state (modals, forms)
- **React Query/SWR**: For server state management and caching
- **Real-time Updates**: Optimistic updates with server reconciliation

### Voice Command State
```typescript
interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  progress: number; // 0-100 for 30-second timeout
  lastCommand?: string;
  error?: string;
}
```

## 8. Loading and Error States

### Loading States

#### Container Loading
- **Overlay**: Semi-transparent backdrop (`bg-black/20`)
- **Spinner**: Centered loading spinner on container content
- **Interaction Blocking**: `pointer-events-none` during loading
- **Duration**: Individual container loading states

#### Global Loading
- **Search**: Skeleton placeholders for search results
- **Initial Load**: Full-page loading state with app branding

### Error Handling

#### Voice Command Errors
- **Display**: Toast notifications (2-second duration)
- **Types**: Network errors, parsing failures, permission denied
- **Recovery**: Clear instructions for user action

#### Network Errors
- **Offline Banner**: Top banner with yellow background
- **Message**: "You're offline. Voice commands and data sync are unavailable."
- **Behavior**: Non-dismissible, auto-hide when connection restored

#### API Errors
- **Toast Notifications**: Error-specific messages
- **Retry Mechanisms**: Automatic retry for transient failures
- **Fallback UI**: Graceful degradation when features unavailable

## 9. Interactive Elements

### Modal Dialogs
- **Design**: Small centered modals using Shadcn/ui Dialog
- **Content**: Input field with save/cancel buttons
- **Keyboard Support**: ESC to cancel, Enter to save
- **Validation**: Real-time validation with error states
- **Focus Management**: Proper focus trapping and restoration

### Toast Notifications
- **Position**: Floating toasts that move with scroll
- **Location**: Top-right area (top: 1rem, right: 1rem)
- **Duration**: 2 seconds with hover-to-persist
- **Queue System**: Sequential display, newest on top
- **Animations**: Smooth slide-in/slide-out transitions

### Form Interactions
- **Inline Editing**: Click-to-edit functionality for names
- **Auto-save**: Automatic saving on blur or Enter key
- **Validation**: Real-time feedback for invalid inputs
- **Error States**: Clear error messaging and recovery

## 10. Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through all interactive elements
- **Focus Indicators**: Clear visual focus states
- **Keyboard Shortcuts**: Standard shortcuts for modal interactions
- **Screen Reader**: Proper ARIA labels and landmarks

### Visual Accessibility
- **Color Contrast**: WCAG AA compliance for all text and interactive elements
- **Focus Management**: Clear focus indicators and logical focus flow
- **Alternative Text**: Descriptive alt text for all images and icons
- **Responsive Text**: Scalable text that responds to user preferences

### Voice Accessibility
- **Visual Feedback**: All voice interactions have visual counterparts
- **Alternative Inputs**: Manual input methods for all voice commands
- **Error Recovery**: Clear instructions when voice features fail

## 11. Performance Optimization

### Rendering Performance
- **Virtual Scrolling**: For item lists exceeding 100 items (react-window)
- **Lazy Loading**: Load container contents on demand
- **Memoization**: React.memo for expensive components
- **Debouncing**: Search input and API calls

### Network Optimization
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Request Batching**: Combine multiple operations when possible
- **Error Recovery**: Intelligent retry mechanisms
- **Caching**: Strategic caching of frequently accessed data

### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Remove unused code from bundles
- **Asset Optimization**: Optimized images and icons
- **Progressive Enhancement**: Core functionality works without JavaScript

## 12. Mobile Considerations

### Touch Interactions
- **Touch Targets**: Minimum 44px touch targets for interactive elements
- **Gesture Support**: Standard mobile gestures where appropriate
- **Haptic Feedback**: Consider vibration for voice command feedback

### Mobile-Specific Features
- **Safe Areas**: Proper handling of notches and home indicators
- **Orientation**: Consistent experience in portrait and landscape
- **Browser Compatibility**: Testing across mobile browsers
- **Performance**: Optimized for mobile devices and slower networks

### Progressive Web App Features
- **Service Worker**: Offline functionality for core features
- **App Manifest**: Proper PWA manifest for installation
- **Icon Set**: Complete icon set for various device types
- **Splash Screen**: Branded loading experience

## 13. Technical Implementation

### Tech Stack Integration
- **Astro 5**: Static site generation with island architecture
- **React 19**: Interactive components with latest features
- **TypeScript 5**: Full type safety across components
- **Tailwind 4**: Utility-first styling with design system
- **Shadcn/ui**: Accessible component library

### Component Organization
```
src/components/
├── ui/              # Shadcn/ui components
├── layout/          # Layout components (Header, AppLayout)
├── containers/      # Container-related components
├── voice/           # Voice interface components
├── search/          # Search functionality
└── common/          # Shared utility components
```

### Type Definitions
```typescript
// Core entity types matching API responses
interface Container {
  container_id: string;
  name: string;
  type: 'freezer' | 'fridge';
  created_at: string;
  shelves?: Shelf[];
}

interface Shelf {
  shelf_id: string;
  container_id: string;
  name: string;
  position: number;
  items?: Item[];
}

interface Item {
  item_id: string;
  shelf_id: string;
  name: string;
  quantity: number;
  created_at: string;
}
```

## 14. Future Considerations

### Scalability
- **Component Architecture**: Designed for easy feature additions
- **State Management**: Scalable state architecture
- **Performance**: Built-in optimization for growth
- **API Integration**: Flexible API integration patterns

### Extensibility
- **Plugin Architecture**: Consider plugin system for new features
- **Theme System**: Extensible theming beyond container colors
- **Internationalization**: Structure ready for multi-language support
- **Analytics**: Hooks for future analytics integration

### Maintenance
- **Testing Strategy**: Component and integration testing
- **Documentation**: Comprehensive component documentation
- **Code Quality**: Linting and formatting standards
- **Monitoring**: Error tracking and performance monitoring

This architecture provides a solid foundation for the MyFreezer MVP while considering future growth and maintainability. 