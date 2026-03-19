# React Cheat Sheet

## What is React?

React is a JavaScript library for building declarative, component-based UIs. Components are functions (or classes) that return JSX. State and side effects are managed through hooks. React 18 introduced concurrent rendering, automatic batching, and the `use` hook.

---

## Quick Reference

```tsx
// Functional component
const Greeting = ({ name }: { name: string }) => <h1>Hello, {name}!</h1>;

// useState
const [count, setCount] = useState(0);

// useEffect
useEffect(() => { document.title = `Count: ${count}`; }, [count]);

// useRef
const inputRef = useRef<HTMLInputElement>(null);

// useContext
const theme = useContext(ThemeContext);

// Custom hook
const useToggle = (init = false) => {
  const [value, setValue] = useState(init);
  return [value, () => setValue(v => !v)] as const;
};
```

---

## Components

### Function Component
```tsx
interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = ({ label, onClick, disabled = false }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

export default Button;
```

### Component with Children
```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

const Card = ({ title, children }: CardProps) => (
  <div className="card">
    <h2>{title}</h2>
    <div className="card-body">{children}</div>
  </div>
);
```

### Forwarding Refs
```tsx
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} {...props} />
);
```

---

## JSX Rules

```tsx
// Must have a single root element (or Fragment)
const App = () => (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);

// Expressions use curly braces
<p>{user.name.toUpperCase()}</p>

// className instead of class
<div className="container">

// htmlFor instead of for
<label htmlFor="email">Email</label>

// Self-closing tags must close
<img src="..." alt="..." />
<br />

// Boolean attributes
<input disabled />          // disabled={true}
<input disabled={false} />  // attribute omitted

// Inline styles take an object
<div style={{ color: 'red', fontSize: 14 }}>

// Conditional rendering
{isLoggedIn && <Dashboard />}
{error ? <Error msg={error} /> : <Content />}
{items.length > 0 && <List items={items} />}

// List rendering — always provide a stable key
{items.map(item => <Item key={item.id} {...item} />)}
```

---

## Hooks

### useState
```tsx
const [value, setValue] = useState<string>('');
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// Functional update (safe when new state depends on previous)
setCount(prev => prev + 1);

// Object state — always spread to avoid losing other fields
setUser(prev => ({ ...prev!, email: 'new@example.com' }));
```

### useEffect
```tsx
// Run on every render
useEffect(() => { console.log('rendered'); });

// Run once (on mount)
useEffect(() => {
  fetchData();
}, []);

// Run when dependencies change
useEffect(() => {
  document.title = title;
}, [title]);

// Cleanup (runs before next effect and on unmount)
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// Async inside useEffect
useEffect(() => {
  let cancelled = false;
  (async () => {
    const data = await fetchUser(id);
    if (!cancelled) setUser(data);
  })();
  return () => { cancelled = true; };
}, [id]);
```

### useRef
```tsx
// DOM reference
const inputRef = useRef<HTMLInputElement>(null);
const focusInput = () => inputRef.current?.focus();
<input ref={inputRef} />;

// Mutable value that does NOT trigger re-render
const renderCount = useRef(0);
useEffect(() => { renderCount.current++; });

// Store previous value
const prevCount = useRef(count);
useEffect(() => { prevCount.current = count; }, [count]);
```

### useContext
```tsx
// Create context
const ThemeContext = React.createContext<'light' | 'dark'>('light');

// Provide context
const App = () => (
  <ThemeContext.Provider value="dark">
    <Toolbar />
  </ThemeContext.Provider>
);

// Consume context
const Toolbar = () => {
  const theme = useContext(ThemeContext);
  return <div className={`toolbar-${theme}`}>Toolbar</div>;
};
```

### useReducer
```tsx
type State = { count: number; error: string | null };
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + 1 };
    case 'decrement': return { ...state, count: state.count - 1 };
    case 'reset':     return { count: 0, error: null };
  }
};

const Counter = () => {
  const [state, dispatch] = useReducer(reducer, { count: 0, error: null });
  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </>
  );
};
```

### useCallback and useMemo
```tsx
// useCallback — memoize a function reference
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// useMemo — memoize an expensive computed value
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
```

### useLayoutEffect
```tsx
// Like useEffect but fires synchronously after DOM mutations (before paint)
useLayoutEffect(() => {
  const { height } = ref.current!.getBoundingClientRect();
  setHeight(height);
}, []);
```

### useId (React 18+)
```tsx
// Generate stable, unique IDs for accessibility attributes
const id = useId();
return (
  <>
    <label htmlFor={id}>Name</label>
    <input id={id} type="text" />
  </>
);
```

### useTransition (React 18+)
```tsx
const [isPending, startTransition] = useTransition();

const handleSearch = (query: string) => {
  startTransition(() => {
    setResults(heavyFilter(query));
  });
};

return (
  <>
    <input onChange={e => handleSearch(e.target.value)} />
    {isPending ? <Spinner /> : <ResultList results={results} />}
  </>
);
```

### useDeferredValue (React 18+)
```tsx
const deferredQuery = useDeferredValue(query);
// deferredQuery lags behind query during transitions, keeping the UI responsive
const results = useMemo(() => filter(data, deferredQuery), [data, deferredQuery]);
```

---

## Custom Hooks

