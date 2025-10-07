import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-neutral-900">
            PixelPin
          </h1>
          <p className="text-xl text-neutral-600">
            The fastest visual feedback tool for modern teams
          </p>
        </div>

        <Card className="text-left">
          <CardHeader>
            <CardTitle>Design System Test</CardTitle>
            <CardDescription>
              Testing our beautiful design system components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="outline">Outline Button</Button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
            <Button variant="primary" loading>
              Loading Button
            </Button>
          </CardContent>
        </Card>

        <div className="text-sm text-neutral-500">
          Ready to start building PixelPin! 🎨
        </div>
      </div>
    </div>
  );
}
