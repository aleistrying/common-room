export type UUID = string;
export type MemberRole = 'admin' | 'member';
export type AttendanceStatus = 'going' | 'maybe' | 'cant_go';
export type EventStatus = 'tentative' | 'confirmed';
export type AvailabilityPreference = 'yes' | 'maybe';
export type PollKind = 'choice' | 'multi_choice';
export type ShareEntityType = 'activity' | 'event' | 'decision_poll' | 'availability_poll';

export interface MemberSession { roomId: UUID; memberId: UUID; memberToken: UUID; displayName: string; role: MemberRole; }
export interface Room { id: UUID; name: string; slug: string; timezone: string; }
export interface RoomMember { id: UUID; room_id: UUID; display_name: string; role: MemberRole; preferred_locale: 'en' | 'fr'; }
export interface RoomCategory { id: UUID; room_id: UUID; slug: string; label: string; emoji: string | null; sort_order: number; created_by_member_id: UUID | null; archived_at: string | null; updated_at: string; }
export interface ActivityGroup { id: UUID; room_id: UUID; title: string; description: string | null; location: string | null; created_by_member_id: UUID | null; created_at: string; updated_at: string; archived_at: string | null; }
export interface ActivityOption { id: UUID; activity_group_id: UUID; label: string; details: string | null; sort_order: number; archived_at: string | null; }
export interface ActivityGroupCategory { activity_group_id: UUID; category_id: UUID; }
export interface ActivityInterest { activity_group_id: UUID; member_id: UUID; created_at: string; }
export interface EventPlan { id: UUID; room_id: UUID; activity_group_id: UUID | null; title: string; event_date: string | null; start_at: string | null; end_at: string | null; location: string | null; notes: string | null; status: EventStatus; created_by_member_id: UUID | null; created_at: string; updated_at: string; archived_at: string | null; timezone: string | null; }
export interface EventOption { event_id: UUID; activity_option_id: UUID; selected_by_member_id: UUID | null; }
export interface EventAttendance { event_id: UUID; member_id: UUID; status: AttendanceStatus; updated_at: string; }
export interface DecisionPoll { id: UUID; room_id: UUID; activity_group_id: UUID | null; event_id: UUID | null; title: string; kind: PollKind; closes_at: string | null; closed: boolean; created_by_member_id: UUID; created_at: string; updated_at: string; }
export interface DecisionPollOption { id: UUID; poll_id: UUID; label: string; activity_option_id: UUID | null; sort_order: number; }
export interface DecisionPollVote { poll_id: UUID; option_id: UUID; member_id: UUID; created_at: string; }
export interface WeeklyAvailability { id: UUID; room_id: UUID; member_id: UUID; day_of_week: number; start_time: string; end_time: string; preference: AvailabilityPreference; label: string | null; created_at: string; }
export interface EventAvailabilityPoll { event_id: UUID; window_start: string; window_end: string; granularity_minutes: 15 | 30 | 60; closes_at: string | null; closed: boolean; created_by_member_id: UUID | null; created_at: string; }
export interface EventAvailabilitySubmission { event_id: UUID; member_id: UUID; submitted_at: string; }
export interface EventAvailabilityWindow { id: UUID; event_id: UUID; member_id: UUID; start_at: string; end_at: string; preference: AvailabilityPreference; created_at: string; }
export interface RoomSnapshot { room: Room | null; members: RoomMember[]; categories: RoomCategory[]; activities: ActivityGroup[]; activityOptions: ActivityOption[]; activityCategories: ActivityGroupCategory[]; interests: ActivityInterest[]; events: EventPlan[]; eventOptions: EventOption[]; attendance: EventAttendance[]; polls: DecisionPoll[]; pollOptions: DecisionPollOption[]; pollVotes: DecisionPollVote[]; weeklyAvailability: WeeklyAvailability[]; availabilityPolls: EventAvailabilityPoll[]; availabilitySubmissions: EventAvailabilitySubmission[]; availabilityWindows: EventAvailabilityWindow[]; fetchedAt: string; }
export interface HistogramSlot { slot_start: string; slot_end: string; yes_count: number; maybe_count: number; score: number; yes_members: string[]; maybe_members: string[]; responded_count: number; total_members: number; missing_members: string[]; }
export type MutationKind = 'activity.create'|'activity.update'|'activity.archive'|'interest.set'|'event.create'|'event.update'|'event.archive'|'attendance.set'|'poll.create'|'poll.vote'|'poll.close'|'category.create'|'weekly.replace'|'availability.open'|'availability.submit'|'availability.choose_time';
export interface SyncMutation { id: UUID; kind: MutationKind; payload: Record<string, unknown>; createdAt: string; }
export type DeepTarget = { entityType: ShareEntityType; entityId: UUID } | null;
