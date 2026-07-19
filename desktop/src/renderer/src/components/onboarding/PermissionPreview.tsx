import permissionPreview from "../../assets/onboarding/permission-preview.png";

export function PermissionPreview() {
  return (
    <div className="flex w-full max-w-[520px] shrink-0 items-center justify-center">
      <img
        src={permissionPreview}
        alt="macOS accessibility permission prompts for Landed"
        className="h-auto w-full select-none"
        draggable={false}
      />
    </div>
  );
}
