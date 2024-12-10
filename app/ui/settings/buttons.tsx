import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function SaveUserSetting({
  // id
  display
}: {
  // id: string
  display?: string
}) {
  return (
    <form>
      <button type="submit" className="ml-3 rounded-md border p-2 text-white bg-blue-600 hover:bg-blue-500">
        <span className="sr-only">
          {display}
        </span>
        <ArrowRightIcon className="w-5" />
      </button>
    </form>
  );
}