"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Upload, Loader2, X } from "lucide-react"
import { toast } from "sonner"

export function StampSignatureSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stampUploading, setStampUploading] = useState(false)

  const [stampUrl, setStampUrl] = useState<string | null>(null)
  const [stampPreview, setStampPreview] = useState<string | null>(null)

  // FIX 1: ref to reset the file input after upload so re-uploading same file works
  const stampInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.id) return

        const { data, error } = await supabase
          .from('company_profile')
          .select('stamp_url')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setStampUrl(data.stamp_url ?? null)
        }
      } catch (error) {
        console.error('Error loading company profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user?.id])

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PNG, JPG, JPEG, or WEBP only')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    setStampUploading(true)

    // FIX 2: wait for FileReader to finish BEFORE starting the upload
    // Previously FileReader ran async alongside the upload — preview may not have set in time
    const base64Preview = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target?.result as string)
      reader.readAsDataURL(file)
    })
    setStampPreview(base64Preview)

    try {
      // FIX 3: use the actual file extension, not hardcoded .png
      // A .jpg file uploaded as stamp.png can confuse some browsers/storage
      const ext = file.name.split('.').pop() ?? 'png'
      const filePath = `${user.id}/stamp.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        toast.error('Stamp upload failed: ' + uploadError.message)
        setStampPreview(null)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath)

      // Add cache-busting so the browser shows the new image immediately
      const newStampUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // Save to database
      const { error: dbError } = await supabase
        .from('company_profile')
        .update({ stamp_url: newStampUrl })
        .eq('user_id', user.id)

      if (dbError) {
        toast.error('Failed to save stamp: ' + dbError.message)
        setStampPreview(null)
        return
      }

      setStampUrl(newStampUrl)
      toast.success('Stamp uploaded successfully')

      // Reset file input so the same file can be re-uploaded if needed
      if (stampInputRef.current) stampInputRef.current.value = ''
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload stamp')
      setStampPreview(null)
    } finally {
      setStampUploading(false)
    }
  }

  const handleRemoveStamp = async () => {
    if (!user?.id) return
    try {
      const { error } = await supabase
        .from('company_profile')
        .update({ stamp_url: null })
        .eq('user_id', user.id)

      if (error) throw error
      setStampUrl(null)
      setStampPreview(null)
      if (stampInputRef.current) stampInputRef.current.value = ''
      toast.success('Stamp removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove stamp')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-muted-foreground">Loading stamp settings...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Stamp</CardTitle>
        <CardDescription>Upload your company stamp — it will appear on quotation and invoice PDFs when enabled</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-sm space-y-3">
          <Label>Company Stamp</Label>
          <div className="space-y-3">
            {(stampPreview ?? stampUrl) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full h-40 rounded-lg border border-border overflow-hidden bg-secondary">
                  <img
                    src={stampPreview ?? stampUrl ?? ''}
                    alt="Stamp preview"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveStamp}
                  className="w-full"
                >
                  <X className="mr-2 size-4" />
                  Remove Stamp
                </Button>
              </div>
            ) : (
              <label htmlFor="stamp-upload" className="cursor-pointer block">
                <input
                  ref={stampInputRef}
                  id="stamp-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleStampUpload}
                  className="hidden"
                  disabled={stampUploading}
                />
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  {stampUploading ? (
                    <Loader2 className="mx-auto size-8 mb-2 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="mx-auto size-8 mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium text-foreground">
                    {stampUploading ? 'Uploading...' : 'Click to upload stamp'}
                  </p>
                  {!stampUploading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or WEBP, max 2MB
                    </p>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