Custom hooks are plain functions that start with `use` and can call other hooks.

```tsx
// useFetch
const useFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
};

// useLocalStorage
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (val: T | ((prev: T) => T)) => {
    const next = val instanceof Function ? val(value) : val;
    setValue(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  };

  return [value, setStoredValue] as const;
};

// useDebounce
const useDebounce = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
```

---

## Performance Optimisation

### React.memo
```tsx
// Prevents re-render if props haven't changed (shallow comparison)
const ExpensiveItem = React.memo(({ id, name }: ItemProps) => (
  <li>{id}: {name}</li>
));

// Custom comparison
const Item = React.memo(MyItem, (prev, next) => prev.id === next.id);
```

### Code Splitting with lazy / Suspense
```tsx
const Dashboard = React.lazy(() => import('./Dashboard'));

const App = () => (
  <Suspense fallback={<Spinner />}>
    <Dashboard />
  </Suspense>
);
```

### Avoid Unnecessary Re-renders
```tsx
// Move state down — only the component that needs it re-renders
// Use useCallback for event handlers passed to memo'd children
// Use useMemo for expensive derived data
// Avoid creating objects/arrays in JSX (they always change reference):

// Bad
<MyComponent style={{ color: 'red' }} />         // new object every render
// Good
const style = useMemo(() => ({ color: 'red' }), []);
<MyComponent style={style} />
```

---

## Event Handling

```tsx
// Click
<button onClick={handleClick}>Click</button>
<button onClick={() => handleClick(id)}>Click</button>

// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Form submit
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

// Keyboard
const handleKey = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') submit();
  if (e.key === 'Escape') cancel();
};

// Stopping propagation
<div onClick={e => e.stopPropagation()}>

// Common event types
React.MouseEvent<HTMLButtonElement>
React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
React.FormEvent<HTMLFormElement>
React.KeyboardEvent<HTMLInputElement>
React.FocusEvent<HTMLInputElement>
React.DragEvent<HTMLDivElement>
```

---

## Error Boundaries

```tsx
// Error boundaries must be class components
class ErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Boundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<h1>Something went wrong.</h1>}>
  <MyComponent />
</ErrorBoundary>
```

---

## Portals

```tsx
import { createPortal } from 'react-dom';

const Modal = ({ children }: { children: React.ReactNode }) =>
  createPortal(
    <div className="modal">{children}</div>,
    document.getElementById('modal-root')!
  );
```

---

## Context with Reducer (State Management Pattern)

```tsx
interface AppState { user: User | null; theme: 'light' | 'dark' }
type AppAction = { type: 'SET_USER'; payload: User } | { type: 'TOGGLE_THEME' };

const AppContext = React.createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':    return { ...state, user: action.payload };
    case 'TOGGLE_THEME': return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
  }
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, { user: null, theme: 'light' });
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
```

---

## Controlled vs Uncontrolled Inputs

```tsx
// Controlled — React owns the value
const [name, setName] = useState('');
<input value={name} onChange={e => setName(e.target.value)} />;

// Uncontrolled — DOM owns the value, accessed via ref
const nameRef = useRef<HTMLInputElement>(null);
<input ref={nameRef} defaultValue="initial" />;
// Read: nameRef.current?.value
```

---

## TypeScript Tips

```tsx
// Component type annotations
const MyComp: React.FC<Props> = ({ title }) => <h1>{title}</h1>;
// Or (preferred — more explicit):
const MyComp = ({ title }: Props): JSX.Element => <h1>{title}</h1>;

// useState with type
const [item, setItem] = useState<Item | null>(null);

// useRef types
const btnRef = useRef<HTMLButtonElement>(null);        // DOM element
const timerRef = useRef<ReturnType<typeof setInterval>>();  // Mutable value

// Event handler types
type ClickHandler = React.MouseEventHandler<HTMLButtonElement>;
type ChangeHandler = React.ChangeEventHandler<HTMLInputElement>;

// Children
React.ReactNode          // Anything React can render
React.ReactElement       // Only JSX elements
React.PropsWithChildren<T>  // T & { children?: ReactNode }

// Discriminated union props
type ButtonProps =
  | { variant: 'icon'; icon: string; label?: never }
  | { variant: 'text'; label: string; icon?: never };
```

---

## Tips and Best Practices

### Co-locate State Close to Where It's Used
Don't lift state higher than necessary. If only one component needs it, keep it there.

### Stable Keys in Lists
Always use stable, unique IDs as keys — never array indices for dynamic lists:
```tsx
// Bad
{items.map((item, index) => <Item key={index} {...item} />)}

// Good
{items.map(item => <Item key={item.id} {...item} />)}
```

### One Concern Per Component
Keep components focused. Extract complex logic into custom hooks; extract complex JSX into sub-components.

### Prefer Composition Over Configuration
```tsx
// Bad — bloated props API
<Dialog title="..." subtitle="..." footerButtons={[...]} headerIcon="..." />

// Good — composable
<Dialog>
  <DialogHeader icon="..."><h2>Title</h2></DialogHeader>
  <DialogContent>...</DialogContent>
  <DialogFooter><Button>OK</Button></DialogFooter>
</Dialog>
```

### Don't Over-memoize
`React.memo`, `useMemo`, and `useCallback` add overhead. Profile first with React DevTools before optimizing.
