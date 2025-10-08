# PixelPin Deployment Readiness Report

Generated: 2025-10-08T02:36:39.780Z
Environment: development
Overall Status: NOT_READY

## Test Results


### Environment Variables
- Status: ❌ FAIL

- Notes: Missing required environment variables

### TypeScript Check
- Status: ❌ FAIL
- Error: Command failed: npx tsc --noEmit


### ESLint Check
- Status: ❌ FAIL
- Error: Command failed: npm run lint


### Production Build
- Status: ❌ FAIL
- Error: Command failed: npm run build
Environment variables loaded from .env
 ⚠ The config property `experimental.turbo` is deprecated. Move this setting to `config.turbopack` or run `npx @next/codemod@latest next-experimental-turbo-to-turbopack .`

Failed to compile.

./src/app/(dashboard)/projects/[id]/assets/[assetId]/immersive/page.tsx
21:15  Warning: 'projectId' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/app/api/assets/[id]/annotations/route.ts
9:77  Warning: 'asset' is defined but never used.  @typescript-eslint/no-unused-vars

./src/app/api/projects/[id]/collaborators/route.ts
11:7  Warning: 'updateCollaboratorSchema' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/AnnotationCard.tsx
68:3  Warning: 'onDelete' is defined but never used.  @typescript-eslint/no-unused-vars
277:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
336:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/components/annotation/AnnotationForm.tsx
41:3  Warning: 'projectCollaborators' is assigned a value but never used.  @typescript-eslint/no-unused-vars
47:20  Warning: 'setMentions' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/AnnotationOverlay.tsx
32:3  Warning: 'viewport' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/AnnotationSidebar.tsx
72:3  Warning: 'projectCollaborators' is defined but never used.  @typescript-eslint/no-unused-vars
121:6  Warning: React Hook useMemo has a missing dependency: 'sortBy'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/components/annotation/AttachmentList.tsx
18:3  Warning: 'showUploader' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/AttachmentPreview.tsx
43:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/components/annotation/AttachmentUploader.tsx
97:9  Warning: 'formatFileSize' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/CollaboratorPresence.tsx
103:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/components/annotation/FocusModeLayout.tsx
11:3  Warning: 'CogIcon' is defined but never used.  @typescript-eslint/no-unused-vars
28:3  Warning: 'assetId' is defined but never used.  @typescript-eslint/no-unused-vars
29:3  Warning: 'showSidebar' is defined but never used.  @typescript-eslint/no-unused-vars
30:3  Warning: 'onToggleSidebar' is defined but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/GuestAnnotationView.tsx
243:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/components/annotation/ImmersiveAnnotationView.tsx
58:3  Warning: 'guestToken' is defined but never used.  @typescript-eslint/no-unused-vars
94:14  Warning: 'urlHistory' is assigned a value but never used.  @typescript-eslint/no-unused-vars
97:5  Warning: 'isValidUrl' is assigned a value but never used.  @typescript-eslint/no-unused-vars
100:5  Warning: 'getBreadcrumb' is assigned a value but never used.  @typescript-eslint/no-unused-vars
103:24  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
123:32  Warning: 'getPresenceMembers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
169:10  Warning: 'annotationError' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/annotation/MentionNotifications.tsx
41:6  Warning: React Hook useEffect has a missing dependency: 'loadNotifications'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
139:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/components/annotation/MentionTextarea.tsx
166:9  Warning: 'renderTextWithMentions' is assigned a value but never used.  @typescript-eslint/no-unused-vars
225:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/components/annotation/WebsiteIframe.tsx
54:18  Warning: 'crossOriginError' is defined but never used.  @typescript-eslint/no-unused-vars
106:20  Warning: 'crossOriginError' is defined but never used.  @typescript-eslint/no-unused-vars
118:22  Warning: 'docError' is defined but never used.  @typescript-eslint/no-unused-vars

./src/components/ui/ErrorBoundary.tsx
26:35  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars

./src/components/ui/LazyImage.tsx
62:5  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

./src/hooks/useUrlContext.ts
61:14  Warning: 'validationError' is defined but never used.  @typescript-eslint/no-unused-vars

./src/lib/bundle-optimization.ts
173:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
183:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
195:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
206:84  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
213:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
406:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
408:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
457:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/lib/comprehensive-testing.ts
236:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
240:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
241:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
242:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
248:67  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
252:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
253:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
267:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
271:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/lib/cross-browser-testing.ts
72:9  Warning: 'vendor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
176:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
301:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
355:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
455:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/lib/production-config.ts
430:9  Warning: 'validation' is assigned a value but never used.  @typescript-eslint/no-unused-vars
431:9  Warning: 'readiness' is assigned a value but never used.  @typescript-eslint/no-unused-vars

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules



### Database Connection
- Status: ❌ FAIL
- Error: DATABASE_URL not configured


### Security Configuration
- Status: ✅ PASS

- Notes: Security headers properly configured


## Recommendations

⚠️ Some checks failed. Please address the issues above before deploying to production.

## Next Steps

1. Fix failing tests
2. Re-run deployment readiness check
3. Verify all issues are resolved
4. Proceed with deployment
