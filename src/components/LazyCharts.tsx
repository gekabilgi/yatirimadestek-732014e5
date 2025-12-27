import React, { lazy, Suspense, ComponentProps } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load recharts components
const LazyAreaChart = lazy(() => 
  import('recharts').then(module => ({ default: module.AreaChart }))
);
const LazyBarChart = lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);
const LazyLineChart = lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);
const LazyPieChart = lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

// Re-export other recharts components that are needed
export { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  Bar,
  Line,
  Pie,
  Cell,
} from 'recharts';

// Chart skeleton component
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Wrapped chart components with lazy loading
export const AreaChart = (props: ComponentProps<typeof LazyAreaChart>) => (
  <Suspense fallback={<ChartSkeleton height={props.height as number || 300} />}>
    <LazyAreaChart {...props} />
  </Suspense>
);

export const BarChart = (props: ComponentProps<typeof LazyBarChart>) => (
  <Suspense fallback={<ChartSkeleton height={props.height as number || 300} />}>
    <LazyBarChart {...props} />
  </Suspense>
);

export const LineChart = (props: ComponentProps<typeof LazyLineChart>) => (
  <Suspense fallback={<ChartSkeleton height={props.height as number || 300} />}>
    <LazyLineChart {...props} />
  </Suspense>
);

export const PieChart = (props: ComponentProps<typeof LazyPieChart>) => (
  <Suspense fallback={<ChartSkeleton height={props.height as number || 300} />}>
    <LazyPieChart {...props} />
  </Suspense>
);
