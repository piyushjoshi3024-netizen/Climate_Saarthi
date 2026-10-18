export const ROLES = Object.freeze(['CITIZEN', 'VOLUNTEER', 'ORGANIZATION', 'RESPONDER', 'COORDINATOR', 'ADMIN']);

// The only roles a member of the public may choose at sign-up.
export const PUBLIC_ROLES = Object.freeze(['CITIZEN', 'VOLUNTEER', 'ORGANIZATION']);

export const STAFF_ROLES = Object.freeze(['COORDINATOR', 'ADMIN']);

export const isStaff = (role) => STAFF_ROLES.includes(role);
