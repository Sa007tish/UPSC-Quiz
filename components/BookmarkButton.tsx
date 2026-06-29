"use client";

export function BookmarkButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? "Remove bookmark" : "Bookmark this question"}
      title={active ? "Bookmarked — click to remove" : "Bookmark for later practice"}
      className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
        active
          ? "text-saffron-500"
          : "text-ink/25 hover:text-saffron-400 dark:text-ink-dark/25 dark:hover:text-saffron-400"
      }`}
    >
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} className="h-4 w-4">
        <path
          d="M6 3.5h12a.5.5 0 0 1 .5.5v16.2a.4.4 0 0 1-.62.34L12 16.5l-5.88 4.04A.4.4 0 0 1 5.5 20.2V4a.5.5 0 0 1 .5-.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
