'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, FolderOpen, MessageSquare, Users, Crown } from 'lucide-react';
import SubscriptionBadge from '@/components/subscriptions/SubscriptionBadge';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan: 'FREE' | 'PRO'
    planDetails: {
      name: string
      description: string
      price: number
      features: string[]
      limits: {
        projects: number
        annotationsPerProject: number
      }
    }
    usage: { projects: number }
  } | null>(null);

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch('/api/subscriptions/info');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription info:', error);
      }
    };

    fetchSubscriptionInfo();
  }, [session]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Welcome back, {session?.user?.name || 'User'}!
            </h1>
            <p className="text-neutral-600">
              Here&apos;s what&apos;s happening with your projects today.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {subscriptionInfo && (
              <SubscriptionBadge plan={subscriptionInfo.plan} />
            )}
            {subscriptionInfo?.plan === 'FREE' && (
              <Button
                onClick={() => router.push('/pricing')}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-neutral-500">No projects yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Annotations</CardTitle>
            <MessageSquare className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-neutral-500">No annotations yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
            <Users className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-neutral-500">Just you for now</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create your first project to start collecting visual feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => router.push('/projects')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
            <div className="text-sm text-neutral-600">
              <p className="mb-2">With PixelPin, you can:</p>
              <ul className="space-y-1 text-neutral-500">
                <li>• Upload images, PDFs, or add website URLs</li>
                <li>• Leave precise visual feedback with annotations</li>
                <li>• Collaborate with your team in real-time</li>
                <li>• Track feedback status from open to resolved</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest projects and feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p>No recent activity</p>
              <p className="text-sm">Create a project to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}