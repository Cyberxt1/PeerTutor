'use client';

import Header from '@/components/layout/header';
import DriveUploadPanel from '@/components/resources/drive-upload-panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/lib/context';
import { hasGoogleDriveUploadConfig } from '@/lib/google-drive';
import {
  contributionGuidelines,
  hasSharedResourcesDrive,
  pastQuestionStructure,
  resourceCollections,
  resourceFolderBlueprint,
  sharedResourcesDriveUrl,
} from '@/lib/resources';
import {
  AlertCircle,
  ArrowUpRight,
  BookMarked,
  FileArchive,
  FolderTree,
  GraduationCap,
  LibraryBig,
  Upload,
} from 'lucide-react';

export default function ResourcesPage() {
  const { platformSettings } = useApp();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {!platformSettings.allowResources ? (
          <section className="px-4 py-20">
            <div className="mx-auto max-w-3xl">
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle>Resources are temporarily unavailable</CardTitle>
                  <CardDescription>
                    The admin has paused access to the shared study library for now.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    When access is restored, this page will show shared notes, past questions, and upload actions again.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : (
          <>
            <section className="px-4 py-16 sm:py-20">
              <div className="mx-auto max-w-6xl space-y-8">
                <div className="max-w-3xl space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge>Shared Resources</Badge>
                    <Badge variant="outline">Open to tutors and learners</Badge>
                    <Badge variant="outline">
                      {hasGoogleDriveUploadConfig ? 'In-app Google Drive upload ready' : 'Google Drive ready'}
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
                      One shared study library for everyone.
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      This resource hub gives tutors and learners one organized place to share lecture notes,
                      revision packs, worked solutions, and past questions through a common Google Drive folder.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {hasSharedResourcesDrive ? (
                      <>
                        <Button asChild className="bg-primary hover:bg-primary/90">
                          <a href={sharedResourcesDriveUrl} target="_blank" rel="noreferrer">
                            Open Shared Drive
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                        <Button asChild variant="outline">
                          <a href="#drive-upload-panel">
                            Upload in App
                            <Upload className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button disabled className="bg-primary hover:bg-primary/90">
                          Open Shared Drive
                        </Button>
                        <Button disabled variant="outline">
                          Upload in App
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {!hasSharedResourcesDrive && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Add `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` or `NEXT_PUBLIC_SHARED_RESOURCES_DRIVE_URL` to activate the shared Drive links.
                    </AlertDescription>
                  </Alert>
                )}

                {!hasGoogleDriveUploadConfig && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Add `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` to turn on full in-app uploads.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-border/60 bg-card/90">
                    <CardHeader className="pb-3">
                      <LibraryBig className="h-6 w-6 text-primary" />
                      <CardTitle className="text-xl">Shared by everyone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Learners can upload helpful materials, and tutors can contribute curated revision assets too.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-card/90">
                    <CardHeader className="pb-3">
                      <BookMarked className="h-6 w-6 text-primary" />
                      <CardTitle className="text-xl">Past questions included</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        The structure makes room for test banks, exam papers, and solved question packs by course.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-card/90">
                    <CardHeader className="pb-3">
                      <FolderTree className="h-6 w-6 text-primary" />
                      <CardTitle className="text-xl">Easy to organize</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Materials are grouped by level, course code, and resource type so students find files faster.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            <section className="px-4 pb-16">
              <div className="mx-auto max-w-6xl">
                <Tabs defaultValue="library" className="gap-6">
                  <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-transparent p-0">
                    <TabsTrigger value="library" className="rounded-full border border-border bg-background px-4 py-2">
                      Library View
                    </TabsTrigger>
                    <TabsTrigger value="past-questions" className="rounded-full border border-border bg-background px-4 py-2">
                      Past Questions
                    </TabsTrigger>
                    <TabsTrigger value="contribute" className="rounded-full border border-border bg-background px-4 py-2">
                      Upload in App
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="library" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {resourceCollections.map((collection) => (
                        <Card key={collection.id} className="border-border/60 bg-card/90">
                          <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                              <CardTitle>{collection.title}</CardTitle>
                              <Badge variant="outline">{collection.badge}</Badge>
                            </div>
                            <CardDescription>{collection.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm font-medium text-foreground">Examples</p>
                            <div className="flex flex-wrap gap-2">
                              {collection.examples.map((example) => (
                                <Badge key={example} variant="secondary" className="rounded-full">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card className="border-border/60 bg-card/90">
                      <CardHeader>
                        <CardTitle>Recommended folder structure</CardTitle>
                        <CardDescription>
                          Use this layout inside the shared Google Drive so the library stays clean as more files are added.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-2xl border border-border bg-muted/30 p-4">
                          <pre className="overflow-x-auto text-sm leading-7 text-foreground">
                            {resourceFolderBlueprint.join('\n')}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="past-questions" className="space-y-6">
                    <Card className="border-border/60 bg-card/90">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <FileArchive className="h-5 w-5 text-primary" />
                          <CardTitle>Past questions should be their own major collection</CardTitle>
                        </div>
                        <CardDescription>
                          This keeps exam prep easy and prevents question papers from getting buried under regular notes.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {pastQuestionStructure.map((item) => (
                          <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
                            <p className="font-semibold text-foreground">{item.title}</p>
                            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="border-border/60 bg-card/90">
                        <CardHeader>
                          <CardTitle className="text-lg">Per course</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Example: `200 Level / CSC201 / Past Questions / CSC201_2023.pdf`
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60 bg-card/90">
                        <CardHeader>
                          <CardTitle className="text-lg">Per semester</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Where schools run semester systems, add `First Semester` and `Second Semester` folders.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60 bg-card/90">
                        <CardHeader>
                          <CardTitle className="text-lg">With solutions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Add a matching `Solved` subfolder for worked answers and explanations.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="contribute" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                      <Card className="border-border/60 bg-card/90">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <CardTitle>Contribution checklist</CardTitle>
                          </div>
                          <CardDescription>
                            A simple standard helps the Drive stay useful even as many people upload to it.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {contributionGuidelines.map((guideline) => (
                            <div key={guideline} className="flex gap-3 rounded-xl border border-border bg-background/70 p-3">
                              <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                              <p className="text-sm text-muted-foreground">{guideline}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="border-border/60 bg-card/90">
                        <CardHeader>
                          <CardTitle>Quick actions</CardTitle>
                          <CardDescription>
                            Give everyone one obvious place to browse and upload.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {hasSharedResourcesDrive ? (
                            <>
                              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                                <a href={sharedResourcesDriveUrl} target="_blank" rel="noreferrer">
                                  Browse Resource Folder
                                  <ArrowUpRight className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                              <Button asChild variant="outline" className="w-full">
                                <a href="#drive-upload-panel">
                                  Upload Notes or Past Questions
                                  <Upload className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button disabled className="w-full bg-primary hover:bg-primary/90">
                                Browse Resource Folder
                              </Button>
                              <Button disabled variant="outline" className="w-full">
                                Upload Notes or Past Questions
                              </Button>
                            </>
                          )}
                          <div className="rounded-2xl border border-dashed border-border p-4">
                            <p className="text-sm font-medium text-foreground">Best naming format</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              `COURSECODE_ResourceType_Year_or_Topic.file`
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Example: `MTH101_Past_Questions_2024.pdf`
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <DriveUploadPanel />
                  </TabsContent>
                </Tabs>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
