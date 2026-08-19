/*
 * The only shape a user is ever sent to a client in.
 *
 * Never expose passwordHash or the 2FA secret. Both are
 * select:false on the model, but this keeps the guarantee
 * explicit instead of relying on a query option.
 */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  twoFactorEnabled: user.twoFactorEnabled,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

export { toPublicUser };
