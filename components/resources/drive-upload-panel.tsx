'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/context';
import {
  googleDriveFolderId,
  hasGoogleDriveUploadConfig,
  requestGoogleDriveAccessToken,
  uploadFileToGoogleDrive,
} from '@/lib/google-drive';
import { resourceCollections, sharedResourcesDriveUrl } from '@/lib/resources';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowUpRight, CheckCircle2, Loader2, Upload } from 'lucide-react';

const studyLevels = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  'Postgraduate',
  'Shared Study Skills',
] as const;

const semesters = ['First Semester', 'Second Semester', 'Summer', 'General'] as const;

function getFileExtension(name: string) {
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot) : '';
}

function sanitizeSegment(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildFileName(file: File, courseCode: string, title: string, session: string) {
  const extension = getFileExtension(file.name);
  const baseName = sanitizeSegment(
    [courseCode.toUpperCase(), title || file.name.replace(extension, ''), session]
      .filter(Boolean)
      .join('_')
  );

  return `${baseName || 'CampusTutor_Resource'}${extension}`;
}

export default function DriveUploadPanel() {
  const { currentUser } = useApp();
  const [accessToken, setAccessToken] = useState('');
  const [resourceType, setResourceType] = useState<(typeof resourceCollections)[number]['id']>('lecture-notes');
  const [studyLevel, setStudyLevel] = useState<(typeof studyLevels)[number]>('100 Level');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [semester, setSemester] = useState<(typeof semesters)[number]>('General');
  const [notes, setNotes] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedLink, setUploadedLink] = useState('');

  useEffect(() => {
    if (currentUser?.name) {
      setContributorName((value) => value || currentUser.name);
    }
  }, [currentUser?.name]);

  const selectedCollection = useMemo(() => {
    return resourceCollections.find((collection) => collection.id === resourceType);
  }, [resourceType]);

  const folderSegments = useMemo(() => {
    const segments = [
      studyLevel,
      sanitizeSegment(
        courseCode.trim()
          ? `${courseCode.trim().toUpperCase()}${courseName.trim() ? ` - ${courseName.trim()}` : ''}`
          : 'General Resources'
      ),
      selectedCollection?.title || 'Shared Resources',
    ];

    if (resourceType === 'past-questions' && academicSession.trim()) {
      segments.push(sanitizeSegment(academicSession.trim()));
    }

    return segments;
  }, [academicSession, courseCode, courseName, resourceType, selectedCollection?.title, studyLevel]);

  const connectToGoogleDrive = async () => {
    setIsConnecting(true);
    setStatusMessage('');

    try {
      const token = await requestGoogleDriveAccessToken(accessToken ? '' : 'consent');
      setAccessToken(token);
      setStatusType('success');
      setStatusMessage('Google Drive connected. You can upload resources now.');
    } catch (error) {
      setStatusType('error');
      setStatusMessage(error instanceof Error ? error.message : 'Unable to connect to Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusType('error');
      setStatusMessage('Choose a file before uploading.');
      return;
    }

    if (!courseCode.trim()) {
      setStatusType('error');
      setStatusMessage('Add a course code so the upload can be organized correctly.');
      return;
    }

    setIsUploading(true);
    setStatusMessage('');
    setUploadedLink('');

    try {
      const token = accessToken || (await requestGoogleDriveAccessToken('consent'));
      if (!accessToken) {
        setAccessToken(token);
      }

      const upload = await uploadFileToGoogleDrive({
        accessToken: token,
        rootFolderId: googleDriveFolderId,
        file: selectedFile,
        folderSegments,
        fileName: buildFileName(selectedFile, courseCode, resourceTitle, academicSession),
        description: [
          `Contributor: ${contributorName.trim() || currentUser?.name || 'CampusTutor community member'}`,
          `Course: ${courseCode.trim().toUpperCase()}${courseName.trim() ? ` - ${courseName.trim()}` : ''}`,
          `Resource type: ${selectedCollection?.title || 'Shared Resource'}`,
          semester !== 'General' ? `Semester: ${semester}` : '',
          notes.trim() ? `Notes: ${notes.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });

      setUploadedLink(upload.webViewLink || upload.webContentLink || '');
      setStatusType('success');
      setStatusMessage(`Uploaded "${upload.name}" to Google Drive successfully.`);
      setSelectedFile(null);
      setResourceTitle('');
      setNotes('');
      setAcademicSession('');
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Google Drive upload failed. Check the folder permissions and your Google configuration.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card id="drive-upload-panel" className="border-border/60 bg-card/90">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Upload Directly to Google Drive</CardTitle>
            <CardDescription>
              Connect your Google account, choose where the file belongs, and upload without leaving CampusTutor.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={accessToken ? 'outline' : 'default'}
              className={!accessToken ? 'bg-primary hover:bg-primary/90' : ''}
              onClick={() => void connectToGoogleDrive()}
              disabled={!hasGoogleDriveUploadConfig || isConnecting || isUploading}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : accessToken ? (
                'Reconnect Google Drive'
              ) : (
                'Connect Google Drive'
              )}
            </Button>
            {sharedResourcesDriveUrl && (
              <Button type="button" variant="outline" asChild>
                <a href={sharedResourcesDriveUrl} target="_blank" rel="noreferrer">
                  Open Shared Folder
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!hasGoogleDriveUploadConfig && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` to enable in-app uploads.
            </AlertDescription>
          </Alert>
        )}

        {statusMessage && (
          <Alert variant={statusType === 'error' ? 'destructive' : 'default'}>
            {statusType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              {statusMessage}
              {uploadedLink && (
                <>
                  {' '}
                  <a href={uploadedLink} target="_blank" rel="noreferrer" className="font-medium underline">
                    View file
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Resource Type</FieldLabel>
                <Select value={resourceType} onValueChange={(value) => setResourceType(value as typeof resourceType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceCollections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Study Level</FieldLabel>
                <Select value={studyLevel} onValueChange={(value) => setStudyLevel(value as typeof studyLevel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {studyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Course Code</FieldLabel>
                <Input
                  value={courseCode}
                  onChange={(event) => setCourseCode(event.target.value.toUpperCase())}
                  placeholder="CSC201"
                  disabled={isUploading}
                />
              </Field>

              <Field>
                <FieldLabel>Course Name</FieldLabel>
                <Input
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  placeholder="Data Structures"
                  disabled={isUploading}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Academic Session or Year</FieldLabel>
                <Input
                  value={academicSession}
                  onChange={(event) => setAcademicSession(event.target.value)}
                  placeholder="2023-2024 or 2024"
                  disabled={isUploading}
                />
              </Field>

              <Field>
                <FieldLabel>Semester</FieldLabel>
                <Select value={semester} onValueChange={(value) => setSemester(value as typeof semester)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Resource Title</FieldLabel>
                <Input
                  value={resourceTitle}
                  onChange={(event) => setResourceTitle(event.target.value)}
                  placeholder="Mid-Semester Revision Pack"
                  disabled={isUploading}
                />
              </Field>

              <Field>
                <FieldLabel>Contributor Name</FieldLabel>
                <Input
                  value={contributorName}
                  onChange={(event) => setContributorName(event.target.value)}
                  placeholder="Your name"
                  disabled={isUploading}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Extra Notes</FieldLabel>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a quick note about what the file contains or how it should be used."
                rows={4}
                disabled={isUploading}
              />
            </Field>

            <Field>
              <FieldLabel>Choose File</FieldLabel>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Recommended for notes, past questions, slides, worked solutions, and practical guides.
              </p>
            </Field>

            <Button
              type="button"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => void handleUpload()}
              disabled={!hasGoogleDriveUploadConfig || isUploading || isConnecting || !selectedFile}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading to Drive...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </>
              )}
            </Button>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Upload destination</p>
              <p className="mt-3 text-sm text-muted-foreground leading-6">
                {folderSegments.join(' / ')}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-foreground">What this flow does</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>It signs the contributor into Google and uploads directly into your shared Drive folder.</p>
                <p>It creates missing subfolders automatically based on the level, course, and resource type selected.</p>
                <p>Past questions can also be grouped by academic session or exam year.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-foreground">Before it works live</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>The shared root folder must be editable by the Google accounts that will upload.</p>
                <p>Your Google OAuth client must allow this app&apos;s domain as an authorized JavaScript origin.</p>
                <p>The Drive API must be enabled in Google Cloud for the same project as the OAuth client.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
