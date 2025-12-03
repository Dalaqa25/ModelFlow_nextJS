# Theme-Adaptive System Guide

This application automatically adapts to the user's system theme preference (light/dark mode).

## How It Works

The app uses:
- `AdaptiveBackground` - Automatically switches between dark (`UnifiedBackground`) and light (`LightBackground`) backgrounds
- `ThemeAdaptiveContext` - Provides theme state and utilities to all components
- Theme-aware text colors that automatically adjust for readability

## Usage in Components

### 1. Basic Usage with Hook

```jsx
'use client';

import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function MyComponent() {
    const { isDarkMode, textColors } = useThemeAdaptive();
    
    return (
        <div>
            <h1 className={textColors.primary}>
                This text is white in dark mode, black in light mode
            </h1>
            <p className={textColors.secondary}>
                This is secondary text
            </p>
        </div>
    );
}
```

### 2. Using Theme Utils

```jsx
'use client';

import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import { themeText, themeBg, themeClass } from '@/lib/theme-utils';

export default function MyComponent() {
    const { isDarkMode } = useThemeAdaptive();
    
    return (
        <div className={themeBg.card(isDarkMode)}>
            <h1 className={themeText.primary(isDarkMode)}>
                Heading
            </h1>
            <button className={themeClass(
                isDarkMode,
                'bg-slate-800 text-white',
                'bg-white text-gray-900'
            )}>
                Click me
            </button>
        </div>
    );
}
```

### 3. Available Text Colors

From `textColors` object:
- `textColors.primary` - Main headings (white/black)
- `textColors.secondary` - Body text (gray-300/gray-700)
- `textColors.tertiary` - Less important text (gray-400/gray-600)
- `textColors.muted` - Placeholders (gray-500)
- `textColors.gradient` - Purple-pink gradient

### 4. Common Patterns

```jsx
// Conditional styling with isDarkMode
<div className={`
    px-4 py-2 rounded-lg
    ${isDarkMode 
        ? 'bg-slate-800 text-white border-slate-700' 
        : 'bg-white text-gray-900 border-gray-300'
    }
`}>
    Theme-adaptive card
</div>

// Input fields
<input className={`
    ${isDarkMode 
        ? 'bg-slate-800 text-white placeholder:text-gray-500' 
        : 'bg-white text-gray-900 placeholder:text-gray-400'
    }
`} />
```

## Pages Already Updated

The following pages have been updated to support theme adaptation:
- ✅ /main
- ✅ /plans
- ✅ /dashboard
- ✅ /auth/login
- ✅ /auth/signup
- ✅ /profile
- ✅ /privacy
- ✅ /playground
- ✅ /admin
- ✅ /terms
- ✅ /requests

## Adding Theme Support to New Pages

1. Wrap your page content with `AdaptiveBackground`:
```jsx
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';

export default function MyPage() {
    return (
        <AdaptiveBackground variant="content" className="pt-16">
            {/* Your content here */}
        </AdaptiveBackground>
    );
}
```

2. Use `useThemeAdaptive` hook in your components:
```jsx
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';

export default function MyComponent() {
    const { textColors, isDarkMode } = useThemeAdaptive();
    // Use textColors and isDarkMode for styling
}
```

## Key Components

- **AdaptiveBackground** (`/app/components/shared/AdaptiveBackground.jsx`)
  - Wraps content and provides theme context
  - Props: `variant`, `className`, `showParticles`, `showFloatingElements`

- **ThemeAdaptiveContext** (`/lib/theme-adaptive-context.jsx`)
  - Provides theme state to all children
  - Automatically detects and responds to system theme changes

- **Theme Utils** (`/lib/theme-utils.js`)
  - Helper functions for common theme patterns
  - Makes it easier to apply consistent theme-aware styles

## Tips

1. Always use `textColors` from the hook for text that needs to be visible
2. Test both light and dark modes during development
3. Use the theme utils for consistent styling across components
4. Remember that the theme is automatically detected from the user's system preferences

