const sharedResourcesFolderId =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID?.trim() || '';

export const sharedResourcesDriveUrl =
  process.env.NEXT_PUBLIC_SHARED_RESOURCES_DRIVE_URL?.trim() ||
  (sharedResourcesFolderId
    ? `https://drive.google.com/drive/folders/${sharedResourcesFolderId}`
    : '');

export const hasSharedResourcesDrive = sharedResourcesDriveUrl.length > 0;

export const resourceCollections = [
  {
    id: 'lecture-notes',
    title: 'Lecture Notes',
    description: 'Clean notes, summary sheets, and annotated slides grouped by course code.',
    badge: 'Core study materials',
    examples: ['MTH101 weekly notes', 'CSC201 revision summary', 'PHY102 formula sheet'],
  },
  {
    id: 'past-questions',
    title: 'Past Questions',
    description: 'Exam and test questions arranged by school, level, course, and session year.',
    badge: 'High demand',
    examples: ['GST101 2022 exam', 'CHM201 mock test', 'BIO104 departmental quiz bank'],
  },
  {
    id: 'worked-solutions',
    title: 'Worked Solutions',
    description: 'Step-by-step answer guides to help learners understand how problems are solved.',
    badge: 'Best for revision',
    examples: ['Calculus worked examples', 'Physics derivation walk-throughs', 'Essay structure samples'],
  },
  {
    id: 'projects-and-practicals',
    title: 'Projects and Practicals',
    description: 'Lab guides, project briefs, coding exercises, and practical prep resources.',
    badge: 'Hands-on',
    examples: ['CSC lab starter files', 'BIO practical guide', 'CHM titration checklist'],
  },
] as const;

export const resourceFolderBlueprint = [
  'CampusTutor Resources/',
  'CampusTutor Resources/100 Level/',
  'CampusTutor Resources/100 Level/MTH101/',
  'CampusTutor Resources/100 Level/MTH101/Lecture Notes/',
  'CampusTutor Resources/100 Level/MTH101/Past Questions/',
  'CampusTutor Resources/100 Level/MTH101/Worked Solutions/',
  'CampusTutor Resources/200 Level/CSC201/',
  'CampusTutor Resources/Shared Study Skills/',
] as const;

export const contributionGuidelines = [
  'Upload only useful academic resources that other students can learn from quickly.',
  'Use clear file names like MTH101_Past_Questions_2023.pdf or CSC201_Revision_Sheet_Week_5.pdf.',
  'Place each file inside the correct level, course, and resource-type folder before leaving the Drive.',
  'For past questions, include the year or semester whenever possible.',
  'Avoid duplicate uploads. Update an existing file only when your version is better or more complete.',
] as const;

export const pastQuestionStructure = [
  {
    title: 'Sort by level first',
    description: 'Start with folders like 100 Level, 200 Level, 300 Level, and postgraduate if needed.',
  },
  {
    title: 'Then group by course',
    description: 'Inside each level, keep a folder for every course code so files stay easy to find.',
  },
  {
    title: 'Separate each year',
    description: 'Keep 2021, 2022, 2023, and 2024 papers in their own folders or file names.',
  },
  {
    title: 'Add solutions beside questions',
    description: 'Pair question papers with worked answers when available to make revision easier.',
  },
] as const;
