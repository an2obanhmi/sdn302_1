import { Role } from "@prisma/client";

export function isOwner(role: Role): boolean {
  return role === Role.OWNER;
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}

export function isOwnerOrAdmin(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN;
}

export function canDeleteTeam(role: Role): boolean {
  return role === Role.OWNER;
}

export function canUpdateTeam(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN;
}

export function canAddMembers(role: Role): boolean {
  return role === Role.OWNER || role === Role.ADMIN;
}

/**
 * Check if actor can change a target member's role.
 * - OWNER can promote/demote anyone (except self).
 * - ADMIN can promote MEMBER to ADMIN or demote ADMIN to MEMBER (cannot touch OWNER).
 * - MEMBER cannot change any roles.
 */
export function canChangeMemberRole(
  actorRole: Role,
  targetCurrentRole: Role,
  newRole: Role
): boolean {
  if (targetCurrentRole === Role.OWNER) {
    return false; // Owner role cannot be changed via member management
  }

  if (newRole === Role.OWNER) {
    return false; // Cannot promote to Owner through this endpoint
  }

  if (actorRole === Role.OWNER) {
    return true;
  }

  if (actorRole === Role.ADMIN) {
    // Admin can change MEMBER to ADMIN or ADMIN to MEMBER (target cannot be Owner, already checked above)
    return true;
  }

  return false;
}

/**
 * Check if actor can remove a target member.
 * - Any user can remove themselves (leave team), EXCEPT the Owner (Owner must delete team or transfer ownership).
 * - OWNER can remove anyone (except self).
 * - ADMIN can remove MEMBER only (cannot remove OWNER or another ADMIN).
 * - MEMBER cannot remove anyone else.
 */
export function canRemoveMember(
  actorRole: Role,
  actorUserId: string,
  targetRole: Role,
  targetUserId: string
): boolean {
  // Self leaving
  if (actorUserId === targetUserId) {
    return targetRole !== Role.OWNER;
  }

  if (actorRole === Role.OWNER) {
    return true;
  }

  if (actorRole === Role.ADMIN) {
    return targetRole === Role.MEMBER;
  }

  return false;
}

/**
 * Check if actor can update a task.
 * - OWNER or ADMIN: can update ANY task in the team.
 * - MEMBER: can update tasks they created or are assigned to.
 */
export function canUpdateTask(
  actorRole: Role,
  actorUserId: string,
  task: { creatorId?: string | null; assigneeId?: string | null }
): boolean {
  if (actorRole === Role.OWNER || actorRole === Role.ADMIN) {
    return true;
  }
  return task.creatorId === actorUserId || task.assigneeId === actorUserId;
}

/**
 * Check if actor can delete a task.
 * - OWNER or ADMIN: can delete ANY task in the team.
 * - MEMBER: can only delete tasks they created or are assigned to.
 */
export function canDeleteTask(
  actorRole: Role,
  actorUserId: string,
  task: { creatorId?: string | null; assigneeId?: string | null }
): boolean {
  if (actorRole === Role.OWNER || actorRole === Role.ADMIN) {
    return true;
  }
  return task.creatorId === actorUserId || task.assigneeId === actorUserId;
}
