import { isAvatarImage, avatarInitial } from "../../lib/avatar";

export function UserAvatar({
  avatar,
  name,
  email,
  className = "h-8 w-8 rounded-lg text-[13px]",
}: {
  avatar?: string | null;
  name?: string;
  email?: string;
  className?: string;
}) {
  if (isAvatarImage(avatar)) {
    return (
      <img
        src={avatar!}
        alt=""
        className={`object-cover ${className}`}
      />
    );
  }

  const initial =
    avatar && avatar.length === 1
      ? avatar
      : avatarInitial(name, email);

  return (
    <div
      className={`flex items-center justify-center bg-zinc-200 font-medium text-zinc-600 ${className}`}
    >
      {initial}
    </div>
  );
}
