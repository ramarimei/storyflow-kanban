export enum StoryStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  TESTING = 'TESTING',
  DONE = 'DONE'
}
export enum StoryPriority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH' }
export enum StoryType { STORY = 'STORY', BUG = 'BUG' }
export enum AppTheme { CLEAN = 'CLEAN', NEBULA = 'NEBULA', SUNSET = 'SUNSET', MIDNIGHT = 'MIDNIGHT' }
export interface User { id: string; name: string; avatar: string; color: string; role: string; }
export interface Comment { id: string; userId: string; text: string; createdAt: number; taggedUserId?: string; }
export interface UserStory {
  id: string; title: string; description: string; status: StoryStatus; priority: StoryPriority;
  type: StoryType; points?: number; assigneeId?: string; createdAt: number;
  progressMade?: string; remainingTasks?: string; comments?: Comment[];
}
export interface WorkspaceState { projectName: string; stories: UserStory[]; theme: AppTheme; lastUpdated: number; }
export interface GeminiStoryResponse { stories: Omit<UserStory, 'id' | 'createdAt'>[]; }
