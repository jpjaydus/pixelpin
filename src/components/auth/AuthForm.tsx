'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const schema = mode === 'signup' ? signUpSchema : signInSchema;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = schema.parse(formData);

      if (mode === 'signup') {
        // Create account
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validatedData),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ general: data.error || 'Failed to create account' });
          return;
        }

        // Auto sign in after successful signup
        const signInResult = await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          setErrors({ general: 'Account created but failed to sign in. Please try signing in manually.' });
          return;
        }

        router.push('/dashboard');
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });

        if (result?.error) {
          setErrors({ general: 'Invalid email or password' });
          return;
        }

        router.push('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">PixelPin</h1>
          <p className="text-neutral-600">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin' 
                ? 'Enter your credentials to access your account'
                : 'Fill in your details to create a new account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="Enter your full name"
                  required
                />
              )}
              
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="Enter your email"
                required
              />
              
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                placeholder="Enter your password"
                helperText={mode === 'signup' ? 'Must be at least 6 characters' : undefined}
                required
              />

              {errors.general && (
                <div className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg p-3">
                  {errors.general}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <a
                  href={mode === 'signin' ? '/signup' : '/signin'}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}