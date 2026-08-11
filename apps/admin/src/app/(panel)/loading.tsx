export default function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <span
        className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#dfe2f0] border-t-[#2b337d]"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
