import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import puppeteer from 'puppeteer'
import { z } from 'zod'

const screenshotSchema = z.object({
  url: z.string().url(),
  viewport: z.object({
    width: z.number().min(320).max(1920),
    height: z.number().min(240).max(1080)
  }).optional(),
  selector: z.string().optional(),
  fullPage: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, viewport, selector, fullPage } = screenshotSchema.parse(body)

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Set viewport if provided
    if (viewport) {
      await page.setViewport(viewport)
    } else {
      await page.setViewport({ width: 1280, height: 720 })
    }

    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })

    // Take screenshot
    const screenshotOptions: {
      type: 'png'
      fullPage: boolean
      clip?: { x: number; y: number; width: number; height: number }
    } = {
      type: 'png',
      fullPage
    }

    if (selector) {
      const clipRect = await page.evaluate((sel) => {
        const element = document.querySelector(sel)
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        }
      }, selector)
      
      if (clipRect) {
        screenshotOptions.clip = clipRect
      }
    }

    const screenshotBuffer = await page.screenshot(screenshotOptions)

    await browser.close()

    // Optimize screenshot size if it's too large
    const optimizedBuffer = screenshotBuffer
    if (screenshotBuffer.length > 1024 * 1024) { // 1MB
      // Could add image compression here if needed
      console.warn('Screenshot is large:', screenshotBuffer.length, 'bytes')
    }

    // Upload to Vercel Blob
    const filename = `screenshots/screenshot-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const blob = await put(filename, Buffer.from(optimizedBuffer), {
      access: 'public',
      contentType: 'image/png'
    })

    return NextResponse.json({
      url: blob.url,
      filename,
      size: screenshotBuffer.length
    })

  } catch (error) {
    console.error('Screenshot capture error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to capture screenshot' },
      { status: 500 }
    )
  }
}

// Client-side screenshot endpoint for iframe content
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Vercel Blob
    const filename = `screenshots/client-screenshot-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png'
    })

    return NextResponse.json({
      url: blob.url,
      filename,
      size: buffer.length
    })

  } catch (error) {
    console.error('Client screenshot upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload screenshot' },
      { status: 500 }
    )
  }
}