"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Save, Upload, Loader2, X } from "lucide-react"
import { toast } from "sonner"

// The storage file path is always fixed — no timestamps in the PATH
// We only use timestamps in the <img src> tag to bust browser cache
const STAMP_FILE_PATH = (userId: string) => `${userId}/stamp`

export function StampSignatureSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // BUG FIX 1: Store only the clean storage PATH in DB, not the full URL with ?t=
  // On load, we generate a fresh signed URL from the path so it always works
  const [stampStoragePath, setStampStoragePath] = useState<string | null>(null)

  // The URL we actually show in <img> — generated fresh each time page loads
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)

  // Pending file — selected but NOT yet saved
  const [newStampFile, setNewStampFile] = useState<File | null>(null)

  // Local base64 preview shown while a new file is selected but not saved
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const stampInputRef = useRef<HTMLInputElement>(null)

  // BUG FIX 2: On load, fetch the storage PATH from DB
  // Then generate a fresh signed URL so the image always loads even after navigation
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

        if (data?.stamp_url) {
          setStampStoragePath(data.stamp_url)

          // BUG FIX 3: Generate a fresh signed URL every time settings page loads
          // This fixes "image not showing after navigation" because signed URLs
          // are time-limited and the stored path always generates a fresh one
          const { data: signedData, error: signedError } = await supabase.storage
            .from('company-assets')
            .createSignedUrl(data.stamp_url, 60 * 60) // 1 hour expiry

          if (!signedError && signedData?.signedUrl) {
            setDisplayUrl(signedData.signedUrl)
          } else {
            // Fallback: if bucket is public, getPublicUrl also works
            const { data: publicData } = supabase.storage
              .from('company-assets')
              .getPublicUrl(data.stamp_url)
            setDisplayUrl(publicData.publicUrl)
          }
        }
      } catch (error) {
        console.error('Error loading stamp:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user?.id])

  // Step 1: User selects a file — show local preview only, nothing uploaded yet
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PNG, JPG, or WEBP only')
      if (stampInputRef.current) stampInputRef.current.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      if (stampInputRef.current) stampInputRef.current.value = ''
      return
    }

    setNewStampFile(file)

    // Show local base64 preview immediately — no network call yet
    const reader = new FileReader()
    reader.onload = (event) => {
      setLocalPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Step 2: User clicks Save Stamp — upload file and save PATH (not URL) to DB
  const handleSaveStamp = async () => {
    if (!newStampFile || !user?.id) return

    setSaving(true)
    try {
      // BUG FIX 4: Always use the same fixed path per user
      // This ensures upsert always overwrites the same file cleanly
      // Extension doesn't matter since we control the path
      const filePath = STAMP_FILE_PATH(user.id)

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, newStampFile, {
          upsert: true,
          contentType: newStampFile.type,
        })

      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message)
        return
      }

      // BUG FIX 5: Save only the clean FILE PATH to DB — not the URL
      // Saving the URL with ?t= timestamps causes the image to break on reload
      // because next time we fetch a different signed URL anyway
      const { error: dbError } = await supabase
        .from('company_profile')
        .update({ stamp_url: filePath })
        .eq('user_id', user.id)

      if (dbError) {
        toast.error('Failed to save: ' + dbError.message)
        return
      }

      // Generate a fresh signed URL just for display right now
      const { data: signedData, error: signedError } = await supabase.storage
        .from('company-assets')
        .createSignedUrl(filePath, 60 * 60)

      const freshDisplayUrl = (!signedError && signedData?.signedUrl)
        ? signedData.signedUrl
        : localPreview! // fallback to local base64 if signing fails

      // Commit state
      setStampStoragePath(filePath)
      setDisplayUrl(freshDisplayUrl)
      setNewStampFile(null)
      setLocalPreview(null)
      if (stampInputRef.current) stampInputRef.current.value = ''

      toast.success('Stamp saved successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save stamp')
    } finally {
      setSaving(false)
    }
  }

  // Cancel pending selection — discard local preview, keep existing saved stamp
  const handleCancelSelect = () => {
    setNewStampFile(null)
    setLocalPreview(null)
    if (stampInputRef.current) stampInputRef.current.value = ''
  }

  // Remove stamp from DB
  const handleRemoveStamp = async () => {
    if (!user?.id) return
    try {
      const { error } = await supabase
        .from('company_profile')
        .update({ stamp_url: null })
        .eq('user_id', user.id)

      if (error) throw error

      setStampStoragePath(null)
      setDisplayUrl(null)
      setNewStampFile(null)
      setLocalPreview(null)
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

  // What to show in the image box:
  // localPreview = new file selected, not saved yet (base64)
  // displayUrl   = saved stamp, signed URL generated on load
  const imageToShow = localPreview ?? displayUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Stamp</CardTitle>
        <CardDescription>
          Upload your company stamp — it will appear on quotation and invoice PDFs when enabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm space-y-3">
          <Label>Company Stamp</Label>

          {/* STATE 1: Nothing — show upload dropzone */}
          {!imageToShow && (
            <label htmlFor="stamp-upload" className="cursor-pointer block">
              <input
                ref={stampInputRef}
                id="stamp-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <Upload className="mx-auto size-8 mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Click to upload stamp</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or WEBP, max 2MB</p>
              </div>
            </label>
          )}

          {/* STATE 2 & 4: Image exists (preview or saved) — show it */}
          {imageToShow && (
            <div className="flex items-center justify-center w-full h-40 rounded-lg border border-border overflow-hidden bg-secondary">
              <img
                src={imageToShow}
                alt="Company stamp"
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
          )}

          {/* STATE 3: New file selected, NOT saved yet — Save + Cancel */}
          {newStampFile && (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSaveStamp}
                disabled={saving}
                className="flex-1"
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Stamp
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelSelect}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* STATE 4: Stamp saved, no pending — Change + Remove */}
          {stampStoragePath && !newStampFile && (
            <div className="flex gap-2">
              <label htmlFor="stamp-upload-change" className="flex-1 cursor-pointer">
                <input
                  ref={stampInputRef}
                  id="stamp-upload-change"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full pointer-events-none"
                >
                  <Upload className="mr-2 size-4" />
                  Change Stamp
                </Button>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveStamp}
              >
                <X className="mr-2 size-4" />
                Remove
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
